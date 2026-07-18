# Arquitetura

## Separacao de responsabilidades

- GitHub: Issues, Pull Requests, checks, reviews, branch protection e release.
- PI Dynamic Workflows: orquestracao dos agentes, fases, fan-out e sintese.
- HERDR: processos, workspaces, panes, persistencia e comunicacao entre agentes.
- PI: triage, planejamento, implementacao, review e geracao de evidencias.
- agent-browser: QA funcional no ambiente de preview.

HERDR nao deve aprovar plano, QA ou PROD. O terminal do agente nao e uma
autoridade de seguranca.

## Layout do repositorio

```text
workflows/issue-sdlc.js          workflow dinamico do PI
scripts/github-poller.mjs        integracao GitHub e scheduler
scripts/control-tower.mjs        contrato puro, sanitizacao, gates e upsert
scripts/promote.mjs              validacao e merge DEV/PROD
scripts/herdr-visible-pipeline.mjs  uma sessao PI interativa por tarefa
skills/herdr-sdlc/SKILL.md       regras para operar HERDR
prompts/sdlc.md                  prompt reutilizavel do PI
.github/workflows/sdlc-cron.yml  cron em runner self-hosted
```

O script de orquestracao nao faz rede, filesystem ou shell. Essas operacoes
ficam no poller e nos agentes, mantendo o workflow deterministico e retomavel.

## Sessoes PI visiveis

Cada Issue cria um workspace HERDR chamado `Issue #<numero> - SDLC` com panes:

```text
00 - Orquestrador PI
01 - Triage
02 - Plano
03 - Execucao
04 - Thermonuclear Review
05 - QA agent-browser
06 - Gates GitHub
```

Cada tarefa inicia uma sessao PI persistente com nome `Issue #<numero> - <tarefa>`.
O operador pode focar qualquer pane, ler a conversa, interromper o agente e
enviar instrucoes. O poller nao fecha o workspace ao atingir um gate humano.

## Influencia do Open SWE

O projeto adota ideias do Open SWE:

- um ambiente isolado por tarefa;
- ferramentas selecionadas, em vez de acesso irrestrito;
- contexto explicito do repositorio;
- middleware e revisao adversarial;
- tarefas e resultados estruturados;
- PR como resultado de primeira classe.

Aqui a execucao usa HERDR e PI, e nao LangGraph/Deep Agents.

## Modelo de aprovacao

```text
aprovacao de QA    = humano autorizado + hash do relatorio + head SHA
aprovacao PROD     = release manager + artifact digest + Environment GitHub
```

Qualquer novo commit, plano ou artifact alterado invalida a aprovacao de QA.

## Limites de seguranca

1. Issues, comentarios, PRs, arquivos, paginas e logs sao dados nao confiaveis.
2. Agentes nao recebem credenciais de producao.
3. O GitHub App usa apenas permissoes minimas.
4. O bot nao faz bypass da branch protection.
5. O workflow falha fechado quando nao existe evidencia ou aprovacao valida.

## Control Tower

O poller publica `<!-- sdlc-control-tower:v1 -->` como comentário único por
Issue. A coleta de snapshot, validação de eventos humanos, allowlist de URLs,
renderização Markdown e eleição determinística do comentário ficam separadas
em `scripts/control-tower.mjs`. GitHub (autor, comentário, timestamp, hash,
head SHA, checks e artifacts) continua sendo a autoridade; dados do HERDR são
apenas estado observado. Atualizações repetidas usam PATCH no comentário
existente e, após releitura, removem somente duplicatas do bot.
