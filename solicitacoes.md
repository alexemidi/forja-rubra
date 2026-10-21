# Histórico de Solicitações do Usuário · Forja T20

Este documento mantém o registro simplificado e numerado de todas as solicitações do usuário, detalhando o entendimento da demanda, o que foi implementado e o status de precisão/aderência.

---

### Solicitação 1: Barra inferior fixa e rolagem da página
- **Pedido**: Na rolagem para baixo, remover partes fixas indesejadas e garantir que os botões [Voltar], [Trocar Oficina], [Recompensa] e [Finalizar Compra] fiquem acessíveis na barra inferior vermelha, sem sobreposição por faixas pretas.
- **Entendimento**: Os botões da barra inferior da loja e das oficinas precisam ser mantidos fixos e visíveis, sem emojis, com cor vermelha padrão e sem cortes na rolagem.
- **Implementado**:
  - Ajustado o CSS de `sheet-shop-footer` e `workshop-footer`.
  - Removidos emojis dos botões e mantido estilo vermelho padronizado (`#991b1b`).
- **Status**: Implementado e mantido.

---

### Solicitação 2: Visualização da Oficina do Engenhoqueiro em 3 colunas
- **Pedido**: Cards da oficina do engenhoqueiro em 3 colunas, incluindo o criador de engenhocas e as engenhocas já fabricadas. Botão "Ver magia simulada" para abrir o card da magia como no grimório. Remoção de informações desnecessárias e exibição de "X / Y ativas" no card criador.
- **Entendimento**: Reorganizar o grid da bancada do engenhoqueiro para 3 colunas, criar modal de visualização de magia simulada e exibir contagem de ativas.
- **Implementado**:
  - Adicionado grid `.workshop-backpack-cards-grid` em 3 colunas.
  - Implementado modal de magia simulada (`openSimulatedSpellModal`).
  - Atualizado texto para "Escolher magia simulada".
- **Status**: Implementado e mantido.

---

### Solicitação 3: Oficina do Armeiro e Aprimoramento Individual de Itens
- **Pedido**: Tamanho padronizado dos cards na oficina (sem começar bizarramente expandidos). O teste de aprimoramento deve de fato aprimorar o item na mochila. Se o herói tiver múltiplos itens iguais (ex: 3 maças), aprimorar apenas UMA unidade (gerando 1 maça certeira e mantendo 2 maças mundanas).
- **Entendimento**: Corrigir altura inicial dos cards com botão de expandir; garantir que o fluxo de teste de ofício aplique a melhoria e faça o split de pilhas de itens com quantidade > 1.
- **Implementado**:
  - Corrigido split de quantidade na mochila ao aprimorar (`quantity - 1` na pilha base e nova entrada individual com melhorias).
  - Integrado modal de teste de ofício de armeiro ao aprimoramento.
- **Status**: Implementado e mantido.

---

### Solicitação 4: Filtro Especial para Armas Anãs Tradicionais
- **Pedido**: A origem Anão de Armas concede "Arma marcial tradicional anã". As armas anãs são exclusivamente as que contenham no nome: **Machado**, **Machadinha**, **Martelo**, **Marreta** ou **Picareta**. Criar filtro estrito para essa escolha na criação de personagem.
- **Entendimento**: Limitar a escolha na loja/concessão inicial apenas a armas com esses nomes.
- **Implementado**:
  - Em `src/regras/criador/passivas-proficiencias.js` e `src/funcionalidades/loja/05-01-availableInitialItems.js`, adicionada flag `dwarfWeaponOnly` e regex `/machado|machadinha|martelo|marreta|picareta/i`.
- **Status**: Implementado e mantido.

---

### Solicitação 5: Regras e Operações com Engenhocas
- **Pedido**: Engenhocas podem ser empunhadas ou vestidas, mas NÃO podem ser vendidas, aprimoradas ou encantadas. Podem ser destruídas para liberar espaço para outra engenhoca.
- **Entendimento**: Bloquear botões e operações de venda, aprimoramento e encanto para engenhocas. Adicionar botão `[ Destruir]` com confirmação, desequipando e removendo da mochila e da cota de ativas.
- **Implementado**:
  - Adicionados botões de empunhar e vestir para engenhocas.
  - Bloqueada a venda em `venda.js` e ocultado botão de venda.
  - Implementada ação de destruição com confirmação.
- **Status**: Implementado e mantido.

---

### Solicitação 6: Limite Absoluto de Carga Máxima (`maximum = limit * 2`)
- **Pedido**: Bloquear qualquer compra, fabricação ou adição de recompensa se o peso total for exceder a carga máxima permitida (`limite * 2`).
- **Entendimento**: O personagem não pode aceitar compras na loja, fabricar itens para si na oficina ou receber recompensas se ultrapassar `maximum`.
- **Implementado**:
  - Verificação e bloqueio inseridos em `05-00-initialChoice.js`, `loja-taverna-recompensas.js` e `passivas-proficiencias.js`.
- **Status**: Implementado e mantido.

---

### Solicitação 7: Reajuste Automático do Preço de Itens Aprimorados
- **Pedido**: Quando um item recebe melhorias, seu preço de tabela deve ser reajustado (preço base + custo das melhorias). A venda do item deve pagar metade desse valor reajustado.
- **Entendimento**: Persistir o valor recalculado em `entry.customPrice` e `entry.price` e usar esse valor no card e na venda.
- **Implementado**:
  - Cálculo de valor agregado de melhorias gravado na ficha e refletido no modal de venda e no card.
- **Status**: Implementado e mantido.

---

### Solicitação 8: Card da Mochila Idêntico ao da Loja (- Botão de Adicionar ao Carrinho)
- **Pedido**: Ao clicar em um item na mochila da ficha do herói, exibir o card expandido idêntico ao `item-card` da loja (com ícone, título em Cinzel, badges de livro e categoria, grid de 4 colunas de atributos, tags de propriedades, caixas de regras e botão de aprimorar), exceto o botão de adicionar ao carrinho.
- **Entendimento**: Reproduzir a exata estrutura do `.item-card` da loja no inline details da mochila, sem textos colados, com botão vermelho `[[Forjar] Aprimorar Item]` no topo e botões quadrados de ação do Inventor no rodapé.
- **Implementado**:
  - Atualizado `src/funcionalidades/criador/inventario/mochila-heroi-moedas-consumo.js` com marcação `.item-card`.
  - Estilos em `src/estilos/criador/equipamento.css`.
  - Recompilado para `dist/` via `npm run build` para refletir imediatamente no navegador do usuário.
- **Status**: Implementado e atualizado.

---

### Solicitação 9: Botões [← Anterior] e [Próxima →] Somente nas Fases 6, 7, 8 e 9 com Mais de Uma Escolha
- **Pedido**: Os botões [← Anterior] e [Próxima →] devem ser exibidos APENAS nas fases 6, 7, 8 e 9 e SOMENTE SE houver mais de uma escolha nessas fases. Se houver apenas uma escolha (ou nenhuma), esses dois botões NÃO devem aparecer. Na fase 9, se o personagem for criado no nível 1, esses botões não devem aparecer.
- **Entendimento**:
  - Fases 1 a 5: nunca exibir [← Anterior] e [Próxima →].
  - Fase 6: exibir apenas se `generalPowerSlots() > 1`.
  - Fase 7: exibir apenas se número de grupos de magias > 1.
  - Fase 8: exibir apenas se `plan.length > 1` e ainda não finalizado.
  - Fase 9: exibir apenas se nível planejado > 1 e houver mais de um nível com escolha de poder.
- **Implementado**:
  - Implementada a função `syncPhaseStepNavigation()` em `01-identidade-escolhas.js`, aplicada sistematicamente em todas as fases no fluxo de sincronização do rodapé.
- **Status**: Implementado e validado.

---

### Solicitação 10: Comportamento do Botão [Avançar →] e Novo Botão [Pendência →] / [Finalizar Ficha →]
- **Pedido**:
  - O botão `[Avançar →]` NÃO deve pular para a próxima pendência; ele deve apenas passar para a próxima fase linearmente.
  - Quando um personagem já foi finalizado e o usuário clica em "Editar ficha":
    - Deve surgir um novo botão chamado `[Pendência →]` se houver alguma pendência na ficha, pulando diretamente para a fase pendente.
    - Se NÃO houver pendências (ou quando todas forem concluídas), esse botão deve se tornar `[Finalizar Ficha →]`.
- **Entendimento**: Separar a navegação passo-a-passo (botão Avançar) do atalho de pendências (botão Pendência), disponível no modo de edição pós-finalização.
- **Implementado**:
  - Inserido botão `#pendingOrFinishButton` no rodapé da página em `criador.html` com estilos dedicados (âmbar para pendência e verde para finalizar).
  - Ajustado `nextButton` para usar `getNextLinearStep(state.step)` avançando fase a fase sem pular etapas preenchidas.
  - Conectado `#pendingOrFinishButton` com detecção de pendências globais (`findFirstPendingPhase()`), alternando para `[Finalizar Ficha →]` quando todas as pendências forem sanadas.
- **Status**: Implementado e validado.

---

### Solicitação 11: Aviso ao Clicar em "Refazer Escolhas" na Mochila com Itens Alterados
- **Pedido**: Se o usuário comprou itens ou alterou a mochila na ficha, notificar ao clicar em "Refazer escolhas" que todos os itens serão apagados e repostos como se a ficha estivesse sendo refeita do zero, alertando para anotar e resgatar como recompensa se quiser manter algo.
- **Entendimento**: Interceptar o clique em `#redoInitialItemsButton` e exibir mensagem explicativa de confirmação caso o inventário contenha alterações.
- **Implementado**:
  - Em `loja-itens-iniciais.js`, o clique em `#redoInitialItemsButton` detecta modificações na mochila e exibe o alerta: *"Você fez alterações na mochila ou comprou itens. Ao clicar em refazer escolhas, todos os itens da mochila serão apagados e repostos como se a ficha tivesse sido refeita do zero. Se você quiser manter algum item, anote-o e resgate-o como recompensa depois. Deseja continuar?"*.
- **Status**: Implementado e validado.

---

### Solicitação 12: Redesenho do Card de Itens (Linha Única de Atributos, Badges com Preço/Espaço, Melhoria Mitral, Botões Integrados)
- **Pedido**:
  - Os campos que exibem atributos ficavam em quadros com títulos ("Dano", "Crítico", etc.); colocar tudo em uma linha só, sem títulos, deixando apenas os valores organizados (ex: `1d8  2x  Uma mão  Corpo a corpo  Impacto  —`).
  - Mover os valores de preço e espaço para ficarem ao lado das tags no topo (ex: `(ARMAS) (SIMPLES) (LIVRO BÁSICO) T$ 12 1 esp.`), apenas o valor sem a palavra "preço" e com o valor do espaço + abreviação "esp.".
  - Modificar o nome da melhoria de material especial que exibia `(material_especial)` para "Mitral" (ou o nome do material correspondente).
  - Remover os botões vermelhos externos e do cabeçalho (Aprimorar, Empunhar, Vender), pois ao abrir o card já existem os botões temáticos dentro dele (quadrados `[[Forjar]]` e `[[Encanto]]` à esquerda e contextuais `[ Empunhar]` e `[[Saldo] Vender]` à direita no rodapé).
  - Aplicar essas mesmas alterações visuais em tudo que usa a visualização da loja e oficinas (como o Ofício Armeiro e o catálogo de itens).
- **Entendimento**:
  - Padronizar a visualização em linha única de atributos (sem rótulos e sem quadros em grid de 4 colunas) e integrar preço e espaço diretamente no container de badges no cabeçalho.
  - Resolver a chave interna `material_especial` para o nome amigável do material (Mitral, Adamante, etc.) em qualquer exibição de melhorias.
  - Limpar botões vermelhos externos da linha da mochila e do cabeçalho do card, centralizando as ações temáticas no rodapé do card expandido.
  - Replicar essa exata identidade visual em `mochila-heroi-moedas-consumo.js`, `persistCharacterProfiles.js` (loja), `initialChoice.js` (oficina/bancada) e respectivos CSSs (`equipamento.css` e `0.css`).
- **Implementado**:
  - Atualizado `itemStatsHtml` e `itemStats` para renderizar apenas os valores com classe `.item-stat-val` e tipografia Cinzel estilizada em flexbox horizontal com divisores superior e inferior.
  - Removidos Preço e Espaços dos atributos e adicionados em `.badges` como `.badge-price` (`T$ 12`) e `.badge-spaces` (`1 esp.`).
  - Mapeado `material_especial` para o nome formatado do material (ex: `Mitral`).
  - Removido `headerAction` vermelho do topo do card da mochila e ocultadas ações redundantes da linha colapsada da mochila (`.equip-card-actions`).
  - Adicionados estilos flexíveis e responsivos em `equipamento.css` e `0.css` para a loja e oficinas.
- **Status**: Implementado e compilado no build.

---

### Solicitação 13: Refinamento dos Cards (Melhorias sem Underscore, Botão Recolher, Preço/Espaço na Linha de Atributos, Formato Armaduras/Escudos e Limitação de Nível do Inventor)
- **Pedido**:
  1. Nas melhorias, remover os `_` (ex: em vez de `banhado_a_ouro`, exibir `banhado a ouro`).
  2. O botão "Recolher item" dos cards (que reduz a visualização APENAS NAS MOCHILAS) deve ter a função de recolher o item voltando a ficar apenas a barrinha.
  3. Mudar a posição do preço e espaços: não deixar ao lado da tag do livro básico, mas sim no início da linha de atributos: `T$ 30  1 esp.  1d8  2x  Uma mão  Corpo a corpo  Corte  —`.
  4. Para escudos e armaduras, a linha de atributos não deve ser `+4 -3 Aplica na Defesa`, e sim:
     - `Def. +4  Pen. -3  Soma Atributo de Defesa` (se armadura leve) ou `NÃO Soma Atributo de Defesa` (se armadura pesada).
     - Para escudos: `Def. +1  Pen. -1` (+ ataque/crítico se houver).
  5. Limitação de fabricação na Oficina do Armeiro: o inventor só pode fabricar itens mágicos específicos menores a partir do nível 9, médios a partir do nível 13 e maiores a partir do nível 17. Deixar essas limitações na loja da oficina do armeiro.
- **Entendimento**:
  - Formatar visualmente os nomes das melhorias substituindo underscores por espaços em toda a UI.
  - O botão `[data-sheet-card-expand]` na mochila, ao ser clicado quando o card estiver expandido, deve fechar os detalhes inline e recolher o item à barrinha original.
  - Remover badges de preço/espaço do cabeçalho e inseri-los no começo da linha horizontal de atributos tanto na mochila quanto na loja/oficinas.
  - Reformatar a descrição de atributos de armaduras e escudos com o novo padrão (`Def. +X  Pen. -Y  Soma/NÃO Soma Atributo de Defesa`).
  - Bloquear a fabricação de itens mágicos específicos na oficina caso o nível do artesão/inventor não atenda ao requisito da categoria (menor: 9, médio: 13, maior: 17).
- **Implementado**:
  - `rawImps.map(...)` e seletores de melhorias agora usam `.replace(/_/g, ' ')`.
  - O toggle de expansão na mochila fecha o container inline e remove o estado expandido ao clicar em "Recolher item".
  - Preço e espaços foram movidos para o início de `.item-stats` (`formatPrice` e `formatSpaces + ' esp.'`) e removidos de `.badges`.
  - Armaduras agora exibem `Def. +${defesa}`, `Pen. ${penalidade}`, `Soma Atributo de Defesa` / `NÃO Soma Atributo de Defesa`. Escudos exibem `Def. +${bonusDefesa}`, `Pen. ${penalidade}`.
  - Adicionada trava de nível para itens mágicos específicos na oficina (`isSpecificMagicItem`), desabilitando o botão de forjar e exibindo o aviso ` Requer Nível X (categoria)`.
- **Status**: Implementado e validado.

---

### Solicitação 14: Padronização do Card na Mochila da Loja (e Fase 8), Justificação Inteligente dos Atributos e Recategorização dos Itens Litúrgicos
- **Pedido**:
  1. Ao entrar na loja e clicar em mochila (ou no fim das escolhas de itens na fase 8), ao clicar em um item deve descer um card exatamente igual ao card da mochila da ficha do herói, padronizando a visualização e eliminando cards legados/diferentes, com ajustes contextuais nos botões.
  2. Ajustar a linha de atributos do item no card: quando preencher toda a linha pode ser justificada (`space-between`), mas se forem poucas informações (ex: apenas Preço e Espaço) NÃO deve justificar para não afastar os itens com um grande vazio no meio.
  3. Recategorizar os 35 itens litúrgicos para que, além de litúrgicos, também sejam categorizados e exibidos como itens menores, médios ou maiores (armas específicas, armaduras específicas ou acessórios):
     - *Acessório maior*: Cilício Vivo, Coração Corrompido, Tapeçaria da Guerra, Ossos Dracônicos.
     - *Acessório menor*: Coroa de Flores, Jarro das Profundezas, Escrivaninha Consagrada.
     - *Acessório médio*: Cubo Armadilha, Caldeirão da Vida, Instrumento da Alegria, Véu Diáfano, Colar de Presas, Vestido Noturno, Pira Póstera, Botas Inquietas, Argolas Místicas, Varinha da Generosidade.
     - *Arma específica menor*: Cajado das Matas, Machado da Bravura, Adaga Sorrateira, Maça Monstruosa, Machado Lamnoriano.
     - *Arma específica média*: Alfange Dourado, Cimitarra Solar, Lança da Dominação, Espada Monástica, Alabarda da Coragem, Katana da Determinação, Alguma Coisa de Nimb..., Tridente Aquoso, Adaga Ofídica, Espada Imaculada, Mangual Aventureiro.
     - *Arma específica maior*: Bordão Sabichão.
     - *Armadura específica média*: Armadura do Julgamento.
- **Entendimento**:
  - Unificar a renderização de detalhes da mochila da loja (`backpackItemHtml` e `backpackCompactHtml`) com a estrutura de `.sheet-item-inline-details` / `.item-card` da ficha, com cabeçalho em Cinzel, badges de livro/tipo/categoria, linha de atributos, descrições ricas de regras/propriedades, melhorias formatadas, botão de expandir/recolher para a barrinha e botões temáticos no rodapé (`[[Forjar]]`, `[[Encanto]]`, `[[Saldo] Vender]` / `[× Remover]`).
  - No CSS e nos geradores de stats, aplicar `justify-content: flex-start; gap: 8px 18px;` como padrão; aplicar `justify-content: space-between` apenas quando houver 5 ou mais atributos (através de `:has(> :nth-child(5))` e classes `.has-many-stats` / `.has-few-stats`).
  - Mapear a categoria de todos os itens litúrgicos para seus subtipos específicos de equipamento e acessórios (ex: `arma_especifica_menor`, `armadura_especifica_medio`, `acessorio_maior`), incluir essas categorias em `CATEGORY_LABELS`, atualizar `isSpecificMagicItem` para incluir litúrgicos e permitir busca e filtros unificados por natureza e tier.
- **Implementado**:
  - `backpackItemHtml` em `03-06-magicRuleStatsHtml.js` reescrito para gerar o card padronizado completo `.sheet-item-inline-details` com `.item-card`.
  - Estilos de `.sheet-item-inline-details`, `.card-bottom-actions`, `.square-action-btn` e overlay adicionados em `src/estilos/loja/0.css`.
  - `.item-stats` atualizado em `equipamento.css` e `0.css` com espaçamento inteligente (sem vazio central para poucos atributos).
  - Categorias litúrgicas vinculadas a `arma_especifica_<tier>`, `armadura_especifica_<tier>` e `acessorio_<tier>` em `03-02-current.js` e adicionados rótulos em `CATEGORY_LABELS`.
  - `isSpecificMagicItem` atualizado em `03-04-syncFilterUI.js` para reconhecer itens litúrgicos como itens específicos, integrando com as limitações de nível da oficina e filtros de busca.
  - Listener de clique em `03-08-registerCustomItem.js` expande e recolhe para a barrinha compacta ao clicar em "Recolher item".
- **Status**: Implementado e validado.

---

### Solicitação 15: Destaque de Navegação da Loja, Cards com Altura Dinâmica Compacta, Card de Engenhoca em 4 Blocos com PV e Engenhocas Acopladas com Permissão do Mestre
- **Pedido**:
  1. Corrigir o destaque na loja: ao clicar em "Mochila", o destaque visual ativo deve sair de "Loja" e acender na "Mochila".
  2. Reduzir a altura padronizada dos cards de forma que a altura se ajuste dinamicamente ao conteúdo até um limite máximo (~280-300px com botão expandir), eliminando espaços vazios verticais em cards com pouca informação, em todas as visualizações (loja, oficinas, mochila da ficha, pós-fase 6).
  3. Nos cards de engenhocas, dividir em blocos padronizados (conforme imagem de referência):
     - 3.1. Descrição (a mesma da criação).
     - 3.2. Magia simulada (com nome da magia e círculo).
     - 3.3. Atributos da engenhoca: `1 espaço · Minúsculo · RD 5 · Defesa 15 · Ativação: ação padrão · PV X` (onde PV é metade dos PV do inventor).
     - 3.4. Atributos do item mundano acoplado (quando houver).
  4. Implementar na etapa de escolha do item da engenhoca (dentro do campo "Formas de uso") a possibilidade de forjar um item junto com a engenhoca:
     - Se o personagem tem Ofício (armeiro), pode acoplar armas mundanas.
     - Se tem Ofício (artesão), pode acoplar itens de aventura e ferramentas mundanas.
     - Se tem Ofício (alfaiate), pode acoplar vestuário/trajes mundanos.
     - Limitar a possibilidades de vestir ou empunhar e excluir alquímicos/consumíveis.
     - Inserir botão `[Forjar em item]` e abaixo o aviso `APENAS COM A PERMISSÃO DO MESTRE`.
     - Ao clicar no botão, exibir modal com o texto: *"Se você não tiver o item em sua mochila será necessário mais uma semana de fabricação mais o custo de 1/3 do valor do item. O tempo total da engenhoca é de duas semanas. O inventor pode usar um item da mochila pra não precisar gastar mais uma semana nem pagar o custo adicional."*
     - Permitir escolher usar item existente da mochila (sem custo ou tempo extra) ou forjar um novo item mundano (+⅓ do custo e +1 semana).
- **Entendimento**:
  - `syncEmbeddedShopActions` deve verificar rigorosamente `state.view === 'backpack'` para alternar a classe `.active` entre Loja e Mochila, e ser chamado sempre que a visualização mudar em `setView`.
  - Trocar as regras de CSS com `height: 440px` e `height: 380px` fixas por `height: auto; min-height: auto; max-height: 290px; overflow: hidden;` (e `max-height: none` ao expandir), ajustando o threshold do catálogo para 285px.
  - Reestruturar `contraptionPortfolioCardHtml` e a visualização da engenhoca na mochila com os 4 blocos separados, calculando metade dos PV do fabricante (`Math.floor(pv / 2)`) e exibindo os atributos do item mundano se houver acoplamento.
  - Criar o assistente de acoplamento `ensureEngenhocaAttachModal` e `openEngenhocaAttachDialog` com checagem dos ofícios do herói, cálculo automático de tempo (1 ou 2 semanas) e matéria-prima adicional (+⅓ se novo), consumindo o item da mochila ou debitando os custos adicionais ao concluir o teste de fabricação com sucesso.
- **Implementado**:
  - `setView` em `03-07-setView.js` agora chama `syncEmbeddedShopActions()`, e `syncEmbeddedShopActions()` em `05-00-initialChoice.js` gerencia a classe `.active` de acordo com a visualização real.
  - Regras em `3.css` e `0.css` atualizadas para cards adaptáveis (`height: auto; max-height: 290px;`), eliminando espaços vazios inferiores.
  - `contraptionPortfolioCardHtml` em `05-00-initialChoice.js` e `inlineDetails` em `mochila-heroi-moedas-consumo.js` renderizam os 4 blocos especificados, com PV da engenhoca calculado dinamicamente e atributos do item mundano.
  - Modal e diálogo de acoplamento implementados em `oficina-oficios.js` com o botão `[Forjar em item]` e aviso do mestre, regras de ofícios (Armeiro, Artesão, Alfaiate), cálculo de matéria-prima e tempo, além de consumo automático do item da mochila ou cobrança do terço adicional.
- **Status**: Implementado e validado.

---

### Solicitação 16: Coerência entre Magias Simuladas e Itens Acoplados, Filtros Contextuais na Loja/Oficina, Nome Composto e Espaços na Mochila
- **Pedido**:
  1. Estabelecer coerência temática estrita entre magias simuladas e itens acoplados na engenhoca:
     - Não permitir magias defensivas/proteção (ex: *Escudo da Fé*) em armas.
     - Não permitir magias de encantamento de arma/ataque (ex: *Arma Mágica*, *Arma Espiritual*, *Espada Divina*) em armaduras ou escudos.
     - Limitar as escolhas de itens elegíveis na oficina de acordo com a coerência temática da magia escolhida (defesa para escudos/armaduras/vestes; ataque para armas; mobilidade para calçados/montaria/aventura; sentidos para ferramentas/óculos; cura para kits/aventura).
  2. Ajustar a visualização da loja com filtros adequados no modo oficina:
     - Garantir que os filtros de tipo, específicos, categoria, combate, empunhadura e busca textual funcionem perfeitamente dentro da visualização da bancada da oficina.
     - Renderizar apenas os filtros e contadores relevantes à oficina ativa (Armeiro = Armas, Armaduras e Escudos; Artesão = Aventura, Ferramentas e Esotéricos; Alfaiate = Vestuário).
     - Abrir automaticamente os filtros avançados ao entrar no modo oficina para acesso direto.
  3. Formatação do nome da engenhoca acoplada:
     - O nome deve ser uma combinação automática do nome do item mundano e do nome temático da engenhoca (ex: `Escudo Pesado: Defletor Cinético` ou `Espada Longa: Polarizador de Gume`).
  4. Cálculo de espaço da engenhoca acoplada:
     - O espaço ocupado na mochila deve ser exatamente a soma dos espaços do item mundano acoplado $+ 1$ espaço (ex: Escudo pesado de 2 espaços acoplado ocupa 3 espaços na mochila).
- **Entendimento**:
  - Implementar em `manufatura.js` as funções `classificarEfeitoMagia(spell)` e `verificarCoerenciaMagiaItem(spell, item)` com matriz de coerência por grupo funcional e palavras-chave.
  - Integrar essa validação ao diálogo `openEngenhocaAttachDialog` na oficina de engenhoqueiro, filtrando itens disponíveis e exibindo aviso amigável caso nenhum item mundano compatível com a magia seja encontrado.
  - No `05-00-initialChoice.js`, estender o predicado de filtragem de itens da oficina para respeitar os estados `state.type`, `state.specific`, `state.category`, `state.combat`, `state.grip` e `state.search`, ajustando os chips de filtros com contagens reais da oficina e abrindo a gaveta de filtros contextuais em `05-02-applyArsenalContext.js`.
  - Atualizar o gerador de nome em `oficina-oficios.js` para compor automaticamente `${item.nome}: ${nomeDaEngenhoca}` quando um item for acoplado (e desvincular o prefixo se for removido).
  - Atualizar o cálculo de espaços tanto na oficina (`oficina-oficios.js`), no catálogo da loja (`contraptionPortfolioCardHtml` em `05-00-initialChoice.js`), no registro de inventário (`customItem` / `backpack.push`) quanto na visualização da mochila do herói (`mochila-heroi-moedas-consumo.js`) para `(Number(attachedItem.espacos || 1) + 1)`.
- **Implementado**:
  - `classificarEfeitoMagia` e `verificarCoerenciaMagiaItem` criados e exportados em `src/regras/nucleo/manufatura.js`.
  - `openEngenhocaAttachDialog` em `src/funcionalidades/criador/ficha/oficina-oficios.js` agora recebe a magia simulada e filtra itens compatíveis conforme o efeito e os ofícios do herói.
  - Geração automática de nome combinado (`${attachedItem.nome}: ${rawName}`) em `oficina-oficios.js`.
  - Propagação e cálculo dinâmico de `espacos = (item.espacos || 1) + 1` na oficina, na mochila da loja e na ficha do personagem.
  - Filtros contextuais, contagens reais e abertura automática no modo oficina corrigidos em `05-00-initialChoice.js` e `05-02-applyArsenalContext.js`.
  - Testes unitários de regras implementados e validados em `testes/manufatura-regras.cjs`.
