# Manual de operacao

## Preparacao

1. Instale o pacote de Dynamic Workflows e a integracao do PI:

   ```bash
   pi install npm:@quintinshaw/pi-dynamic-workflows
   herdr integration install pi
   ```

2. Crie as labels `sdlc:ready`, `sdlc:processing`, `sdlc:plan-review`,
   `sdlc:qa-review`, `sdlc:qa-approved`, `sdlc:needs-fix` e `sdlc:blocked`.
3. Proteja `dev` e `main`. O bot nao pode ignorar a protecao.
4. Crie o Environment `production` com required reviewers.
5. Crie o secret `SDLC_GITHUB_TOKEN` usando um GitHub App.
6. Defina a variable `SDLC_APPROVERS` com uma lista explicita de logins humanos.
7. Configure um runner self-hosted com labels `herdr` e `sdlc`, Node 20, PI,
   HERDR e agent-browser.

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
- Plano novo invalida a aprovacao do plano.
- Nao remova `sdlc:processing` enquanto um runner estiver ativo.
- Se o runner morrer, confirme que nao ha PI/HERDR ativo antes de reativar a Issue.
