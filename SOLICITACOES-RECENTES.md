# Solicitações recentes — Forja T20

Este arquivo acompanha o estado dos pedidos mais recentes. Ele deve ser atualizado junto com as próximas implementações.

## Pendentes

- [ ] Conferência visual completa em Chrome/Edge desktop e largura de celular.
- [ ] Lote 2: extrair o estado para módulo próprio, consolidar migrações de layout e tratar falhas de gravação no cadastro de personagens.
- [ ] Lote 3: controlador único das nove fases.
- [ ] Lote 4: mecanismo central de efeitos.
- [ ] Lotes 5 a 9: inventário, interface, exportação, limpeza e qualidade final.

## Em desenvolvimento

- Nenhum lote neste momento.

## Implementado

- [x] Lote 1: documentação de desenvolvimento, comando único de verificação, validação sintática, validação dos dados, proteção contra diálogos nativos, proteção do PDF modelo e personagens de referência.
- [x] Lote 2, primeira parte: versão do estado, migração dos níveis e separação do nível inicial, planejado e em edição. A consolidação completa continua pendente.
- [x] 1. Substituir avisos nativos do navegador por notificações e janelas internas centralizadas.
- [x] 2. Impedir duplicação de itens iniciais e de origem ao refazer escolhas, usando identificadores únicos de concessão.
- [x] 3. Ao comprar uma arma de ataque à distância que usa munição, oferecer o conjunto compatível.
- [x] 4. Dar resposta visual aos cliques dos botões e notificar quando um item entrar no carrinho.
- [x] 5. Confirmar a remoção de itens da mochila, com opções para manter, remover tudo ou remover uma unidade/pacote quando houver mais de um.
- [x] 6. Ao subir de nível, abrir o novo nível e orientar a escolha entre poder de classe, geral e, quando disponível, racial.
- [x] 7. Tratar o poder selecionado como escolha válida para o botão Continuar e permitir recolher o bloco sem perder a seleção.
- [x] 8. Mostrar “Ver item completo” somente quando o conteúdo do card ultrapassar sua altura padrão.
- [x] 9. Manter os botões de aquisição em uma linha, com altura padronizada, e resumir o estado adquirido com contador.
- [x] 10. Fazer “Refazer escolhas” reiniciar a fase 8 na primeira escolha, sair da mochila e preservar apenas uma ocorrência de cada concessão.
- [x] 11. Permitir descer um nível na progressão, removendo as escolhas e benefícios provenientes do último nível.

## Testado automaticamente

- [x] `npm run check` valida sintaxe, dados, políticas, PDF, geração determinística e regressões funcionais.
- [x] IDs duplicados, referências de classe inexistentes, preços e espaços inválidos, magias sem escola, mudanças no vocabulário de efeitos e personagens de referência são verificados.
- [x] Migração de fichas antigas, limites dos três níveis e preservação do nível/dinheiro inicial durante edições são verificados.
- [x] Recarregar após descer de nível mantém o nível reduzido; selecionar personagem antigo recupera o nível inicial salvo antes de aplicar os valores padrão.
- [x] HTMLs finais gerados pelas fontes.
- [x] Testes automatizados do Arsenal, Grimório, progressão, inventário e exportação executados.

## Conferido visualmente

- [ ] Desktop 1366×768.
- [ ] Celular 390×844.
