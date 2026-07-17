# Operations runbook

## Repository setup

1. Install the Pi Dynamic Workflows package and the HERDR Pi integration:

   ```bash
   pi install npm:@quintinshaw/pi-dynamic-workflows
   herdr integration install pi
   ```

2. Create the labels `sdlc:ready`, `sdlc:processing`, `sdlc:plan-review`,
   `sdlc:qa-review`, `sdlc:qa-approved`, `sdlc:needs-fix`, and `sdlc:blocked`.
3. Configure branch protection on `dev` and `main`. The bot must not bypass it.
4. Create the `production` Environment with required human reviewers.
5. Store a GitHub App token as `SDLC_GITHUB_TOKEN`; set repository variable
   `SDLC_APPROVERS` to an explicit comma-separated allowlist of human logins.
6. Configure a self-hosted runner with labels `herdr` and `sdlc`, Pi, HERDR,
   agent-browser, and the model credentials. Never install production secrets
   in the agent workspace.

## Operating the flow

1. Add `sdlc:ready` to an Issue.
2. The cron poller starts the workflow and publishes the plan.
3. A listed human comments exactly:

   ```text
   /approve plan sha256:<plan-hash>
   ```

4. The poller resumes only with the exact approved plan.
5. After QA, a listed human comments:

   ```text
   /approve qa <head-sha>
   ```

6. Run `Promote approved PR to DEV` with the Issue number, PR number and exact
   reviewed SHA. The script rechecks the approval label, SHA and required checks.
7. Open a `dev -> main` PR and run `Promote approved DEV PR to PROD`. GitHub's
   `production` Environment pauses the job until a human reviewer approves it.

## Failure handling

- `sdlc:blocked` is fail-closed. Inspect the machine-readable result comment.
- A changed commit invalidates the SHA-bound QA approval.
- A changed plan invalidates the plan approval.
- Never remove `sdlc:processing` manually while a runner is active.
- If the runner dies, remove the processing label only after confirming no active
  Pi/HERDR process exists, then re-add `sdlc:ready`.

