const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPOSITORY
const prNumber = process.env.PR_NUMBER
const expectedSha = process.env.EXPECTED_SHA
const target = process.env.PROMOTION_TARGET ?? 'dev'
const issueNumber = process.env.ISSUE_NUMBER

if (!token || !repo || !prNumber || !expectedSha) {
  throw new Error('GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER and EXPECTED_SHA are required')
}

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

const pr = await api(`/repos/${repo}/pulls/${prNumber}`)
if (pr.state !== 'open') throw new Error(`PR #${prNumber} is not open`)
if (pr.head.sha !== expectedSha) throw new Error(`PR head changed: expected ${expectedSha}, found ${pr.head.sha}`)
if (target === 'prod' && pr.base.ref !== 'main') throw new Error('PROD promotion must target main')
if (target === 'dev' && pr.base.ref !== 'dev') throw new Error('DEV promotion must target dev')

if (target === 'dev') {
  if (!issueNumber) throw new Error('ISSUE_NUMBER is required for DEV promotion')
  const issue = await api(`/repos/${repo}/issues/${issueNumber}`)
  const labels = issue.labels.map((label) => label.name)
  if (!labels.includes('sdlc:qa-approved')) throw new Error('Human QA approval label is missing')
}

const checks = await api(`/repos/${repo}/commits/${expectedSha}/check-runs?per_page=100`)
const required = (process.env.SDLC_REQUIRED_CHECKS ?? '').split(',').map((x) => x.trim()).filter(Boolean)
for (const name of required) {
  const check = checks.check_runs.find((item) => item.name === name)
  if (!check || check.conclusion !== 'success') throw new Error(`Required check is not successful: ${name}`)
}

const merged = await api(`/repos/${repo}/pulls/${prNumber}/merge`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sha: expectedSha, merge_method: 'squash' }),
})
if (!merged.merged) throw new Error(`GitHub did not merge PR: ${merged.message ?? 'unknown reason'}`)
console.log(JSON.stringify({ ok: true, target, pr: Number(prNumber), sha: expectedSha }))
