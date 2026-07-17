# SDLC HERDR

Pipeline de SDLC baseada em GitHub Issues, PI Dynamic Workflows, HERDR e agent-browser.

> Status: MVP em evolucao. Nao use para producao sem configurar protecao de branches, GitHub Environments, GitHub App e runner isolado.

## Arquitetura

```text
GitHub Issue/PR
      |
      v
PI Dynamic Workflow
      |
      +-- HERDR: workspaces e panes
      |     +-- PI Triage
      |     +-- PI Plan
      |     +-- PI Execute
      |     +-- Thermonuclear Review
      |     +-- agent-browser QA
      |
      +-- GitHub: checks, reviews, ambientes e merges
```

HERDR e o runtime de terminais e agentes. Ele nao e a autoridade de aprovacao.
O GitHub e a autoridade para aprovacoes humanas, protecao de branches e release.

## Fluxo

```text
Triage -> Plan -> aprovacao humana do plano -> Execute
       -> Thermonuclear Review -> agent-browser QA
       -> aprovacao humana do QA -> merge DEV
       -> aprovacao humana PROD -> merge/deploy PROD
```

## Instalacao

Requisitos: Node.js 20+, PI, HERDR e credenciais do provedor de modelo.

```powershell
cd sdlc-herdr
npm install
npm run validate
pi install npm:@quintinshaw/pi-dynamic-workflows
pi install .
herdr integration install pi
```

Depois execute `/reload` no PI.

## GitHub e cron

`.github/workflows/sdlc-cron.yml` executa o poller a cada dez minutos e tambem
permite `workflow_dispatch`. O runner deve ser self-hosted e ter as labels:

```text
self-hosted, herdr, sdlc
```

Configure no repositorio:

- permissao `issues: write` e `contents: write` no `GITHUB_TOKEN` dos workflows;
- variable `SDLC_APPROVERS` com logins humanos separados por virgula;
- labels `sdlc:ready`, `sdlc:processing`, `sdlc:plan-review`, `sdlc:qa-review`,
  `sdlc:qa-approved`, `sdlc:needs-fix` e `sdlc:blocked`;
- protecao de branches `dev` e `main`;
- Environment `production` com required reviewers;
- checks obrigatorios para CI, review e QA.

Adicione `sdlc:ready` a uma Issue para iniciar o fluxo.

## Aprovacoes

O plano e publicado como comentario com hash. Um aprovador configurado deve
comentar exatamente:

```text
/approve plan sha256:<hash-do-plano>
```

Depois do QA:

```text
/approve qa <head-sha-do-PR>
```

Comentarios sao apenas solicitacoes. O poller valida autor, hash e SHA. PROD
usa adicionalmente a aprovacao nativa do GitHub Environment.

## Promocao

Para DEV, use o workflow `Promote approved PR to DEV` informando Issue, PR e
SHA revisado. Para PROD, use `Promote approved DEV PR to PROD`; o Environment
`production` interrompe o job ate a aprovacao humana.

## Desenvolvimento

```powershell
npm test
npm run validate
```

## Exportar e instalar em outra maquina

```bash
git clone https://github.com/Mamprim-go/sdlc-herdr
cd sdlc-herdr
npm install
pi install npm:@quintinshaw/pi-dynamic-workflows
pi install .
```

No Windows, o instalador local e:

```powershell
./scripts/install.ps1
```

## Referencias

- https://herdr.dev/docs/
- https://herdr.dev/docs/socket-api/
- https://herdr.dev/docs/integrations/
- https://github.com/langchain-ai/open-swe
- https://github.com/QuintinShaw/pi-dynamic-workflows
