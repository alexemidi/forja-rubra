# Estado da unificação

## Implementado e verificado

- Projeto independente em `forja-unificada`, com build versionado. A raiz antiga e `rebuild` foram movidos para `preservacao/arquivos-legados/`; o build não lê essas cópias.
- Fontes correspondentes aos 25 bundles ativos incorporadas; 410 arquivos originais e suas cópias conferidos por SHA-256.
- Cópias auxiliares revisadas; decisões específicas em `matriz-integracao.json`. Ícones exclusivos, estrutura do banner e acesso às recompensas incorporados. Restrições alternativas de conta não ativadas.
- Navegação única para ficha e criador. Removida a substituição de `renderStage` pelo inicializador da ficha, que impedia a subida de nível.
- Renderização inicial após carregar módulos e estilos. Erros de execução interrompem a inicialização.
- Templates explícitos de navegação, rodapé da criação e diálogos. A ficha finalizada não monta a navegação do criador; a progressão a monta sob demanda.
- Card comum das mochilas da ficha e da loja, com adaptadores para suas ações e regras.
- Normalização, dano/cura e aplicação de descanso extraídos para operações puras. Descanso persistido na ficha ativa e no registro do personagem.
- Backup com validação, preservação de campos desconhecidos e reversão em falha. Leitura de ficha inválida não a substitui por uma ficha vazia.
- Testes de navegador para inicialização de 13 páginas, dano/descanso após recarga, card na loja, importação, dados inválidos, subida de nível após recarga, largura em celular e fluxo de engenhoca com seleção prévia de ofício e modo de acoplamento na loja.

## Trabalho estrutural restante

1. Separar os controladores e dependências do criador dos controladores da ficha. Os controles HTML foram separados; os bundles ainda compartilham grande parte dos scripts.
2. Extrair as transações e o contexto de loja, taverna e grimório dos adaptadores globais. Depois substituir a integração por iframe mantendo compra, venda, fabricação, magias e retorno à ficha.
3. Separar o estado transitório de interface dos dados persistidos do personagem com migração compatível. Não remover campos antigos antes de migrar todos os consumidores.
4. Ampliar a conversão para módulos ES e a checagem estrita de tipos. Os módulos novos já são checados; o legado ainda é concatenado pelo build.

## Validação

`npm run check` executa tipos, build, os 31 scripts herdados, testes do núcleo e navegador. O registro da rodada completa está em `validacao-completa.log`; `validacao-navegador-final.log` registra a rodada após integrar o rodapé auxiliar. `resultados-navegador.json` contém o resultado estruturado da última execução em Chromium.

Não houve publicação em produção. O encerramento desses testes não representa a conclusão das quatro etapas estruturais acima. A organização da área de trabalho mantém apenas a pasta `forja-unificada/` e a pasta oculta `.git` na raiz; os originais seguem recuperáveis em `preservacao/`.
