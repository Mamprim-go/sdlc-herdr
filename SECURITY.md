# Security policy

This project executes coding agents and must be treated as privileged
automation. GitHub Issue bodies, comments, PR descriptions, repository files,
browser pages and test output are untrusted inputs and may contain prompt
injection.

## Required controls

- Use a GitHub App with least-privilege permissions and short-lived tokens.
- Keep `SDLC_APPROVERS` explicit; an empty allowlist rejects every approval.
- Bind approvals to immutable plan hashes and PR head SHAs.
- Use GitHub branch protection and a protected `production` Environment.
- Do not give PI/HERDR production credentials or merge-bypass permissions.
- Run agents in isolated workspaces and use command/tool allowlists.
- Treat browser content and logs as attacker-controlled data.
- Rotate secrets and review all third-party Pi packages before installation.

## Reporting

Do not report vulnerabilities in public Issues. Contact the repository owners
through a private security channel and include reproduction steps without
including credentials or sensitive production data.
