# Manual de operacao

## Preparacao

1. Instale o pacote de Dynamic Workflows e a integracao do PI:

   ```bash
   pi install npm:@quintinshaw/pi-dynamic-workflows
   herdr integration install pi
   ```

2. Crie as labels `sdlc:ready`, `sdlc:processing`, `sdlc:qa-review`,
   `sdlc:qa-approved`, `sdlc:needs-fix` e `sdlc:blocked`.
3. Proteja `dev` e `main`. O bot nao pode ignorar a protecao.
4. Crie o Environment `production` com required reviewers.
5. Defina a variable `SDLC_APPROVERS` com uma lista explicita de logins humanos.
6. Execute o workflow `Configure SDLC labels` uma vez.
7. Configure um runner self-hosted com labels `herdr` e `sdlc`, Node 20, PI,
   HERDR e agent-browser.

## Control Tower

Para cada Issue aberta com label `sdlc:*`, o poller mantém um único comentário
iniciado por `<!-- sdlc-control-tower:v1 -->`. O comentário é atualizado por ID
e duplicatas do bot são reconciliadas mantendo a mais antiga; comentários
humanos nunca são removidos. O bloco legível mostra estado, fase, Issue,
workspace, PR/SHA, gates, próxima ação e fail-safe. O bloco de dados é apenas
metadado sanitizado: corpo de Issue, prompts, secrets e transcripts não são
publicados.

Evidências só aparecem quando são URLs HTTPS do GitHub vinculadas ao repositório
e acompanhadas de SHA/digest verificável. A aprovação continua pendente sem
comentário GitHub de um login em `SDLC_APPROVERS`, hash exato e SHA correspondente.
Labels são sinalização, não prova de aprovação.

## Fluxo normal

1. Adicione `sdlc:ready` a uma Issue.
2. O cron inicia o workflow e publica o plano.
3. Um aprovador autorizado comenta:

   ```text
   /approve plan sha256:<hash-do-plano>
   ```

4. O poller retoma somente com o mesmo plano aprovado.
5. Apos o QA, um aprovador comenta:

   ```text
   /approve qa <head-sha>
   ```

6. Execute `Promote approved PR to DEV` com Issue, PR e SHA exatos.
7. Abra uma PR `dev -> main` e execute `Promote approved DEV PR to PROD`.
   O Environment pausa o job ate uma aprovacao humana.

## Falhas

- `sdlc:blocked` significa falha segura. Leia o comentario estruturado.
- Commit novo invalida a aprovacao de QA.
- Plano novo exige uma nova execucao antes da aprovacao de QA.
- Nao remova `sdlc:processing` enquanto um runner estiver ativo.
- Se o runner morrer, confirme que nao ha PI/HERDR ativo antes de reativar a Issue.
- Em `blocked`, corrija a causa no GitHub, confirme o SHA e reexecute o cron;
  nunca edite o comentário para simular uma aprovação. Se houver lock stale no
  runner, confirme que não existe poller ativo e remova somente o lease local.
