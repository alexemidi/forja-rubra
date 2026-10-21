# Forja Rubra unificada

Projeto independente integrado a partir das fontes da raiz e da versão ativa do rebuild, preservadas em `preservacao/` com hashes SHA-256. As versões antigas não são destinos de compilação.

## Executar

Requer Node.js 22 ou superior. Abra o terminal nesta pasta:

```powershell
npm ci
npm run dev
```

Abra **http://127.0.0.1:4300/**. A nuvem está desativada por padrão nesta versão de validação. Não existe conexão automática ao Supabase de produção.

## Arquivos editáveis

- `src/`: fontes da aplicação e estilos.
- `dados/`: catálogos canônicos.
- `testes/`: verificações automatizadas.
- `dist/versoes/`: builds gerados. Não editar.
- `preservacao/`: cópias verificadas da raiz e do rebuild, além dos diretórios antigos movidos para `arquivos-legados/`. Não editar.

O build publica uma versão completa e só então troca `dist/atual.json`. Versões anteriores são mantidas para recuperação. O servidor lê essa referência ao iniciar; reinicie-o após gerar um novo build. Para hospedagem estática, publique somente o conteúdo do diretório indicado por `atual.json`.

## Testar

```powershell
npx playwright install chromium
npm run check
```

`check` executa checagem estrita de tipos com TypeScript (`npm run typecheck`), compilação (`npm run build`), suíte unificada de testes com suporte nativo a TypeScript (`npm test`) e testes em Chromium (`npm run test:e2e`). Todo o código-fonte em `src/` opera em 100% TypeScript com tipagem estrita nos módulos do domínio.

## Transferir fichas do ambiente antigo

O armazenamento do navegador pertence ao endereço e à porta. A porta 4300 começa isolada das portas antigas.

1. Pare o servidor antigo para liberar sua porta, sem apagar arquivos ou limpar o navegador.
2. Nesta pasta, execute `npm run backup:rebuild` para a porta 4200 ou `npm run backup:raiz` para a porta 4174.
3. Abra **somente `/backup.html`** no mesmo hostname usado anteriormente. Por exemplo, se usava `http://localhost:4200`, abra `http://localhost:4200/backup.html`; `localhost` e `127.0.0.1` têm armazenamentos distintos.
4. Baixe o backup completo e guarde o arquivo. A tela apenas lê os dados ao exportar.
5. Pare esse servidor, execute `npm start` e abra `http://127.0.0.1:4300/backup.html`.
6. Escolha o arquivo, confira a prévia e importe. Antes da importação será baixado um backup do destino.

As entradas presentes no arquivo substituem as correspondentes no destino; as demais permanecem. Reimportar o mesmo arquivo não acrescenta duplicatas. Campos desconhecidos são preservados. Credenciais e sessões de autenticação não são transferidas. Se o navegador impedir o download, permita-o e guarde o backup antes de prosseguir.

## Situação da integração

O detalhamento do que foi entregue e das etapas restantes está em [docs/estado-integracao.md](docs/estado-integracao.md).

Os 25 bundles ativos do rebuild eram iguais às respectivas fontes na data da preservação. Portanto, suas últimas alterações ativas foram incorporadas ao copiar essas fontes, inclusive a seleção de ofício nas engenhocas.

- Navegação consolidada em funções nomeadas, sem substituir repetidamente `renderStage`.
- Inicializador da ficha integrado à mesma navegação, sem forçar conclusão durante a subida de nível. A primeira renderização ocorre após carregar todos os módulos.
- Estatísticas consolidadas em uma composição explícita, sem substituir `progressionStats`.
- Normalização de vitais extraída para módulo ES puro e tipado por JSDoc.
- Estrutura dos cards de mochila compartilhada entre ficha e loja em `src/ui/card-inventario.mjs`, mantendo os adaptadores de regras e ações de cada tela.
- Dano e cura usam operação pura; descanso salva a ficha e sua entrada na lista de personagens.
- Ícones exclusivos `hammer` e `share` incorporados das cópias auxiliares.
- CSS estático da ficha extraído do JavaScript e aguardado na inicialização.
- Diálogos e navegação usam templates explícitos em `src/ui/templates`; o build não extrai mais elementos da página do criador. A ficha finalizada só monta os controles de criação ao entrar na progressão.
- Backup com validação, importação idempotente e reversão em falha de armazenamento.
- Falha de execução interrompe a inicialização, sem anunciar a página como pronta; fichas inválidas permanecem no armazenamento e têm acesso à tela de backup.
- Build isolado e versionado; manifesto de diferenças em `docs/matriz-integracao.json`.

