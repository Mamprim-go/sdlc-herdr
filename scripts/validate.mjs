import { readFile } from 'node:fs/promises'

const workflow = await readFile(new URL('../workflows/issue-sdlc.js', import.meta.url), 'utf8')
const required = ['export const meta', 'agent(', 'parallel(', 'phase(', 'awaiting_qa_approval']
const missing = required.filter((marker) => !workflow.includes(marker))
if (missing.length) {
  console.error(`Workflow invalid; missing: ${missing.join(', ')}`)
  process.exit(1)
}
console.log('OK: workflows/issue-sdlc.js contains required gates and orchestration primitives')
