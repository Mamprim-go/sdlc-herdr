# Architecture decisions

## Control plane versus execution plane

GitHub owns policy and release gates. Pi Dynamic Workflows owns agent
orchestration. HERDR owns terminal execution. PI is invoked inside HERDR and
produces structured artifacts.

This is intentionally different from treating an agent terminal as an approval authority.

## Open SWE influence

Open SWE is a useful reference for:

- one isolated environment per task;
- curated tools rather than unrestricted integrations;
- explicit repository context (`AGENTS.md`);
- middleware around the agent loop;
- follow-up messages while a run is active;
- deterministic thread/task identity;
- PR creation and validation as first-class outputs.

This project adapts those ideas to GitHub Issues and HERDR panes instead of LangGraph/Deep Agents sandboxes.

## Runtime layout

The repository is intentionally a portable Pi package, not a Python service:

```text
workflows/issue-sdlc.js       deterministic Dynamic Workflow
scripts/github-poller.mjs     GitHub API + cron/self-hosted runner bridge
skills/herdr-sdlc/SKILL.md    HERDR operating rules for agents
prompts/sdlc.md               reusable Pi prompt
.github/workflows/sdlc-cron.yml  ten-minute scheduler
```

Dynamic Workflows cannot perform network or filesystem access from the
orchestrator script. The poller and agents are therefore the integration
boundary for GitHub and HERDR. This keeps the workflow resumable and
deterministic instead of hiding side effects inside it.

## Approval model

The approval identity is external to PI and HERDR:

```text
plan approval  = authorized human + plan_hash
QA approval    = authorized human + report_hash + head_sha
PROD approval  = release manager + artifact_digest + GitHub Environment
```

Any new commit, changed plan, or changed artifact invalidates the corresponding approval.

## Security boundaries

1. Issue bodies, comments, PR descriptions and repository files are untrusted input.
2. Agents run without production credentials.
3. Commands are allowlisted by the runner; HERDR only controls the assigned workspace.
4. The GitHub App has least-privilege permissions.
5. `main`/production branch protection cannot be bypassed by the bot.