### Arquitetura TypeScript e Modularização (`CodeGuideline.md`)

O núcleo de domínio, os componentes visuais padronizados e os módulos de funcionalidades foram migrados para **TypeScript estrito (`strict: true`)** seguindo os contratos de domínio de Tormenta 20 (inspirados no *Fichas de Nimb*) e a estrutura modular documentada em [`CodeGuideline.md`](CodeGuideline.md):

- `src/interfaces/`: contratos e interfaces TypeScript (`attributes.ts`, `vitals.ts`, `equipment.ts`, `companions.ts`, `powers.ts`, `character-sheet.ts`, `market.ts`).
- `src/lib/t20/` e `src/lib/storage/`: regras puras de Tormenta 20 sem DOM (`vitals.ts`, `economy.ts`, `encumbrance.ts`, `mounts.ts`, `distinctions.ts`, `damage-steps.ts`, `golpe-pessoal.ts`, `age.ts`, `creation.ts`, `progression.ts`, `equipment-slots.ts`, `inventory.ts`, `shop-operations.ts`, `random.ts`, `share-code.ts`, `rewards.ts`, `dungeons.ts` e `crafting/` com `workshop-rules.ts` e `contraption-rules.ts`), além de persistência segura, backup e separação de estado de interface.
- `src/components/ui/`: componentes visuais padronizados em TypeScript (`modal.ts` com os 3 modelos canônicos de modal: Transação/Checkout, Confirmação/Notificação e Escolha Rápida; `inventory-card.ts`, `topbar.ts`, `condition-badges.ts` e `damage-reduction.ts`).
- `src/features/`: módulos de funcionalidades por domínio (`creator/powers/phase6-stages.ts`, `creator/state/character-model.ts`, `creator/origins/exclusive-items.ts`, `creator/stats/progression-stats.ts`, `inventory/hands.ts`, `inventory/armor-shield-stats.ts`, `sheet/vitals/adventure-economy.ts`, `shop/cart-checkout.ts`).
- `src/integrations/` e `src/pages/`: exportação tipada de personagem (`export/character-export.ts`) e registro centralizado de páginas (`registry.ts`).
- `src/aplicacao/runtime.ts`: ponto único de composição do runtime compilado por `esbuild` no pipeline de build (`ferramentas/build.cjs`), mantendo re-exports compatíveis em `src/nucleo/*.mjs` e `src/ui/*.mjs` para os consumidores legados.
- `testes/unit/t20-core.test.ts` e `testes/unit/features.test.ts`: suíte de testes unitários em TypeScript executada via `npm run test:ts`.

### Refatoração que ainda precisa continuar

A integração funcional não significa que todo o legado foi convertido. Os adaptadores ainda compartilham estado global; há cálculos e handlers antigos fora do núcleo ES. A ficha ainda carrega os controladores legados de criação, embora sua navegação não seja mais montada na ficha finalizada. Algumas ferramentas seguem em iframe. Os cards de mochila têm estrutura compartilhada, mas a preparação de dados e ações específicas continua nos adaptadores. A separação desses controladores e a separação completa entre estado de domínio e interface permanecem pendentes. Não remover esses adaptadores antes de substituir seus contratos e testar os fluxos correspondentes.

Não houve publicação em produção. As versões antigas saíram da raiz da área de trabalho e foram movidas para `preservacao/arquivos-legados/`, sem exclusão dos arquivos. A raiz agora contém apenas `forja-unificada/` e a pasta oculta `.git`. A pasta `preservacao/referencia-fichas-de-nimb/` guarda separadamente o projeto de referência de terceiros; seu código não integra o runtime da Forja.

### Navegação em modo local

O SDK do Supabase só é solicitado quando `window.__FORJA_ENV__.ENABLE_CLOUD` é `true`; o modo local inicia sem depender desse serviço externo. Loja, Taverna e Grimório integrados preservam seus iframes ao trocar de área; o contexto é atualizado ao reabrir. O pré-carregamento inclui Distinções e Grimório. As ferramentas usam o título Forja Rubra seguido do nome da página e retorno no cabeçalho, à esquerda do menu. A Taverna integrada não replica cabeçalho nem rodapé dentro do iframe. A loja integrada mantém apenas Finalizar compra no rodapé, exibido quando o carrinho contém itens; o iframe publica a contagem pelo canal validado da loja.

### Cálculos por operação

