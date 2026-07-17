---
name: herdr-sdlc
description: Executa o fluxo de SDLC de GitHub Issue usando PI Dynamic Workflows e HERDR.
---

# HERDR SDLC

Use esta skill somente dentro de um pane gerenciado pelo HERDR
(`HERDR_ENV=1`). Use a CLI HERDR com os IDs retornados pelo proprio HERDR para
criar workspaces e panes. Nunca presuma que um ID e `w1:p1`.

O workflow esta em `workflows/issue-sdlc.js` e cobre Triage, Plan, Execute,
Thermonuclear Review e QA com browser. O GitHub e a autoridade para aprovacao
humana e merge.
