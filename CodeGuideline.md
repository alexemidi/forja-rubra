# Code Guideline — Forja Rubra Unificada (Tormenta 20)

## 1. Visão Geral e Mapa de Pastas

Este documento define o padrão arquitetural, visual e de engenharia da **Forja T20**, estruturado para alta performance, manutenção sênior e contexto determinístico em fluxos de *Vibe Coding*.

```text
forja-t20/
  ├── AGENTS.md                  # Regras globais invioláveis, travas de segurança e diretrizes visuais
  ├── CodeGuideline.md           # Mapa arquitetural, Design System e guia de engenharia / Vibe Coding
  ├── dados/                     # Catálogos canônicos JSON de Tormenta 20 (textos oficiais preservados)
  ├── ferramentas/               # Pipeline de build (esbuild + TypeScript sem comentários) e servidor HTTP
  ├── src/
  │   ├── aplicacao/             # Ponto de entrada do runtime global (runtime.ts)
  │   ├── compartilhado/         # Utilitários globais de página (topbar-unificada, drawer, atalhos, tema)
  │   ├── components/ui/         # Fábricas de UI reutilizáveis (modais, cards, ícones SVG, badges)
  │   ├── estilos/               # Design System CSS modular
  │   │   ├── compartilhado/     # tokens.css (paleta Forja Rubra) e componentes.css (cards, botões, chips)
  │   │   ├── criador/           # Estilos do fluxo de criação de personagem (Fases 1 a 10)
  │   │   ├── ficha/             # Estilos da Ficha Digital e modais de progressão/treinamento
  │   │   ├── guilda/            # Estilos da Guilda de Parceiros e Mercenários
  │   │   ├── taverna/           # Estilos da Taverna (Hospedagem, Refeições e Serviços)
  │   │   ├── loja/              # Estilos do Mercado / Arsenal
  │   │   ├── grimorio/          # Estilos do Grimório de Magias
  │   │   ├── distincoes/        # Estilos de Distinções
  │   │   └── recompensas/       # Estilos de Recompensas, Comunidades e Masmorras
  │   ├── features/              # Módulos de domínio em TypeScript (state, rules, checkout, sheet, creator)
  │   ├── funcionalidades/       # Controladores de interface das páginas (criador, ficha, loja, taverna, guilda, etc.)
  │   ├── integrations/          # Integrações externas (Supabase Auth/Cloud, exportação PDF via pdf-lib)
  │   ├── interfaces/            # Contratos e tipos TypeScript canônicos do domínio T20
  │   ├── lib/                   # Funções puras de domínio (t20/ e storage/) sem acesso ao DOM
  │   ├── nucleo/                # Regras centrais unificadas de equipamentos, vitais, economia e validação
  │   ├── pages/                 # Registro tipado de páginas da aplicação (registry.ts)
  │   ├── paginas/               # Templates HTML das páginas e manifesto.json de empacotamento
  │   └── ui/templates/          # Fragmentos HTML compartilhados (diálogos, navegação e rodapé)
  └── testes/
      ├── unit/                  # Suítes de testes unitários em TypeScript (.test.ts)
      ├── e2e/                   # Testes ponta a ponta via Playwright
      └── *.cjs                  # 50 suítes de verificação estática, integração e regressão
```

---

## 2. Design System Oficial — Forja Rubra (`tokens.css` & `componentes.css`)

Todas as páginas devem importar `src/estilos/compartilhado/tokens.css` e `src/estilos/compartilhado/componentes.css` antes de seus estilos específicos.

### 2.1. Tokens Canônicos (`:root`)

| Token CSS | Valor Hex | Uso Principal |
| :--- | :--- | :--- |
| `--bg` | `#090708` | Fundo principal da página (carvão escuro) |
| `--bg2` | `#100b0d` | Fundo secundário, inputs e áreas internas |
| `--panel` | `#110d0f` | Superfície padrão de cards, painéis e modais |
| `--panel2` | `#181114` | Superfície elevada, hover de cards e cabeçalhos |
| `--line` | `#4a252a` | Bordas sutis de cards, divisores e tabelas |
| `--red` / `--red2` | `#c51f2c` / `#ea3948` | Ação primária, abas ativas, selos rubros |
| `--gold` / `--gold2` | `#e9ad59` / `#f5c879` | Títulos (`Cinzel`), valores em Tibares (`T$`) e destaques |
| `--cream` | `#f5eee6` | Texto principal de alta legibilidade |
| `--muted` | `#c9b2aa` | Texto secundário, descrições e notas |
| `--font-display` | `'Cinzel', Georgia, serif` | Títulos, cabeçalhos e nomes de seções |
| `--font-sans` | `'Inter', 'Segoe UI', system-ui, sans-serif` | Corpo de texto, botões, inputs e tabelas |

### 2.2. Regras de Padronização de Componentes

1. **Cards de Catálogo (`.guild-card`, `.tavern-card`, `.item-card`, `.spell-card`):**
   - Fundo `linear-gradient(180deg, rgba(24, 17, 20, 0.96), rgba(13, 10, 12, 0.98))`, borda `1px solid var(--line)`, `border-radius: 8px`, transição suave de `border-color` para `var(--gold)`.
2. **Botões (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`):**
   - Nunca criar botões azuis, verdes ou roxos avulsos.
   - Estados concluídos (como treinamentos realizados) devem exibir apenas um quadro delimitado por linha (`border: 1px solid var(--line); background: transparent`) aproveitando a cor da própria janela.
3. **Pré-requisitos e Restrições:**
   - Exibir abaixo do texto do poder na mesma fonte e cor do restante da descrição, apenas com a palavra **Pré-requisito:** em negrito, sem caixas verdes ou vermelhas de fundo.

---

## 3. Boas Práticas de Engenharia Sênior e Vibe Coding

1. **Fonte Única de Verdade (SSOT):**
   - Textos oficiais ficam em `dados/*.json`.
   - Regras matemáticas (PV, PM, Defesa, Carga, Manufatura, Treinamento, Devoção) ficam em `src/lib/t20/` e `src/nucleo/`.
   - Estilos base ficam em `src/estilos/compartilhado/`.
2. **Zero Poluição de Código:**
   - Não deixar código comentado, funções órfãs ou comentários redundantes que apenas repetem o nome da função.
   - Preferir funções curtas, nomes semânticos claros e retorno antecipado (*early return*).
3. **Performance de Renderização e Eventos:**
   - Usar delegação de eventos (`document.addEventListener('click', ...)`) em vez de anexar centenas de listeners individuais a cada re-renderização de lista.
   - Construir listas de DOM em memória (`Array.map(...).join('')` ou `DocumentFragment`) realizando uma única escrita em `innerHTML`.
4. **Fluxo Determinístico para Agentes (Vibe Coding):**
   - Antes de alterar qualquer módulo de UI ou CSS, verificar os contratos validados pelas suítes em `testes/*.cjs`.
   - Sempre finalizar qualquer tarefa executando `npm run typecheck && npm run build && npm test`.