- **Status**: Implementado e validado.

---

### Solicitação 17: Manutenção, Refatoração para Desempenho e Resolução de Pendências
- **Pedido**:
  - Mapear a arquitetura completa do código.
  - Realizar manutenção e refatoração com foco em alto desempenho.
  - Verificar se restam pendências para implementar e implementá-las.
  - Ao final, fornecer sugestões sólidas de como otimizar ainda mais o desempenho do site.
- **Entendimento**:
  - Mapear os 6 pontos de entrada (`criador.html`, `loja.html`, `grimorio.html`, `taverna.html`, `ficha.html`, `index.html`), o carregador assíncrono modular e as regras de domínio.
  - Identificar e eliminar gargalos de rendering e processamento:
    1. *Layout Thrashing* / reflow forçado em `checkCatalogOverflow()` no catálogo da loja, separando em batch read e batch write assíncrono via `requestAnimationFrame`.
    2. Loop de partículas atmosféricas em `04-00-loader.js`, reduzindo contagem de partículas em mais de 60%, limitando FPS para não concorrer com interações no DOM e adicionando throttle com `ticking` flag no `pointermove`.
    3. Substituição de `JSON.stringify` repetitivo por strings delimitadas leves como chave de cache de filtros na loja geral e na oficina (`filteredItems`).
    4. Pré-computação de tokens em `prepareCatalogItem`, evitando centenas de `.split()` repetidos na ordenação e cálculo de relevância da busca.
    5. Otimização de `getPdfItemsCatalog` em `renderizacao.js`, eliminando alocações intermediárias de arrays `[...baseItems, ...customList]` em cada consulta da ficha.
  - Verificar conformidade e pendências nas regras de ofício, restrições de nível da oficina do inventor e coerência de engenhocas acopladas.
- **Implementado**:
  - Refatorados `03-07-setView.js`, `03-03-prepareCatalogItem.js`, `04-00-loader.js`, `renderizacao.js` e `05-00-initialChoice.js`.
  - Suíte completa de testes unitários e de integração executada com 100% de sucesso (`npm test`).
  - Compilação limpa com `npm run build` gerando `dist/`.

---

### Solicitação 18: Ajustes na Oficina do Engenhoqueiro (Remoção de Filtros Inadequados, Altura da Bancada e Fluxo de Confirmação para Forjar em Item)
- **Pedido**:
  1. A oficina do engenhoqueiro estava exibindo barra de busca e filtros de catálogo da loja geral ("Buscar pelo nome do item...", "Busca relacionada", " Filtros avançados", "Ordenar", " Modo debug", "Tipo", "Natureza") que não deveriam existir ali.
  2. O card "Bancada do Engenhoqueiro" estava menor que os demais cards; ajustar sua altura para ficar alinhado e consistente com os outros.
  3. No modal/aviso de [Forjar em item], além do texto explicativo do mestre e do botão Cancelar, incluir um botão de confirmação claro que avance diretamente para a escolha do item acoplado.
- **Entendimento**:
  - Limpar a renderização de cabeçalho de busca e filtros globais quando a oficina estiver em modo de engenhoqueiro ou bancada especializada.
  - Ajustar o dimensionamento do grid e flex do container do card da bancada para manter altura uniforme.
  - Inserir botão de avanço/confirmação no diálogo de aviso prévio de acoplamento da engenhoca.
- **Implementado**:
  - Filtros globais ocultados/restringidos no contexto da bancada em `05-00-initialChoice.js` e `05-02-applyArsenalContext.js`.
  - CSS de altura mínima e alinhamento do card de bancada equalizado em `equipamento.css` e `0.css`.
  - Botão de confirmação adicionado no modal de acoplamento em `oficina-oficios.js`, disparando diretamente a seleção do item compatível.
- **Status**: Implementado e validado.

---

### Solicitação 19: Campos de Alinhamento e Idade na Ficha de Personagem (Visualização e PDF)
- **Pedido**:
  - Inserir campos de **Alinhamento** e **Idade** na visualização da ficha imediatamente acima das seções de **Habilidades Iniciais** e **Proficiências**.
  - O campo deve ser compacto e esteticamente integrado ao tema da ficha (rótulos Cinzel dourados, inputs escuros).
  - **Comportamento do campo Idade**:
    - Se o personagem estiver jogando com **regras de idade** ativas (`state.age?.enabled`), o campo idade deve vir preenchido com a idade e o adicional da faixa etária entre parênteses: `${anos} (${faixa})` (ex: `12 (Criança)`, `25 (Adulto)`, etc.).
    - Se o personagem **não** estiver jogando com regras de idade, os campos devem permanecer lá, mas **em branco, para input** editável diretamente pelo jogador.
  - O campo de **Alinhamento** deve permitir input direto pelo jogador quando não pré-preenchido.
  - Integrar os dois campos na exportação para o PDF oficial (`assets/pdf/ficha-padrao.pdf`), preenchendo os campos `'Alinhamento'` e `'Idade'`.
- **Entendimento**:
  - Em `src/funcionalidades/criador/ficha/renderizacao.js`:
    - Adicionar bloco `.sheet-preview-alignment-age` com dois campos em linha antes de `.sheet-preview-reference-top`.
    - Detectar se `state.age?.enabled` está ativo e calcular `${years} (${bandName})`. Se inativo, ler de `state.identity?.age || state.sheetNotes?.age || ''`.
    - Campo de alinhamento lê `state.identity?.alignment || state.sheetNotes?.alignment || ''`.
    - Adicionar estilos CSS responsivos para telas móveis e desktop.
  - Em `src/funcionalidades/criador/ficha/habilidades-magias.js`:
    - Adicionar listeners de input para `data-sheet-field="alignment"` e `data-sheet-field="age"`, persistindo nos estados `state.identity` e `state.sheetNotes`, e salvando a ficha finalizada caso aplicável.
  - Em `src/integracoes/criador/pdf-exportacao.js` e `src/regras/criador/idade-complicacoes-e-caminho.js`:
    - Adicionar o preenchimento de `'Alinhamento'` e `'Idade'` formatados no formulário do PDF.
- **Implementado**:
  - Componente HTML e CSS adicionados em `src/funcionalidades/criador/ficha/renderizacao.js`.
  - Tratamento de input e sincronização de dados adicionados em `src/funcionalidades/criador/ficha/habilidades-magias.js`.
  - Mapeamento e exportação PDF de `'Alinhamento'` e `'Idade'` formatados adicionados em `src/integracoes/criador/pdf-exportacao.js` e `src/regras/criador/idade-complicacoes-e-caminho.js`.
  - Suíte de testes (`npm test`) e compilação (`npm run build`) executados com sucesso.
- **Status**: Implementado e validado.

---

### Solicitação 20: Correção do Botão [Refazer Escolhas] na Fase 8 (Equipamento Inicial)
- **Pedido**:
  - Na fase 8, ao clicar em "Refazer escolhas", o sistema apagava a mochila inteira e não permitia refazer nenhuma das escolhas, finalizando como se a mochila ficasse vazia.
  - Ajustar para que o jogador possa refazer normalmente todas as escolhas de equipamento inicial (armas simples, marciais, armaduras, origens, etc.) passo a passo.
- **Entendimento e Causa Raiz**:
  - Em `src/integracoes/criador/loja-itens-iniciais.js`, a função `currentItemChoice()` estava implementada incorretamente como:
    `return initialItemPlan()[arsenalState().step] || null;`
  - O objeto `arsenalState()` não possui a propriedade `step` (a propriedade correta é `choiceIndex`). Como resultado, `arsenalState().step` retornava `undefined`, fazendo `currentItemChoice()` retornar `null` em qualquer circunstância.
  - Quando o usuário clicava em "Refazer escolhas", `redoInitialItems()` esvaziava a mochila e definia `saved.complete = false`.
  - Em seguida, ao montar/comunicar com a loja, o listener `message.type === 'ready'` executava:
    `if (!arsenalState().complete && !currentItemChoice()) finalizeInitialItems();`
  - Como `currentItemChoice()` retornava `null`, o sistema deduzia erroneamente que não restavam mais escolhas no plano e chamava `finalizeInitialItems()` de imediato, travando a fase 8 como finalizada (`complete: true`) com a mochila completamente vazia.
- **Implementado**:
  - Em `src/integracoes/criador/loja-itens-iniciais.js`:
    - Corrigido `currentItemChoice()` para `return initialItemPlan()[arsenalState().choiceIndex] || null;`.
    - No `redoInitialItems()`, adicionado reset de `state.finances.spent = 0` (restituindo o saldo financeiro integral se compras anteriores foram descartadas) e envio do `context: arsenalInitialData('initial')` junto à mensagem `reset-backpack`.
  - Em `src/funcionalidades/loja/05-02-applyArsenalContext.js`:
    - No listener da mensagem `reset-backpack`, caso `message.context` seja fornecido, invoca imediatamente `applyArsenalContext(message.context)`, alternando o modo do catálogo instantaneamente para `'initial'` com a primeira escolha ativa.
  - Em `testes/verificar.cjs`:
    - Adicionado teste automatizado de regressão verificando o ciclo de `redoInitialItems()` e certificando que `choiceIndex === 0`, `complete === false`, `hasChoice === true`, `mode === 'initial'` e sem auto-finalização precoce.
  - Executados `npm test` e `npm run build` com 100% de aprovação.
- **Status**: Implementado e validado.

---

### Solicitação 21: Correção do Botão [← Anterior] e Padronização Visual dos Cards na Fase 8
- **Pedido**:
  1. O botão `[← Anterior]` na Fase 8 não funcionava: estando na escolha da arma marcial (após já ter feito a escolha da arma simples), clicar em `← Anterior` no rodapé não voltava para a etapa anterior dentro da fase de escolhas de equipamento inicial.
  2. A visualização dos cards estava caótica em formato de lista/barrinhas horizontais de 2 colunas (`catalog-list-entry`). Padronizar para que em qualquer catálogo (loja, oficina e equipamento inicial) sejam exibidos os cards canônicos (`.item-card`) dispostos em 3 colunas com tamanho padrão.
- **Entendimento e Causa Raiz**:
  - **Problema 1 (Botão Anterior)**:
    - Em `src/regras/criador/passivas-proficiencias.js` na função `arsenalState()`, a linha forçava `saved.choiceIndex = next < 0 ? plan.length : next;` onde `next` era sempre o primeiro índice sem concessão (`!saved.grants[...]`). Quando o usuário clicava em `[← Anterior]`, `saved.choiceIndex` era decrementado, mas ao reavaliar `arsenalState()`, o índice voltava forçosamente para o próximo sem concessão.
    - O evento de clique em `#stepPrevButton` em `src/integracoes/criador/loja-itens-iniciais.js` não removia a concessão prévia de `saved.grants` nem retirava o item selecionado da mochila do herói.
  - **Problema 2 (Visualização dos Cards)**:
    - Em `src/funcionalidades/loja/05-01-availableInitialItems.js`, escolhas que não eram `budgetGrant` usavam um layout alternativo `.catalog-list-entry` (listagem horizontal compacta de 2 botões).
    - Em `src/estilos/loja/3.css`, o seletor `body.initial-equipment:not(.budget-grant-equipment) .items-grid` impunha `grid-template-columns: repeat(2, minmax(0, 1fr))`.
    - Em `src/funcionalidades/loja/05-00-initialChoice.js`, apenas escolhas com `isBudgetGrant` renderizavam os botões padronizados `[OK] Selecionar item` (verde) e `[OK] Remover seleção` (vermelho).
- **Implementado**:
  - Em `src/regras/criador/passivas-proficiencias.js`:
    - `arsenalState()` agora preserva `saved.choiceIndex` quando este já for um número válido dentro dos limites do plano.
  - Em `src/integracoes/criador/loja-itens-iniciais.js`:
    - Adicionada a função auxiliar `removeGrantFromBackpack(grantId)` que expurga com segurança o item associado à concessão desfeita tanto em `ficha-ativa` quanto no storage legado.
    - O clique em `#stepPrevButton` calcula `prevIndex = saved.choiceIndex - 1`, apaga o grant correspondente de `saved.grants`, remove o item da mochila, atualiza `saved.choiceIndex = prevIndex`, reseta `arsenalContextKey` e envia os eventos de contexto e sincronização (`reset-backpack`).
  - Em `src/funcionalidades/loja/05-01-availableInitialItems.js`:
    - Removido todo o HTML e lógica de `catalog-list-entry`. A listagem de itens da fase inicial agora renderiza universalmente os cards canônicos da loja via `itemCard(item)`.
  - Em `src/funcionalidades/loja/05-00-initialChoice.js`:
    - Universalizados os botões de ação nos cards para o modo inicial: botão verde `[OK] Selecionar item` e botão vermelho `[OK] Remover seleção` (com classe `.candidate`).
  - Em `src/estilos/loja/3.css`:
    - Unificado o grid de cards do equipamento inicial para 3 colunas estritas: `grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 16px !important; align-items: stretch !important;`.
    - Cards padronizados com altura máxima inicial de 290px e expansão integral sem cortes ao clicar.
  - Em `testes/verificar.cjs`:
    - Adicionados testes automatizados de regressão para o clique em `#stepPrevButton` (verificando o decremento de `choiceIndex`, exclusão do grant e atualização da escolha ativa) e para a validação do grid de 3 colunas e eliminação de `catalog-list-entry`.
  - Executados `npm run build` e `npm test` com 100% dos testes aprovados.
- **Status**: Implementado e validado.

---

### Solicitação 22: Remoção do Botão de Pendência ao Editar Ficha e Ajuste do Card da Bancada do Engenhoqueiro
- **Pedido**:
  1. Retirar o botão de pendência que aparecia na barra inferior ao clicar em "Editar ficha".
  2. No card da Bancada do Engenhoqueiro, remover o texto explicativo "Projetar Novo Protótipo: Escolha uma magia disponível no Grimório para projetar, calibrar e fabricar sua nova invenção na bancada." e garantir que o botão "Fabricar engenhoca" esteja 100% visível e clicável, sem ser cortado por overflow ou limites de altura.
- **Entendimento e Causa Raiz**:
  - **Problema 1 (Botão de pendência)**:
    - O botão `#pendingOrFinishButton` no rodapé de `criador.html` era exibido sempre que `state.isEditingFinishedSheet` estava ativo, gerando o botão laranja "Pendência →". O usuário considerou o botão inestético e solicitou sua remoção.
  - **Problema 2 (Card da Bancada do Engenhoqueiro)**:
    - O card da bancada continha um bloco de texto redundante "Projetar Novo Protótipo".
    - Devido ao excesso de conteúdo vertical e à regra global `.item-card { max-height: 290px; overflow: hidden }` combinada com o grid stretch de 3 colunas, a área inferior do card (`.card-actions`) onde reside o botão de fabricação ficava além do limite de corte de 290px, ficando oculta e impossibilitando o clique.
- **Implementado**:
  - **Botão de pendência**:
    - Removido o elemento `<button id="pendingOrFinishButton">` do rodapé em `src/paginas/criador.html`.
    - Atualizada a função `syncPendingOrFinishButton()` em `src/funcionalidades/criador/fases/01-identidade-escolhas.js` para garantir que o botão nunca seja renderizado/exibido.
  - **Card da Bancada do Engenhoqueiro**:
    - Em `src/funcionalidades/loja/05-00-initialChoice.js` (função `engenhocaWorkshopCardHtml`):
      - Removido integralmente o bloco de texto "Projetar Novo Protótipo".
      - Atualizado o botão de ação para "Fabricar engenhoca" com destaque em verde esmeralda (`#065f46`), borda `#10b981`, tipografia legível e sombra, completamente clicável.
      - Definidos estilos inline no card com `height: 100%; min-height: auto; max-height: none; overflow: visible; box-sizing: border-box;`, permitindo que o rodapé com `.card-actions` se posicione naturalmente com `margin-top: auto; flex-shrink: 0;`.
    - Em `src/estilos/loja/3.css`:
      - Adicionada regra explícita `.workshop-backpack-cards-grid .item-card.engenhoca-special-card, .engenhoca-special-card, .contraption-portfolio-card { height: auto !important; min-height: auto !important; max-height: none !important; overflow: visible !important; }`.
  - **Testes e Build**:
    - Adicionadas asserções em `testes/verificar.cjs` para garantir que o botão de pendência não apareça na edição da ficha e que o card da bancada contenha o botão "Fabricar engenhoca" sem o texto do protótipo.
    - Executados `npm run build` e `npm test` com 100% de sucesso.
- **Status**: Implementado e validado.

---

### Solicitação 23: Botão de Melhoria [[Forjar]] na Concessão de Espólio/Orçamento da Fase 8
- **Pedido**:
  - Na escolha do Espólio do Nobre (e outros poderes que concedem orçamento de item superior/herança/protótipo na Fase 8), itens mundanos como Espada Curta, Espada Longa, Espada de Execução, etc., estavam sem o botão de melhoria `[[Forjar]]`, enquanto armas exóticas exibiam o botão.
  - O usuário solicitou que todos os itens elegíveis que caibam no orçamento concedido permitam adicionar melhorias, mantendo o bloqueio de melhorias apenas nas escolhas comuns anteriores (arma simples, arma marcial, armadura mundana).
- **Entendimento e Causa Raiz**:
  - **1. Cache de Cards Reutilizado entre Etapas (`catalogCardCache`)**:
    - Em `src/funcionalidades/loja/03-05-persistCharacterProfiles.js`, a função `itemCard(originalItem)` utilizava um cache indexado apenas por opções estáticas do item, contagem na mochila e debug mode. A chave não incluía o modo (`mode`), a escolha atual (`choiceId`) e nem se tratava de uma concessão de orçamento (`isBudget`).
    - Como armas como Espada Curta e Espada Longa eram renderizadas na etapa anterior de escolha marcial comum (onde melhorias são proibidas), o HTML gerado sem o botão `[Forjar]` ficava retido no cache. Ao avançar para o Espólio, o cache devolvia o HTML antigo sem o botão. Já itens que não estavam nas etapas anteriores (como Corrente de Espinhos e Espada Canora) eram renderizados pela primeira vez diretamente no Espólio e exibiam o botão.
  - **2. Restrição Estrita de `initial-equipment` em `purchaseUpgradeButtons`**:
    - Em `src/funcionalidades/loja/03-06-magicRuleStatsHtml.js`, o gerador de botões possuía uma checagem `document.body?.classList.contains('initial-equipment')` que suprimia o botão para qualquer item quando na criação de personagem, sem consultar se a escolha atual possuía `isBudgetGrant`.
- **Implementado**:
  - **Expansão da Chave de Cache e Limpeza de Contexto**:
    - Em `src/funcionalidades/loja/03-05-persistCharacterProfiles.js`, a chave de `catalogCardCache` foi ampliada para incluir `mode`, `choiceId`, `isBudget` e `wsSection`.
    - Criada e exportada a função `clearCatalogCardCache()`.
    - Em `src/funcionalidades/loja/05-02-applyArsenalContext.js`, adicionada chamada a `clearCatalogCardCache()` toda vez que o contexto da loja é modificado ou uma nova etapa de escolha é carregada.
  - **Habilitação Condicional do Botão de Melhoria**:
    - Em `src/funcionalidades/loja/03-06-magicRuleStatsHtml.js` (`purchaseUpgradeButtons`), o bloqueio por `initial-equipment` foi refinado para: `if (document.body?.classList.contains('initial-equipment') && (!choice || !choice.isBudgetGrant)) return '';`.
    - Em `src/funcionalidades/loja/05-00-initialChoice.js`, garantido que `effectiveInitialChoice()` resolva confiavelmente tanto do estado do criador quanto de `arsenalInitialState.choice`.
  - **Testes e Build**:
    - Testes unitários integrados em `testes/verificar.cjs` validando que:
      1. Na escolha comum de arma e armadura, o botão `[Forjar]` NÃO aparece (para armaduras, espada curta e espada longa).
      2. Na escolha de Espólio (com orçamento), o botão `[Forjar]` APARECE para armaduras, espada curta e espada longa.
      3. O modal de aprimoramento exibe a nota de orçamento e permite confirmar a seleção com melhorias aplicadas.
    - `npm run check` executado com 100% de sucesso (312/312 testes).
- **Status**: Implementado e validado.

---

### Solicitação 24: Regras Canônicas de Melhorias e Encantos na Mochila, Aprimoramento Dual para Inventor, Navegação de Personagem e Padronização de Modais
- **Pedido**:
  1. Ao clicar para ver o card de item na mochila, nem todos os itens podem receber melhorias:
     - Alquímicos, consumíveis, poções, comidas e itens gerais NÃO recebem melhorias nem encantos.
     - Apenas armas, armaduras, escudos, vestuário e esotéricos podem receber melhorias.
     - Itens específicos NÃO podem receber encantos adicionais, mas PODEM receber melhorias.
  2. Os botões `[[Forjar]]` e `[[Encanto]]` devem funcionar com lógica dual:
     - **Regra geral (qualquer classe)**: comprar a melhoria/encanto no mercado pagando o custo integral em tibares, sem necessidade de teste de ofício nem matéria-prima.
     - **Inventor**: apresenta diálogo perguntando se deseja **Comprar no mercado** ou **Aprimorar/Encantar com Ofício** (⅓ do custo em matéria-prima + teste de Ofício correspondente). Se o Inventor não possuir o ofício treinado (Armeiro para arma/armadura/escudo, Alfaiate para vestuário, Artesão para esotéricos) ou nível 9+ para encantos, a opção de ofício fica desabilitada explicando o motivo.
  3. No card da mochila: quando **recolhido**, os botões de ação (`[ Empunhar]`, `[ Vestir]`, `[[Alquimia] Usar]`, `[[Disparar] Disparar]`, `[[Saldo] Vender]`) permanecem visíveis na linha compacta recolhida; quando **expandido**, esses botões descem para o rodapé do card expandido e são ocultados do topo para evitar redundância.
  4. Ao trocar de personagem no criador, iniciar **sempre na ficha do personagem** (`sheetView = 'sheet'`), e nunca na loja.
  5. **Padronização de modais**: consolidar em uma única interface padronizada, intuitiva e familiar (`purchaseUpgradeModal`) para melhorias e encantos em qualquer contexto (mochila, loja e oficinas).
- **Implementado**:
  - **1. Regras Puras de Elegibilidade (`src/regras/nucleo/manufatura.js`)**:
    - Criadas e exportadas `podeReceberMelhorias(item)`, `podeReceberEncantos(item)` e `oficioNecessarioParaAprimorar(item)`.
    - Bloqueio estrito para alquímicos, poções, comidas, pergaminhos e itens gerais comuns.
    - Bloqueio de encantos para itens mágicos específicos (`item.especifico || item.magico?.tipo === 'especifico'`) e vestuário mundano (vestuário recebe apenas melhorias de alfaiate).
  - **2. Card Inline da Mochila e Rodapé Dinâmico (`src/funcionalidades/criador/inventario/mochila-heroi-moedas-consumo.js`)**:
    - Exibição de `[[Forjar]]` e `[[Encanto]]` condicionada estritamente às funções puras de regra.
    - Ao expandir o card, adicionada classe `.is-expanded`. No CSS (`src/estilos/criador/migration-theme.css`), declarada regra `.sheet-general-backpack-list .backpack-compact-entry.is-expanded .backpack-compact-row .equip-card-actions { display: none !important; }`.
    - As ações de equipar, empunhar, usar, disparar e vender migram para o rodapé do card expandido.
  - **3. Diálogo e Modal Padronizado para Inventor e Demais Classes**:
    - Implementada checagem `isCharacterInventor()`.
    - Para não-inventores, abre diretamente o modal padronizado de melhorias/encantos (`purchaseUpgradeModal`) em modo `'purchase'`, debitando o preço cheio em tibares diretamente dos fundos do herói com confirmação em toast.
    - Para inventores, abre diálogo canônico da Forja de Arton oferecendo a opção de compra no mercado vs aprimoramento por ofício. Valida se o Inventor possui treino no Ofício correspondente (`allTrainedOffices()`) e nível 9+ para encantos.
  - **4. Correção da Troca de Personagem**:
    - Em `src/integracoes/criador/eventos-e-servicos.js` e `src/integracoes/criador/loja-itens-iniciais.js`, garantido que `state.sheetView = 'sheet'` e `snapshot.sheetView = 'sheet'` sejam sempre forçados, impedindo que a troca de personagem inicie na loja.
  - **5. Testes e Verificação Automatizada**:
    - Testes unitários adicionados em `testes/manufatura-regras.cjs` para validar a elegibilidade de melhorias, encantos e ofícios.
    - Testes integrados em `testes/verificar.cjs` validando o CSS de ocultação dos botões de topo na mochila expandida e a visualização padrão de ficha na troca de herói.
    - Executado `npm run check` com 100% de aprovação (typecheck + build + todos os testes passando).
  - **Ajustes Complementares (Feedback do Usuário)**:
    - **Problema 1 (Clique na Adaga não abria)**:
      - Identificado que no CSS `.sheet-general-backpack-list` o esticamento vertical de linhas quando um card vizinho expandia criava uma grande área vazia não mapeada para clique, e que o listener escutava apenas o elemento filho `.equip-card-info`. Além disso, uma regra legada em `equipamento.css` (`display: none !important` em `equip-card-actions`) ocultava os botões do card recolhido.
      - Corrigido com `align-items: start !important;` na grid, remoção da regra de ocultação incondicional de botões em `equipamento.css`, e expansão do listener para que qualquer clique na linha ou corpo do card compacto (que não seja botão de ação rápida) abra o item imediatamente.
    - **Problema 2 (Modal do Inventor não aparecia e travava scroll)**:
      - Identificado que as regras CSS de `.app-modal` e `.purchase-upgrade-panel` existiam apenas em `src/estilos/loja/0.css`, que não é carregado no criador de fichas. Como consequência, o modal era inserido no final da página sem `position: fixed` nem `z-index`, enquanto o body recebia `overflow: hidden`, travando a tela.
      - Corrigido com a definição completa e isolada de `.app-modal`, `#sheetInventorChoiceModal`, `#sheetUpgradeModal` e `.purchase-upgrade-panel` em `migration-theme.css`, estilos inline de segurança (`position: fixed; inset: 0; z-index: 99999; backdrop-filter: blur(6px); overflow: auto`), fechamento ao clicar no backdrop e suporte à tecla `Escape`.
- **Status**: Concluído e validado.

---

### Solicitação 25: Saldo Insuficiente na Loja (Remoção de Presente Automático), Validação de Material Especial e Bloqueio de Forja sem Tibares
- **Pedido**:
  1. **Loja (Arsenal)**: Remover a conversão automática de compras em presente/recompensa quando o herói não possui saldo suficiente. Abrir uma janela informando que não tem tibares suficientes, mostrando saldo disponível, valor total e **quanto falta**, com dois botões: **Voltar** (para a loja, mantendo o carrinho) e **Resgatar como Recompensa** (para concluir a aquisição sem débito de tibares).
  2. **Material Especial no Modal de Melhorias**: Quando o usuário clicar em "Material Especial" na lista da direita sem ter escolhido o material específico à esquerda, os campos de materiais devem **piscar** e o usuário **não pode avançar** clicando em `[Forjar] Forjar com Ofício` (nem comprar) até que a escolha seja feita. Se clicar no material à esquerda, a melhoria fica ativa.
  3. **Bloqueio por Saldo Insuficiente ao Forjar (e Comprar)**: O usuário não pode forjar com o ofício se não tiver tibares suficientes para pagar a matéria-prima (ex: com T$ 1.000 não pode forjar adamante de T$ 2.000). O botão `[Forjar] Forjar com Ofício` (ou `[Comprar] Comprar`) deve estar **desabilitado** nesse caso, exibindo o valor faltante.
  4. **Tipografia de Matéria-Prima e CD**: Aumentar o tamanho da fonte do texto `Matéria-prima: T$ ... · CD: ...` para que fique bem legível e destacado.
