import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)

async function call(binary, args) {
  const result = await exec(binary, args, { windowsHide: true, maxBuffer: 2 * 1024 * 1024 })
  return result.stdout
}

async function split(binary, pane, direction) {
  const output = JSON.parse(await call(binary, ['pane', 'split', pane, '--direction', direction, '--no-focus']))
  return output.result.pane.pane_id
}

async function rename(binary, pane, label) {
  await call(binary, ['pane', 'rename', pane, label])
  return pane
}

/**
 * Creates a stable visual layout. The control pane is the only pane that runs
 * PI; the other panes are named observability slots for the workflow phases.
 * Dynamic Workflow subagents remain isolated Pi sessions, so these labels are
 * an operator-facing map and not a claim that subagents share one process.
 */
export async function createSdlcLayout({ herdr, cwd, label }) {
  const created = JSON.parse(await call(herdr, ['workspace', 'create', '--cwd', cwd, '--label', label, '--no-focus']))
  const workspaceId = created.result.workspace.workspace_id
  const root = created.result.root_pane.pane_id
  const panes = { orchestrator: root }

  await rename(herdr, root, '00 - Orquestrador PI')
  panes.triage = await split(herdr, root, 'right')
  await rename(herdr, panes.triage, '01 - Triage')
  panes.plan = await split(herdr, panes.triage, 'down')
  await rename(herdr, panes.plan, '02 - Plano')
  panes.execute = await split(herdr, root, 'down')
  await rename(herdr, panes.execute, '03 - Execucao')
  panes.review = await split(herdr, panes.execute, 'right')
  await rename(herdr, panes.review, '04 - Thermonuclear Review')
  panes.qa = await split(herdr, panes.review, 'down')
  await rename(herdr, panes.qa, '05 - QA agent-browser')
  panes.gates = await split(herdr, panes.execute, 'down')
  await rename(herdr, panes.gates, '06 - Gates GitHub')

  return { workspaceId, panes }
}
