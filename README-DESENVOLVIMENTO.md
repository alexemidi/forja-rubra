# Desenvolvimento da Forja T20

Este documento explica como alterar o projeto com segurança, mesmo sem conhecimento técnico avançado.

## Onde fazer alterações

Edite os arquivos dentro de `tools/character-builder`, `tools/item-catalog/src` e os arquivos JSON de dados. Os arquivos `Criador de Ficha T20.html` e `Arsenal de Arton.html` são produtos gerados: nunca faça uma correção diretamente neles, pois ela será perdida na próxima geração.

O `grimorio.html` ainda é uma fonte autossuficiente e também é incorporado ao Criador. Alterações nele precisam ser verificadas nas duas formas de uso.

O PDF `output/pdf/Ficha T20 Jogo do Ano - Otimizada v1.7.pdf` é o modelo protegido. O Criador preenche uma cópia; o modelo não deve ser sobrescrito.

## Comandos principais

Abra um terminal na raiz do projeto e use:

- `npm run build`: gera primeiro o Arsenal e depois o Criador.
- `npm test`: executa os testes funcionais existentes.
- `npm run check`: executa todas as proteções, gera os HTMLs e confirma que o resultado é reproduzível.
- `npm run benchmark`: mede catálogo, escolhas, mochila e pesquisa cinco vezes.

Antes de considerar uma alteração concluída, execute `npm run check`.

## Como trabalhar em lotes

1. Confirme que `git status --short` não mostra alterações inesperadas.
2. Atualize `SOLICITACOES-RECENTES.md`, movendo o pedido para “Em desenvolvimento”.
3. Altere somente as fontes.
4. Acrescente ou ajuste um teste que reproduza o comportamento.
5. Execute `npm run check`.
6. Faça a conferência visual no computador e no celular.
7. Atualize o registro para “Implementado”, “Testado automaticamente” e “Conferido visualmente”, conforme o que realmente foi verificado.
8. Crie um commit local descritivo.

## Como recuperar uma versão

- `git log --oneline -10` mostra os últimos pontos recuperáveis.
- `git show IDENTIFICADOR` mostra o que mudou em um commit.
- Antes de restaurar qualquer coisa, guarde alterações ainda não registradas. Não use `git reset --hard`.
- Para experimentar uma versão antiga sem apagar a atual, crie uma cópia da pasta ou uma worktree do Git.

## Como registrar uma regra ou um bug

Para uma regra nova, informe a fonte, o texto original, quando se aplica, o que altera e dois exemplos. Para um bug, informe raça, classe, nível, escolhas realizadas, sequência de cliques, resultado atual, resultado esperado e uma imagem quando o problema for visual.

Uma regra que ainda não tem cálculo confiável deve aparecer como lembrete. O sistema não deve inventar um valor.

## Critério de qualidade

Uma mudança só está pronta quando mantém os HTMLs autossuficientes, não usa pop-ups nativos, preserva o PDF modelo, passa em `npm run check` e não quebra os cenários registrados. Alterações visuais também exigem conferência em 1366×768 e 390×844.

