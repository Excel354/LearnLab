import React from 'react';
import { formatMathPowerText } from './mathFormat';

/**
 * Strips unnecessary markdown hashtags (###, ##, #) and asterisks (**, *, ***)
 * from text for speech synthesis or pure text display.
 */
export function cleanStudyBuddyPlainText(text: string | null | undefined): string {
  if (!text) return '';
  let cleaned = String(text);

  // 1. Remove markdown header hashtags at the beginning of lines: e.g. "### 1. Title" -> "1. Title"
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // 2. Remove decorative divider lines: "---" or "==="
  cleaned = cleaned.replace(/^[-=]{3,}\s*$/gm, '');

  // 3. Convert asterisk bullets to clean bullet characters: "* Point" -> "• Point"
  cleaned = cleaned.replace(/^\s*\*\s+/gm, '• ');

  // 4. Remove bold/italic asterisks while preserving the words inside: e.g. "**RuBP**" -> "RuBP"
  cleaned = cleaned.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');

  // 5. Remove any leftover isolated asterisks or hashtags
  cleaned = cleaned.replace(/(^|\s)\*+(\s|$)/g, '$1$2');
  cleaned = cleaned.replace(/(^|\s)#+(\s|$)/g, '$1$2');

  // 6. Format math power text (e.g. 2^4 -> 2 raised to the power of 4)
  cleaned = formatMathPowerText(cleaned);

  return cleaned.trim();
}

/**
 * Parses inline formatting (bold, italics, math powers) into clean React nodes
 * without raw asterisks or hashtags.
 */
export function parseStudyBuddyInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Format math powers first (e.g. 2^4 -> 2 raised to the power of 4)
  const mathFormatted = formatMathPowerText(text);

  // Split by bold (**text** or ***text***) and italics (*text*)
  // We use a regex to match bold (**...**) or italic (*...*) segments
  const tokens: React.ReactNode[] = [];
  const regex = /(\*{2,3}[^*]+\*{2,3}|\*[^*]+\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(mathFormatted)) !== null) {
    const matchStart = match.index;
    const matchStr = match[0];

    // Push preceding text if any
    if (matchStart > lastIndex) {
      const plainSegment = mathFormatted.substring(lastIndex, matchStart);
      // Strip any stray single asterisks or hashtags from plain text
      const cleanPlain = plainSegment.replace(/[*#]/g, '');
      if (cleanPlain) {
        tokens.push(cleanPlain);
      }
    }

    if (matchStr.startsWith('**') || matchStr.startsWith('***')) {
      // Bold token: strip the asterisks and render strong
      const innerText = matchStr.replace(/^\*+|\*+$/g, '').trim();
      tokens.push(
        React.createElement(
          'strong',
          { key: `bold-${tokens.length}-${matchStart}`, className: 'font-semibold text-slate-900' },
          innerText
        )
      );
    } else if (matchStr.startsWith('*')) {
      // Italic token: strip the asterisks and render emphasized text
      const innerText = matchStr.replace(/^\*+|\*+$/g, '').trim();
      tokens.push(
        React.createElement(
          'span',
          { key: `em-${tokens.length}-${matchStart}`, className: 'font-medium text-indigo-950 italic' },
          innerText
        )
      );
    }

    lastIndex = matchStart + matchStr.length;
  }

  // Push remaining text after the last match
  if (lastIndex < mathFormatted.length) {
    const remaining = mathFormatted.substring(lastIndex);
    const cleanRemaining = remaining.replace(/[*#]/g, '');
    if (cleanRemaining) {
      tokens.push(cleanRemaining);
    }
  }

  return tokens.length > 0 ? tokens : [mathFormatted.replace(/[*#]/g, '')];
}
