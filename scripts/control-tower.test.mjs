import test from 'node:test'
import assert from 'node:assert/strict'
import { approvalEvent, CONTROL_TOWER_MARKER, findControlTowerComments, hashText, normalizeSnapshot, renderControlTower, validateEvidence } from './control-tower.mjs'

test('renders a stable, fail-safe snapshot without untrusted issue content', () => {
  const snapshot = normalizeSnapshot({ issue: { number: 2 }, labels: ['sdlc:blocked'], result: { status: 'blocked', phase: 'Review', workspace_id: 'Issue #2 - SDLC', head_sha: 'abcdef1234567' } })
  const output = renderControlTower(snapshot)
  assert.ok(output.startsWith(CONTROL_TOWER_MARKER))
  assert.match(output, /Fail-safe/)
  assert.doesNotMatch(output, /undefined/)
})

test('accepts only repository HTTPS evidence with a verifiable digest', () => {
  const good = { type: 'QA', url: 'https://github.com/Mamprim-go/sdlc-herdr/actions/runs/12', digest: 'abcdef1234567' }
  assert.equal(validateEvidence([good, { url: 'javascript:alert(1)', digest: 'abcdef1234567' }], { repository: 'Mamprim-go/sdlc-herdr', runId: 12 }).length, 1)
})

test('rejects unbound hosts, repositories, runs, and untyped evidence', () => {
  const context = { repository: 'Mamprim-go/sdlc-herdr', runId: 12 }
  assert.equal(validateEvidence([{ type: 'QA', url: 'https://github.com/other/repo/actions/runs/12', digest: 'abcdef1234567' }], context).length, 0)
  assert.equal(validateEvidence([{ type: 'QA', url: 'https://github.com/Mamprim-go/sdlc-herdr/actions/runs/120', digest: 'abcdef1234567' }], context).length, 0)
  assert.equal(validateEvidence([{ type: 'QA', url: 'https://githubusercontent.com/Mamprim-go/sdlc-herdr/actions/runs/12', digest: 'abcdef1234567' }], context).length, 0)
  assert.equal(validateEvidence([{ url: 'https://github.com/Mamprim-go/sdlc-herdr/actions/runs/12', digest: 'abcdef1234567' }], context).length, 0)
})

test('renders evidence in an owner-safe markdown destination', () => {
  const snapshot = normalizeSnapshot({
    issue: 2,
    result: { status: 'awaiting_qa_approval', repo: 'Mamprim-go/sdlc-herdr', run_id: 12 },
    evidence: [{ type: 'QA', url: 'https://github.com/Mamprim-go/sdlc-herdr/actions/runs/12?x=%29', digest: 'abcdef1234567' }],
  })
  assert.match(renderControlTower(snapshot), /\[evidencia\]\(<https:\/\/github\.com\//)
})

test('never treats an old SHA as approval for the live SHA', () => {
  const oldSha = 'abcdef1234567'
  const liveSha = 'fedcba7654321'
  const comment = { id: 4, created_at: '2024-01-01T00:00:00Z', user: { login: 'alice' }, body: `/approve qa ${oldSha}` }
  assert.equal(approvalEvent(comment, 'qa', liveSha, new Set(['alice'])), null)
})

test('selects oldest marked bot comment and ignores human lookalikes', () => {
  const comments = [
    { id: 3, created_at: '2024-01-03', user: { login: 'github-actions[bot]' }, body: CONTROL_TOWER_MARKER },
    { id: 1, created_at: '2024-01-01', user: { login: 'github-actions[bot]' }, body: CONTROL_TOWER_MARKER },
    { id: 0, created_at: '2024-01-00', user: { login: 'human' }, body: CONTROL_TOWER_MARKER },
  ]
  assert.deepEqual(findControlTowerComments(comments).map((x) => x.id), [1, 3])
})

test('approval requires an allowlisted GitHub comment and exact hash', () => {
  const hash = hashText('plan')
  const comment = { id: 9, created_at: '2024-01-01T00:00:00Z', user: { login: 'alice' }, body: `/approve plan ${hash}` }
  assert.equal(approvalEvent(comment, 'plan', hash, new Set(['alice'])).valid, true)
  assert.equal(approvalEvent({ ...comment, user: { login: 'mallory' } }, 'plan', hash, new Set(['alice'])), null)
})