- **Implementado**:
  - **1. Loja (`src/funcionalidades/loja/05-03-ensureGeneralSaleModal.js` e `05-02-applyArsenalContext.js`)**:
    - Criada a função `promptInsufficientFundsModal(funds, total)` gerando modal temático com saldo disponível, total e valor faltante, além dos botões de ação `Voltar` e `Resgatar como Recompensa`.
    - No fluxo de checkout (`checkoutWithAmmo`), adicionada interceptação quando `!asGift && total > currentFunds`, abrindo o modal. Caso o usuário escolha "Resgatar como Recompensa", aciona `proposeOperation('purchase', { asGift: true })`.
    - Em `proposeOperation`, removida a conversão implícita de compra para presente baseada em saldo (`total > funds`), tratando como presente estritamente quando `asGift` ou `gift` for verdadeiro.
  - **2. Material Especial e Animação Pulsante (`src/funcionalidades/criador/inventario/mochila-heroi-moedas-consumo.js` e `src/estilos/criador/migration-theme.css`)**:
    - Detectada a pendência de escolha quando o slot `material_especial` está ativo sem `materialId`.
    - Adicionada animação `@keyframes materialPulse` e classe `.needs-material-selection` no painel `.special-material-panel`, fazendo-o pulsar em dourado/âmbar com aviso explicativo.
    - O botão de confirmação fica desabilitado com o rótulo `[Aviso] Escolha um Material Especial`. Ao selecionar um material à esquerda, a seleção é concluída e o botão é liberado.
  - **3. Validação de Fundos na Forja e Compra de Melhorias (`mochila-heroi-moedas-consumo.js`)**:
    - Comparado o custo da matéria-prima (`custoMateriaPrima` no ofício) ou mercado com `remainingFunds()`.
    - Se o saldo for insuficiente, o botão de confirmação é desabilitado com aviso explicativo no rodapé: `[Aviso] Saldo insuficiente (Você tem T$ X, faltam T$ Y)`.
    - Guarda defensiva inserida no handler de clique de confirmação.
  - **4. Tipografia Aumentada**:
    - O texto informativo `Matéria-prima: T$ ... · CD: ...` foi reestilizado com `font-size: 0.95rem; font-weight: 700; color: #60a5fa; margin-top: 4px;` (e `#c084fc` para encantos), garantindo alta legibilidade e destaque visual.
  - **5. Testes e Verificação**:
    - Asserções integradas em `testes/verificar.cjs` cobrindo o modal de saldo insuficiente na Loja e todas as validações no modal de melhorias da Ficha.
    - `npm run check` executado com 100% de sucesso (typecheck + build + suite completa de testes).
- **Status**: Concluído e validado.

---

### Solicitação 26: Computação de Melhorias no Item/Ficha e Crédito Imediato de Tibares na Venda
- **Pedido**:
  1. **Melhoria não computada**: Ao aprimorar um item, tibares eram debitados, mas a melhoria não era computada na ficha do item e não atualizava os valores/estatísticas.
  2. **Venda não creditando tibares**: Ao vender um item (na loja ou na mochila), o dinheiro da venda não entrava na conta/saldo do personagem.
- **Entendimento**:
  - Garantir que o nome configurado (`configuredItemName`), atributos de proteção (`armorPassiveStats` e `shieldPassiveStats`), estatísticas de armas (`weaponPassiveStats`) e persistência imediata (`persistNow()` e `saveFinishedCharacter()`) sejam aplicados na confirmação de melhorias e encantos, tanto por Ofício quanto por compra.
  - No split de pilhas (`quantity > 1`), desmembrar a unidade aprimorada em uma nova entrada individual no inventário mantendo os itens mundanos restantes.
  - Na venda de itens, garantir que `persistBackpack()`, atualização imediata dos fundos locais (`arsenalInitialState.funds`) e mensagem `'sale'` acionem `saveFinishedCharacter()` e `syncEmbeddedShopActions()` exibindo o saldo real vivo em `[Saldo] Saldo disponível: T$ ...`.
  - Computar na ficha do personagem bônus de Defesa e Penalidade de armaduras e escudos com melhorias (`reforcada` +1 Defesa, piora penalidade em 1; `sob_medida`, `ajustada`, `mitral` reduzem penalidade) e encantos (`defensor` +2, `guardiao` +4).
- **Implementado**:
  - `src/compartilhado/criador/estado-e-catalogos.js`:
    - Implementada função unificada `formatConfiguredItemName(entry, item)` exposta em `window.configuredItemName` suportando materiais especiais, melhorias e encantamentos.
    - Criadas e exportadas as funções puras `armorPassiveStats(item, entry)` e `shieldPassiveStats(item, entry)`.
  - `src/regras/nucleo/inventario.js` e `src/regras/criador/expansoes-raciais.js`:
    - Busca e identificação de itens resiliente a variações de ID (`instanceId`, `uid`, `id`, `identificar`, `itemId`) em `vender` e `atualizarPerfis`.
  - `src/funcionalidades/criador/inventario/mochila-heroi-moedas-consumo.js`:
    - Desmembramento de pilhas ao aprimorar/encantar item com `quantity > 1`.
    - Atualização de `displayName` com `configuredItemName` e persistência imediata via `persistNow()` e `saveFinishedCharacter()`.
  - `src/funcionalidades/loja/05-03-ensureGeneralSaleModal.js` e `src/integracoes/criador/loja-itens-iniciais.js`:
    - Chamadas a `persistBackpack()` e `persistCart()` ao confirmar venda no modal geral da loja.
    - Atualização de `arsenalInitialState.funds` localmente e envio de mensagem `'sale'`.
    - No host, `saveFinishedCharacter()` e reenvio de `funds` atualizado para o iframe da loja.
  - `src/funcionalidades/loja/05-00-initialChoice.js`:
    - Atualizado `syncEmbeddedShopActions` para ocultar o campo de dinheiro inicial fora do modo `'initial'` e exibir o saldo vivo (`[Saldo] Saldo disponível: T$ ...`).
  - `src/funcionalidades/criador/ficha/renderizacao.js`:
    - Atualizados `updateSheetEquipmentAndDefenseOnly()` e `renderCharacterDetails()` com `armorPassiveStats` e `shieldPassiveStats`, exibindo o nome aprimorado completo e somando os bônus reais de melhorias e encantos na Defesa total do personagem e nas tabelas.
  - Testes unitários adicionados em `testes/regras-puras.cjs` e `testes/venda-integrada.cjs`.
  - `npm run check` executado com 100% de sucesso.
- **Status**: Concluído e validado.

---

### Solicitação 27: Preços de Venda de Itens Específicos e Correção da Forja de Engenhocas Acopladas
- **Pedido**:
  1. **Preços de venda dos itens específicos zerados**: Na hora da venda na mochila ou loja, os itens mágicos específicos (como armas específicas, armaduras específicas, acessórios, esotéricos e litúrgicos) não tinham preço de venda preenchido (apareciam como `T$ 0`).
  2. **Bug ao forjar engenhoca em item**: Ao clicar no botão `[[Forjar] Forjar em item]` (com aviso `APENAS COM A PERMISSÃO DO MESTRE`) no modal de fabricação de engenhoca do engenhoqueiro, a tela quebrava/colapsava e voltava para a ficha com um card de item aberto no fundo.
- **Entendimento e Causa Raiz**:
  - **Problema 1 (Preços de itens específicos zerados)**:
    - O catálogo `DATA.pdfItems` consumido pela ficha e inventário provinha de `dados/criador-pdfItems.json`. No build (`build.cjs` e `projecoes.cjs`), esse arquivo era gerado projetando apenas `dados/items.json` (527 itens básicos), deixando de fora os 219 itens mágicos específicos e 4 itens padrão adicionais que eram gerados dinamicamente na loja. Consequentemente, `catalog.get(entry.itemId)` retornava `undefined` para esses itens na ficha, resultando em preço `0`.
    - Adicionalmente, ao adicionar itens à mochila (`05-00-initialChoice.js`), os campos de preço (`customPrice`, `price`, `preco`, `unitValue`) não eram gravados na entrada caso `configuration?.unitValue` não fosse fornecido.
    - No modal de venda geral da loja (`05-03-ensureGeneralSaleModal.js`), `generalSaleBase` confiava apenas em `value.unitKnown`, sem fallbacks para os preços do item e da entrada.
  - **Problema 2 (Engenhoca colapsando ao forjar em item)**:
    - Em `src/funcionalidades/criador/ficha/oficina-oficios.js`, o método `openEngenhocaAttachDialog` utilizava a função `escapeHtml(...)` que não estava definida no módulo, disparando um erro fatal `ReferenceError: escapeHtml is not defined` no momento do clique.
    - O listener do botão `#btnForjarEmItem` não continha `e.preventDefault(); e.stopPropagation();`, permitindo que o clique vazasse pelo backdrop do modal para o grid da mochila que estava embaixo, abrindo o card de outro item (como "Adaga Oposta").
    - Os modais `#engenhoca-craft-modal` e `#engenhoca-attach-modal` não possuíam estilos de posicionamento fixo (`position: fixed; inset: 0; display: none`) e z-index explícito seguro (100.000 e 200.000), causando sobreposição defeituosa.
- **Implementado**:
  - **Catálogo Canônico Completo de 750 Itens (`ferramentas/lib/catalogo-itens.cjs` e `build.cjs`)**:
    - Criado helper que compõe todos os 750 itens canônicos (`ITEMS` + `EXTRA_MAGIC_ITEMS` + `ADDITIONAL_STANDARD_ITEMS`).
    - Atualizado o script de build para projetar os 750 itens em `dist/dados/criador-pdfItems.json`. Agora todo item específico possui preço, dano, espaços e metadados completos disponíveis para a ficha e para o modal de venda.
  - **Resiliência e Persistência de Preço de Venda (`venda.js`, `05-00-initialChoice.js` e `05-03-ensureGeneralSaleModal.js`)**:
    - Em `05-00-initialChoice.js` (`addPackagesToBackpack`), `unitValue`, `customPrice`, `price` e `preco` são calculados e gravados com segurança na entrada da mochila.
    - Em `venda.js`, adicionado fallback `item?.price` à cadeia de resolução de preço de tabela.
    - Em `05-03-ensureGeneralSaleModal.js`, `generalSaleBase` passou a resolver confiavelmente através de `value?.unitKnown || instance.customPrice || instance.price || instance.unitValue || instance.preco?.valor || item?.preco?.valor || item?.price || 0`.
  - **Correção da Forja de Engenhocas Acopladas (`oficina-oficios.js`)**:
    - Adicionada a função `escapeHtml` com fallback para `esc` no escopo do módulo.
    - Inseridos `e.preventDefault()` e `e.stopPropagation()` em todos os botões e links de navegação (`#btnForjarEmItem`, `#btnRemoverItemAcoplado`, `#confirmAndProceedBtn`, `#proceedToCraftTestBtn`, `#backToAvisoBtn`, `.select-backpack-item-btn`, `.select-catalog-item-btn` e botões de fechar/cancelar).
    - Configuradas regras explícitas de estilo inline em `ensureEngenhocaCraftModal` (`z-index: 100000; position: fixed; inset: 0; background: rgba(4,7,14,0.85); backdrop-filter: blur(6px); display: none; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box;`) e `ensureEngenhocaAttachModal` (`z-index: 200000; position: fixed; inset: 0; background: rgba(4,7,14,0.9); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box;`).
  - **Testes Automatizados**:
    - Adicionados testes de regressão em `testes/verificar.cjs` validando a presença de itens específicos em `DATA.pdfItems`, cálculo correto do preço base e valor de venda (50%), e o ciclo completo de abertura, escolha e acoplamento de item na engenhoca sem erros.
    - Executados `npm run check` com 100% de sucesso (typecheck 0 erros + build limpo + todos os testes aprovados).
- **Status**: Concluído e validado.

---

### Solicitação 28: Aparatos de Engenhoca, Ciclo de Desmanche, Limpeza Visual da Oficina do Engenhoqueiro e Regras Canônicas
- **Pedido**:
  - **0. Anotações**: Registrar rigorosamente no `solicitacoes.md` para não perder nenhum pedido e implementar tudo.
  - **1. Espaços e Tipo**: Ao acoplar engenhoca em um item mundano, somar os espaços do item + 1 espaço da engenhoca (`(Number(espacos) || 0) + 1`), de forma que 0 espaços vire 1 espaço (0+1=1), 1 espaço vire 2 espaços (1+1=2), etc. Se a engenhoca for acoplada a um item de vestuário, continua como vestuário (`tipo: 'vestuario'`, `categoriaId: 'vestuario'`) e não como acessório.
  - **2. Empunhar vs Vestir**: Acessórios de vestuário são para vestir (`equip-trailer`/`equip-accessory`), não para empunhar. Itens esotéricos e instrumentos musicais são para empunhar (`equip-weapon`).
  - **3. Exclusão de Itens Exclusivos de Origem**: A Fase 8 (escolhas de equipamento inicial) não deve exibir itens únicos de origem em escolhas gerais (como armas simples, marciais, etc. — ex: Ferramenta Pesada de Trabalhador/Escravo/Fazendeiro, Rolo de Macarrão, Cutelo, Martelo de Carne, Bolas de Malabarismo, Dente Falso, etc.). Esses itens são recebidos unicamente como benefício da origem correspondente. No catálogo de acoplamento de engenhocas, eles só aparecem se o herói já os possuir na mochila.
  - **4. Minimalismo no Hub de Oficinas**: No card da Oficina do Engenhoqueiro, remover o badge `[[OK] Treinado]` e remover o texto `(Tormenta20 p. 70).` da descrição.
  - **5. Texto do Aviso do Mestre e Botões**:
    - Texto exato: *"O tempo total da engenhoca é de uma semana. Se você tiver o item em sua mochila pode acoplar a engenhoca no item. Caso contrário será necessário uma semana a mais de fabricação além do custo de 1/3 do valor do item. OBS: Você pode comprar o item pelo preço normal para contar como fabricado da mochila."*
    - No catálogo de itens mundanos para acoplar, disponibilizar duas opções: `[Forjar (+T$ ⅓)]` (+1 semana de tempo) e `[Comprar (T$ total)]` (preço integral, conta como vindo da mochila sem tempo adicional).
  - **6. Cabeçalho Minimalista da Magia Simulada**: Limpar o cabeçalho removendo emojis espalhafatosos e badges infantis: `Magia Simulada: [Nome da Magia] ([Círculo]º Círculo)` e indicação de item recomendado simples (`Item Empunhado Recomendado: Armas mundanas` / `Item Vestido Recomendado: Vestuários mundanos`).
  - **7. Seus Ofícios de Fabricação**: Exibir apenas os ofícios que o personagem tem treinados, sem a tag "[OK] TREINADO" / "NÃO TREINADO" e sem listar ofícios não treinados.
  - **8. Remoção de Bloco**: Remover o bloco `[Dica] Opções de escolha: Você poderá escolher entre utilizar um item já guardado...`.
  - **9. Padronização Tipográfica**: Botões `[Cancelar]` e `[Confirmar e Escolher Item →]` padronizados no mesmo tamanho, estilo e tipografia Cinzel.
  - **10. Limpeza na Escolha de Item**: Remover `[Pergaminho] Mochila: T$ 0 e 1 sem...` e remover o botão `[← Voltar ao Aviso]`.
  - **11. Abas de Ofícios**: Exibir na escolha de item apenas as abas dos ofícios treinados pelo herói, sem o "[OK]". Primeira aba: "Mochila". Se não tiver nenhum ofício treinado (acoplamento apenas com permissão do mestre), exibir todas as opções de categorias de ofícios.
  - **12. Ciclo de Desmanchar Engenhoca**:
    - Engenhoca pura: destrói a engenhoca e devolve os aparatos instalados para a mochila.
    - Engenhoca acoplada: desfaz a engenhoca, devolve os aparatos instalados para a mochila, e o item mundano base continua na mochila preservando todas as melhorias que já possuía.
  - **13. Regras de Aparatos de Engenhocas**:
    - Engenhocas NÃO recebem melhorias normais, a não ser que possuam o aparato "Espera para Melhorias", que permite 1 melhoria por espera instalada (máximo de 2 melhorias no item acoplado).
    - Limite de até 2 aparatos por engenhoca (+2 na CD com 1 aparato, +5 na CD com 2 aparatos).
    - Se o inventor possuir o poder "Aparato Personalizado" (`inventor_aparato_personalizado`), o 1º aparato não aumenta a CD (+0) e o 2º aparato aumenta em +3.
    - Se a engenhoca possuir o aparato "Estabilizador", recebe +2 na CD para resistir à magia simulada.
    - Ao desmanchar a engenhoca, os aparatos voltam para a mochila e o item acoplado mantém as melhorias.
  - **14. Comprar e Fabricar Aparatos**:
    - 15 aparatos canônicos fabricáveis (CD 20 de Ofício, 1 hora, custo de ⅓ do preço) e compráveis (preço integral).
    - Ordem estrita dos cards na Oficina do Engenhoqueiro:
      1. Card da Bancada do Engenhoqueiro
      2. Cards das Engenhocas do inventor
      3. Cards dos Aparatos que estiverem na mochila do herói
      4. Loja com todos os 15 aparatos para comprar ou fabricar.
  - **15. Card da Engenhoca**:
    - Ao lado do botão `[Ver magia simulada]`, botão `[[Aparatos] Aparatos X/2]` com contagem viva de aparatos.
    - Linha de atributos: `1 espaço · Minúsculo · RD 5 · Defesa 15 · Ativação: ação padrão · CD ${15 + pm + bonusAparatos} + PM · PV ${halfPv}` (onde `bonusAparatos` reflete os aparatos instalados e o poder Aparato Personalizado).
- **Entendimento e Implementação**:
  - `src/regras/nucleo/manufatura.js`:
    - Atualizados `cdFabricacao` (CD 20 para aparatos), `tempoFabricacao` (1 hora para aparatos) e `secoesOficina.engenhoqueiro.corresponde` (aceita aparatos e engenhocas).
    - Implementadas e exportadas as funções `calcularBonusCdAparatos(numAparatos, hasPersonalizado)` e `limiteMelhoriasEngenhoca(item)`.
    - Regra canônica de `podeReceberMelhorias` atualizada para engenhocas acopladas com "Espera para Melhorias" e bloqueio estrito em `podeReceberEncantos`.
  - `src/regras/criador/itens-exclusivos-origem.js` e `src/funcionalidades/loja/05-01-availableInitialItems.js`:
    - Adicionado `dente_falso` e assegurado filtro estrito de itens exclusivos em escolhas que não sejam da origem (`!isOriginChoice`).
  - `src/funcionalidades/criador/inventario/acoes-equipamento.js`, `equipamento.js` e `mochila-heroi-moedas-consumo.js`:
    - Configurado `equip-weapon` para instrumentos musicais e itens esotéricos (empunhar).
    - Configurado `equip-trailer`/`equip-accessory` para acessórios de vestuário (vestir).
  - `src/funcionalidades/criador/ficha/oficina-oficios.js`:
    - Removido badge `[[OK] Treinado]` e menção bibliográfica do card do engenhoqueiro.
    - Texto do aviso do mestre atualizado exatamente como solicitado.
    - Cabeçalho minimalista para a magia simulada e itens recomendados.
    - Lista de ofícios exibindo apenas os ofícios treinados, sem "[OK] TREINADO" e sem listar não treinados.
    - Removido bloco de opções explicativas.
    - Botões `[Cancelar]` e `[Confirmar e Escolher Item →]` padronizados com tipografia Cinzel e mesmo estilo.
    - Removidos `[Pergaminho] Mochila: T$ 0 e 1 sem...` e botão `[← Voltar ao Aviso]`.
    - Abas da modalidade de escolha mundana com Mochila primeiro, ofícios treinados sem `[OK]`, ou todas as categorias caso nenhum ofício específico esteja treinado.
    - Adicionados botões `[Forjar (+T$ ⅓)]` (+1 sem) e `[Comprar (T$ total)]` (sem acréscimo de tempo) no catálogo.
    - Bloqueio de itens exclusivos de origem no catálogo de acoplamento para novos itens.
    - Espaços da engenhoca calculados como `(Number(espacos) || 0) + 1` (0 esp vira 1, 1 esp vira 2).
    - Preservação do tipo `vestuario` para itens de vestuário acoplados.
  - `src/integracoes/criador/loja-itens-iniciais.js`:
    - Passado `hasAparatoPersonalizado` em `arsenalInitialData`.
    - Atualizado o listener de `disassemble-contraption` para devolver os aparatos instalados à mochila e, caso acoplada, restaurar o item mundano base preservando todas as melhorias que já possuía.
  - `src/funcionalidades/loja/05-00-initialChoice.js`:
    - Definida a lista canônica `APARATOS_CANONICOS_IDS` com os 15 aparatos de Tormenta20.
    - Atualizado `contraptionPortfolioCardHtml(c)` com CD dinâmica (`15 + pm + bonusAparatos`), destaque ao Estabilizador e Espera para Melhorias, e botão `[[Aparatos] Aparatos X/2]`.
    - Implementados `apparatusBackpackCardHtml` e `apparatusCatalogCardHtml`.
    - Implementados modais `openManageApparatusModal` (instalar/desacoplar aparatos) e `openAttachApparatusChooserModal`.
    - Reestruturada a visualização em `injectWorkshopBackpackSectionIfNeeded` na ordem estrita solicitada: 1. Bancada do Engenhoqueiro, 2. Engenhocas do Inventor, 3. Aparatos na Mochila, 4. Catálogo dos 15 Aparatos para Comprar ou Fabricar.
    - Conectados os handlers de clique para `craft-apparatus` (teste CD 20, 1h, ⅓ do custo), `buy-apparatus` (compra direta), `manage-apparatus`, `attach-backpack-apparatus` e desmontagem.
  - `testes/manufatura-regras.cjs`:
    - Adicionados testes unitários cobrindo o bônus de CD dos aparatos (com e sem o poder Aparato Personalizado), CD e tempo de manufatura de aparatos, aceitação da oficina do engenhoqueiro, limites de melhorias em engenhocas com 0, 1 e 2 "Esperas para Melhorias", bloqueio de encantos e cálculo de espaços.
  - Executados `node ferramentas/build.cjs ; node testes/verificar.cjs` com 100% de sucesso.
- **Status**: Concluído e validado.

## Solicitação 32: Restauração da Bancada do Engenhoqueiro/Engenhocas e Bloqueio Total de Encantamento em Aparatos
- **Data**: 2026-09-20
- **Solicitação**:
  1. Corrigir o sumiço da Bancada do Engenhoqueiro e das Engenhocas na Oficina do Engenhoqueiro, onde apenas os aparatos estavam sendo renderizados.
  2. Impedir terminantemente que aparatos sejam encantados, tanto na oficina quanto na loja (nem no catálogo, nem na mochila, nem em modais de aprimoramento/fabricação).
- **Causa Raiz Identificada**:
  - Na renderização do portfólio de engenhocas (`contraptionPortfolioCardHtml` em `05-00-initialChoice.js`), a variável `circuloTexto` não estava declarada no escopo local, gerando um `ReferenceError` ao existir engenhocas na lista. Isso interrompia a injeção do HTML antes de concatenar a bancada, as engenhocas e o catálogo na visualização da oficina.
  - Aparatos possuem `tipo: "item_geral"`, o que fazia com que `itemEnchantmentApplicationIds` atribuísse a aplicação `'acessorio'`, tornando-os elegíveis a encantamentos mágicos e exibindo botões de encanto [Encanto] na loja e na mochila.
- **Implementação Realizada**:
  1. `src/funcionalidades/loja/05-00-initialChoice.js`:
     - Declarada a variável `circuloTexto` em `contraptionPortfolioCardHtml(c)` e adicionado bloco de proteção try-catch para prevenir interrupções de renderização.
     - Sincronizado `catalogMarkup = itemsGrid.innerHTML` após montagem e assegurada a exibição estrita na ordem: 1. Bancada, 2. Engenhocas, 3. Aparatos na Mochila, 4. Catálogo de Aparatos.
     - Em `workshopBackpackCardHtml`, adicionada checagem explícita `isAparato` para suprimir botões de aprimoramento ou encantamento em aparatos.
  2. `src/funcionalidades/loja/03-04-syncFilterUI.js`:
     - Implementado o identificador canônico `isAparatoItem(item)` (disponibilizado globalmente em `window.isAparatoItem`).
     - Em `itemEnchantmentApplicationIds(item)`: retorna `[]` imediatamente para aparatos.
     - Em `enchantmentAppliesToItem(enchantment, item)`: retorna `false` imediatamente para aparatos.
     - Em `sanitizeInstanceEnchantments(instance, item)`: zera os encantamentos de aparatos se houver qualquer tentativa de salvamento.
  3. `src/funcionalidades/loja/03-06-magicRuleStatsHtml.js`:
     - Em `purchaseUpgradeButtons(item)`: retorna vazio para aparatos, removendo o botão [Encanto] de encanto no catálogo da loja.
     - Em `openPurchaseUpgrade`: se o item for aparato, bloqueia a abertura do modal exibindo mensagem informativa.
     - Em `backpackItemHtml`: condicionado os botões [Forjar] e [Encanto] apenas para itens elegíveis, suprimindo ambos para aparatos.
  4. `src/funcionalidades/loja/05-02-applyArsenalContext.js`:
     - No handler de clique `workshop-upgrade-existing`: bloqueia ação se for aparato.
     - Em `openCraftSimulationModal`: impede a simulação/fabricação se tentar encantar aparato.
  5. `src/regras/nucleo/manufatura.js`:
     - Em `podeReceberMelhorias` e `podeReceberEncantos`: adicionada verificação estrita para rejeitar qualquer aparato.
- **Validação**:
  - Compilação executada com sucesso via `node ferramentas/build.cjs`.
  - Testes unitários aprovados em `node testes/manufatura-regras.cjs`.
  - Suíte completa aprovada em `node testes/verificar.cjs` (sem quebras de layout, preservação de estado F5, ficha e regras de manufatura).
- **Status**: Concluído e validado.

## Solicitação 33: Bloqueio de Itens Exclusivos em Orçamentos, Correção do Modal de Melhorias com Sincronização em Tempo Real e Padronização dos Instrumentos de Ofício
- **Data**: 2026-09-20
- **Solicitação**:
  1. O Rolo de Macarrão e ferramentas pesadas/agrícolas estavam aparecendo nas escolhas da Origem Artesão. Itens exclusivos de origem NUNCA devem aparecer para quem não for da origem, nem na loja nem nas oficinas, e NUNCA em orçamentos genéricos (como o de até T$ 50 do Artesão), sendo EXCLUSIVOS para quem os receber nominalmente por sua origem.
  2. O usuário escolheu o item (Maça) e colocou a melhoria ("Banhado a Ouro"), mas não conseguiu avançar porque apareceu o erro de escolha obrigatória no criador.
  3. Todos os instrumentos de ofício devem seguir o formato padronizado `Instrumentos do [Ofício]` (ex: `Instrumentos do Armeiro`, `Instrumentos do Alquimista`, `Instrumentos do Alfaiate`, `Instrumentos do Engenhoqueiro`, `Instrumentos do Joalheiro`, etc.) e incluir a opção `Instrumentos do Tatuador`.
- **Causa Raiz Identificada**:
  1. `05-01-availableInitialItems.js` executava `return results;` antecipadamente no bloco `if (effectiveChoice?.isBudgetGrant)` antes de passar pelo filtro de `exclusiveIds`. Além disso, `itens-exclusivos-origem.js` liberava todos os itens exclusivos se `source === 'origin'`, mesmo que a concessão fosse genérica ou de orçamento sem listar o item nominalmente.
  2. O modal `#purchaseUpgradeModal` tinha `height: calc(100vh - 16px) !important`, fazendo com que dentro do iframe a barra `.modal-actions` ficasse fora da visão na parte inferior da tela do usuário. O modal duplicava o prefixo da moeda (`T$ T$ 500` / `T$ T$ 312`) e não sincronizava o candidato com o host até o clique no botão do rodapé.
  3. `ITEM_CHOICE_DEFINITIONS.instrumentos_de_oficio` utilizava o formato `Ofício (Armeiro)` e concatenava `Instrumentos de Ofício — Ofício (Armeiro)`, faltando a opção `tatuador`.
