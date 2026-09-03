/**
 * Formats mathematical text so that power/exponent notation using '^'
 * is converted to plain English "raised to the power of" for novices to understand.
 *
 * Examples:
 * - "2^4" -> "2 raised to the power of 4"
 * - "x^2" -> "x raised to the power of 2"
 * - "(2x + 1)^3" -> "(2x + 1) raised to the power of 3"
 * - "10^{-3}" -> "10 raised to the power of -3"
 * - "10^-3" -> "10 raised to the power of -3"
 * - "$11011_2 = (1 \times 2^4)$" -> "$11011_2 = (1 \times 2 raised to the power of 4)$"
 * - Any remaining "^" -> " raised to the power of "
 */
export function formatMathPowerText(text: string | null | undefined): string {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);

  let result = text;

  // 1. Handle LaTeX or brace notation: e.g. base^{exp}
  result = result.replace(/([0-9a-zA-Z\)\.\$]+)\s*\^\s*\{([^}]+)\}/g, '$1 raised to the power of $2');

  // 2. Handle standard base^exp with optional parentheses around base:
  // e.g. 2^4, x^2, (a+b)^2, 10^-3, 10^+3
  result = result.replace(/(\([^\)]+\)|[0-9a-zA-Z]+)\s*\^\s*([+-]?[0-9a-zA-Z]+)/g, '$1 raised to the power of $2');

  // 3. Any standalone or remaining '^'
  result = result.replace(/\s*\^\s*/g, ' raised to the power of ');

  return result;
}

/**
 * Checks if a subject is a Mathematics related subject
 */
export function isMathSubject(subject: string | null | undefined): boolean {
  if (!subject) return false;
  const s = subject.toLowerCase();
  return (
    s.includes('math') ||
    s.includes('algebra') ||
    s.includes('calculus') ||
    s.includes('arithmetic') ||
    s.includes('geometry') ||
    s.includes('trigonometry') ||
    s.includes('statistics')
  );
}
