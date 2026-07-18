import { createHash } from 'node:crypto'

export const CONTROL_TOWER_MARKER = '<!-- sdlc-control-tower:v1 -->'
const MAX_FIELD = 500
const MAX_COMMENT = 12000

const text = (value, fallback = '—') => String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_FIELD) || fallback
const md = (value) => text(value).replace(/[\\`*_{}[\]()<>#+.!|~-]/g, '\\$&')
const sha = (value) => typeof value === 'string' && /^(?:[0-9a-f]{7,64}|sha256:[0-9a-f]{64})$/i.test(value)

export function evidenceUrl(value, { repository, runId } = {}) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) return null
    const host = url.hostname.toLowerCase()
    if (host !== 'github.com' && host !== 'githubusercontent.com' && host !== 'actions.githubusercontent.com') return null
    if (repository && host === 'github.com' && !url.pathname.toLowerCase().startsWith(`/${repository.toLowerCase()}/`)) return null
    if (runId && !url.pathname.includes(String(runId))) return null
    return url.href.slice(0, 1000)
  } catch { return null }
}

export function validateEvidence(items = [], context = {}) {
  return (Array.isArray(items) ? items : []).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const url = evidenceUrl(item.url, context)
    const digest = item.digest ?? item.sha ?? item.head_sha
    if (!url || !sha(String(digest ?? ''))) return []
    return [{ type: text(item.type, 'evidence'), url, digest: String(digest) }]
  })
}

const statusMap = {
  awaiting_plan_approval: ['plan-review', 'Plan', 'Aprovador humano deve validar o hash do plano.'],
  awaiting_qa_approval: ['qa-review', 'QA', 'Aprovador humano deve validar o relatorio e o head SHA.'],
  return_to_execute: ['needs-fix', 'Review', 'Corrigir os achados e executar a revisao novamente.'],
  blocked: ['blocked', 'Falha segura', 'Investigar o bloqueio; nao fazer merge ou deploy.'],
  processing: ['processing', 'Execucao', 'Aguardar o poller/agente e verificar o workspace.'],
  ready: ['ready', 'Triage', 'Iniciar a triagem da Issue.'],
}

export function normalizeSnapshot({ issue, labels = [], result = {}, pullRequest = null, approvals = {}, evidence = [] } = {}) {
  const names = labels.map((x) => typeof x === 'string' ? x : x?.name).filter(Boolean)
  const raw = text(result.status ?? names.find((x) => x.startsWith('sdlc:'))?.slice(5), 'unknown').toLowerCase()
  const status = statusMap[raw] ? raw : names.includes('sdlc:blocked') ? 'blocked' : raw
  const mapped = statusMap[status] ?? ['unknown', text(result.phase, 'Desconhecida'), 'Intervencao humana necessaria; confirmar estado no GitHub.']
  const pr = pullRequest?.number ?? result.pr_number ?? result.pr
  const headSha = pullRequest?.head?.sha ?? result.head_sha ?? result.sha
  const validApprovals = Object.fromEntries(Object.entries(approvals ?? {}).map(([kind, value]) => {
    const valid = value && value.valid === true && text(value.login, '') && sha(String(value.hash ?? value.sha ?? ''))
    return [kind, valid ? { state: 'VALIDADO', login: text(value.login), hash: String(value.hash ?? value.sha), sha: text(value.head_sha ?? headSha) } : { state: value ? 'INVALIDADO' : 'PENDENTE' }]
  }))
  return {
    version: 1, issue: Number(issue?.number ?? issue ?? 0), state: status, phase: text(result.phase ?? mapped[1]),
    workspace: text(result.workspace_id ?? result.workspace ?? result.herdr_workspace, '—'),
    pr: pr ? Number(pr) : null, head_sha: sha(String(headSha ?? '')) ? String(headSha) : null,
    next_action: mapped[2], fail_safe: status === 'blocked' || status === 'unknown' ? 'Nenhuma promocao automatica. Intervencao humana e recuperacao segura necessarias.' : null,
    gates: validApprovals, evidence: validateEvidence([...evidence, ...(result.evidence ?? [])], { repository: result.repo, runId: result.run_id }),
  }
}

export function findControlTowerComments(items = [], botLogin = 'github-actions[bot]') {
  return items.filter((item) => item?.body?.startsWith(CONTROL_TOWER_MARKER) && item.user?.login === botLogin).sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '') || Number(a.id) - Number(b.id))
}

export function renderControlTower(snapshot) {
  const gateLines = Object.entries(snapshot.gates ?? {}).map(([name, gate]) => `- **${md(name)}**: ${gate.state}${gate.login ? ` — ${md(gate.login)} (${md(gate.hash)})` : ''}`).join('\n') || '- Nenhum gate humano registrado: PENDENTE'
  const evidenceLines = (snapshot.evidence ?? []).map((item) => `- ${md(item.type)}: [evidencia](${item.url}) — ${md(item.digest)}`).join('\n') || '- Nenhuma evidencia valida publicada.'
  const body = `${CONTROL_TOWER_MARKER}\n## SDLC Control Tower\n\n- **Estado:** ${md(snapshot.state)}\n- **Fase:** ${md(snapshot.phase)}\n- **Issue:** #${snapshot.issue}\n- **Workspace HERDR:** ${md(snapshot.workspace)}\n- **PR/SHA:** ${snapshot.pr ? `#${snapshot.pr}` : '—'} / ${md(snapshot.head_sha)}\n- **Proxima acao humana:** ${md(snapshot.next_action)}\n\n### Gates\n${gateLines}\n\n### Evidencias\n${evidenceLines}\n\n${snapshot.fail_safe ? `> **Fail-safe:** ${md(snapshot.fail_safe)}\n` : ''}<!-- sdlc-control-tower-data ${JSON.stringify(snapshot).replace(/-->/g, '-- >')} -->`
  return body.slice(0, MAX_COMMENT)
}

export function approvalEvent(comment, kind, expected, allowlist) {
  if (!comment || !allowlist?.has(comment.user?.login) || !comment.created_at || !comment.id) return null
  const escaped = String(expected ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = String(comment.body ?? '').match(new RegExp(`^\\s*/approve\\s+${kind}\\s+(${escaped})\\s*$`, 'i'))
  if (!match || !sha(String(expected))) return null
  return { valid: true, login: comment.user.login, hash: expected, head_sha: expected, comment_id: comment.id, timestamp: comment.created_at }
}

export const hashText = (value) => `sha256:${createHash('sha256').update(String(value)).digest('hex')}`
