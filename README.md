# SDLC HERDR

Pipeline de SDLC orientada a GitHub Issues, com PI como coding agent, HERDR como runtime de workspaces/panes e GitHub como autoridade de aprovação e merge.

> **Status:** scaffold/MVP em construção. O código não deve ser usado para deploy de produção sem configurar branch protection, GitHub Environments e um GitHub App.

## Arquitetura

```text
GitHub Issue/PR
      │ webhook
      ▼
Pi Dynamic Workflow
      │
      ├── HERDR workspace/panes
      │     ├── PI Triage
      │     ├── PI Plan
      │     ├── PI Execute
      │     ├── Thermonuclear Review
      │     └── agent-browser QA
      │
      └── GitHub checks, reviews, environments e merges
```

HERDR não é o sistema de aprovação. Ele mantém os processos e agentes vivos e expõe CLI/socket API. Aprovações de plano, QA e PROD são gates verificáveis no GitHub.

## Fluxo

```text
Triage → Plan → plan approval → Execute → Review → Browser QA
       → QA approval → DEV merge → PROD approval → PROD merge/deploy
```

## Quick start local

Requisitos: Node.js 20+, `herdr` no PATH, PI instalado e o pacote `@quintinshaw/pi-dynamic-workflows` instalado no PI.

```powershell
cd sdlc-herdr
npm run validate
pi install npm:@quintinshaw/pi-dynamic-workflows
pi install .
```

Para executar o controller:

```powershell
npm run poll
```

Para usar o poller, defina `GITHUB_TOKEN`, `GITHUB_REPOSITORY` e `SDLC_PI_BIN`. O
poller deve rodar em um self-hosted runner com HERDR e PI; GitHub-hosted runners
não conseguem acessar o HERDR local.

## Integração HERDR + PI

Instale a integração oficial do HERDR no PI:

```bash
herdr integration install pi
```

O workflow não inventa IDs de panes. Use a CLI HERDR com IDs retornados pelo
próprio HERDR, conforme `skills/herdr-sdlc/SKILL.md`.

## GitHub e cron

`.github/workflows/sdlc-cron.yml` executa o `scripts/github-poller.mjs` a cada
10 minutos e também permite `workflow_dispatch`. O runner precisa das labels
`self-hosted`, `herdr` e `sdlc`. Para produção, prefira um GitHub App com
permissões mínimas e configure:

- label `sdlc:ready` para iniciar trabalho;
- label `sdlc:processing` para deduplicar polling;
- branch protection em `dev` e `main`;
- Environment `production` com required reviewers;
- checks obrigatórios para CI, review e browser QA.

## Segurança obrigatória

- Issue/PR/comment são entrada não confiável.
- O controller não interpreta texto livre como aprovação.
- Aprovações são vinculadas ao hash do plano e ao `head_sha` do PR.
- PROD usa GitHub Environment `production` com required reviewers.
- O bot não pode fazer bypass de branch protection.
- Use GitHub App/OIDC e tokens mínimos; não use PAT pessoal em produção.
- Execute agentes em workspace/sandbox sem credenciais de produção.

## Exportar e instalar

O repositório é portátil: copie ou publique este diretório no GitHub e instale
os recursos do PI em outra máquina:

```bash
npm install
pi install npm:@quintinshaw/pi-dynamic-workflows
pi install git:github.com/ORG/sdlc-herdr
```

Para uma instalação local no Windows:

```powershell
./scripts/install.ps1
```

Depois execute `/reload` no PI. O poller é deliberadamente separado do
workflow; ele só busca Issues e inicia o PI. As decisões de aprovação continuam
no GitHub.

## Referências

- [HERDR docs](https://herdr.dev/docs/)
- [HERDR Socket API](https://herdr.dev/docs/socket-api/)
- [HERDR integrations](https://herdr.dev/docs/integrations/)
- [PI SDK](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/sdk.md)
- [PI RPC](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/rpc.md)
- [Open SWE](https://github.com/langchain-ai/open-swe)

Configure tamb�m a vari�vel de reposit�rio SDLC_APPROVERS com os logins humanos autorizados, separados por v�rgula. O poller falha fechado quando essa vari�vel n�o est� configurada.
