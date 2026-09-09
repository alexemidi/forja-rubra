# Solicitações recentes — Forja T20

Este arquivo acompanha o estado dos pedidos mais recentes. Ele deve ser atualizado junto com as próximas implementações.

## Pendentes

- [ ] Ficha pronta: separar itens vestidos; quadro de armadura/escudo e valores de CD/atributo/bônus por fonte de magia; conferência visual. Distribuição de moedas entre TC/T$/TO e carga de moedas ainda pendentes.

- [ ] Conferência visual completa em Chrome/Edge desktop e largura de celular.
- [ ] Lote 2: extrair o estado para módulo próprio, consolidar migrações de layout e tratar falhas de gravação no cadastro de personagens.
- [ ] Lote 3: controlador único das nove fases.
- [ ] Lote 4: mecanismo central de efeitos.
- [ ] Lotes 5 a 9: inventário, interface, exportação, limpeza e qualidade final.

## Em desenvolvimento

- Nenhum lote neste momento.

## Implementado

- [x] Campos de moedas e carga na ficha pronta: saldo atual em T$, TC/TO exibidos como zero, limite, carga usada dos itens e máxima. Não há distribuição manual do saldo entre metais nesta versão.
- [x] Perícias alinhadas ao início da identificação, removendo o deslocamento vertical herdado e mantendo equipamento abaixo das duas colunas.

- [x] Resumos curtos explícitos para os exemplos de poderes do Zahir, entre parênteses; magia da tatuagem e atributo de aumento obtidos da escolha salva. Texto completo permanece expansível.
- [x] Corrigida regra CSS que deslocava o botão de ordenação das perícias para fora do cabeçalho.

- [x] Ficha pronta: identificação com rótulos sem nome repetido, perícias por A–Z ou atributo + A–Z, progressão à esquerda com descrições expansíveis, habilidades iniciais separadas, magias expansíveis e campos persistidos de condições e anotações.

- [x] Organização da ficha pronta: atributos e vitais na coluna de ataques, perícias completas à direita, equipamento abaixo e progressão por nível ao lado das habilidades e proficiências. Mantidas as cores da Forja.

- [x] Continuar na progressão confirma a seleção antes da validação global; avança ao próximo nível e finaliza quando não restam pendências. Botão reabilitado após a transição.
- [x] Descrição de poder na progressão mostra nome, texto e escolhas necessárias; etiquetas redundantes removidas.

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

- [x] Cliques no DOM: selecionar aumento, escolher atributo e Continuar em dois níveis consecutivos sem a validação antiga interromper a confirmação.

- [x] `npm run check` valida sintaxe, dados, políticas, PDF, geração determinística e regressões funcionais.
- [x] IDs duplicados, referências de classe inexistentes, preços e espaços inválidos, magias sem escola, mudanças no vocabulário de efeitos e personagens de referência são verificados.
- [x] Migração de fichas antigas, limites dos três níveis e preservação do nível/dinheiro inicial durante edições são verificados.
- [x] Recarregar após descer de nível mantém o nível reduzido; selecionar personagem antigo recupera o nível inicial salvo antes de aplicar os valores padrão.
- [x] HTMLs finais gerados pelas fontes.
- [x] Testes automatizados do Arsenal, Grimório, progressão, inventário e exportação executados.

## Conferido visualmente

- [ ] Conferir a nova organização da ficha pronta contra as imagens de referência, em desktop e celular.

- [ ] Desktop 1366×768.
- [ ] Celular 390×844.