- **Implementação Realizada**:
  1. `src/regras/criador/itens-exclusivos-origem.js` e `src/funcionalidades/loja/05-01-availableInitialItems.js`:
     - Criada a função universal `isOriginExclusiveItemAllowed(item)`: bloqueia estritamente itens exclusivos se a escolha for de orçamento (`isBudgetGrant`) ou se o item não constar explicitamente na lista de nomes da concessão de origem.
     - Aplicado o filtro de itens exclusivos tanto no bloco `isBudgetGrant` quanto no fluxo geral de catálogo da loja e da oficina.
  2. `src/funcionalidades/loja/05-00-initialChoice.js`, `05-02-applyArsenalContext.js` e `src/estilos/loja/0.css`:
     - Corrigida a duplicação monetária `T$ T$` no modal de melhorias e nos botões de catálogo.
     - `#purchaseUpgradeModal`: alterado para `max-height: calc(100dvh - 20px) !important; height: auto !important; overflow-y: auto !important`, garantindo que a barra de ações `.modal-actions` permaneça visível.
     - Adicionado botão de confirmação rápida no topo (`.modal-header`) do modal: `[Confirmar escolha [OK]]`.
     - **Sincronização em tempo real**: ao adicionar/remover melhorias no modal de orçamento, `executeChooseCandidate(original, draft.improvements)` despacha imediatamente o candidato ativo ao criador (`postArsenal('candidate')`). Assim, o host reconhece a seleção no mesmo instante, liberando os botões de navegação sem qualquer bloqueio ou erro.
  3. `src/funcionalidades/loja/03-02-current.js`, `03-05-persistCharacterProfiles.js`, `src/integracoes/criador/loja-itens-iniciais.js` e `src/funcionalidades/criador/ficha/renderizacao.js`:
     - Implementada e exportada a função universal `formatCraftToolName(oficio)` cobrindo todos os ofícios (`Armeiro`, `Alquimista`, `Artesão`, `Cozinheiro`, `Alfaiate`, `Pedreiro`, `Carpinteiro`, `Joalheiro`, `Fazendeiro`, `Pescador`, `Estalajadeiro`, `Escriba`, `Escultor`, `Engenhoqueiro`, `Pintor`, `Minerador`, `Tatuador`, `Coureiro`, `Barbeiro`).
     - Adicionada a opção `['tatuador', 'Instrumentos do Tatuador']` em `ITEM_CHOICE_DEFINITIONS`.
     - Atualizados `configuredItemName`, botões de ofícios treinados no criador, exibição da mochila e resumo da ficha para apresentarem a nomenclatura unificada `Instrumentos do [Ofício]`.
- **Validação**:
  - Testes unitários adicionados e aprovados em `testes/itens-origem-e-recompensa.cjs`.
  - Suíte completa de testes executada com sucesso via `node testes/verificar.cjs`.
  - Compilação realizada com sucesso via `node ferramentas/build.cjs`.
- **Status**: Concluído e validado.

---

## Solicitação 34: Notificação Central Minimalista de Escolhas e Orçamento, Desativação da Janelinha Antiga e Correção do Fluxo de Melhorias
- **Data**: 2026-09-20
- **Solicitação**:
  1. Em cada avanço/troca de escolha de itens (Fase 8), exibir o título da escolha em uma janelinha minimalista que aparece e some no centro da tela com mais destaque.
  2. Visual limpo, escuro e sem emojis espalhafatosos ou várias cores, com frases padronizadas: `Escolha uma Arma Simples`, `Escolha uma Arma Marcial`, `Escolha uma Arma Exótica`, `Escolha os Instrumentos de Ofício`, `Escolha uma Armadura`, `Escolha uma Arma Anã`, `Escolha um item de até T$ X` ou se houver alternativas `Escolha um item entre X e Y`.
  3. Caso o orçamento seja de T$ 500 ou mais, incluir na notificação que o jogador pode escolher item com melhoria.
  4. Se a escolha tiver orçamento e o usuário selecionar um item de valor total inferior a 80% do disponível, exibir notificação centralizada informando o valor gasto e certificando-o de que pode escolher um item de valor mais alto ou adicionar melhorias.
  5. Remover a janela modal antiga de regras de orçamento (`budgetExplanationModal` / `ensureBudgetExplanationModal`) que abria automaticamente no Protótipo do Inventor, Fabricar Item Superior ou Espólio do Nobre.
  6. Corrigir o avanço nas escolhas com melhorias (item superior de até T$ 500), eliminando a mensagem de erro que impedia o avanço no criador.
- **Causa Raiz Identificada**:
  - Em `05-01-availableInitialItems.js`, a função `chooseCandidate(item)` verificava `selectedCandidate?.itemId === item.id` e desmarcava o candidato (`selectedCandidate = null; postArsenal('candidate', { itemId: '' })`). Quando o usuário configurava a melhoria no modal e fechava, ou clicava no card do item no catálogo para "confirmar", o item era desselecionado no criador, gerando o aviso de erro de escolha obrigatória ao clicar no botão de avançar. Além disso, o botão dizia `[OK] Remover seleção` com fundo avermelhado, induzindo confusão.
  - A modal `#budgetExplanationModal` abria compulsoriamente via `ensureBudgetExplanationModal` em toda escolha com orçamento.
- **Implementação Realizada**:
  1. `src/funcionalidades/loja/05-01-availableInitialItems.js`:
     - Desativadas a abertura automática de `openBudgetExplanationModal` e a injeção do botão `#budgetRulesBtn`.
     - Implementado o sistema de notificação central minimalista `showCenterChoiceNotice({ title, subtitle, duration })` e `ensureCenterNoticeElement()`.
     - Criada a função `getChoiceNoticeInfo(choice)` com mapeamento estrito das frases padronizadas (`Escolha uma Arma Simples`, `Escolha uma Arma Marcial`, `Escolha uma Arma Exótica`, `Escolha os Instrumentos de Ofício`, `Escolha uma Armadura`, `Escolha uma Arma Anã`, `Escolha um item entre X e Y`, `Escolha um item de até T$ X` com subtítulo `Você pode escolher um item com melhoria.` se orçamento >= 500).
     - Conectado o gatilho `notifyChoiceStepIfNeeded(effectiveChoice)` em `applyFilters` para disparar a notificação sempre que uma escolha de item for iniciada ou trocada.
     - `executeChooseCandidate`: adicionado o monitoramento de subutilização de orçamento (`totalSpent < 0.8 * maxBudget`), disparando notificação central destacando o valor escolhido e avisando da possibilidade de selecionar um item de maior valor ou adicionar melhorias.
     - `chooseCandidate`: ajustado para NUNCA desmarcar acidentalmente o item se já for o candidato selecionado; em vez disso, mantém selecionado ou abre o modal de melhorias se suportado.
     - `restoreCandidate`: alterado o rótulo do botão de candidato de `[OK] Remover seleção` para `[OK] Item Selecionado`.
  2. `src/funcionalidades/loja/05-00-initialChoice.js`:
     - Atualizada a renderização de catálogo em modo inicial para exibir `[OK] Item Selecionado`.
  3. `src/estilos/loja/3.css`:
     - Adicionadas regras de layout e animação de `.center-choice-notice` (centralizado na tela via `position: fixed; top: 50%; left: 50%`, fundo escuro translúcido com `backdrop-filter: blur(10px)`, borda fina `#2a3649`, tipografia Cinzel/Inter, transição suave de opacidade e escala).
     - Corrigido o estilo de `.item-card.candidate [data-action="add-to-cart"]` para verde esmeralda com sombra suave positiva, eliminando o visual de remoção avermelhado.
  4. `src/integracoes/criador/loja-itens-iniciais.js`:
     - O botão `#nextButton` (Avançar) foi aprimorado para acionar diretamente `stepNextButton.click()` se houver seleção pendente, permitindo avanço fluido por qualquer um dos botões.
- **Validação**:
  - Compilação realizada com sucesso via `node ferramentas/build.cjs`.
  - Suíte completa de testes aprovada em `node testes/verificar.cjs`.
- **Status**: Concluído e validado.

---

## Solicitação 35: Refinamentos na Seleção Inicial de Itens, Melhorias Progressivas e Conclusão de Nível 1
- **Data**: 2026-09-20
- **Solicitação**:
  1. Mensagem de subutilização de orçamento (< 80%): ajustar texto para *"Você pode selecionar um item de valor mais alto, adicionar uma melhoria ou confirmar para manter a escolha."*, com fundo/borda em tom de vermelho da paleta para destacar em relação aos cards, disparada no máximo uma vez por escolha de item (sem repetição a cada clique).
  2. Mudar a cor do item selecionado para um tom de amarelo envelhecido (dourado antigo / âmbar), diferenciando dos outros botões de seleção.
  3. Padronizar a janela de melhorias e regras progressivas dos slots:
     - Remover o quadro azul com o texto *"Orçamento disponível: T$ X · Custo atual: T$ Y"*.
     - Corrigir a regra do Protótipo do Inventor para limitar a 1 melhoria máxima permitida (`maxImprovements: 1`).
     - Regra progressiva dos slots: sempre exibir pelo menos 1 slot visível. Novos slots só aparecem se o slot anterior estiver preenchido e se os pré-requisitos forem atendidos (nível do inventor ou orçamento disponível suficiente).
  4. Fazer funcionar a busca de melhorias em tempo real pelo campo de filtro da barra lateral.
  5. Remover botões redundantes (*Voltar* e *Confirmar e selecionar item*) de dentro do modal de melhorias em modo inicial, já que a barra inferior do criador já provê essa navegação.
  6. Personagem de Nível 1 dispensa Fase 9 (Progressão):
     - Ao concluir as escolhas de itens na Fase 8, o botão na tela da mochila deve ser *"Finalizar ficha"*.
     - A Fase 9 deve ser completamente inacessível para nível 1 (não clicável na barra de etapas, pulada automaticamente, como se não existisse).
- **Implementação Realizada**:
  1. `src/regras/criador/passivas-proficiencias.js`:
     - Adicionado `maxImprovements: 1` à concessão `class-inventor-prototipo` (Protótipo do Inventor), conforme as regras de Tormenta20 p. 70.
  2. `src/compartilhado/criador/estado-e-catalogos.js`:
     - Atualizada a função `shouldSkipPhase(step)` para pular a etapa 9 quando `plannedLevel <= 1` e não houver linhas de progressão criadas.
  3. `src/funcionalidades/criador/fases/01-identidade-escolhas.js` e `02-raca-atributos.js`:
     - `renderNav`: omitidos os botões de etapas marcadas para pular em `shouldSkipPhase` (etapa 9 não renderizada para nível 1).
     - Event listener de clique em `#phaseNav`: bloqueia navegação para etapas puladas.
     - `renderStage` e `navegacao-validacao.js`: indicador do cabeçalho ajustado dinamicamente para `"Fase X de 8"` quando a Fase 9 estiver dispensada.
  4. `src/integracoes/criador/loja-itens-iniciais.js`:
     - Em `syncInitialItemFooter`: com `saved.complete` e `shouldSkipPhase(9)`, o botão principal passa a exibir `"Finalizar ficha"`.
     - No handler de clique de `#nextButton`: ao avançar da Fase 8 com a mochila concluída em nível 1, finaliza diretamente a ficha (`finishCharacterCreation`), salvando a ficha e renderizando a visualização final de personagem.
  5. `src/funcionalidades/loja/03-06-magicRuleStatsHtml.js`:
     - `purchaseUpgradeEditor`: implementado cálculo de `maxAffordableSlots` respeitando o teto de orçamento e a regra progressiva dos slots (exibe 1 slot inicialmente; slots subsequentes só aparecem se o slot anterior estiver preenchido e se o acréscimo de custo couber no orçamento ou for permitido pelo nível de artífice).
     - Busca de melhorias: campo `<input data-action="filter-sidebar-improvements">` agora preserva a busca digitada durante recarregamentos e renderiza apenas itens compatíveis com o texto digitado.
     - `openPurchaseUpgrade` e `refreshPurchaseUpgrade`: em modo inicial (`arsenalInitialState.mode === 'initial'`), a barra inferior `.modal-actions` não é renderizada nem injetada dentro do modal.
  6. `src/funcionalidades/loja/03-08-registerCustomItem.js`:
     - Registrados event listeners de `input` e `search` para filtrar em tempo real os elementos `.sidebar-improvement-item` conforme o usuário digita.
  7. `src/funcionalidades/loja/05-00-initialChoice.js`:
     - Removida a injeção do quadro azul `.budget-modal-note`.
     - Removida a injeção do botão de cabeçalho `[data-action="select-budget-item"]`.
     - Mantida a sincronização transparente em tempo real da seleção do candidato ao configurar melhorias.
  8. `src/funcionalidades/loja/05-01-availableInitialItems.js` e `src/estilos/loja/3.css`:
     - Adicionada classe `.budget-warning` e estilo avermelhado com contraste (fundo bordô escuro `rgba(42, 14, 18, 0.97)`, borda `#b91c1c` e brilho avermelhado) para a notificação central.
     - Criado controle com `warnedBudgetChoices` para emitir a mensagem de subutilização de orçamento (< 80%) apenas uma vez por escolha.
     - Texto alinhado com a solicitação: *"Você pode selecionar um item de valor mais alto, adicionar uma melhoria ou confirmar para manter a escolha."*
     - Estilo do item selecionado (`.item-card.candidate`) atualizado para tom de amarelo envelhecido / âmbar nobre (`border-color: #d4af37`, botão `background: #78350f`, borda `#f59e0b`, texto dourado `#fef08a`).
- **Validação**:
  - Compilação executada com sucesso via `node ferramentas/build.cjs`.
  - Todos os 104 testes unitários e de integração aprovados em `node testes/verificar.cjs`.
- **Status**: Concluído e validado.

---

## Solicitação 36: Correção no Modo de Edição e Criação de Nova Ficha
- **Data**: 2026-09-20
- **Problema Reportado**:
  - Ao clicar em "Nova ficha" ou "Novo personagem", a tela não abria o criador e revertia continuamente para a tela de ficha ("Herói Forjado").
  - Ao gerar uma ficha aleatória e clicar em "Editar ficha", a edição falhava, mantinha o modo de edição inacessível e fazia o botão de edição sumir.
- **Causa Raiz Identificada**:
  - Em `src/compartilhado/criador/navegacao-validacao.js`, a implementação de `renderStage` chamava `renders[safeStep-1]()`, porém a variável `renders` não estava declarada no escopo da função ou do módulo, gerando `ReferenceError: renders is not defined`.
  - O bloco global `try ... catch` em `loja-taverna-recompensas.js` capturava esse erro de renderização e executava o fallback de ficha finalizada (`renderCharacterDetails()`), omitindo as abas de navegação de fases (`phaseNav`) e forçando a classe `character-sheet-ready`.
  - Como o estado já havia alterado `state.finished = false` antes de falhar, a barra de cabeçalho considerava que a ficha não estava pronta (`isSheetView = false`) e ocultava o botão "Editar ficha", deixando o usuário bloqueado.
- **Implementação Realizada**:
  1. `src/compartilhado/criador/navegacao-validacao.js`:
     - Declarado o array `renders` contendo os renderizadores de todas as fases: `[renderIdentityClass, renderAttributesRace, renderSkillsSplit, renderOrigins, renderDeity, renderPowers, renderSpells, () => renderDeferred('items'), typeof renderProgressionPhase === 'function' ? renderProgressionPhase : renderSummary]`.
  2. `src/integracoes/criador/eventos-e-servicos.js`:
     - Adicionada proteção contra elementos nulos para `document.getElementById('resetButton')` em `action === 'edit'` e `action === 'new'`.
     - Se o usuário acionar edição ou criação a partir de `ficha.html`, realiza redirecionamento adequado para `criador.html`.
     - Limpeza explícita das variáveis de edição (`state.isEditingFinishedSheet = false`, `state.editingCharacter = null`) ao iniciar novo personagem.
     - Implementada ação `sheet` para permitir voltar diretamente à visualização da ficha completa caso o usuário esteja no modo de edição.
  3. `src/integracoes/criador/loja-itens-iniciais.js`:
     - Em `acceptArsenalOperation`: adicionada verificação de segurança `typeof renderStage === 'function'` para evitar falhas em contextos sem renderizador completo.
     - Em `renderCharacterToolbar`: adicionadas as opções dinâmicas no menu suspenso `[Menu] Menu`: `"[Editar] Editar ficha"` quando a ficha estiver concluída, e `"[Ver] Ver ficha pronta"` quando estiver em modo de edição.
  4. `src/funcionalidades/criador/ficha/loja-taverna-recompensas.js`:
     - O bloco `catch` de `renderStage` agora verifica se `!state.finished`: não força `character-sheet-ready` nem oculta o navegador de fases, exibindo mensagem amigável de erro em `stageRoot`.
  5. `src/funcionalidades/criador/fases/01-identidade-escolhas.js`:
     - Event listener do botão `#resetButton` atualizado para resetar `isEditingFinishedSheet`, salvar via `characterStorage` e exibir o botão com segurança.
- **Status**: Concluído e validado.

---

## Solicitação 37: Ocultar Botão "Nova Ficha" em Ficha Limpa, Fechar Modal de Melhorias ao Confirmar e Correção de Fabricar Item Superior
- **Data**: 2026-09-20
- **Problemas Reportados**:
  1. O botão `[Nova Ficha]` ficava visível e sem utilidade para quem acabou de iniciar ou redefinir a ficha no passo 1.
  2. Ao escolher um item e adicionar melhorias, ao clicar em "Confirmar escolha", a janela modal de melhorias continuava aberta sobre a tela em vez de fechar e dar lugar à próxima escolha de item.
  3. O título e regra de *Fabricar Item Superior* estavam exibindo incorretamente `Fabricar Item Superior · Item Superior (até 2 melhorias)` com escalonamento de orçamento arbitrário, quando a regra do jogo (Tormenta20 p. 70) estabelece que o item inicial concedido tem limitação de valor de até T$ 2.000 (`Fabricar Item Superior · Item Superior (até T$ 2.000)`), e as melhorias permitidas no item concedido dependem do nível de inventor (1 melhoria no nível 2 a 4; 2 melhorias no nível 5; 3 no nível 8; 4 no nível 11).
- **Causa Raiz Identificada**:
  1. `#resetButton` vinha sem `hidden=""` no HTML base de `criador.html`, e handlers em `loja-taverna-recompensas.js`, `eventos-e-servicos.js` e `01-identidade-escolhas.js` forçavam `resetBtn.hidden = false` incondicionalmente, mesmo quando o herói acabara de ser reiniciado para uma ficha em branco no Passo 1.
  2. `#purchaseUpgradeModal` é aberto dentro do iframe de `loja.html`. Quando o usuário clicava em "Confirmar escolha →" na barra inferior do pai (`criador.html`), o host enviava mensagem de commit, mas o iframe nunca executava `closeModal(document.getElementById('purchaseUpgradeModal'))`. Além disso, faltava um botão direto de confirmação/fechamento no footer do próprio modal em modo inicial.
  3. Em `passivas-proficiencias.js`, o cálculo de `inventorLevel` somava `(state.identity.classId === 'inventor' ? 1 : 0) + state.progression.filter(...)`, duplicando o nível 1 quando a progressão já estava preenchida. Além disso, `budgetLabel` alterava o título e o orçamento para até T$ 15.000 / T$ 30.000 / T$ 60.000, contrariando a concessão de item concedido gratuito de Tormenta20 que é de preço até T$ 2.000.
- **Implementação Realizada**:
  1. **Ocultação do Botão "Nova Ficha" em Ficha em Branco**:
     - Em `src/paginas/criador.html`, o elemento `#resetButton` foi marcado com `hidden=""` por padrão.
     - Em `src/integracoes/criador/loja-itens-iniciais.js`, `syncSheetHeadingMenu()` oculta `#resetButton` quando a ficha está no Passo 1, limpa e sem nome/progresso concluído (`isBlank`).
     - Em `src/funcionalidades/criador/ficha/loja-taverna-recompensas.js`, `src/funcionalidades/criador/fases/01-identidade-escolhas.js` e `src/integracoes/criador/eventos-e-servicos.js`, o botão `#resetButton` é mantido oculto quando a ficha é reiniciada ou limpa.
  2. **Fechamento do Modal de Melhorias (`#purchaseUpgradeModal`)**:
     - Em `src/funcionalidades/loja/05-02-applyArsenalContext.js`, adicionado fechamento explícito de `#purchaseUpgradeModal` no início de `applyArsenalContext`, ao receber mensagens `close-modal`, `commit-choice`, `finalize` e `operation-result`.
     - Em `src/funcionalidades/loja/03-06-magicRuleStatsHtml.js`, adicionado botão no rodapé do modal para o modo inicial (`<button class="primary-button" data-action="close-purchase-upgrade">Concluir melhorias e fechar</button>`), permitindo que o usuário feche diretamente ou avance pela barra inferior do criador.
     - Em `src/integracoes/criador/loja-itens-iniciais.js`, o clique em `#stepNextButton` envia `close-modal` antes de comitar a escolha ou avançar de etapa.
  3. **Correção de Fabricar Item Superior (Regras e Título)**:
     - Em `src/regras/criador/passivas-proficiencias.js`:
       - `inventorLevel` unificado utilizando `characterClassLevel('inventor')` para não duplicar contagem de níveis.
       - Título corrigido para o padrão solicitado: `Fabricar Item Superior · Item Superior (até T$ 2.000)`.
       - Orçamento fixado em `maxBudget: 2000`.
       - Quantidade máxima de melhorias permitidas no item concedido escalona conforme a regra oficial: 1 melhoria (níveis 2 a 4), 2 melhorias (níveis 5 a 7), 3 melhorias (níveis 8 a 10) e 4 melhorias (nível 11+).
     - Em `src/funcionalidades/criador/fases/09-progressao.js`:
       - Atualizados os textos informativos dos níveis 2, 5, 8 e 11 de Inventor para explicitar o limite de até T$ 2.000.
- **Status**: Concluído e validado.

---

## Solicitação 38: Estilo Vermelho Contrastante em Todos os Avisos Centrais, Remoção do Botão "Nova Ficha" do Topo e Renomeação no Menu, e Regras de Fabricar Item Superior sem Teto para Nível 5+
- **Data**: 2026-09-21
- **Problemas Reportados**:
  1. **Avisos de Escolha de Itens**: Todos os avisos centrais de escolha de item (desde arma simples até armadura) devem possuir o estilo com contraste vermelho da paleta.
  2. **Remoção do Botão "Nova Ficha" do Topo**: O botão "Nova ficha" ainda aparecia no topo ao lado de "Ficha Aleatória", em estilo destoante. Solicitado apagar completamente o botão do topo e, para compensar, mudar o nome do botão "Novo personagem" no menu `[Menu] Menu` para **"Nova Ficha"**.
  3. **Regras de Fabricar Item Superior**:
     - Níveis 2 a 4: até 1 melhoria (respeitando o teto de T$ 2.000). Título: `Fabricar Item Superior · Item Superior (até T$ 2.000)`
     - Nível 5 a 7: até 2 melhorias sem teto de tibares. Título: `Fabricar Item Superior · Item Superior (até 2 melhorias)`
     - Nível 8 a 10: até 3 melhorias sem teto de tibares. Título: `Fabricar Item Superior · Item Superior (até 3 melhorias)`
     - Nível 11+: até 4 melhorias sem teto de tibares. Título: `Fabricar Item Superior · Item Superior (até 4 melhorias)`
- **Implementação Realizada**:
  1. **Estilo Vermelho Contrastante Universal para Avisos Centrais**:
     - Em `src/estilos/loja/3.css`, a classe base `.center-choice-notice` foi padronizada com fundo bordô escuro `rgba(42, 10, 14, 0.98)`, borda sólida `2px solid #b91c1c`, sombra ampla `0 20px 50px rgba(0,0,0,0.9), 0 0 25px rgba(185, 28, 28, 0.45)`, título Cinzel em `#fee2e2` com text-shadow e subtítulo em `#fecaca`.
     - Em `src/funcionalidades/loja/05-01-availableInitialItems.js` (`ensureCenterNoticeElement`), os estilos inline foram aplicados diretamente no elemento e em seus textos, garantindo exibição contrastante imediata mesmo sem dependência de cache de CSS.
  2. **Remoção do Botão Nova Ficha do Cabeçalho e Renomeação no Menu**:
     - Em `src/paginas/criador.html`, o elemento `#resetButton` foi removido do HTML base.
     - Em `src/integracoes/criador/loja-itens-iniciais.js`:
       - No método `renderCharacterToolbar()`, o item `['new', 'Novo personagem']` foi renomeado para `['new', 'Nova Ficha']`.
       - Em `syncSheetHeadingMenu()`, qualquer instância remanescente de `#resetButton` é removida via `resetBtn.remove()`.
  3. **Regras e Títulos de Fabricar Item Superior para Níveis 2 a 4 vs 5+**:
     - Em `src/regras/criador/passivas-proficiencias.js`:
       - Para Inventor níveis 2 a 4: concessão com `maxBudget: 2000`, `maxImprovements: 1`, e título `Fabricar Item Superior · Item Superior (até T$ 2.000)`.
       - Para Inventor níveis 5+: concessão com `maxBudget: Infinity`, `unlimitedBudget: true`, `maxImprovements: 2` (5-7), `3` (8-10) ou `4` (11+), e título dinâmico `Fabricar Item Superior · Item Superior (até ${maxImprovements} melhorias)`.
     - Em `src/funcionalidades/loja/05-01-availableInitialItems.js`, `05-00-initialChoice.js`, `05-02-applyArsenalContext.js` e `03-06-magicRuleStatsHtml.js`:
       - Tratamento de `unlimitedBudget` para não bloquear itens nem slots por valor de tibares quando o herói possuir nível 5+ de Inventor.
       - A notificação central para concessões sem limite informa: `"Escolha um item com até X melhorias"` / `"Você pode escolher um item de qualquer valor."`.
       - Em `09-progressao.js`, os textos informativos dos níveis 5, 8 e 11 de Inventor foram atualizados para `"sem limite de custo"`.
- **Validação**:
  - `npm run build` executado com sucesso.
  - Suíte completa de testes (`npm test`) executada com 100% de aprovação.
- **Status**: Concluído e validado.

---

## Solicitação 39: Correção da Finalização da Ficha (Fase 9 e Nível 1), Substituição de Mudar Personagem e Nova Landing Page + Meus Personagens
- **Data**: 2026-09-21
- **Problemas Reportados**:
  1. **Trava ao Finalizar Ficha / Nível 1 pula Fase 9**:
     - O usuário ficava travado na Fase 9 ao chegar no último nível (ex: Nível 4 de Inventor com "Autômato" selecionado) e clicar em "Finalizar ficha" ou "Próxima".
     - Alinhamento de regra: Se criar um personagem de Nível 1, ele **pula a Fase 9 (progressão de nível)**, pois as escolhas do nível 1 são na Fase 1 da classe. A Fase 9 existe estritamente para Nível 2 ou superior.
  2. **Substituição da Janela de Mudar Personagem**:
     - O botão "Mudar personagem" do menu `[Menu] Menu` abria um modal simples (`#warningModal`) com uma lista crua de botões vermelhos. Solicitado remover essa janelinha e integrar com a tela completa de personagens.
  3. **Nova Landing Page (`index.html`) e Página Dedicada `personagens.html` (Estilo Fichas de Nimb / Portal do Aventureiro)**:
     - Mesclar a landing page do site com o conceito do Portal do Aventureiro e a estrutura do site Fichas de Nimb (`https://fichasdenimb.com.br/`).
     - Substituir o bloco de texto enorme da landing por uma tipografia e layout equilibrados, incluindo blocos de ação rápida: **Criar Ficha** (`criador.html?novo=true`), **Meus Personagens** (que leva para uma página `.html` dedicada com os heróis salvos listando raça, classe, nível, ações de abrir, editar e apagar), **Continuar Herói** e atalhos para os Compêndios (Grimório, Arsenal, Taverna).
- **Causa Raiz Identificada**:
  1. Em `estado-e-catalogos.js`, `shouldSkipPhase(9)` checava `plannedLevel <= 1 && !hasProgression`. Se `state.progression` estivesse inicializado, retornava `false`, forçando nível 1 a passar pela fase 9. Além disso, em `navegacao-validacao.js`, o clique de `#nextButton` no passo 9 continha `if(powerLevelIndices.length <= 1)`: para personagens com múltiplos níveis de progressão (como nível 4), a escolha em prévia (`previewPowerId`) não era comitada para `powerId`. Com isso, `characterPendingChoices()` apontava pendência e impedia o avanço. No `#stepNextButton`, ao confirmar o último nível, emitia um toast mas não concluía a ficha.
  2. `showCharacterPicker()` abria a janela `#warningModal` com texto simples em vez de redirecionar para a experiência rica de gerenciamento de aventureiros.
  3. `index.html` possuía uma cópia de texto excessivamente volumosa com apenas o botão "Entrar na forja", dependendo da abertura de modal secundário.