A atualização parcial de equipamento compartilha os cálculos passivos dentro da mesma operação. O consumo de itens agenda a atualização do personagem salvo sem repetir um salvamento completo imediato. Moedas e carga pertencem ao quadro da mochila; parceiros aparecem abaixo da redução de dano, no bloco de Defesa; o estado das condições e seu botão de adicionar ficam junto ao título Condições. O seletor de condições mantém as regras do catálogo e apresenta nomes com ícones em quatro colunas e a descrição selecionada ao lado.

`persistNavigationNow()` preserva o estado salvo sem reconstruir os totais de perícias. Alterações de personagem continuam usando `persistNow()`. `renderStage()` e salvamentos completos compartilham os efeitos passivos durante uma única operação síncrona, pelo adaptador `ForjaCalculo`; o cache é descartado no `finally`. Isso não cria cache persistente entre alterações e não substitui as fórmulas legadas. A substituição completa da navegação de páginas continua pendente.


### Mochilas e equipamento de montarias

O cálculo compartilhado em `src/nucleo/mochilas.mjs` compõe atributo de carga, mochilas e poderes. A mochila comum é vestida sem consumir o limite; a armação é um acessório de mochila sem consumir esse limite. Mochila de aventureiro concede +2 ou +6 com armação, e mochila de carga concede +10. Andarilho Carregado e Organizadinhos participam do cálculo; Bolsões Insanos e Soldado de Infantaria também. Ficha, loja e PDF usam os mesmos bônus.

As entradas de inventário preservam seus identificadores e campos desconhecidos. Equipamento animal usa `mountPartnerId`; conteúdo de alforje usa `carriedByMountId`. Equipamento e carga de uma montaria removida retornam à disponibilidade do herói. Montarias exigem tamanho maior que o personagem, respeitam dois itens vestidos, sela antes de alforje e proibição de armadura pesada para montarias voadoras. Testes de Cavalgar, quedas, ações adicionais e efeitos que dependem de rolagens continuam sendo resolvidos pelo jogador; o controle de guiar confirma o sucesso, sem rolar dados automaticamente. Estas integrações não encerram as demais pendências de refatoração.


### Estábulo e carregamento compartilhado

`estabulo.html` reúne exclusivamente montarias, com catálogo em `dados/montarias.json` extraído do texto fornecido e registro no mesmo contrato de parceiros do herói ativo. Tamanho e patamar recebido são explícitos; receber por campanha não simula uma compra. A ficha e o menu fornecem acesso ao Estábulo.

A inicialização compartilhada controla uma cobertura opaca durante a abertura das páginas. Integrações de iframe apresentam a cobertura quando a espera ultrapassa 180 ms e a retiram ao sinal de prontidão do destino; não há atraso artificial para exibir a animação. Ícones e filtros de condições compartilham a cor de categoria; as descrições oficiais permanecem separadas dos controles de interface.

### Poções da Taverna independente

A escolha de poção fora da ficha usa `ficha.html?comprarPocao=<circulo>` para retomar o Grimório integrado ao herói ativo. O parâmetro é validado, consumido e substituído por `view=grimoire`; recarregar preserva o contexto de compra. Abrir a seleção não debita tibares: a confirmação continua no contrato existente de compra da Taverna. A Taverna embutida continua usando a mensagem `choose-potion-spell` do próprio iframe.

### Marcas de distinção e catálogo da ficha

A ficha carrega `DATA.distinctions`, assim como o criador. A última distinção adquirida fica em `distinctions.selectedId`; sua revogação retira os efeitos calculados. `src/nucleo/marcas-distincoes.mjs` compõe bônus fixos de perícia, substituições de atributo, Defesa da Amazona condicionada à armadura e PM do Cavaleiro Feérico por poder adquirido. O adaptador exclui marcas da inferência textual para não duplicar bônus nem converter efeitos condicionais em permanentes. Poderes continuam disponíveis junto dos poderes de classe.

A automatização de marcas não está completa: concessões que exigem escolher magia, equipamento, mestre dracônico ou parceiro, e efeitos que dependem de alvo/cena precisam de contratos próprios. Seus textos continuam disponíveis nas habilidades; não são aplicados como bônus permanentes.

O cancelamento de nível conserva um retrato completo em `levelUpBefore` até confirmar a conclusão. Cancelar restaura esse retrato mesmo depois de recarregar; fichas antigas sem retrato mantêm o procedimento legado de remoção do último nível. A confirmação ou o cancelamento elimina o retrato transitório.
