import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)

function textFromEvents(events) {
  const messages = events.filter((event) => event.type === 'message_end' && event.message?.role === 'assistant')
  const content = messages.at(-1)?.message?.content
  if (Array.isArray(content)) return content.filter((part) => part.type === 'text').map((part) => part.text).join('\n')
  return typeof content === 'string' ? content : ''
}

function parseTerminalEvents(text) {
  const events = []
  for (const line of text.split(/\r?\n/)) {
    const value = line.trim()
    if (!value.startsWith('{')) continue
    try { events.push(JSON.parse(value)) } catch { /* terminal prompt or partial line */ }
  }
  return events
}

async function command(binary, args) {
  const result = await exec(binary, args, { windowsHide: true, maxBuffer: 8 * 1024 * 1024 })
  return result.stdout
}

export async function runPiInHerdr({ herdr = process.env.HERDR_BIN ?? 'herdr', pi = process.env.SDLC_PI_BIN ?? 'pi', cwd, prompt, timeoutMs = 20 * 60 * 1000 }) {
  const created = JSON.parse(await command(herdr, ['workspace', 'create', '--cwd', cwd, '--label', `sdlc-${Date.now()}`, '--no-focus']))
  const workspace = created.result.workspace.workspace_id
  const pane = created.result.root_pane.pane_id
  const events = []
  const startedAt = Date.now()
  try {
    await command(herdr, ['pane', 'run', pane, `${pi} --mode rpc --no-session`])
    await command(herdr, ['pane', 'send-text', pane, `${JSON.stringify({ type: 'prompt', message: prompt })}\n`])
    while (Date.now() - startedAt < timeoutMs) {
      const output = await command(herdr, ['pane', 'read', pane, '--source', 'recent-unwrapped', '--lines', '500'])
      for (const event of parseTerminalEvents(output)) {
        events.push(event)
        if (event.type === 'agent_settled') return textFromEvents(events)
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    throw new Error(`PI timed out in HERDR workspace ${workspace}, pane ${pane}`)
  } finally {
    await command(herdr, ['workspace', 'close', workspace]).catch(() => {})
  }
}