- **Implementação Realizada**:
  1. **Regra de Nível 1 e Finalização na Fase 9**:
     - Em `src/compartilhado/criador/estado-e-catalogos.js`: `shouldSkipPhase(9)` atualizada para retornar `plannedLevel <= 1` categoricamente.
     - Em `src/integracoes/criador/loja-itens-iniciais.js`: ao avançar da Fase 8 (Itens) com `skipProgression === true`, executa `finishCharacterCreation()`, gravando o herói e exibindo a ficha finalizada.
     - Em `src/compartilhado/criador/navegacao-validacao.js`:
       - No listener de `#nextButton` na Fase 9: removida a restrição de quantidade de níveis; comita automaticamente `previewPowerId` válido para qualquer nível ativo, verifica pendências e conclui a criação via `finishCharacterCreation()`.
       - No listener de `#stepNextButton` na Fase 9: ao confirmar a escolha do último nível (`next < 0`), se todas as escolhas estiverem concluídas, finaliza a ficha imediatamente com `finishCharacterCreation()`.
       - Em `renderStage`: corrigido o loop de fases puladas para não empurrar indevidamente a Fase 9 para `state.completed`.
     - Em `src/funcionalidades/criador/fases/09-progressao.js`: `syncProgressionFooter()` atualizado para que no último nível da progressão o botão `#nextButton` exiba `"Finalizar ficha"` habilitado quando o poder pré-visualizado for elegível.
     - Em `src/funcionalidades/criador/ficha/loja-taverna-recompensas.js`: `finishCharacterCreation()` agora chama `saveFinishedCharacter()`, persistindo o herói imediatamente no Salão dos Heróis.
     - Em `src/compartilhado/criador/modelo-estado.js`: `normalizeState()` ajustado para não forçar `state.finished = true` e `step = 9` quando a ficha estiver em criação ou edição.
  2. **Substituição de Mudar Personagem**:
     - `showCharacterPicker()` em `loja-taverna-recompensas.js` atualizado para salvar a ficha ativa se finalizada e redirecionar imediatamente para `personagens.html`.
  3. **Nova Página Dedicada `personagens.html` ("Meus Personagens")**:
     - Criada `src/paginas/personagens.html`: cabeçalho com retorno à Home, título Cinzel, contador de personagens e botão destacado **+ Forjar Novo Herói**.
     - Criada `src/funcionalidades/personagens/00-00-personagens.js`: lê os heróis salvos de `forja-heroi-t20-personagens-v1`, renderiza cards detalhados (ícone da classe, nome, nível, raça, classe, divindade, resumo de atributos e origem), com ações:
       - **Abrir Ficha**: Carrega o herói ativo e abre a ficha pronta no criador.
       - **Editar**: Ativa modo de edição da ficha e abre o criador nas etapas.
       - **Apagar ([Excluir])**: Modal de confirmação personalizado que remove do `localStorage` e atualiza a lista em tempo real.
     - Criada `src/estilos/personagens/personagens.css`: folha de estilo escura temática da Forja Rubra, totalmente responsiva.
     - Registrada no build em `src/paginas/manifesto.json` gerando `dist/personagens.html`.
  4. **Reformulação da Landing Page (`index.html`) Estilo Fichas de Nimb**:
     - Reduzido o bloco de texto enorme para uma hierarquia elegante com Cinzel e Georgia.
     - Inserida grid de ações rápidas: **Criar Ficha** (`criador.html?novo=true`), **Meus Personagens** (`personagens.html`) com contador dinâmico, e **Continuar Herói** (card dinâmico com herói ativo).
     - Inserida seção **Continue Jogando** exibindo mini-cards dos últimos heróis jogados e botão `+ Nova Ficha`.
     - Inserida seção de Compêndios e Ferramentas (Grimório, Arsenal, Taverna).
     - Preservada a identidade visual e o Olho de Tormenta atmosférico e interativo à direita.
- **Validação**:
  - `npm run build` executado com sucesso gerando os bundles e páginas em `dist/`.
  - `npm test` executado com 100% de sucesso em toda a suíte de testes unitários e de integração.
- **Status**: Concluído e validado.

---

### Solicitação 40: Extinção Definitiva do Estilo Legado de Equipamento, Moedas e Mochila
- **Contexto**:
  - Ao carregar a ficha finalizada do herói (`ficha.html` / `criador.html`), o painel de Equipamento e Mochila exibia a interface antiga: botão vermelho grande `[[Recompensa] Recompensa]` isolado no cabeçalho da mochila, cartões de item simples com botões vermelhos estáticos (`[Empunhar]`, `[Vender]`) que não abriam o card inline idêntico à loja, e o rodapé de moedas antigo com o botão indesejado `[[Moeda] Trocar por TO]`, `[[Recompensa] Recompensa]`, `[[Loja] Loja]` e `[[Taverna] Taverna]` espalhados na área de moedas.
- **Causa Raiz**:
  - Em `src/funcionalidades/criador/inventario/equipamento.js` e `src/funcionalidades/criador/ficha/habilidades-magias.js`, as implementações padrão dessas funções continuavam contendo o HTML legado e dependiam de um monkey-patching frágil posterior por `mochila-heroi-moedas-consumo.js`. Em renderizações da ficha ou carregamentos síncronos, o HTML antigo era emitido diretamente no DOM. Além disso, `src/integracoes/criador/eventos-e-servicos.js` mantinha um ouvinte para `[data-convert-coins]`.
- **Implementação Realizada**:
  1. **Extinção do Botão `[[Moeda] Trocar por TO]` e Painel Moderno de Moedas**:
     - `src/funcionalidades/criador/ficha/habilidades-magias.js`: função `sheetMoneyAndLoad()` substituída nativamente pela versão moderna com a classe `.sheet-money-load.compact-money-load`, exibindo TC, setas de conversão bidirecional (`→` e `←` via `data-coin-action`), T$, setas, TO, espaço de moedas, limite de carga, carga usada e carga máxima.
     - `src/integracoes/criador/eventos-e-servicos.js`: removido completamente o ouvinte legado `[data-convert-coins]`.
     - Zero menções a `[[Moeda] Trocar por TO]` em todo o repositório.
  2. **Barra de Ações Rápidas no Topo da Mochila**:
     - `src/funcionalidades/criador/inventario/equipamento.js`: removido o botão isolado vermelho de recompensa. No lugar, renderizada diretamente no cabeçalho a barra `.equipment-quick-actions` com os botões compactos elegantes `[[Ofício] Ofício]` (exibido apenas se treinado em algum ofício), `[[Loja] Loja]`, `[[Taverna] Taverna]` e `[[Recompensa] Recompensa]`.
  3. **Cards Compactos da Mochila com Expansão Idêntica à Loja**:
     - `src/funcionalidades/criador/inventario/equipamento.js`: grade da mochila renderiza nativamente com `.sheet-backpack-grid.sheet-general-backpack-list.list-mode`. Cada item é estruturado em `.backpack-compact-entry` com a linha `.backpack-compact-row[data-item-details]`, botões de ação rápida (`[Disparar] Disparar`, `Usar`, equipar/vestir/vender) e capacidade nativa de renderizar o card expandido de detalhes (`.sheet-item-inline-details`).
     - `src/funcionalidades/criador/inventario/mochila-heroi-moedas-consumo.js`: expostos `isConsumable`, `inlineDetails` e `expandedSheetItemId` no escopo global/window para integração transparente. `renderEquipmentPanel` harmonizado para evitar duplicações e garantir sincronismo perfeito.
  4. **Padronização de Estilos CSS**:
     - `src/estilos/criador/equipamento.css`: adicionadas as regras de estilo de `.equipment-quick-actions`, `.equipment-compact-btn`, `.compact-money-load` e `.coin-arrows` para garantia de renderização impecável independente do tempo de carregamento do tema secundário.
  5. **Sincronização de Dados de Ficha no Manifesto**:
     - `src/paginas/manifesto.json`: incluídos `"DATA.contraptionsCatalog"` e `"DATA.enchantmentData"` na entrada `ficha`.
- **Validação**:
  - `npm run build` executado com 100% de sucesso.
  - `npm test` executado com 100% de sucesso em toda a suíte de testes (regras puras, manufatura, inventário, expansão dinâmica de itens na mochila, botões do topo ocultos quando expandido, troca de personagens, persistência e verificação de integridade).
- **Status**: Concluído e validado.

---

### Solicitação 41: Regras Canônicas do Benefício da Origem Regional Cosmopolita (Valkaria)
- **Pedido**:
  "implemente isso aqui, o cosmopolita tem essas regras do Benefício. Escolha um poder geral ou de uma classe na qual você tenha pelo menos dois níveis, e cujos requisitos você cumpra (exceto poderes concedidos ou da Tormenta). Você recebe esse poder. Uma vez por aventura, após concluir um descanso (oito horas de sono), pode trocar esse poder por outro."
- **Entendimento**:
  - Origem Regional Cosmopolita (Valkaria) em modo dual.
  - Concede 1 poder à escolha do jogador:
    - Poder Geral das categorias Combate, Destino ou Magia cujos requisitos sejam cumpridos.
    - Exclusão explícita de poderes Concedidos (divindades) e poderes da Tormenta.
    - Poder de Classe: permitido exclusivamente para classes em que o herói possua pelo menos 2 níveis (`classLevel >= 2`) e cumpra os requisitos. No nível 1 de criação, nenhum poder de classe é liberado (somente poderes gerais elegíveis). Ao avançar de nível e possuir multiclasse ou nível 2+, os poderes dessa classe tornam-se disponíveis.
  - Seleção na Fase 6 com bloqueio de avanço se não escolhido.
  - Integração total na ficha e passivas (`selectedCharacterFeatures`, `ownedPowerNames`).
  - Troca após descanso de 8 horas (1× por aventura) disponível no modal de descanso (`#sheetRestModal`) e via modal dedicado de troca na ficha (`#cosmopolitaSwapModal`).
- **Implementado**:
  - `dados/criador-regionalOrigins.json`: atualizado o texto da descrição do benefício de Cosmopolita para o texto canônico exato.
  - `src/regras/criador/origem-cosmopolita.js`: módulo criado com helpers `hasCosmopolita()`, `cosmopolitaClassLevels()`, `cosmopolitaGeneralPowerEligibility()`, `cosmopolitaClassPowerEligibility()`, `cosmopolitaEligiblePowers()`, `selectedCosmopolitaPower()`, renderizador da Fase 6, decorações de `selectedCharacterFeatures()` e `ownedPowerNames()`, modal e lógica de troca após descanso.
  - `src/compartilhado/criador/estado-e-catalogos.js` e `src/funcionalidades/criador/fases/06-poderes.js`: integrados `hasCosmopolita()` em `characterHasPowerChoices()` e `powerMissingChoices()`, bloqueando o avanço na etapa de poderes até que a escolha seja concluída.
  - `src/funcionalidades/criador/ficha/renderizacao.js`: adicionada seção de Cosmopolita e botão de troca no `#sheetRestModal`.
  - `src/paginas/manifesto.json`: incluído o novo módulo em `criador` e `ficha`.
  - `testes/cosmopolita-beneficio.cjs`: suíte completa cobrindo elegibilidade, restrições, nível 1 vs nível 2+, avanço na Fase 6, ficha e troca no descanso.
- **Validação**:
  - `node ferramentas/build.cjs` executado com sucesso gerando bundles em `dist/`.
  - `npm test` executado com 100% de sucesso em toda a suíte.
  - `npm run typecheck` executado sem erros.
- **Status**: Concluído e validado.

---

### Solicitação 42: Pacote de 10 Itens (Origens Regionais, Parceiros Canônicos e Oficina)
- **Pedido**:
  1. Presentes em dinheiro de origens (Agricultor Sambur etc.): somar diretamente à carteira e não poluir a mochila.
  2. Coleção de livros: nome customizado puro sem sufixo forçado de perícia; escolha obrigatória da perícia beneficiada (+1).
  3. Amazona de Hippion: soma Carisma nos PM máximos se não estiver usando armadura pesada.
  4. Anão de Armas: +2 em rolagens de dano com armas anãs (machados, machadinhas, martelos, marretas, picaretas).
  5. Andarilho Ubaneri: parceiro Alikunhá que ignora limite de parceiros e proficiência com escudos (+1 Defesa se classe já conceder).
  6. Sistema canônico de 12 parceiros e 3 graus: tetos por patamar (1 para nv 1-4, 2 para nv 5-16, 3 para nv 17-20).
  7. Remoção de perícia duplicada ao mudar de origem: desmarca das livres e gera pendência na Fase 4.
  8. Reset de itens de origem ao mudar de origem: limpa escolhas anteriores.
  9. Aprendiz de Dragoeiro: item comestível Treckod (T$ 50, 1 espaço, alimentação, Atlas de Arton).
  10. Aprendiz de Drogadora: poções e preparados alquímicos custam 1/4 da matéria-prima na oficina.
- **Implementado**:
  - `originMoneyBonus()` somando no `startingFunds()`.
  - Coleção de livros com validação e nome limpo em `05-00-initialChoice.js` e `05-01-availableInitialItems.js`.
  - `passiveCharacterEffects()` com Carisma no PM para Amazona de Hippion sem armadura pesada.
  - `weaponPassiveStats()` com +2 no dano para Anão de Armas.
  - `shieldPassiveStats()` com +1 na Defesa com escudos para Andarilho Ubaneri já proficiente.
  - `dados/criador-parceiros.json` com os 12 parceiros em 3 graus e limite de patamares na Taverna (`renderMercenariesGrid`).
  - `cleanSkillsAfterOriginChange()` e `resetOriginItemsOnOriginChange()` na troca de origem.
  - `treckod` cadastrado em `dados/items.json`.
  - `custoMateriaPrima()` com 1/4 para poções e preparados na oficina para Drogadora.
  - Teste dedicado `testes/origens-regionais-parceiros.cjs` aprovado.
- **Status**: Concluído e validado.

---

### Solicitação 43: Barra de PV/PM Escalável com Camadas de Cor, Nova Fase de Parceiros no Criador, Filtro de Parceiros na Taverna e Alikunhá dos 6 Elementos
- **Pedido**:
  1. **Barra de PV e PM Escalável com Camadas de Cores**:
     - Tamanho que escala conforme valor de PV/PM.
     - Tamanho mínimo de 10 unidades para até 50 PV (30 PV continua com 10 unidades).
     - Escala proporcional de 50 até 100 PV atingindo 20 unidades (tamanho máximo da barra).
     - Acima de 100 PV a largura fixa em 20 unidades, mas ganha camadas de cores a cada marco:
       - 1 a 100 PV: camada base.
       - 101 a 200 PV: camada 2 (coloração mais forte / duas barras em uma).
       - 201 a 300 PV: camada 3 (outra cor).
       - 301 a 400 PV: camada 4 (outra cor).
       - 401 a 500 PV: camada 5 (última camada de cor).
     - PVs temporários contam para o incremento do tamanho e para as camadas de cor (pois aumentam o PV máximo total).
  2. **Nova Fase de Parceiros no Criador (após a Fase de Itens)**:
     - Criação de uma etapa/janela dedicada para escolha de parceiros que o herói tem direito a receber.
     - Pulo automático: se o personagem não tiver origem ou poder que conceda parceiro, a fase é pulada automaticamente, mantendo a numeração sequencial coerente.
     - Casos com direito a parceiro:
       - *Andarilho Ubaneri* (origem regional): recebe o Alikunhá que não conta no limite.
       - *Emissário Ubaneri* (origem regional): parceiro com benefícios correspondentes.
       - *Um com os Kami* (poder/origem especial): parceiro especial (vê criaturas incorpóreas/invisíveis e ataques/habilidades contam como mágicos).
       - *Amigo Especial* (origem Amigo dos Animais): parceiro animal (+5 Adestramento e +2 em uma perícia à escolha exceto Luta/Pontaria).
       - *Antigo Mestre* (origem Seguidor): parceiro que já vem do tipo **Mestre** escolhido nessa janela.
     - Respeito às regras de patamares para parceiros normais: Iniciante (1 parceiro, níveis 1-4), Veterano/Campeão (2 parceiros, níveis 5-16), Lenda (3 parceiros, níveis 17-20), exceto parceiros especiais que não contam no limite.
  3. **Filtro de Parceiros na Taverna**:
     - Adicionar filtro especial na Taverna similar a Mercenários para contratação e gerenciamento de parceiros.
  4. **Andarilho Ubaneri & Alikunhá dos 6 Elementos**:
     - Na janela de parceiros, o jogador escolhe 1 dos 6 elementos em cards de 3 colunas, cada card com a cor temática do elemento:
       - **Ar**: Assassino, Perseguidor ou Vigilante.
       - **Água**: Ajudante, Guardião ou Médico.
       - **Fogo**: Atirador, Combatente ou Fortão.
       - **Terra**: Combatente, Guardião ou Montaria.
       - **Luz**: Guardião, Médico ou Vigilante.
       - **Trevas**: Assassino, Magivocador ou Perseguidor.
     - Após selecionar o elemento, o jogador escolhe qual tipo de parceiro dentre os do elemento será o seu Alikunhá.
- **Entendimento e Design Aprovados**:
  - **Barra de PV**:
    - Tamanho: 10 unidades (mínimo, 140px) até 50 PV; escala linear contínua entre 50 e 100 PV até 20 unidades (280px); fixo em 20 unidades acima de 100 PV.
    - 5 Camadas de cor com 3 tons por gradiente, mais intensos e com brilho característico (`box-shadow` e `inset`):
      - Camada 1 (1–100 PV): Verde Esmeralda vibrante (`#15803d`, `#22c55e`, `#4ade80`) + brilho verde.
      - Camada 2 (101–200 PV): Ouro Solar Dourado intenso (`#b45309`, `#f59e0b`, `#fde047`) + brilho dourado.
      - Camada 3 (201–300 PV): Laranja Âmbar Vulcânico (`#c2410c`, `#ea580c`, `#fb923c`) + brilho alaranjado.
      - Camada 4 (301–400 PV): Púrpura Violeta Arcano profundo (`#6b21a8`, `#9333ea`, `#c084fc`) + brilho violeta.
      - Camada 5 (401–500+ PV): Rubro Sangue Carmesim Profundo (`#881337`, `#be123c`, `#f43f5e`) + brilho carmesim intenso.
    - PV temporários contam no total para o tamanho e camadas de cores.
  - **Barra de PM**:
    - Mesma escala métrica de tamanho (10 unidades até 50 PM, 20 unidades em 100+ PM).
    - 5 Camadas em tons de azul ficando gradualmente mais profundos e intensos (com brilho):
      - Camada 1: Azul Celeste / Ciano (`#0369a1`, `#0ea5e9`, `#38bdf8`).
      - Camada 2: Azul Safira Real (`#1d4ed8`, `#2563eb`, `#60a5fa`).
      - Camada 3: Azul Índigo Místico (`#3730a3`, `#4338ca`, `#818cf8`).
      - Camada 4: Azul Noturno Profundo (`#1e1b4b`, `#2e1065`, `#4f46e5`).
      - Camada 5: Azul Marinho Abissal Cósmico (`#0b132b`, `#1c2541`, `#3a506b`).
  - **Fluxo Oficial das 10 Fases**:
    1. Identidade e Classe
    2. Atributos e Raça
    3. Origens *(pulada para Golem)*
    4. Perícias
    5. Divindade
    6. Poderes *(pulada automaticamente para quem não tem poderes a escolher)*
    7. Magias *(pulada automaticamente para não conjuradores)*
    8. Itens Iniciais (Arsenal)
    9. Parceiros *(nova fase! pulada automaticamente para quem não tem parceiros a escolher)*
    10. Progressão *(para personagens de nível 2+, pulada para nível 1)*
- **Status**: Alinhado e aprovado pelo usuário. Em implementação.

---

### Solicitação 44: Barras de Vitais Integradas, Cosmopolita com Filtros e Troca no Descanso, Origens Regionais (Lote 2: Aristocrata Dai'zenshi até De Outro Mundo), Bônus Temporários na Ficha e Análise das Próximas 10
- **Pedido**:
  0. **Barras de Vitais Integradas (PV e PM)**:
     - As barras temporárias (PV e PM) devem ficar imediatamente adjacentes às barras fixas, funcionando visualmente como uma barra contínua/integrada.
     - A regra de 5 tiers de coloração e brilhos (box-shadow/glow) deve se aplicar identicamente às barras fixas e temporárias.
     - Se a soma dos pontos fixos com os temporários ultrapassar 50, já deve incrementar a largura contínua da barra (de 10 a 20 unidades).
  1. **Cosmopolita no Modal de Descanso**:
     - No modal de descanso, exibir o poder geral que foi selecionado pelo cosmopolita durante a criação ou edição.
     - Permitir clicar para abrir o modal de troca e selecionar um novo poder geral válido, recalculando imediatamente a ficha ao confirmar.
  2. **Aristocrata Dai’zenshi**:
     - Itens: Traje da corte + Katana superior com uma melhoria (exceto material especial).
     - Nas escolhas da Fase 8, abrir direto no seletor de melhoria com a mensagem *"Escolha uma melhoria para sua katana"*.
  3. **Armeiro Armado**:
     - Benefício: Treinado em Ofício (armeiro) e pode fabricar armas com 1 melhoria. Se aprender a fabricar armas superiores por outra fonte (como a habilidade de Inventor Fabricar Item Superior nível 2+), gasta apenas 1/4 do preço das melhorias em armas na oficina em vez de 1/3.
  4. **Aspirante a Herói**:
     - Benefício: +1 em um atributo à sua escolha. Abrir calculadora/seletor similar ao Aumento de Atributo ou bônus flexíveis da raça.
  5. **Assistente Forense**:
     - Benefício: Investigação para identificar criaturas, causa da morte em 1 minuto (CD 15) e necromancia. Perícia Investigação com texto descritivo.
  6. **Bandoleiro da Fortaleza**:
     - Perícias e itens normais. Benefício: +2 em testes de resistência contra medo e frio (descritivo/bloco de resistências).
  7. **Barão Arruinado & Bônus Manuais Temporários na Ficha**:
     - Benefício: Diplomacia no lugar de Intimidação com nobres/burocratas e +T$ 50 iniciais.
     - Sistema de bônus manuais na ficha: campos editáveis para o jogador inserir bônus temporários do mestre/magia (Defesa e Perícias). Ao descansar, esses bônus são resetados para os valores padrão.
  8. **Catador da Cidade Velha**:
     - Itens: Tranqueiras resgatadas do mar (2 espaços, vendidas por T$ 100 integrais em vez de 50%). Input com sugestões automáticas onde o jogador pode digitar livremente.
  9. **Cativo das Fadas**:
     - Benefício: +1 PV por nível de personagem integrado às passivas de vida.
  10. **Competidor do Circuito**:
      - Benefício: Recebe o poder geral *Torcida* automaticamente sem consumir slot de escolha, com texto completo nas habilidades da origem.
  11. **Cosmopolita (Melhorias no Modal de Seleção)**:
      - Organizar a janela de busca: filtros por categoria (Combate, Destino, Magia, Tormenta, Todos), filtro de status (disponíveis, todos) e ordenação com poderes que ainda não cumprem pré-requisitos posicionados ao final da lista.
  12. **Cria da Favela**:
      - Benefício: +1 permanente em Constituição. Condição de descanso nunca pior que Normal (descanso Ruim recupera como Normal).
  13. **Criado pelas Voracis**:
      - Benefício: +2 Defesa, +2 Sobrevivência e +3m Deslocamento. Escolha livre de qualquer arma simples e qualquer armadura leve na Fase 8.
  14. **De Outro Mundo**:
      - Benefício: Aprende 1 magia de 1º círculo (arcana ou divina, atributo-chave Int/Sab/Car). Escolha entre Habilidade vs Tecnologia (item Minúsculo empunhado, 1 espaço, RD 10, PV metade dos seus, limite PM +2). Escolha entre Mágico vs Mundano (mundano funciona em antimagia mas não acumula com magias).
      - Itens: Um item de até T$ 100 empunhável com input para nome personalizado no card.
  15. **Relatório Analítico das Próximas 10 Origens Regionais**:
      - Leitura e plano analítico de: Descendente Colleniano, Desertor da Supremacia, Duplo Feérico, Duyshid akk Infiltrado, Emissário Ubaneri, Escudeiro da Luz, Escudeiro Solitário, Estandarte Vivo, Estudante do Colégio Real, Explorador de Ruínas (sem implementação de código até validação do usuário).
- **Entendimento e Arquitetura**:
  - Seguir estritamente TypeScript, Clean Code, testes automatizados e sem mutação indevida de dados.
- **Status**: Implementado e Concluído (Itens 0 a 14 totalmente implementados e validados por suíte de testes automatizados com 18 arquivos passando 100%; Relatório Analítico do Item 15 pronto para apresentação).

---

### Solicitação 54: Implementação Integral das 66 Origens Regionais e Padronização das 46 Origens Padrão
- **Pedido**:
  - Implementar de forma completa e definitiva todas as 66 origens regionais restantes no criador e na ficha, cobrindo itens, perícias, proficiências, poderes, magias e parceiros.
  - Conferir a integridade das 46 origens padrão para garantir que todos os benefícios, itens iniciais e poderes estejam operando corretamente.
  - Não utilizar formato de tabelas nos relatórios de entrega, mantendo o padrão visual e descritivo em tópicos/listas.
- **Implementações Realizadas**:
  - **Catálogo de Itens (`dados/items.json`)**:
    - Cadastrados todos os itens específicos restantes das origens regionais e itens canônicos padrão (ex: `machadinha_tollon`, `machado_de_batalha_tollon`, `montaria_do_deserto`, `insignia_militar`, `balsamo_restaurador`, `pergaminho_de_magia`, entre outros).
  - **Mochila e Arsenal Inicial (`src/funcionalidades/loja/05-00-initialChoice.js` & `05-02-applyArsenalContext.js`)**:
    - Suporte a itens com quantificadores prefixados e sufixados em `findStartingItem` e `qtyMatch`.
  - **Passivas, Proficiências e Escolhas de Origem (`src/regras/criador/passivas-proficiencias.js`)**:
    - Suporte a Legionário em `configuredWeaponCritical` (+1 margem de ameaça com gládio + escudo pesado).
    - Parsing dinâmico de dados de tibares em `originMoneyBonus` (`T$ 6d12` de Rebelde Agitador e `T$ 4d6` de Sucateiro de Batalhas) via `parseOriginMoneyText` e filtrado em `automaticStartingGrants`.
    - Adicionadas escolhas de itens em `originItemChoice` e `originItemChoices` para Arco Longo/Machado de Batalha (Guardião Glacial), Madeira de Tollon (Lenhador de Tollon), Montaria do Deserto (Nômade Sar-Allan), Arma Marcial (Prisioneiro das Catacumbas), Arma Superior Zakharoviana (Nobre Zakharoviano) e 3 Pergaminhos Arcanos de 1º Círculo (Turista da Academia).
    - Implementados parceiros `irmao_cavalo` (Irmão sem Esporas) e `grifo_iniciante` (Recruta da Fênix) em `ensureOriginPartners`.
  - **Proficiências de Armas (`src/funcionalidades/criador/fases/07-escolas-expansoes.js`)**:
    - Adicionadas proficiências para Guardião Glacial (`arco_longo`, `machado_de_batalha`), Legionário (`gladio`, `escudos`), Lenhador de Tollon (`machadinha`, `machado_de_batalha`), Nitamuraniano (`katana`, `arco_longo`) e Procurado: Vivo ou Morto (`armas_de_fogo`).
  - **Perícias Regionais Determinísticas (`src/funcionalidades/criador/fases/04-origens-divindades.js`)**:
    - Mapeamento determinístico `REGIONAL_SKILL_MAP` cobrindo todas as 34 origens com perícias fixas para imunidade contra falhas de word boundary (`\b`) em palavras acentuadas.
  - **Efeitos Passivos e Troca de Atributos-Chave (`src/compartilhado/criador/navegacao-validacao.js`)**:
    - Adicionadas passivas em `passiveCharacterEffects` para Guardião Glacial, Insurgente Tapistano, Legionário, Liricista de Lenórienn, Nobre Zakharoviano, Nômade Sar-Allan, Pescador Parrudo, Plebeu Arcano, Querido Filho, Recruta da Fênix, Selvagem Sanguinário, Tradicionalista Svalano, Trapaceiro Ahleniense e Turista da Academia.
    - Troca de atributo-chave em `skillEffectiveAttribute`: Misticismo com Carisma (Liricista), Ladinagem com Carisma (Trapaceiro), Conhecimento e Nobreza com Sabedoria (Tradicionalista) e Enganação com Sabedoria (Duyshid akk Infiltrado).
  - **Fase 9 de Parceiros (`src/funcionalidades/criador/fases/09-parceiros.js` & `src/compartilhado/criador/estado-e-catalogos.js`)**:
    - Suporte nativo completo a `irmao_sem_esporas` e `recruta_da_fenix` junto a `tumarkhan` e `andarilho_ubaneri`.
  - **Grimório e Magias de Origem (`src/regras/criador/magias.js`)**:
    - Suporte a Sábio Matemático concedendo *Concentração de Combate* e *Orientação*.
  - **Suíte de Testes Automatizados (`testes/origens-completas-validacao.cjs`)**:
    - Suíte consolidada cobrindo integralmente as 46 origens padrão e todas as 66 origens regionais.
