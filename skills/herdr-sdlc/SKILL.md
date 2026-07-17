---
name: herdr-sdlc
description: Run the GitHub Issue SDLC workflow using Pi Dynamic Workflows and HERDR.
---

# HERDR SDLC

Use this skill only inside a HERDR-managed pane (`HERDR_ENV=1`). Use HERDR CLI
with IDs returned by HERDR to create an isolated workspace and panes. Start PI
normally in a pane; do not assume that a pane ID is `w1:p1`.

The workflow source is `workflows/issue-sdlc.js`. It handles Triage, Plan,
Execute, Thermonuclear Review and browser QA. GitHub is the authority for
human approvals and merge gates.

