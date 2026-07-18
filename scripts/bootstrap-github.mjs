const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPOSITORY
const approvers = process.env.SDLC_APPROVERS

if (!token || !repo) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required')
if (!approvers) throw new Error('SDLC_APPROVERS is required; configure an explicit human allowlist')

async function api(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers ?? {}),
    },
  })
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${await response.text()}`)
  return response.status === 204 ? null : response.json()
}

const labels = [
  ['sdlc:ready', '1d76db'], ['sdlc:processing', '5319e7'],
  ['sdlc:qa-review', 'fbca04'],
  ['sdlc:qa-approved', '0e8a16'], ['sdlc:needs-fix', 'd93f0b'],
  ['sdlc:blocked', 'b60205'],
]
for (const [name, color] of labels) {
  try {
    await api(`/repos/${repo}/labels/${encodeURIComponent(name)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_name: name, color }),
    })
  } catch (error) {
    if (!String(error.message).includes('GitHub 404')) throw error
    await api(`/repos/${repo}/labels`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
  }
}
console.log(JSON.stringify({ ok: true, repo, labels: labels.map(([name]) => name), approvers }))