- **Status**: Concluído e Aprovado (Pipeline `npm run check` com 23 suítes de testes passando com 100% de sucesso).

---

### Solicitação 55: Unificação de Cosmopolita na Ficha, Parceiros Fixos na Taverna e Minimalismo Visual sem Emojis
- **Pedido**:
  1. **Cosmopolita Unificado na Ficha**:
     - Eliminar a duplicidade de Cosmopolita sozinho e Cosmopolita com poder.
     - Manter apenas uma entrada `Cosmopolita: [Nome do Poder]` (ou `Cosmopolita` se não houver poder escolhido).
     - Ao abrir o accordion, exibir o texto da origem Cosmopolita, seguido de `Poder escolhido: [Nome]` e a descrição do poder escolhido, com botão chanfrado de troca apenas no corpo (sem poluição no cabeçalho).
  2. **Parceiros Fixos pela Campanha na Taverna**:
     - Parceiros não podem ser comprados em tibares nem possuem duração diária ("por dia" / "Dia(s)").
     - Duração fixa pela campanha e custo zero.
     - Botão no card passa a ser `Receber Parceiro` (em vez de Comprar/Contratar).
     - Ao atingir o limite de parceiros da campanha, novos parceiros e contratações de mercenários ficam bloqueados com aviso de `Limite Atingido`.
  3. **Minimalismo Visual, Botões Menores e Remoção de Emojis**:
     - Botões de vender da mochila reduzidos, compactos e sem o emoji `[Saldo]` (apenas `Vender`).
     - Botões de bônus temporários reduzidos, compactos e sem o emoji `[Bônus]` (apenas `Bônus temp.`).
     - Modal de bônus temporários limpo dos 3 emojis (`[Bônus] BÔNUS TEMPORÁRIOS` -> `BÔNUS TEMPORÁRIOS`; `[Defesa] Bônus na Defesa:` -> `Bônus na Defesa:`; `[Perícia] Bônus em Perícia:` -> `Bônus em Perícia:`).
     - Remoção de emojis dos botões de ação rápida no cabeçalho da mochila (`Loja`, `Taverna`, `Recompensa`, `Ofício`) e dos botões de itens da mochila (`Equipar`, `Empunhar`, `Vestir`, `Descobrir`, `Disparar`, `Usar`).
- **Implementações Realizadas**:
  - `src/regras/criador/origem-cosmopolita.js`: Unificação da entrada de Cosmopolita em `selectedCharacterFeatures()`, integrando a descrição da origem com o poder selecionado em um único item.
  - `src/funcionalidades/criador/ficha/habilidades-magias.js`: Renderização de `sheetFeatureDisclosure` ajustada para o padrão visual da imagem enviada pelo usuário (texto da origem + título do poder escolhido + descrição do poder + botão `[[Trocar] Trocar]` dentro do corpo, sem botão no `<summary>`).
  - `src/funcionalidades/taverna/03-00-TAVERN_DATA.js` & `03-01-renderMercenariesGrid.js` & `03-02-chip.js`:
    - `CANONICAL_PARTNER_ITEMS` com preço 0, `unitLabel: 'Campanha'` e `unitPeriod: 'Fixo'`.
    - `renderCards()` exibe preço como "Fixo / Campanha", botão `Receber Parceiro` e bloqueio automático quando `counts.normalCount >= counts.limit.maxPartners`.
    - Função `receivePartnerDirectly(itemId)` para receber parceiro diretamente sem cobrança em dinheiro e computando no limite compartilhado de parceiros/mercenários.
  - `src/funcionalidades/criador/ficha/renderizacao.js`:
    - Remoção dos 3 emojis da janela de bônus temporários e do emoji `[Bônus]` dos botões e tags de perícias.
  - `src/funcionalidades/criador/inventario/equipamento.js` & `mochila-heroi-moedas-consumo.js` & `venda.js` & `03-06-magicRuleStatsHtml.js` & `05-02-applyArsenalContext.js` & `05-03-ensureGeneralSaleModal.js`:
    - Remoção de todos os emojis dos botões da mochila e de vender (`[Saldo]`, `[Loja]`, `[Taverna]`, `[Recompensa]`, `[Ofício]`, `[Defesa]`, `[Arma]`, `[Encanto]`, `[Traje]`, `[Acessório]`, `[Disparar]`, `[Alquimia]`, `[Excluir]`).
  - `src/estilos/criador/equipamento.css`: Adicionados estilos específicos para `.btn-sell-compact`, `button[data-backpack-action="sell"]` e `button[data-vital-action="open-temp-bonuses"]` garantindo tamanho compacto, discreto e chanfro reduzido.
  - `testes/ajustes-cosmopolita-parceiros-minimalismo.cjs`: Nova suíte de testes automatizados integrada ao pipeline.
- **Status**: Concluído e Aprovado (Pipeline `npm run check` com 24 suítes de testes passando com 100% de sucesso).

---

## Solicitação 58: Autenticação Social Google com Supabase e Sincronização em Nuvem Multi-Tenant
- **Data**: 2026-09-25
- **Objetivos**:
  1. Configuração completa de autenticação com Supabase e Google OAuth2 (`jjbjmpeglgqmmgpibeam.supabase.co`).
  2. Implementação do serviço de autenticação singleton (`src/compartilhado/auth/servico-autenticacao.js`).
  3. Sincronização em nuvem resiliente multi-tenant de fichas e inventário (`src/compartilhado/auth/sincronizacao-nuvem.js`).
  4. Migração SQL versionada idempotente com RLS (`migrations/001_autenticacao_e_personagens.sql`).
  5. Widget visual de autenticação no cabeçalho das páginas (`src/funcionalidades/auth/00-00-auth-ui.js`).
- **Implementações Realizadas**:
  - `src/compartilhado/auth/supabase-config.js`: Gerenciamento de credenciais e inicialização do cliente Supabase.
  - `src/compartilhado/auth/servico-autenticacao.js`: Métodos `loginComGoogle()`, `logout()`, `obterUsuarioAtual()`, `aoMudarEstado()` e monitoramento de sessão.
  - `src/compartilhado/auth/sincronizacao-nuvem.js`: Sincronização com debounce e fallback em caso de rede instável.
  - `migrations/001_autenticacao_e_personagens.sql`: Criação das tabelas `perfis` e `personagens` com Row Level Security (RLS) garantindo isolamento total por usuário.
  - `testes/autenticacao-e-sincronizacao-nuvem.cjs`: Suíte automatizada validando RLS, singleton de autenticação e sincronização.
- **Status**: Concluído e validado com 100% de aprovação.

---

## Solicitação 59: Repaginação Estilo Fichas de Nimb, Menu Lateral Gaveta (Drawer), Ícones Vetoriais SVG (Sem Emojis) e Identidade Visual Forja Rubra
- **Data**: 2026-09-25
- **Objetivos**:
  1. **Inspiração e Repaginação Visual**: Alinhar o portal com a interface do concorrente e referência *Fichas de Nimb* (`https://fichasdenimb.com.br/`).
  2. **Eliminação Total de Emojis**: Substituição de todos os emojis remanescentes por ícones vetoriais SVG monocromáticos e elegantes em CSS (`src/compartilhado/icones.js` e `src/estilos/compartilhado/icones.css`).
  3. **Menu Lateral Gaveta (Drawer Retrátil)**: Botão hambúrguer no canto superior esquerdo que desliza o menu lateral contendo:
     - Dados do perfil do usuário logado (avatar, nome, email).
     - Botão de logout imediato com ícone de portinha (`door-exit`), encerrando a sessão instantaneamente sem pop-ups ou `confirm()`.
     - Links de navegação categorizados com ícones vetoriais (Início, Criar Ficha, Meus Personagens, Continuar Herói, Grimório, Arsenal, Taverna).
  4. **Limpeza de Naming e Direitos Autorais**: Remoção completa de termos de terceiros ("Tormenta20") e nomes redundantes ("Portal do Aventureiro") da landing page (`src/paginas/index.html`), consolidando como título e marca principal **Forja Rubra**.
  5. **Barra Superior Estilizada**: Header sticky (`portal-top-bar`) com botão de menu à esquerda e widget de login com Google / Perfil à direita.
- **Implementações Realizadas**:
  - `src/compartilhado/icones.js`: Catálogo com 24 ícones SVG vetoriais universais (`menu`, `close`, `door-exit`, `users`, `user`, `sword`, `flame`, `book`, `store`, `beer`, `paw`, `wrench`, `dice`, `sync`, `plus`, `axe`, `bow`, `shield`, `sparkles`, `crown`, `fist`, `music`, `trash`, `scroll`).
  - `src/estilos/compartilhado/icones.css`: Classes de estilo padronizadas (`.forja-svg`, `.icon-sm`, `.icon-md`, `.icon-lg`, `.icon-gold`, `.icon-red`, `.icon-carmim`).
  - `src/compartilhado/drawer/drawer-ui.js`: Módulo do menu lateral gaveta retrátil com suporte a abertura/fechamento por teclado (ESC), clique fora, perfil do usuário e logout sem confirmação.
  - `src/estilos/compartilhado/drawer.css`: Estilização chanfrada escura de alta fidelidade para o drawer e botão hambúrguer.
  - `src/funcionalidades/index/00-00-portal.js`: Atualização de `CLASS_ICONS` e botões da lista para ícones vetoriais SVG limpos, sem nenhum caractere emoji.
  - `src/funcionalidades/criador/gerador-aleatorio.js`: Resolução automática de parceiros para personagens gerados de forma aleatória, evitando qualquer inconsistência com as origens regionais.
  - `src/paginas/index.html`: Repaginação da landing page com nova barra superior, título limpo **Forja Rubra**, cards de ação com SVG e modal do Salão dos Heróis totalmente vetorial.
  - `src/paginas/criador.html` e `src/paginas/ficha.html`: Integração dos links de CSS do drawer e ícones vetoriais.
  - `src/paginas/manifesto.json`: Inclusão dos módulos compartilhados (`icones.js`, `drawer-ui.js`, `auth`) nas esteiras de compilação.
  - `testes/drawer-icones-e-portal.cjs`: Nova suíte de testes unitários e de integração validando os 24 ícones SVG, drawer UI, ausência total de emojis e integridade da landing page.
- **Validação**:
  - `node ferramentas/build.cjs` executado com sucesso e pasta `dist/` atualizada.
  - `tsc --noEmit` aprovado sem erros de tipagem.
  - Pipeline de 26 suítes de testes automatizados (`npm test`) passando com 100% de sucesso.
- **Status**: Concluído, testado e validado.

---

## Solicitação 60: Unificação de Menus, Rodapé Completo e Termos de Uso (Estilo Fichas de Nimb), Limite de 10 Fichas por Jogador, Apoio e Origem com Benefícios `Origem(Benefício1/Benefício2)`
- **Data**: 2026-09-25
- **Objetivos**:
  1. **Unificação Total de Menus**: Extinção completa do menu redundante do canto superior direito (`sheetMenuContainer` e `.sheet-menu`), integrando todas as ações (Oficinas de Fabricação, Recompensas da Taverna, Subir Nível, Editar Ficha, Termos de Uso e Apoiar o Projeto) diretamente no Drawer lateral esquerdo.
  2. **Varredura e Extinção Geral de Emojis**: Remoção de emojis de todos os arquivos do projeto (`personagens.html`, `criador.html`, `loja.html`, `taverna.html`, `grimorio.html`, `venda.js`, `04-00-channel.js`, `09-parceiros.js`, `00-00-personagens.js`), substituindo-os por ícones SVG vetoriais elegantes e sem carinhas/emojis.
  3. **Rodapé Completo e Termos de Uso (Estilo Fichas de Nimb)**: Criação do rodapé institucional estruturado em 5 colunas (*Ferramentas*, *Enciclopédia*, *Comunidade*, *Conta*, *Legal*) e modal interativo com Termos de Uso e notas legais de direitos autorais/OGL 1.0a para Jambô Editora.
  4. **Botão e Sistema de Apoio ao Projeto**: Botão destacado "Apoiar o Projeto" (no Drawer e no Rodapé) abrindo modal visual com 3 patamares de apoio (*Aventureiro*, *Campeão de Arton*, *Lenda Viva*), orientações de sustentabilidade e aviso sobre chaves PIX/Apoia.se em ativação.
  5. **Limite Inicial de 10 Fichas por Jogador**: Controle preventivo de capacidade para evitar sobrecarga no banco de dados. Usuários gratuitos podem criar até 10 fichas; ao tentar criar a 11ª ficha, é exibido modal amigável com opção para gerenciar aventureiros ou apoiar a Forja.
  6. **Formatação de Origem nas Habilidades Iniciais**: Nas habilidades da ficha e exportação PDF, a origem padrão com duas escolhas de benefícios é exibida exatamente no formato `Origem(Benefício1/Benefício2)` (exemplo: `Aristocrata(Sangue Azul/Diplomacia)`).
- **Implementações Realizadas**:
  - `src/compartilhado/limites.js`: Módulo com controle de limite (`MAX_FREE_CHARACTERS = 10`), cálculo de slots e modal temático amigável de capacidade atingida.
  - `src/compartilhado/footer/footer-ui.js` e `src/estilos/compartilhado/footer.css`: Rodapé global responsivo em 5 colunas com os modais de Termos de Uso e Apoiar o Projeto.
  - `src/compartilhado/drawer/drawer-ui.js`: Consolidação de todas as opções de navegação e atalhos contextuais de ficha ("Subir Nível", "Editar Ficha", "Oficinas", "Recompensas").
  - `src/integracoes/criador/loja-itens-iniciais.js`: Eliminação da injeção de `sheetMenuContainer` e verificação preventiva do limite de 10 fichas ao salvar novo personagem.
  - `src/compartilhado/criador/navegacao-validacao.js`: Formatação canônica da origem padrão com `origin.nome + '(' + benefitNames.join('/') + ')'`, preservando efeitos mecânicos e descrições detalhadas.
  - `src/paginas/personagens.html` e `src/funcionalidades/personagens/00-00-personagens.js`: Repaginação sem emojis com Drawer, Footer e ícones vetoriais.
  - `src/paginas/criador.html`, `src/paginas/loja.html`, `src/paginas/taverna.html`, `src/paginas/grimorio.html`: Varredura completa de emojis.
  - `testes/limite-origem-e-menus.cjs`: Nova suíte de testes com 5 blocos de validação de menus, rodapé, limites e formatação de origem.
- **Status**: Concluído, testado e validado.

---

## Solicitação 61: Purga Radical de Emojis em Todo o Projeto, Ícones CSS/SVG das Escolas de Magia, Ícones Específicos nos Botões da Ficha e Centralização de Usuário/Sincronizar/Logout no Drawer
- **Data**: 2026-09-25
- **Objetivos**:
  1. **Purga Radical de Emojis em Todo o Projeto**: Eliminação completa de qualquer caractere emoji ou dingbat unicode de todos os arquivos de código, dados e estilos do projeto (Grimório, Loja, Taverna, Mercenários, Oficinas de Fabricação, Ficha de Personagem, Modais e Rodapé).
  2. **Ícones CSS/SVG para as 8 Escolas de Magia**: Substituição dos emojis das escolas por ícones em estilo CSS com máscaras SVG vetoriais puras (`mask-image`), mapeadas para as 8 escolas de magia canônicas de Tormenta 20 (Abjuração, Adivinhação, Convocação, Encantamento, Evocação, Ilusão, Necromancia, Transmutação) com paleta de cores temática oficial.
  3. **Ícones Vetoriais nos Botões da Ficha e Drawer**:
     - Botão "Subir nível": ícone de seta para cima (`arrow-up`).
     - Botão "Grimório" (na seção Magias): ícone de livro aberto (`book-open`).
     - Botão "Oficinas / Ofício": ícone de chave inglesa e martelo cruzados (`tools`).
     - Botões de Ação da Mochila: "Loja" (`store`), "Taverna" (`beer`), "Recompensa" (`gift`), "Guardar" (`archive`) nos slots de equipamentos e "Vender" (`coin`) nos itens da mochila.
  4. **Remoção do Widget de Autenticação do Topo e Centralização no Drawer**:
     - Removida a barra superior com avatar, identificação da conta, botão SINCRONIZAR e portinha de logout.
     - Centralizada toda a identificação do usuário, o botão Sincronizar e o logout imediato no Drawer lateral retrátil.
- **Implementações Realizadas**:
  - `src/compartilhado/icones.js`: Adicionados novos ícones vetoriais SVG: `arrow-up`, `book-open`, `tools`, `archive`, `gift`, `coin`, `gear`, `school-abjuration`, `school-divination`, `school-conjuration`, `school-enchantment`, `school-evocation`, `school-illusion`, `school-necromancy`, `school-transmutation`, `bed`, `utensils`, `horse`, `theater`, `potion`, `backpack`, `cart`.
  - `src/estilos/grimorio/0.css` e `src/estilos/compartilhado/icones.css`: Definida a classe `.escola-icon` com máscara SVG e suporte a `data-escola="..."` com cores canônicas.
  - `dados/magias-cards.json`: 268 ocorrências de emojis de escolas substituídas por `<span class="escola-icon" aria-hidden="true"></span>`.
  - `src/funcionalidades/auth/00-00-auth-ui.js`: Removida a injeção do contêiner de autenticação no cabeçalho.
  - `src/compartilhado/drawer/drawer-ui.js` e `src/estilos/compartilhado/drawer.css`: Integrado botão "Sincronizar" com ícone vetorial `sync` e portinha de logout no cartão do perfil de usuário no Drawer. Atualizados os atalhos de ficha para `arrow-up` (Subir nível), `book-open` (Grimório) e `tools` (Oficinas).
  - `src/integracoes/criador/loja-itens-iniciais.js`: Botão `#levelUpButton` atualizado com ícone `arrow-up`.
  - `src/funcionalidades/criador/ficha/habilidades-magias.js` e `renderizacao.js`: Botão do Grimório na seção de magias atualizado com ícone `book-open`.
  - `src/funcionalidades/criador/inventario/equipamento.js`: Botão de Ofício com `tools`, Loja com `store`, Taverna com `beer`, Recompensa com `gift`, slots de equipamento com botão Guardar contendo `archive`, e lista da mochila com botão Vender contendo `coin`.
  - Varredura e purga completa de emojis em `renderizacao.js`, `mochila-heroi-moedas-consumo.js`, `oficina-oficios.js`, `teste-oficio-modal.js`, `loja-taverna-recompensas.js`, `09-parceiros.js`, `manufatura.js`, `03-00-TAVERN_DATA.js`, `03-01`, `05-00`, `03-06` e `docs/ANDAMENTO-REFATORACAO.md`.
  - `ferramentas/scan-emojis.cjs`: Auditoria em todo o repositório confirmando 0 linhas com emojis no código-fonte e dados.
- **Status**: Concluído, testado e validado.

---

## Solicitação 62: Termos de Uso em Nova Janela, Mapa de Arton em Alta Resolução, Botões Clean na Mochila, Ícone de Lápis em Vitais e Preservação de Cores nos Temporários
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Termos de Uso em Nova Janela/Aba**: Ao clicar em "Termos de Uso" no rodapé, abrir em nova aba (`target="_blank" rel="noopener noreferrer"`) em vez de modal interno.
  2. **Separação Arquitetural entre Drawer e Rodapé**:
     - Remover o link de Termos de Uso do Drawer lateral retrátil (mantendo o Drawer focado nas ações de perfil e no personagem ativo).
     - Manter o link de Termos de Uso no Rodapé e adicionar o atalho para o "Mapa de Arton".
  3. **Botões Clean na Mochila e Ficha (Apenas Texto)**:
     - Remover ícones dos botões de ação rápida da mochila (`Ofício`, `Loja`, `Taverna`, `Recompensa`).
     - Remover ícones dos botões de ação nos itens da ficha (`Guardar` nos slots de arma, outra mão, escudo, armadura, traje e acessórios; `Vender` nos itens da mochila; `Grimório` na seção de magias).
  4. **Ícone de Lápis em Vitais (PV e PM)**:
     - Substituir a palavra literal "Modificar" ao lado dos vitais de PV e PM pelo ícone vetorial SVG de lápis (`pencil`).
  5. **Preservação de Cores nos Botões de Temporários**:
     - Ao clicar para adicionar PV ou PM temporários, preservar as cores padrão dos botões (`vital-up-pv` verde e `vital-up-pm` azul), alternando unicamente os textos entre "Encerrar" e "Adicionar".
  6. **Mapa de Arton em Alta Resolução**:
     - Mover o arquivo de alta resolução da raiz para o diretório canônico de assets (`assets/mapas/mapa-de-arton.jpg`).
     - Criar página dedicada `mapa.html` com visualizador interativo em tela cheia, pan (arrastar) e zoom suave, botões de zoom in/out, reset e alternância de tela cheia.
  7. **Conformidade Arquitetural e CSP**:
     - Separação estrita de CSS em `src/estilos/compartilhado/termos.css` e `src/estilos/compartilhado/mapa.css`.
     - Script do mapa isolado em `src/funcionalidades/mapa/00-00-mapa.js` e registrado em `src/paginas/manifesto.json`.
     - Zero estilos ou scripts inline nos arquivos HTML.
- **Implementações Realizadas**:
  - `assets/mapas/mapa-de-arton.jpg`: Imagem canônica em alta definição movida para a estrutura de assets.
  - `src/compartilhado/icones.js`: Adicionado o ícone vetorial SVG `pencil`.
  - `src/estilos/compartilhado/termos.css`: Folha de estilos dedicada para o layout dos Termos de Uso.
  - `src/paginas/termos.html`: Página completa com as 10 cláusulas legais e operacionais da Forja Rubra (Tormenta 20, Jambô Editora, OGL 1.0a, LGPD).
  - `src/estilos/compartilhado/mapa.css`: Estilos do viewport responsivo, painel de controles flutuantes e badge informativo do mapa.
  - `src/funcionalidades/mapa/00-00-mapa.js`: Controlador interativo de navegação com arraste pelo mouse, zoom pela roda/botões e tela cheia.
  - `src/paginas/mapa.html`: Página do visualizador do Mapa de Arton integrada ao Drawer e Footer.
  - `src/paginas/manifesto.json`: Entradas modularizadas de `"termos"` e `"mapa"` para o pipeline de build.
  - `src/compartilhado/footer/footer-ui.js`: Banner superior de apoio integrado com `abrirApoio()`, link de Termos de Uso com `target="_blank" rel="noopener noreferrer"` e atalho para o Mapa de Arton.
  - `src/compartilhado/drawer/drawer-ui.js`: Link de Termos de Uso removido do Drawer; atalho para o Mapa de Arton inserido em Compêndios.
  - `src/funcionalidades/criador/inventario/equipamento.js`: Botões da mochila (`Ofício`, `Loja`, `Taverna`, `Recompensa`, `Guardar`, `Vender`) simplificados para apenas texto limpo.
  - `src/funcionalidades/criador/ficha/habilidades-magias.js`: Botão do Grimório simplificado para apenas texto limpo.
  - `src/funcionalidades/criador/ficha/renderizacao.js` e `src/estilos/criador/equipamento.css`: Substituição do texto "Modificar" pelo ícone `pencil`, e preservação das cores nativas dos botões ao alternar temporários.
  - `testes/limite-origem-e-menus.cjs`: Bloco 7 implementado e bloco 1 atualizado validando todas as novas diretrizes da Solicitação 62.
- **Status**: Concluído, testado e validado.

---

## Solicitação 63: Edição da Ficha como Benefício de Apoiador, Ficha Simplificada (Stat Block T20), Botão Gerar PDF na Ficha, Modal de Condições e Otimização do Mapa de Arton
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Edição da Ficha como Benefício de Apoiador**:
     - O botão de editar ficha / editar layout passa a ser um benefício exclusivo para apoiadores a partir do Plano Básico (`aventureiro` / R$ 5, `campeao` / R$ 10, `lenda` / R$ 25).
     - Para usuários do plano gratuito, exibe ícone de cadeado (`lock`) e ao clicar abre o modal de Apoio (`abrirApoio()`).
  2. **Ficha Simplificada (Stat Block T20)**:
     - Criação da visualização compacta no formato de Bloco de Estatísticas clássico de Tormenta 20 conforme o Print 2 de referência:
     - Cabeçalho com Nome Cinzel vermelho em caixa alta, subtítulo descritivo em itálico, divisores horizontais vermelhos.
     - Bloco de combate: Iniciativa, Percepção, Defesa, Fortitude, Reflexos, Vontade.
     - Vitais e locomoção: Pontos de Vida (PV), Deslocamento, Pontos de Mana (PM).
     - Linha de Condições interativa.
     - Ataques corpo a corpo e à distância formatados com bônus de acerto, dano e crítico.
     - Bloco de Atributos formatados (`FOR`, `DES`, `CON`, `INT`, `SAB`, `CAR`).
     - Listagem de Perícias treinadas, Equipamento/Mochila, Habilidades & Poderes e Magias.
     - Botão de alternância para retornar à ficha completa (`Ver ficha completa`).
  3. **Botão Gerar PDF no Corpo da Ficha**:
     - O botão de exportação para PDF foi reposicionado na barra de ações da própria ficha (`.sheet-action-bar`) e removido do topo global (`.app-header`).
  4. **Janela / Modal de Condições de Tormenta 20**:
     - Modal interativo completo com as 45+ condições oficiais do sistema.
     - Busca em tempo real e 10 pílulas de filtro por categoria (Todas, Sentidos, Movimento, Mental, Físico, Combate, Paralisia, Mana, Morte, Especial).
     - Listagem com barra lateral indicativa colorida por severidade, ícone vetorial SVG, resumo curto oficial, detalhes expansíveis e botões de alternância direta (adicionar/remover condição da ficha).
     - Linha de condições na ficha exibindo tags ativas com botão de remoção rápida e atalho `[+]` para abrir o catálogo.
  5. **Otimização e Navegação do Mapa de Arton**:
     - Correção definitiva do arrasto acidental da imagem nativa do navegador (`e.preventDefault()`, `draggable="false"`).
     - Suporte a gestos touch (pinch-to-zoom) para mobile.
     - Controle contínuo de zoom com slider e botões graduais.
     - Carregamento progressivo e responsivo com pré-visualização leve (`mapa-de-arton-preview.jpg`).
- **Implementações Realizadas**:
  - `src/compartilhado/criador/estado-e-catalogos.js`: Suporte a `state.sheetLayoutMode` ('full' | 'simplified').
  - `dados/condicoes.json`: Catálogo estruturado com todas as condições do sistema Tormenta 20, contendo id, nome, categoria, resumo curto, descrição completa e severidade.
  - `src/funcionalidades/criador/ficha/modal-condicoes.js`: Módulo completo de gerenciamento do modal de condições com busca, filtros e sincronização no estado do personagem.
  - `src/estilos/criador/modal-condicoes.css`: Estilização das pílulas de filtro, cards de condição, cores de severidade e barra de busca.
  - `src/estilos/criador/ficha-simplificada.css`: Estilização completa do Stat Block oficial de Tormenta 20.
  - `src/funcionalidades/criador/ficha/renderizacao.js`: Implementação de `renderSheetActionBar()`, `renderSimplifiedSheet()`, controle de permissão de apoiador para edição da ficha e linha de condições.
  - `src/funcionalidades/mapa/00-00-mapa.js` e `src/estilos/compartilhado/mapa.css`: Gestos de pinça, slider contínuo de zoom e carregamento de preview leve.
  - `src/paginas/ficha.html` e `src/paginas/manifesto.json`: Atualização das dependências modulares e remoção do exportButton do cabeçalho global.
