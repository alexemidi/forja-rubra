/**
 * Formata o resumo calculado de Redução de Dano (RD), sem alterar descrições canônicas.
 */

export function formatarReducaoDano(resumo: string): string {
  return String(resumo || '')
    .split(',')
    .map((parte) => {
      const match = parte.trim().match(/^RD\s+(\d+)(?:\/(.+))?$/i);
      if (!match) return parte.trim();
      return (
        'Redução de Dano' +
        (match[2] ? ' de ' + match[2] : '') +
        ' ' +
        match[1]
      );
    })
    .filter(Boolean)
    .join(' · ');
}
