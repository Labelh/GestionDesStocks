/**
 * Utilitaire pour nettoyer le texte avant insertion dans les PDF
 * Remplace les caractères Unicode spéciaux par leurs équivalents ASCII
 */

export function sanitizePdfText(text: string | undefined | null): string {
  if (!text) return '';

  return text
    // Symbole diamètre
    .replace(/⌀/g, 'Ø')
    .replace(/Ø/g, 'diam.')

    // Symboles mathématiques
    .replace(/±/g, '+/-')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/≈/g, '~')

    // Symboles de degré et température
    .replace(/°C/g, 'degC')
    .replace(/°F/g, 'degF')
    .replace(/°/g, 'deg')

    // Symboles de monnaie alternatifs
    .replace(/€/g, 'EUR')
    .replace(/£/g, 'GBP')
    .replace(/¥/g, 'JPY')

    // Symboles divers
    .replace(/™/g, '(TM)')
    .replace(/®/g, '(R)')
    .replace(/©/g, '(C)')
    .replace(/…/g, '...')

    // Guillemets spéciaux
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")

    // Tirets spéciaux
    .replace(/[–—]/g, '-')

    // Espaces insécables
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ')

    // Caractères de contrôle
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
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