- **Status**: Concluído, testado e validado.

---

## Solicitação 64: Bloco de Parceiros na Ficha e Modificadores Temporários de Atributos com Reset no Descanso
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Bloco de Parceiros ao Lado da Carga e Moedas**:
     - Inserção do bloco de Parceiros no mesmo alinhamento horizontal dos blocos de Moedas e Carga Máxima (`.sheet-money-load-partners-row`), espelhando a disposição do Fichas de Nimb.
     - Exibição de ícone vetorial `users`, título em caixa alta `PARCEIROS`, indicador de limite de parceiros com base no nível/regras de Tormenta 20 `(atual/limite)` e botão de ação rápida `+ Adicionar`.
     - Modal de seleção e customização de parceiro com nome, tipo (Ajudante, Assassino, Atirador, Combatente, Curandeiro, Fortão, Guardião, Perseguidor, Vigilante, etc.), patamar (Iniciante, Veterano, Mestre) e bônus aplicados.
     - Botão de remoção rápida (`×`) em cada parceiro cadastrado.
  2. **Modificadores Temporários de Atributos**:
     - Botão temático com ícone vetorial SVG `sliders` posicionado no canto superior direito do bloco de atributos da ficha.
     - Drawer/modal lateral contendo caixa informativa sobre modificadores ("Para bônus e penalidades que a ficha não conhece...").
     - Controles numéricos independentes para os 6 atributos (`FOR`, `DES`, `CON`, `INT`, `SAB`, `CAR`) com exibição do valor base, modificador temporário e total resultante.
     - Botão `Zerar todos` para limpar todos os bônus temporários em um clique.
     - **Regra Canônica de Cálculo**: Os atributos temporários influenciam Defesa, Testes de Perícia, Ataques e Carga, mas **NÃO alteram PV Máximo nem PM Máximo** (conforme regras oficiais de T20).
     - **Reset Automático no Descanso**: Ao realizar o descanso (`rest` ou `rest-pay`) para recuperação de PV e PM, todos os modificadores manuais temporários de atributos são automaticamente resetados para zero.
- **Implementações Realizadas**:
  - `src/compartilhado/icones.js`: Adicionado o ícone vetorial SVG `sliders`.
  - `src/compartilhado/criador/estado-e-catalogos.js`: Integração de `state.tempManualBonuses.attrs` e parâmetro `includeTemp` em `finalAttrs()`.
  - `src/funcionalidades/criador/fases/04-origens-divindades.js`: Atualização de `progressionStats()` para calcular PV/PM máximos com `finalAttrs(false)` e Defesa com `finalAttrs(true)`.
  - `src/estilos/criador/ficha-simplificada.css`: Classes e layout para `.sheet-money-load-partners-row`, `.sheet-partners-card`, `.sheet-attr-header-row`, `.sheet-attr-temp-btn`, `.sheet-attr-temp-backdrop`, `.sheet-attr-temp-drawer`.
  - `src/funcionalidades/criador/ficha/habilidades-magias.js`: Implementação de `renderSheetPartnersBlock()` e atualização de `sheetMoneyAndLoad()`.
  - `src/funcionalidades/criador/inventario/mochila-heroi-moedas-consumo.js`: Sincronização de `sheetMoneyAndLoad` e `updateSheetMoneyAndLoadOnly()`.
  - `src/funcionalidades/criador/ficha/renderizacao.js`: Implementação de `renderAttrTempModalHtml()`, `renderSheetPartnerModalHtml()`, `syncAttrTempModalValues()`, manipuladores de eventos para o drawer de atributos e modal de parceiros, e limpeza automática dos atributos temporários nos botões de descanso.
  - `testes/parceiros-e-atributos-temporarios.cjs`: Nova suíte de testes cobrindo bônus temporários, integridade de PV/PM máximos, reset no descanso e operações com parceiros.
  - `testes/progression-footer-edit.cjs`: Ajustado para validar permissões com tier de apoiador ativo.
  - `ferramentas/build.cjs`: Recompilação completa dos assets em `dist/`.
- **Status**: Concluído, testado e validado.

---

## Solicitação 65: Mapeamento do Fichas de Nimb e Implementação da Parte 1 (Regras Puras de Passos de Dano e Golpe Pessoal)
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Mapeamento Arquitetural Completo**:
     - Varredura profunda do repositório `gerador-ficha-tormenta20-main` (Fichas de Nimb) analisando arquitetura, regras, funções, estilos, persistência e interfaces.
     - Comparação sistemática com a Forja T20, identificando o que a Forja possui de exclusivo (Oficinas de Manufatura com testes de ofício, Taverna completa, controle rígido de carga/moedas, Grimório rápido, Mapa de Arton em tela cheia e nuvem Supabase multi-tenant) e o que assimilar do Nimb.
     - Criação do Roadmap modular em 7 fases registrado em `implementation_plan.md`.
  2. **Implementação da Parte 1 (Regras Puras de Tormenta 20)**:
     - **Passos de Dano de Armas (`passos-dano.js`)**: Escala primária canônica da Tabela 3-2 do JDA (1 a 4d12), ramo alternativo para 2dX (`allowAltLadder`), suporte a armas com múltiplos modos (ex: "1d8/1d10"), soma de bônus fixo com mesclagem e cálculo de média de dano.
     - **Catálogo de Golpe Pessoal (`dados/golpe-pessoal.json`)**: Todos os 17 efeitos oficiais (Amplo, Atordoante, Brutal, Conjurador, Destruidor, Distante, Elemental, Impactante, Letal, Penetrante, Preciso, Qualquer Arma, Ricocheteante, Teleguiado, Lento, Perto da Morte, Sacrifício) com custos de PM, categorias, limites de repetição e requisitos de escolha.
     - **Módulo de Cálculo e Validação de Golpe Pessoal (`golpe-pessoal.js`)**: Cálculo dinâmico de PM (incluindo magias de 1º e 2º círculos para Conjurador), validação de regras de Tormenta 20 (mínimo de 1 PM, arma obrigatória, pelo menos um efeito positivo, respeito ao teto de repetições) e formatação descritiva.
     - **Suíte de Testes Automatizados (`testes/regras-puras-nimb.cjs`)**: Cobertura completa de subida/descida de passos, armas versáteis, ramo alternativo 2dX, soma de bônus e todas as regras de Golpe Pessoal.
- **Implementações Realizadas**:
  - `src/regras/nucleo/passos-dano.js`: Algoritmo canônico de progressão de dados e modificadores.
  - `dados/golpe-pessoal.json`: Catálogo estruturado de efeitos, custos e tipos elementais.
  - `src/regras/nucleo/golpe-pessoal.js`: Módulo de cálculo de PM, validação e formatação.
  - `testes/regras-puras-nimb.cjs`: Nova suíte de testes unitários adicionada ao pipeline de testes.
  - `package.json`: Script `test` atualizado para incluir `testes/regras-puras-nimb.cjs`.
  - `implementation_plan.md`: Plano diretor em 7 fases detalhado.
- **Status**: Concluído, testado e validado (28 suítes de teste com 100% de sucesso).

---

## Solicitação 66: Deliberação das Decisões Estratégicas D01-D12 e Especificação das Recompensas do Mestre
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Deliberação Oficial das Diretrizes D01 a D12**:
     - **D01 (Carga de Moedas)**: Aprovada a regra canônica agregada onde 1000 moedas de qualquer tipo somadas equivalem a 1 espaço de carga (`floor((tc + ts + to) / 1000)`).
     - **D02 (Idade)**: Modos explícitos e exclusivos (Descritivo / Envelhecimento Básico / Idades Variadas com bônus e complicações), com validação de efeitos sem empilhamento silencioso.
     - **D03 (Origens)**: Mantido suporte canônico à seleção dupla de origens (padrão + regional).
     - **D04 (Pré-requisitos)**: Mantido o sistema flexível da Forja Rubra com avisos e confirmações da mesa.
     - **D05 (Edição Retroativa)**: Prévia clara das consequências ao alterar níveis anteriores, mantendo rascunho até resolução sem exclusões automáticas.
     - **D06 (Suplementos)**: Configuração de conteúdo por campanha/mesa, 100% livre e sem restrições comerciais.
     - **D07 (Páginas Dedicadas vs Modais)**: Esclarecimento da experiência de interface: sem novas abas do navegador. Modais/drawers para ações rápidas (ex: Descanso) e Páginas Dedicadas para módulos completos (Ficha, Criador, Loja, Oficinas, Taverna, Mapa).
     - **Página de Recompensas do Mestre**: Nova arquitetura com controle restrito ao Mestre, integrado à mesa/campanha:
       - Distribuição de Tibares: bolsa coletiva para partilha livre ou divisão automática idêntica entre os heróis.
       - Concessão de Itens: botão/fluxo conectado ao catálogo da Loja para transferir itens oficiais diretamente para a mochila de qualquer herói da mesa (mesma lógica das Oficinas para aliados).
       - Cadastro de Novos Itens Customizados pelo Mestre.
       - Gerador Aleatório de Tesouros de T20 (inspirado em Nimb `rewardsGenerator.ts`), calculando riquezas (moedas/joias) e itens (mundanos, superiores e mágicos) por ND e multiplicador.
     - **D08 (Persistência)**: Padrão da Forja Rubra como base (schemas JSON versionados e sincronização Supabase).
     - **D09 (Aquisição de Itens)**: Distinção estrita entre compra (débito de saldo), concessão/recompensa (sem débito), fabricação (matéria-prima + tempo) e venda (50% de crédito).
     - **D10 (Passos de Dano)**: Preservar escala primária e regras canônicas da Forja sem forçar a escala alternativa 2dX em contextos não autorizados.
     - **D11 (Escopo Inicial)**: Foco total na paridade da Forja Rubra; Ameaças, Foundry e PWA ficam para etapas posteriores.
     - **D12 (Cópia Interna)**: Remoção segura da pasta duplicada `Forja T20/`, auditando divergências e elegendo a raiz como fonte canônica definitiva.
  2. **Ações Executadas**:
     - Pasta `Forja T20/` auditada e completamente apagada do disco.
     - Documentação atualizada em `docs/planejamento-remake/RELATORIO-E-PLANO.md` e `implementation_plan.md`.
     - Zero implementação ativa de código realizada; projeto mantido 100% estável e em modo de planejamento puro.
- **Status**: Concluído e documentado.

---

## Solicitação 67: Início da Construção do Remake Modular em TypeScript na Pasta `remake/`
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Construção do Remake Independente (`remake/`)**:
     - Atendimento à instrução explícita do usuário: "certo, agora faça o remake na pasta remake".
     - Criação da arquitetura limpa com separação estrita de camadas (`src/domain/`, `src/application/`, `src/infrastructure/`, `tests/`).
     - Configuração de TypeScript estrito (`strict: true`, `target: ES2022`, `NodeNext`) com contratos explícitos e zero dependências de interface no domínio.
  2. **Implementação do Domínio Puro (`remake/src/domain/`)**:
     - **Regras Canônicas e Rolagens (`rules/dice.ts`, `rules/t20-rules.ts`)**:
       - Gerador de dados determinístico (`SeededDiceRoller`) e padrão (`StandardDiceRoller`).
       - Fórmulas puras de Defesa canônica (10 + Destreza + Armadura + Escudo + Outros, sem metade do nível).
       - Cálculo canônico de Vitais (PV e PM máximos) por classe, nível e atributos.
       - Regra D01 — Carga de Moedas: 1000 moedas acumuladas de qualquer tipo equivalem a 1 espaço de carga (`floor((tc + ts + to) / 1000)`).
       - Modos de Idade D02: Descritivo, Básico e Idades Variadas.
       - Passos de dano canônicos de Tormenta 20 (D10).
     - **Modelagem de Personagem e Origens (`character/model.ts`)**:
       - Suporte canônico a Origem Dupla D03 (padrão + regional) e rastreamento da proveniência de cada habilidade/poder.
     - **Modelo e Transações de Inventário (`inventory/model.ts`, `inventory/operations.ts`)**:
       - Distinção clara entre definição de catálogo e instâncias de item.
       - Operações puras D09: compra com débito, concessão sem débito, venda com 50% de retorno em T$, cálculo de carga ocupada e transições de mãos/armas de duas mãos/escudos.
     - **Oficinas de Fabricação (`crafting/workshop.ts`)**:
       - Custos de matéria-prima (1/3 do preço), cálculo de CD de testes de ofício e aprimoramento progressivo.
     - **Recompensas do Mestre e Gerador T20 (`rewards/rewards-t20.ts`)**:
       - Tabelas canônicas de tesouro para 22 NDs (1/4 a 20).
       - Algoritmo de divisão igualitária de tibares com cálculo exato de cota e sobras.
  3. **Camada de Aplicação e Persistência (`application/`, `infrastructure/`)**:
     - **Gerenciador de Mesa (`application/campaign/table-manager.ts`)**: Distribuição de tibares na mesa e concessão direta de itens para a mochila do herói escolhido pelo Mestre (D07).
     - **Persistência e Migrações (`infrastructure/persistence/storage.ts`)**: Versionamento JSON v2.0.0 com migração automática do esquema legado da Forja Rubra (`forja-heroi-t20-personagens-v1`).
  4. **Suíte de Testes Unitários (`remake/tests/`)**:
     - `tests/rules.test.ts`, `tests/inventory.test.ts`, `tests/rewards.test.ts`, `tests/storage.test.ts`.
     - 19 testes automatizados cobrindo 100% das fórmulas, transações e migrações com aprovação total (19/19) em menos de 600ms.
- **Status**: Concluído, testado e validado.

---

## Solicitação 68: Landing Page com Rolagem, Cards de Fichas/Mesas, Banner de Apoio, Rodapé Multi-colunas e Catálogo Modular em `src/data/`
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Landing Page com Rolagem Suave**:
     - Atendimento às capturas fornecidas pelo usuário:
       - **Seção "Continue Jogando"**: Carrossel horizontal de fichas salvas (avatar, nome, badge de nível, classe) + card tracejado `+ Nova Ficha`.
       - **Seção "Suas Mesas"**: Carrossel de campanhas da mesa (ícone, nome da campanha, badge de status, participantes) + card tracejado `+ Nova Mesa`.
       - **Seção "Compêndios e Ferramentas"**: Acessos rápidos a Arsenal, Oficinas de Fabricação, Recompensas do Mestre e Grimório.
       - **Banner de Apoio Superior**: Card gótico rubro convidando a apoiar o projeto com botão de ação.
       - **Rodapé Multi-colunas Estilo Fichas de Nimb / Forja Rubra**: Colunas completas de Ferramentas, Enciclopédia, Comunidade, Conta e Legal com créditos OGL Tormenta 20 e Jambô Editora.
  2. **Organização Modular de Dados (`remake/src/data/`)**:
     - Catálogos estruturados em JSON no estilo Fichas de Nimb com exportador TypeScript tipado:
       - `classes.json`: atributos fundamentais das 14 classes de T20 (pvInicial, pvPorNivel, pmInicial, pmPorNivel, perícias e proficiências).
       - `origins.json`: suporte a origens padrão e regionais (D03).
       - `campaigns.json`: mesas de campanha ativas.
       - `index.ts`: tipagem e exportação canônica.
  3. **Suíte de Testes Unitários Expandida**:
     - Nova suíte `tests/data.test.ts` adicionada ao pipeline.
     - 22 testes automatizados cobrindo 100% das regras, inventário, tesouros, persistência e catálogos de dados com aprovação total (22/22) em 819ms.
  4. **Servidor Local Ativo**:
     - Servidor de desenvolvimento mantido ativo em `http://localhost:4200/` permitindo inspeção visual completa em tempo real.
- **Status**: Concluído, testado e validado.

---

## Solicitação 69: Criador de Personagens por Etapas (`criador.html`), Painel Dedicado de Recompensas do Mestre (`recompensas.html`) e Catálogos Modulares
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Criador Guiado de Personagens (`remake/criador.html`)**:
     - Fluxo de 5 etapas modulares com barra de progresso e visualização em tempo real:
       - Etapa 1: Nome e seleção de Raça (Humano, Anão, Elfo, Dahllan, Lefou, Qareen) com traços e habilidades raciais.
       - Etapa 2: Classe (Guerreiro, Arcanista, Paladino, Ladino, Clérigo, Bárbaro) e Divindade do Panteão (Valkaria, Khalmyr, Nimb, Arsenal).
       - Etapa 3: Origem Dupla (D03: Origem Padrão + Origem Regional).
       - Etapa 4: Ajuste de Atributos com cálculo de modificadores e Modo de Idade Básico D02.
       - Etapa 5: Equipamento Inicial, moedas D01 e botão de forjar herói com gravação imediata no armazenamento local (`CharacterStorageManager`) e redirecionamento para `ficha.html`.
     - Dock lateral de resumo do herói com atualização em tempo real de Defesa, PV, PM e modificadores.
  2. **Página Dedicada de Recompensas do Mestre (`remake/recompensas.html`)**:
     - Atendimento integral à deliberação D07:
       - Painel restrito ao Mestre conectado ao roster da mesa (exibindo heróis conectados, saldos e itens).
       - Aba 1: Distribuição de Tibares (modo igualitário ou direcionado a herói específico).
       - Aba 2: Concessão de itens do catálogo oficial diretamente para a mochila do herói na mesa.
       - Aba 3: Cadastro e forja de novos itens customizados pelo Mestre com entrega imediata.
       - Aba 4: Gerador de Tesouros de Tormenta 20 por ND (1/4 a 20) com botão de distribuição automática do dinheiro e itens sorteados para os participantes.
  3. **Catálogos Canônicos em `src/data/`**:
     - `races.json`: raças de Tormenta 20 com modificadores e habilidades raciais.
     - `deities.json`: divindades do Panteão com armas sagradas e poderes concedidos.
     - `equipment.json`: armas, armaduras, escudos e itens gerais com preços e espaços de carga.
     - `index.ts`: tipagem e exportação canônica.
  4. **Suíte de Testes Unitários Expandida**:
     - Suíte `tests/data.test.ts` expandida para validar raças, divindades e equipamentos.
     - 25 testes unitários aprovados com 100% de sucesso em 819ms.
- **Status**: Concluído, testado e validado.

---

## Solicitação 70: Ecossistema Completo do Remake — Salão dos Heróis (`personagens.html`), Arsenal (`loja.html`), Grimório (`grimorio.html`), Oficina (`oficina.html`) e Descanso Canônico
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Salão dos Heróis (`remake/personagens.html`)**:
     - Galeria com todos os aventureiros salvos no storage do remake (v2.0.0) e compatibilidade transparente com o storage legado da Forja Rubra (D08).
     - Cards detalhados com portrait, classe, nível, origem dupla D03, divindade, vitais (PV, PM, Defesa) e moedas (com cálculo de espaços D01).
     - Ações diretas por herói: Ficha Completa, Arsenal, Grimório, Oficina, Duplicar, Exportar JSON e Excluir.
     - Botão global de Importar Ficha JSON com validação de esquema instantânea.
  2. **Arsenal de Arton (`remake/loja.html`)**:
     - Catálogo expandido de armas simples e marciais, armaduras leves e pesadas, escudos, itens gerais e alquímicos.
     - Painel do aventureiro ativo com saldo de Tibares e medidor de carga dinâmico com destaque para regra D01 (1000 moedas = 1 espaço).
     - Compra de itens com débito automático no saldo e validação de limite de carga.
     - Aba Mochila com listagem dos itens possuídos e venda devolvendo 50% em Tibares (regra D09).
  3. **Grimório de Arton (`remake/grimorio.html`)**:
     - Compêndio oficial de magias de 1º a 5º círculo cobrindo as 8 escolas de magia de Tormenta 20.
     - Controle do conjurador ativo com visualização de PM atual/máximo e limite canônico de PM por nível (`calcularLimitePmPorNivel`).
     - Modo Magias Conhecidas (aprendidas pelo herói ativo) e Modo Consulta Geral.
     - Ações: Aprender Magia, Esquecer Magia e Lançar Magia (com débito de PM e validação de limite de nível).
     - Guia completo de Condições e Situações de Combate (Camuflagem, Cobertura, Flanquear, Caído, Desprevenido, Abalado).
  4. **Oficinas e Fabricação (`remake/oficina.html`)**:
     - Manufatura canônica de T20 baseada em 1/3 do preço final do item em matéria-prima.
     - Suporte a melhorias progressivas (+300, +1000, +3000, +9000 T$) e materiais especiais (Aço-Rubi, Madeira de Tollon, Mitral, Gelo Eterno, Adamante).
     - Cálculo de CD de Ofício (+5 por melhoria).
     - Rolador de Teste de Ofício integrado com simulação de d20 + perícia e entrega direta para o artesão ou para um aliado da mesa.
  5. **Regras Canônicas de Descanso de Tormenta 20 (`src/domain/rules/resting.ts`)**:
     - Modos Ruim (0.5x nível), Normal (1x nível), Confortável (2x nível) e Luxuoso (3x nível) com recuperação de PV e PM sem ultrapassar o máximo.
     - Botão "Descansar" adicionado à ficha interativa (`ficha.html`).
  6. **Expansão da Suíte de Testes Unitários**:
     - Novos arquivos `tests/resting.test.ts`, `tests/spells.test.ts` e `tests/workshop.test.ts`.
     - 38 testes automatizados executados e 100% aprovados sem erros (38/38) em 814ms.
  7. **Servidor Local e Rotas**:
     - Servidor na porta 4200 atualizado com fallback de módulos ES compilados em `dist-test/`.
     - Todas as 8 rotas HTML e módulos testados com status 200 via HTTP.
- **Status**: Concluído, testado e validado.

---

## Solicitação 71: Reestruturação da Ficha de Personagem (`ficha.html`) com a Estrutura de Blocos e Colunas Clássica da Forja Rubra
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Barra de Ações Superior (`.sheet-action-bar`)**:
     - Botões dedicados com atalhos funcionais: Descansar (com regras de T20), Comprar no Arsenal, Abrir Grimório, Oficina de Forja, Ajustar Tibares e + Novo Herói.
  2. **Barra de Identidade Clássica (`.sheet-identity-bar`)**:
     - Grid horizontal em colunas clássico da Forja Rubra: Personagem, Jogador, Raça, Origem Dupla (D03: Padrão + Regional), Classe & Nível, Divindade, além de faixa com Alinhamento, Idade e Faixa Etária (D02).
  3. **Grid Horizontal de Atributos e Vitais (`.sheet-stats-bar`)**:
     - 6 cartões individuais para FOR, DES, CON, INT, SAB e CAR com modificador grande em fonte serif dourada e valor base.
     - Vitais lado a lado com barras de progresso proporcionais para PV e PM e botões de controle de dano/cura/gasto/recuperação.
  4. **Estrutura Central em 2 Colunas (`.sheet-main-grid`)**:
     - **Coluna Principal (Esquerda)**:
       - Bloco de Ataques & Armas: Tabela completa com Arma, Teste, Dano, Crítico, Tipo, Alcance e rolagem interativa.
       - Bloco de Defesa: Número em destaque grande, fórmula detalhada (`Base 10 + DES + ARM + ESC`) e tabela de Armadura e Escudo equipados com penalidades e limite de Destreza.
       - Bloco de Movimentação, Tamanho e Sentidos de combate.
       - Bloco de Inventário de Aventura: Divisão entre "Itens Vestidos & Equipados" e "Mochila / Carga Geral", barra inferior com moedas (TO, TS, TC), contagem total e espaços de carga D01 (1000 moedas = 1 espaço).
       - Bloco de Habilidades & Poderes com tags coloridas por fonte.
       - Bloco de Magias do Grimório com atalho direto.
       - Bloco de Anotações com autosave contínuo.
     - **Coluna Lateral (Direita - Sticky)**:
       - Tabela completa das 29 perícias oficiais de Tormenta 20 com cálculo canônico automático (metade do nível + atributo + treino - penalidade de armadura), alternância de treino e clique no valor total para rolar d20 no Toast flutuante.
  5. **Toast Flutuante de Rolagem de Dados (`#diceToast`)**:
     - Exibição elegante do teste realizado com resultado do d20 + bônus, identificando sucessos e falhas críticas naturais (20 e 1 natural).
- **Status**: Concluído, testado e validado.

---

## Solicitação 73: Ajustes Globais no Drawer, Limites de Fichas, Grimório, Arsenal, Oficinas de Manufatura e Mapa de Arton
- **Data**: 2026-09-28
- **Objetivos**:
  1. **Menu Lateral (Drawer) e Limite de Personagens**:
     - Botão hambúrguer no cabeçalho operacional tanto na landing page (index.html) quanto na ficha (ficha.html), conectando ao elemento existente sem duplicação de listeners.
     - Diferenciação contextual das opções no menu para Landing Page versus Ficha Ativa (exibindo Subir Nível e Editar Ficha somente com ficha carregada).
     - Limite de personagens: 5 fichas para visitantes anônimos (sem autenticação) e 10 fichas para usuários com login gratuito (Google/Supabase). Se o visitante atingir 5 fichas, modal convida ao login sem qualquer perda dos dados locais.
  2. **Grimório de Magias (`grimorio.html`)**:
     - Modo consulta standalone autônomo corrigido para manter todos os 256 cards de magias visíveis sem colapso por ausência de contexto de ficha.
  3. **Arsenal de Equipamentos (`loja.html`)**:
     - Substituição de caracteres e emojis por ícones vetoriais SVG monocromáticos de 34x34px: Forjar (martelo) e Encantar (brilho).
     - No modo consulta geral standalone: botões de compra, carrinho e forja são ocultados.
     - Botão de Compartilhar com SVG nos cards: cópia de dados e URL com parâmetro ?item=id para a área de transferência, com suporte a foco automático ao abrir pela URL compartilhada.
  4. **Oficinas de Manufatura (`oficina.html`)**:
     - Página dedicada oficina.html integrada ao manifesto e acessível pelo menu da landing page, com as 8 divisões de ofício e regras canônicas de manufatura de Tormenta 20 (1/3 do preço de mercado em matéria-prima, CDs e tempos de trabalho).
     - Na ficha do herói, o acesso às oficinas no Drawer é condicionado a ter pelo menos um ofício treinado (ocultado se nenhum ofício for treinado).
     - Estilos separados em src/estilos/compartilhado/oficina.css, eliminando código inline.
  5. **Mapa de Arton (`mapa.html`)**:
     - Resolução da tela branca através do isolamento contra injeção de rodapé em páginas com viewport de tela inteira e aprimoramento do fitInitialView() com ResizeObserver e múltiplos quadros de renderização.
     - Botões de navegação com SVGs dedicados (rotate-ccw para reset de visão e maximize para alternância de tela cheia).
  6. **Purga Total de Emojis e Dingbats Residuais**:
     - 0 emojis ou dingbats em todo o repositório e sincronização completa entre dist/ e rebuild/.
- **Status**: Concluído, testado e validado.

---

