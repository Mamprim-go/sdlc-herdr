import test from 'node:test'
import assert from 'node:assert/strict'
import { acquireLease, extractFinalText, parseResult, releaseLease } from './github-poller.mjs'

test('extracts the last assistant text from RPC events', () => {
  const events = [
    { type: 'message_end', message: { role: 'assistant', content: [{ type: 'text', text: 'old' }] } },
    { type: 'message_end', message: { role: 'assistant', content: [{ type: 'text', text: '{"status":"awaiting_plan_approval"}' }] } },
  ]
  assert.equal(extractFinalText(events), '{"status":"awaiting_plan_approval"}')
})

test('parses a JSON result embedded in agent output', () => {
  assert.deepEqual(parseResult('Result:\n{"status":"awaiting_qa_approval","head_sha":"abc"}'), {
    status: 'awaiting_qa_approval',
    head_sha: 'abc',
  })
})

test('fails closed when the agent result is not structured', () => {
  assert.equal(parseResult('no structured result').status, 'unknown')
})

test('lease release is owner-safe', () => {
  const owner = acquireLease()
  assert.ok(owner)
  releaseLease('not-the-owner')
  assert.equal(acquireLease(), false)
  releaseLease(owner)
})
