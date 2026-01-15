/**
 * Utilitaire pour nettoyer le texte avant insertion dans les PDF
 * Remplace les caractères Unicode spéciaux par leurs équivalents compatibles jsPDF
 */

export function sanitizePdfText(text: string | undefined | null): string {
  if (!text) return '';

  return text
    // Symbole diamètre - convertir en "D" ou "diam."
    .replace(/⌀/g, 'D')
    .replace(/Ø/g, 'D')
    .replace(/ø/g, 'd')

    // Symboles mathématiques
    .replace(/±/g, '+/-')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/≈/g, '~')
    .replace(/µ/g, 'u') // micro
    .replace(/²/g, '2') // exposant 2
    .replace(/³/g, '3') // exposant 3
    .replace(/¹/g, '1') // exposant 1
    .replace(/½/g, '1/2')
    .replace(/¼/g, '1/4')
    .replace(/¾/g, '3/4')

    // Symboles de degré et température
    .replace(/°C/g, 'degC')
    .replace(/°F/g, 'degF')
    .replace(/°/g, 'deg')

    // Symboles de monnaie
    .replace(/€/g, 'EUR')
    .replace(/£/g, 'GBP')
    .replace(/¥/g, 'JPY')
    .replace(/¢/g, 'c')

    // Symboles divers
    .replace(/™/g, '(TM)')
    .replace(/®/g, '(R)')
    .replace(/©/g, '(C)')
    .replace(/…/g, '...')
    .replace(/•/g, '-')
    .replace(/·/g, '.')
    .replace(/†/g, '+')
    .replace(/‡/g, '++')
    .replace(/§/g, 'S')
    .replace(/¶/g, 'P')
    .replace(/№/g, 'No')
    .replace(/℮/g, 'e')

    // Guillemets spéciaux
    .replace(/[""„]/g, '"')
    .replace(/[''‚]/g, "'")
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .replace(/‹/g, "'")
    .replace(/›/g, "'")

    // Tirets et traits
    .replace(/[–—―]/g, '-')
    .replace(/‐/g, '-')
    .replace(/‑/g, '-')
    .replace(/‒/g, '-')

    // Espaces spéciaux
    .replace(/\u00A0/g, ' ')  // espace insécable
    .replace(/\u202F/g, ' ')  // espace fine insécable
    .replace(/\u2009/g, ' ')  // espace fine
    .replace(/\u2007/g, ' ')  // figure space
    .replace(/\u2008/g, ' ')  // punctuation space
    .replace(/\u200B/g, '')   // zero-width space
    .replace(/\u200C/g, '')   // zero-width non-joiner
    .replace(/\u200D/g, '')   // zero-width joiner
    .replace(/\uFEFF/g, '')   // BOM

    // Flèches
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/↑/g, '^')
    .replace(/↓/g, 'v')
    .replace(/↔/g, '<->')
    .replace(/⇒/g, '=>')
    .replace(/⇐/g, '<=')

    // Caractères de contrôle et non imprimables
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')

    // Emoji et pictogrammes (remplacer par espace)
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '');
}

/**
 * Nettoie un tableau de données pour PDF
 */
export function sanitizePdfTableData(data: any[][]): any[][] {
  return data.map(row =>
    row.map(cell =>
      typeof cell === 'string' ? sanitizePdfText(cell) : cell
    )
  );
}

/**
 * Nettoie un objet de données pour PDF
 */
export function sanitizePdfObject<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      cleaned[key] = sanitizePdfText(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item =>
        typeof item === 'string' ? sanitizePdfText(item) : item
      );
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned as T;
}
