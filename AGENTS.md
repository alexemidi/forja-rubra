# Desenvolvimento da Forja Rubra Unificada (Tormenta 20)

## 1. Regras Globais de Conteúdo e Apresentação

- **Fidelidade Canônica:** Seguir estritamente as regras dos livros de Tormenta 20. Preservar os textos canônicos: não reescrever, resumir ou modificar descrições oficiais sem autorização explícita. Rótulos e resumos calculados da interface devem ser diferenciados desses textos.
- **Design System Único (Forja Rubra):** Manter o visual minimalista, escuro e temático em todas as páginas (`index`, `criador`, `ficha`, `loja`, `taverna`, `guilda`, `estabulo`, `grimorio`, `distincoes`, `recompensas`, `oficina`, `engenhoca`, `mapa`), importando obrigatoriamente `src/estilos/compartilhado/tokens.css` e `src/estilos/compartilhado/componentes.css`.
- **Paleta Estrita:**
  - Fundo principal (`--bg` / `--bg2`): `#090708` / `#100b0d`
  - Superfícies e cards (`--panel` / `--panel2`): `#110d0f` / `#181114`
  - Bordas (`--line`): `#4a252a`
  - Destaque Rubro (`--red` / `--red2`): `#c51f2c` / `#ea3948`
  - Destaque Dourado (`--gold` / `--gold2`): `#e9ad59` / `#f5c879`
  - Texto Primário / Secundário (`--cream` / `--muted`): `#f5eee6` / `#c9b2aa`
- **Proibições Visuais Absolutas:**
  - **Sem Emojis:** Proibido usar emojis em qualquer arquivo de `src/`. Usar exclusivamente ícones vetoriais SVG discretos (`src/components/ui/icons.ts`).
  - **Sem Cores Destoantes:** Proibido criar quadros verdes, azuis, roxos, rosas ou neon para pré-requisitos concluídos, treinamentos, familiares elementais ou fundamentalistas. Pré-requisitos e notas devem usar a mesma cor e fonte do texto, apenas com o rótulo em negrito (`<strong>Pré-requisito:</strong>`).
  - **Sem Redundância:** Proibido repetir contadores, botões de fechar duplicados no rodapé quando já existem no cabeçalho, ou textos explicativos redundantes.
  - **Modais Compactos:** Priorizar layouts que caibam na tela sem barra de rolagem vertical lateral, salvo quando houver listagens extensas inevitáveis.
  - **Sem CSS Inline / Runtime:** Novos estilos devem residir em `src/estilos/` utilizando classes reutilizáveis, nunca injetados via `document.createElement('style')` ou atributos `style="..."` extensos.

## 2. Travas de Segurança e Autorização

- **Ficha Digital Protegida:** É terminantemente proibido alterar a lógica estrutural de cálculo da Ficha Digital sem dupla confirmação expressa do usuário utilizando a frase-passe exata: `Eu autorizo a modificação do código da ficha.`
- **Arquivo `raças.md`:** Nunca alterar `raças.md` sem confirmação dupla do usuário.
- **Preservação de Dados:** Trabalhar somente nesta pasta. Editar `src` e `dados`; nunca corrigir `dist` ou `preservacao` manualmente. Preservar campos desconhecidos, identificadores, fichas antigas e o comportamento confirmado por testes.

## 3. Arquitetura, Código Limpo e Vibe Coding

- **TypeScript Estrito:** Toda a base de código em `src/`, novos módulos, contratos e testes devem utilizar TypeScript (`.ts`). Preservar `npm run typecheck` com zero erros antes de cada entrega. Não reintroduzir arquivos `.js` ou `.mjs` em `src/`.
- **Módulos Puros e Pontos Únicos:** Novas regras devem ficar em módulos puros (`src/lib/t20/` ou `src/nucleo/`). Não introduzir redefinições concorrentes de `renderStage` ou `progressionStats`.
- **Código Enxuto:** Evitar comentários óbvios ou código morto; o pipeline de build (`ferramentas/build.cjs`) remove comentários automaticamente nos pacotes de `dist/js/`.
- **Verificação Obrigatória:** Cada regressão corrigida precisa de teste do comportamento afetado. Executar `npm run typecheck`, `npm run build` e `npm test` antes de declarar qualquer entrega concluída. Manter a nuvem desativada nos testes.
