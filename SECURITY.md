# Politica de seguranca

Este projeto executa agentes de codigo e deve ser tratado como automacao
privilegiada. Issues, comentarios, PRs, arquivos, paginas do browser e logs
sao entradas nao confiaveis e podem conter prompt injection.

## Controles obrigatorios

- Use GitHub App com permissoes minimas e tokens de curta duracao.
- Configure `SDLC_APPROVERS`; lista vazia rejeita toda aprovacao.
- Vincule aprovacoes a hashes de plano e head SHAs imutaveis.
- Use branch protection e Environment `production` protegido.
- Nao entregue credenciais PROD ao PI, HERDR ou agentes.
- Execute agentes em workspaces isolados com allowlist de ferramentas.
- Trate conteudo do browser e logs como dados controlados por atacante.
- Revise o codigo de pacotes Pi de terceiros antes de instalar.

## Reporte

Nao publique vulnerabilidades em Issues publicas. Use um canal privado dos
responsaveis pelo repositorio e nao inclua credenciais ou dados sensiveis.