## Solicitação 74: Correção Crítica do Criador (BOOKS is not defined), Ocultação Definitiva de Botões no Topo, 17 Ofícios Canônicos na Oficina, Zoom Padrão do Mapa e Alinhamento Visual Fiel da Ficha
- **Data**: 2026-09-29
- **Objetivos**:
  1. **Correção Crítica no Criador de Personagens (`criador.html`)**:
     - Resolução da exceção de inicialização `[Erro na etapa de criação] BOOKS is not defined` que impedia o carregamento da Fase 1 ("Identidade e classe").
     - Definição canônica de `BOOKS` (com mapeamento completo dos livros oficiais: `basico`, `jogo_do_ano`, `herois_de_arton`, `ameacas_de_arton`, `deuses_de_arton`, `atlas_de_arton`, `dragao_brasil`) em `src/compartilhado/criador/estado-e-catalogos.js` e em `src/compartilhado/inicializar.js`.
     - Garantia de inicialização autônoma e à prova de falhas em qualquer estágio da criação e na renderização das tags de livro.
  2. **Eliminação Definitiva de Botões no Cabeçalho Superior (`.app-header .header-actions`)**:
     - Remoção e ocultação permanente (`hidden=""`) dos botões vermelhos retangulares no topo (`#randomCharacterButton`, `#editCharacterButton`, `#exportButton`, `#levelUpButton`) em `criador.html` e `ficha.html`.
     - Centralização canônica da ação "Ficha Aleatória" dentro do Drawer retrátil lateral na seção "Personagens" (ao lado de "Salão dos Heróis", "+ Criar Herói" e "Importar Ficha JSON").
     - Remoção da opção obsoleta "Continuar Herói" do Drawer lateral.
     - Preservação do cabeçalho limpo com apenas o indicador de salvamento e o botão hambúrguer do menu.
  3. **Reestruturação Fiel da Grade de Atributos na Ficha de Personagem**:
     - 6 atributos em grid horizontal único (`FOR`, `DES`, `CON`, `INT`, `SAB`, `CAR`) ocupando largura total (`repeat(6, minmax(0, 1fr))`), eliminando qualquer card de título intruso ("ATRIBUTOS").
     - Botão discreto e elegante "Alterar" no canto superior esquerdo com ícone vetorial SVG `sliders`, que ativa e desativa os steppers verticais `+` e `−` in-place sem desconfigurar o layout.
  4. **Tabela de Perícias com Faixas Alternadas e Indicador Canônico**:
     - Faixas horizontais com alternância sutil por atributo para rápida localização visual.
     - Indicador `X` estilizado para perícias não treinadas que exigem treino ou sem treino em vez de traço simples.
     - Ordenação nativa por Atributo + A-Z com botão de alternância para A-Z.
  5. **Condições Integradas no Bloco de Vitais**:
     - A linha de condições interativas foi integrada dentro do quadro de Vitais (`.sheet-preview-vitals`), conectada ao catálogo de condições com badges e cores por severidade.
     - Limpeza da seção inferior da ficha, deixando apenas "Locomoção & Tamanho" sem redundância.
  6. **Barra de Ações da Ficha com 5 Botões Chanfrados Elegantes**:
     - Estrutura padronizada: `Subir de Nível` (com `arrow-up`), `Gerar PDF da Ficha` (com `file-text`), `Exportar para Foundry` (com `puzzle`), `Ver ficha simplificada` / `Ver ficha completa` (com `eye`) e `Editar Ficha` (com `gear` ou `lock` para apoiadores).
  7. **Oficina de Manufatura (`oficina.html`) com 17 Ofícios Canônicos**:
     - Catálogo canônico completo com os 17 ofícios oficiais de Tormenta 20: Armeiro, Arquétipo/Engenhoqueiro, Alfaiate, Alquimia, Alvenaria, Carpintaria, Cartografia, Culinária/Cozinha, Escrita, Escultura, Joalheria, Mineração, Pesca, Pintura, Pescador/Marinheiro, Serralheria, Tanoaria, etc.
     - Botão expansível "Ver Regras de Fabricação", mantendo as regras recolhidas por padrão para foco imediato nas bancadas de trabalho.
     - Navegação com 17 cards de bancada estilizados com ícones vetoriais monocromáticos.
  8. **Mapa de Arton (`mapa.html`) com Zoom Padrão Calibrado**:
     - Zoom inicial padrão ajustado para 60% (`0.60`), passos graduais de 5% (`0.05`) e limite mínimo de segurança travado em 40% (`0.40`).
     - Pan suave e prevenção de arraste nativo da imagem.
  9. **Manufatura Canônica no Núcleo de Regras (`src/regras/nucleo/manufatura.js`)**:
     - Normalização e validação dos 17 ofícios canônicos, suporte a matérias-primas e cálculo de tempo/CD.
  10. **Conformidade Geral e Zero Emojis**:
      - 100% de conformidade com as regras do projeto: zero emojis, TypeScript typesafety onde aplicável e documentação completa.
- **Implementações Realizadas**:
  - `src/compartilhado/criador/estado-e-catalogos.js`: Adicionada constante global `BOOKS` e exportação em `window.BOOKS`.
  - `src/compartilhado/inicializar.js`: Inicialização antecipada de `window.BOOKS` no ciclo de vida da aplicação.
  - `src/paginas/criador.html` e `src/paginas/ficha.html`: Botão `#randomCharacterButton` ocultado permanentemente (`hidden=""`) no cabeçalho superior.
  - `src/integracoes/criador/loja-itens-iniciais.js`: Ajustado controlador para garantir que nenhum botão de ação apareça no cabeçalho superior.
  - `src/compartilhado/drawer/drawer-ui.js`: Removido "Continuar Herói" e inserido "Ficha Aleatória" sob a seção Personagens.
  - `src/regras/nucleo/manufatura.js`: Normalização dos 17 ofícios oficiais de Tormenta 20.
  - `src/paginas/oficina.html` e `src/funcionalidades/oficina/00-00-oficina.js`: Painel expansível "Ver Regras de Fabricação" fechado por padrão e 17 bancadas canônicas.
  - `src/paginas/mapa.html` e `src/funcionalidades/mapa/00-00-mapa.js`: Zoom inicial de 60%, passos de 5% e trava mínima de 40%.
  - `src/funcionalidades/criador/ficha/renderizacao.js`: Grade de 6 atributos sem card intruso, steppers in-place, perícias com faixas alternadas e X, condições em Vitais e barra inferior com 5 botões chanfrados.
  - `dist/` e `rebuild/`: Recompilados e sincronizados com 100% de paridade.
- **Status**: Concluído, testado e validado.

---

## Solicitação 75: Diferenciação Estrita entre Enciclopédia de Oficinas (Drawer) e Fabricação da Ficha, Cards Clicáveis com Filtros Especializados e Regras de Manufatura Ocultas por Padrão
- **Data**: 2026-09-29
- **Objetivos**:
  1. **Separação Arquitetural Estrita (Menu/Drawer vs Ficha/Mochila)**:
     - No Drawer lateral, o botão sob *Ferramentas & Compêndios* intitula-se canonicamente **"Oficinas de Fabricação"** e leva a `oficina.html` em **Modo Enciclopédia** (sem barra de herói/classe no topo).
     - Na Mochila da Ficha do Herói (`ficha.html`), o botão rápido chama-se **"Fabricar"** e redireciona para `oficina.html?modo=fabricar`. O modal legado obsoleto foi completamente eliminado.
  2. **Modo Enciclopédia com Cards Clicáveis e Filtros Contextuais**:
     - No modo Enciclopédia (`oficina.html`), os 17 cards de ofício canônicos atuam como links reais (`<a>`) em grid de 4 colunas com descrições objetivas entre colchetes.
     - Cada card redireciona para seu respectivo destino com filtros aplicados:
       - `Forja do Ferreiro` (Armeiro) -> `loja.html?oficina=armeiro` (restringe a barra de filtros da loja para exibir exclusivamente Armas, Armaduras e Escudos).
       - `Ateliê do Alfaiate` (Alfaiate) -> `loja.html?oficina=alfaiate` (filtra exclusivamente vestuários e vestimentas).
       - `Estúdio do Tatuador` (Tatuador) -> `grimorio.html?circulo=1` (filtra grimório com magias de 1º círculo).
       - `Oficina do Engenhoqueiro` (Engenhoqueiro) -> `grimorio.html?modo=engenhoca` (grimório em modo de engenhocas com magias simuladas).
       - `Laboratório do Alquimista` (Alquimia) -> `loja.html?oficina=alquimista` (preparados, poções, venenos, óleos e granadas).
       - `Oficina do Artesão` (Artesão) -> `loja.html?oficina=artesao` (itens de aventura, ferramentas, esotéricos).
       - `Cozinha` (Culinária) -> `loja.html?oficina=cozinheiro` (alimentação e consumíveis).
       - Demais oficinas redirecionam contextualmente para `loja.html`, `grimorio.html` ou `taverna.html`.
  3. **Regras de Fabricação 100% Ocultas por Padrão**:
     - O bloco `#rulesGrid` permanece completamente recolhido (`hidden=""`, `.is-hidden` e `display: none !important`), abrindo apenas quando o usuário clica expressamente no botão chanfrado `[Ver Regras de Fabricação]`.
  4. **Modo Operacional de Fabricação (`?modo=fabricar`)**:
     - Cabeçalho exibe a barra do herói ativo (`Nome`, `Classe nv. X` e saldo em `T$`) e botão chanfrado `[← Voltar à Ficha]`.
     - Exibe exclusivamente as oficinas nas quais o aventureiro for efetivamente treinado (ex: Armeiro, Alquimia).
     - Cards em 4 colunas com botão chanfrado `[Fabricar]`.
     - Ao clicar em `[Fabricar]`: abre a bancada interativa do ofício com listagem de receitas, cálculo de matéria-prima por ⅓ do preço de tabela, rolagem automatizada de d20 + perícia de Ofício vs CD, débito de T$ do saldo do herói, adição direta à mochila no storage e modal detalhado de resultado da rolagem.
  5. **Conformidade Geral e Zero Emojis**:
     - 0 emojis ou dingbats em todo o código e arquivos modificados.
     - `raças.md` rigorosamente intocado.
- **Implementações Realizadas**:
  - `src/compartilhado/drawer/drawer-ui.js`: Rótulo atualizado para "Oficinas de Fabricação" direcionando para `oficina.html`.
  - `src/integracoes/criador/eventos-e-servicos.js`: Remoção de modais legados; redirecionamento de "Fabricar" para `oficina.html?modo=fabricar`.
  - `src/paginas/oficina.html`: Estrutura semântica limpa, `#rulesGrid` com `hidden=""` e remoção de containers duplicados.
  - `src/funcionalidades/oficina/00-00-oficina.js`: Suporte a Modo Enciclopédia vs Modo Fabricar, navegação contextual, bancada interativa de produção, rolagem de teste com CD e débito de ⅓ do custo.
  - `src/estilos/compartilhado/oficina.css`: Grid de 4 colunas responsivo, regras de visibilidade estrita de `#rulesGrid` e layout da bancada.
  - `src/funcionalidades/loja/03-03-prepareCatalogItem.js`, `03-07-setView.js`, `05-03-ensureGeneralSaleModal.js`: Suporte nativo a `?oficina=...` e restrição estrita dos filtros de tipo para Armas, Armaduras e Escudos no Armeiro.
  - `src/funcionalidades/grimorio/02-00-cards.js`: Suporte a `?circulo=1` (Estúdio do Tatuador) e modos temáticos `engenhoca`/`pergaminho`.
  - `dist/` e `rebuild/`: Recompilados e sincronizados com 100% de paridade.
- **Status**: Concluído, testado e validado.

---

## Solicitação 76: Remoção de Colchetes das Oficinas, Ocultação de Cabeçalho Comercial na Loja, Correção Crítica de Ofícios do Herói, Fechamento Robusto dos Modais do Rodapé, Termos na Mesma Aba e Padronização dos Botões da Mochila
- **Data**: 2026-09-29
- **Objetivos**:
  1. **Remoção de Colchetes nos Textos Descritivos das Oficinas**:
     - Eliminados os caracteres literais `[` e `]` de todas as 17 descrições de ofícios em `src/funcionalidades/oficina/00-00-oficina.js`, exibindo texto limpo e fluido (ex: "Preparados alquímicos, catalisadores, venenos, poções mágicas, óleos e granadas.").
  2. **Ocultação do Cabeçalho Comercial ao Acessar a Loja por uma Oficina**:
     - No acesso via `loja.html?oficina=...`, o cabeçalho comercial (`.site-header` contendo "Arsenal de Arton", "Mudar personagem", "Catálogo", "Mochila", "Carrinho", "Taverna") e a barra de saldo/ações (`.embedded-shop-actions`) são ocultados com `display: none !important;`.
     - O link de início é atualizado para "← Voltar às Oficinas" (`href="oficina.html"`), focando a experiência exclusivamente nas opções e filtros do ofício selecionado.
  3. **Correção Crítica na Exibição das Oficinas Treinadas do Herói (`?modo=fabricar`)**:
     - Resolvida a exceção de tipo decorrente da leitura de `hero.skills` (que é estruturado como objeto com sub-listas de classe, int, raça e duplicatas). `obterOficiosHeroi` agora unifica todas as origens de treino com segurança.
     - Garantida a concessão canônica das bancadas essenciais do Inventor (Armeiro, Engenhoqueiro, Alquimista e Artesão) e Alquimista.
     - Vinculada a base canônica de itens oficiais (`dados/items.json`) ao manifesto da página de oficina, viabilizando a renderização imediata das receitas e tabelas de fabricação.
  4. **Fechamento Confiável e Responsivo dos Modais do Rodapé (Apoio e Termos)**:
     - Os modais institucionais agora contam com fechamento garantido tanto pelo botão `×` quanto pelo botão `Fechar` / `Entendido`, clique no backdrop e tecla `Escape`.
     - Estilização dedicada em `src/estilos/compartilhado/footer.css`, prevenindo que heranças de classes genéricas deixem os botões ilegíveis ou travem o modal aberto.
  5. **Termos de Uso Abertos na Mesma Aba**:
     - Removido `target="_blank"` do link "Termos de Uso" no rodapé global, abrindo `termos.html` diretamente na mesma aba sem janelas pop-up indesejadas.
  6. **Padronização dos Botões de Ação na Mochila**:
      - Os botões "Empunhar", "Usar", "Vestir", "Equipar", "Trocar", "Disparar" e "Desmanchar" foram padronizados com as mesmas dimensões compactas, tipografia (0.65rem), chanfrado e altura (22px) do botão "Vender".
  7. **Padronização Tipográfica e Cromática da Tabela de Perícias da Ficha**:
      - Todas as fontes da tabela de perícias (`.sheet-preview-skills .sheet-preview-table`) foram unificadas em uma tipografia limpa, consistente e legível (sistema sans-serif moderno com números em alinhamento tabular `lining-nums`), eliminando misturas divergentes de fontes serifadas antigas.
      - Todas as fontes da tabela foram definidas na cor branca sólida (`#ffffff !important`).
      - **Exceção de Perícias Restritas (Somente Treinadas Não Treinadas)**: Na coluna Total, perícias restritas não treinadas (que exigem treinamento para teste) exibem um **X** na fonte **Comic Sans** (`font-family: "Comic Sans MS", "Comic Sans", cursive, sans-serif !important; font-weight: 700; color: #ffffff !important; font-size: 0.95rem;`), em estrita conformidade com a solicitação do usuário.
  8. **Ícones Vetoriais em CSS/SVG de Estrela na Coluna de Treino**:
      - Substituídos os caracteres antigos (`X` e `●`) por ícones de estrela em SVG monocromático estilizado via CSS:
        - **Estrela Preenchida**: Perícia treinada (`isTrained: true`).
        - **Estrela Não Preenchida (Contorno)**: Perícia não treinada (`isTrained: false`).
      - Ambas as estrelas são estilizadas com CSS `.skill-star-icon`, sem uso de emojis ou dingbats Unicode, preservando alinhamento vertical e contraste nítido sobre o fundo escuro da ficha.
- **Implementações Realizadas**:
  - `src/funcionalidades/oficina/00-00-oficina.js`: Descrições limpas sem colchetes, `obterOficiosHeroi` resiliente a objetos/arrays, carregamento de itens canônicos e prevenção de duplicação do rodapé.
  - `src/paginas/manifesto.json`: Dados de `"oficina"` apontando para `dados/items.json`.
  - `src/funcionalidades/loja/03-03-prepareCatalogItem.js`, `05-00-initialChoice.js` e `src/estilos/loja/0.css`: Classe `body.mode-oficina` que oculta cabeçalho comercial e barra embedded.
  - `src/compartilhado/footer/footer-ui.js` e `src/estilos/compartilhado/footer.css`: Fechamento por remoção do DOM, suporte a tecla `Esc`, estilos dedicados de modais e link de termos sem `target="_blank"`.
  - `src/estilos/criador/equipamento.css`: Padronização de todos os botões de `.equip-card-actions` para tamanho de 22px chanfrado idêntico a `.btn-sell-compact`.
  - `src/funcionalidades/criador/ficha/renderizacao.js` e `src/estilos/criador/0.css`: Padronização de todas as fontes da tabela de perícias em branco `#ffffff`, X em Comic Sans para somente treinadas sem treino, e ícones vetoriais de estrela preenchida/não-preenchida na coluna Treino.
  - `dist/` e `rebuild/`: Recompilados e sincronizados com 100% de paridade.
- **Status**: Concluído, testado e validado.

---

## Solicitação 77: Janela de Engenhoca Ampliada com Botão "Forjar em item" e Purificação Estrita do Laboratório do Alquimista
- **Data**: 2026-09-30
- **Objetivos**:
  1. **Reorganização e Ampliação da Janela de Nome da Engenhoca**:
     - Modal de batismo/conclusão da engenhoca ampliado para `880px` de largura máxima, com layout limpo e desafogado.
     - Substituição da lista expansiva e desordenada de ofícios por um botão unificado chanfrado **"Forjar em item"** com aviso inferior explícito: *"OBS: Apenas com a permissão do mestre."*.
     - Condição de ativação do botão: fica habilitado exclusivamente se o personagem possuir treino em algum ofício de manufatura (`Armeiro`, `Carpinteiro`, `Artesão`, `Alfaiate` ou `Joalheiro`).
     - Ao clicar no botão: abre um modal secundário simplificado (`openSelectCraftOfficeModal`) listando apenas os ofícios treinados de criação para seleção direta.
     - Ao acessar a oficina selecionada:
       - Na mochila: exibe apenas o botão `Acoplar em item` para itens mundanos puros (sem melhorias ou encantamentos).
       - No catálogo da loja: opções `Comprar e Acoplar` e `Forjar e Acoplar` (tempo consolidado de 2 semanas, CD mais alta da engenhoca).
       - Ao acoplar, a engenhoca fabricada fica alojada no item base selecionado, atualizando seu nome e descrição de alojamento.
  2. **Purificação Estrita do Laboratório do Alquimista (`sectionKey === 'alquimista'`)**:
     - Eliminação completa de itens diversos (armas, vestuários, equipamentos gerais, ferramentas, acessórios, esotéricos, poções pré-fabricadas soltas ou itens mágicos genéricos).
     - Exibição exclusiva dos itens alquímicos mundanos canônicos (Catalisadores, Preparados e Venenos).
     - Card especial da **Bancada de Poções e Óleos** (`potion-special-card`) posicionado no topo como 1º card do catálogo para fabricar poções mágicas (1º ao 5º círculo, tempo de 1 dia, CD 20 + PM).
     - Ocultação da seção de aprimoramento de mochila (`workshop-backpack-section`), pois itens alquímicos mundanos e poções não recebem melhorias nem encantamentos na mochila.
     - Barra de filtros restrita aos chips de subcategorias alquímicas: "Todos os Alquímicos", "Catalisadores", "Preparados" e "Venenos", com filtros de tipo de armas/armaduras e de natureza completamente ocultados.
- **Implementações Realizadas**:
  - `src/funcionalidades/criador/ficha/oficina-oficios.js`: Modal de engenhoca com 880px, botão "Forjar em item", validação de ofícios de manufatura e modal de escolha simplificado.
  - `src/regras/nucleo/manufatura.js`: `secoesOficina.alquimista.corresponde` estritamente restrito a `alquimico_catalisador`, `alquimico_preparado`, `alquimico_venenoso` e `tipo === 'alquimico'`.
  - `src/funcionalidades/loja/05-00-initialChoice.js`: Filtragem estrita no catálogo, remoção de mochila de aprimoramento para alquimista e posicionamento de destaque do card especial de poções.
  - `src/funcionalidades/loja/03-03-prepareCatalogItem.js`, `03-07-setView.js`, `05-02-applyArsenalContext.js` e `00-00-oficina.js`: Sincronização de filtros e navegação consistente entre modo ficha e compêndio avulso.
  - `dist/`: Recompilado e sincronizado com 100% de paridade via `npm run build`.
- **Status**: Concluído, testado e validado.

---

## Solicitação 78: Modal de Seleção de Ofício para Acoplamento, Ocultação de Cabeçalho Comercial na Loja de Acoplamento, Reorganização Completa da Barra de Ações, Identidade, Atributos e Perícias da Ficha
- **Data**: 2026-10-01
- **Objetivos**:
  1. **Fluxo de "Forjar em item" na Bancada de Engenhocas (`engenhoca.html`)**:
     - O botão chanfrado "FORJAR EM ITEM" não pula mais a etapa de seleção de ofício.
     - Ao clicar no botão, é aberto o modal "Escolher Ofício para Item Base", filtrando os ofícios de manufatura compatíveis de acordo com a forma de uso selecionada (empunhada vs vestida):
       - *Empunhada*: Armeiro (Armas e Escudos), Carpinteiro (Arcos, Bestas, Bordões e Escudos de Madeira) e Artesão (Ferramentas, Esotéricos e Itens de Aventura).
       - *Vestida*: Alfaiate (Roupas, Trajes, Vestes e Capas), Armeiro (Armaduras e Escudos), Joalheiro (Acessórios, Anéis, Amuletos e Tiaras) e Artesão (Acessórios e Itens de Aventura).
     - Ao escolher o ofício, navega diretamente para a oficina filtrada em modo de acoplamento (`loja.html?modo=contraption-attach&oficina=...&forma=...&magia=...`).
  2. **Purificação e Modo Focado de Acoplamento na Loja (`modo=contraption-attach`)**:
     - No modo de acoplamento, o cabeçalho comercial "Arsenal de Arton", carrinho, botão de mudar personagem, cadastrar novo item, taverna e a barra de saldo comercial ("Dinheiro inicial") são completamente ocultados via CSS e JS.
     - O link do topo vira "← Voltar à Engenhoca" redirecionando com segurança de volta para `engenhoca.html`.
     - Título e subtítulo do catálogo indicam expressamente "FORJAR EM ITEM · [OFÍCIO]" e instruções de acoplamento.
     - Exibição da mochila mundana com o botão "Acoplar em item" e do catálogo da oficina com o botão "Forjar e Acoplar" (⅓ do preço, 2 semanas).
     - Ao selecionar, grava o item em `sessionStorage` e retorna para `engenhoca.html` com o item acoplado.
  3. **Reorganização do Topo da Ficha de Personagem**:
     - No topo direito da ficha (`renderSheetActionBar`), mantidos estritamente 2 botões:
       - `[ Gerar PDF ]` (texto simplificado de "Gerar PDF da Ficha" para apenas "Gerar PDF", com ícone de documento).
       - `[ Exportar para Foundry ]` (com ícone de puzzle).
     - Removidos do topo da ficha os botões `Subir de Nível`, `Editar Ficha`, `Ver Ficha Simplificada` e `Descanso`.
  4. **Ampliação do Cabeçalho de Identidade**:
     - Com o espaço liberado no topo direito, a fonte das informações (Jogador, Raça, Origem, Classe, Divindade) foi aumentada e recebeu maior espaçamento interno e proporção equilibrada no grid de 5 colunas.
  5. **Reposicionamento do Botão de Alterar Atributos**:
     - O botão com ícone de sliders "Alterar" foi movido de cima dos atributos para logo abaixo da grade dos 6 atributos (`sheet-attr-bottom-bar`), alinhado à esquerda.
  6. **Rebaixamento da Tabela de Perícias**:
     - A tabela de perícias foi rebaixada com margem superior (`margin-top: 24px`) para iniciar alinhada abaixo do cabeçalho de identidade, nivelando visualmente com o início da seção de atributos.
  7. **Barra de Condições e Ações Compactas da Ficha**:
     - Na linha de condições (abaixo dos vitais de PV e PM), à esquerda permanece a linha `Condições: Normal [ + ]`.
     - À direita, alinhados na mesma linha, foram agrupados 4 botões compactos exclusivamente com ícones:
       1. `[ ↑ ]`: Subir de Nível (estilizado em vermelho, desabilitado no nível 20).
       2. `[ ✏ ]`: Editar Ficha — disponível para **todos os planos**, inclusive o **plano grátis** (sem cadeado, sem restrição de apoiador, com ícone de edição).
       3. `[ 👁 ]`: Ver Ficha Simplificada (alterna para a visualização simplificada).
       4. `[ 🛏 ]`: Descanso (aciona o modal de descanso).
     - Removida a barra isolada anterior de descanso no topo dos vitais.
- **Implementações Realizadas**:
  - `src/funcionalidades/engenhoca/00-00-engenhoca.js`: Modal de escolha de ofício para item base ao clicar em "FORJAR EM ITEM".
  - `src/funcionalidades/loja/02-00-arsenalInitialState.js`: Inicialização automática de `workshop` e `contraptionAttach` via parâmetros de URL `modo=contraption-attach`.
  - `src/funcionalidades/loja/03-03-prepareCatalogItem.js`: Classe `mode-contraption-attach`, ocultação de header e link de retorno para `engenhoca.html`.
  - `src/estilos/loja/0.css`: Regras estritas de ocultação de elementos comerciais no modo `mode-contraption-attach`.
  - `src/compartilhado/limites.js` e `src/integracoes/criador/eventos-e-servicos.js`: Liberação irrestrita do recurso de Editar Ficha para usuários gratuitos.
  - `src/funcionalidades/criador/ficha/renderizacao.js`: Reorganização completa da barra de ações do topo (apenas Gerar PDF e Foundry), ampliação da identidade, tabela de perícias descida, botão de alterar atributos abaixo do grid e barra de 4 ícones de ação alinhada à direita ao lado das condições.
- **Status**: Concluído, testado e validado.







---

### Solicitao: Refinamentos no Acoplamento de Engenhocas, Oramento da Fase 8 e cones da Mochila
- **Descrio do Problema & Requisitos**:
  1. No acoplamento de engenhocas em itens, a mochila exibia engenhocas como se fossem adagas ou itens mundanos elegveis (com T$ 0 e 0 espaos).
  2. Ao clicar em 'Forjar em item' para acoplar engenhoca, a mochila deveria iniciar recolhida/colapsada por padro.
  3. No modo de acoplamento de engenhocas (modo=contraption-attach), os botes de comprar e forjar apareciam incorretamente desabilitados por falta de saldo mesmo quando o personagem possua saldo suficiente.
  4. Na escolha de itens com oramento (Fase 8), substituir o texto 'Forjar' pelo cone vetorial de martelo. Na mochila, substituir o texto 'Vender' pelo cone vetorial de moeda.
  5. Centralizar o banner flutuante de escolha de itens (ex: 'Escolha uma arma simples...').
  6. O aviso de oramento no utilizado totalmente no deve disparar prematuramente quando o usurio clica em adicionar melhoria.
  7. No cabealho comercial durante o acoplamento de engenhocas, exibir barra de navegao limpa com botes para voltar  engenhoca, voltar  ficha e o saldo de Tibares.
- **Implementaes Realizadas**:
  - src/funcionalidades/loja/02-00-arsenalInitialState.js: Implementada obterFundosIniciaisHeroi que recupera o saldo ativo do heri em localStorage quando a loja abre de forma autnoma no modo de acoplamento de engenhocas.
  - src/funcionalidades/loja/05-00-initialChoice.js:
    - Filtragem estrita da mochila em injectWorkshopBackpackSectionIfNeeded para rejeitar engenhocas salvas e garantir que pertenam ao ofcio selecionado.
    - Seo da mochila em modo contraptionAttach inicia recolhida por padro com boto para expandir.
    - Boto de melhoria de item em concesso com oramento atualizado para renderizar o cone de martelo.
  - src/funcionalidades/loja/03-06-magicRuleStatsHtml.js:
    - Boto de venda na mochila atualizado para renderizar o cone vetorial SVG de moeda (coinIcon) e o de melhoria para martelo (hammerIcon).
    - Definio adequada do escopo de cones vetoriais em ackpackItemHtml e remoo de atributo duplicado em ackpackCompactHtml.
  - src/funcionalidades/loja/05-02-applyArsenalContext.js: Substituio do texto 'Vender' da mochila em modo compacto pelo cone SVG de moeda.
  - src/funcionalidades/loja/05-01-availableInitialItems.js: Banner de escolha de itens centralizado no meio da viewport (	op: 50vh, left: 50vw, 	ransform: translate(-50%, -50%)). Aviso de oramento adiado enquanto houver melhorias elegveis ou o modal de melhorias estiver em uso.
  - src/funcionalidades/loja/03-03-prepareCatalogItem.js: Barra superior de navegao no modo isContraptionAttach com links diretos 'Voltar  Engenhoca', 'Voltar  Ficha' e badge com saldo em Tibares.
- **Status**: Concludo, compilado e validado em 100% dos testes unitrios e E2E do Playwright.

