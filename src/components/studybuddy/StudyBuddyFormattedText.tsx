import React from 'react';
import { parseStudyBuddyInline } from '../../utils/studyBuddyFormatter';
import { formatMathPowerText } from '../../utils/mathFormat';

interface StudyBuddyFormattedTextProps {
  text: string;
  isAi?: boolean;
}

export const StudyBuddyFormattedText: React.FC<StudyBuddyFormattedTextProps> = ({
  text,
  isAi = true,
}) => {
  if (!text) return null;

  if (!isAi) {
    return (
      <p className="whitespace-pre-wrap leading-relaxed">
        {formatMathPowerText(text)}
      </p>
    );
  }

  // Split into lines for structured rendering
  const lines = text.split('\n');

  return (
    <div className="space-y-1 text-xs text-slate-800 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 1. Skip decorative markdown dividers: --- or ===
        if (/^[-=]{3,}$/.test(trimmed)) {
          return <div key={idx} className="my-1.5 border-b border-slate-100" />;
        }

        // 2. Empty line: subtle vertical breathing room
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // 3. Markdown Header: e.g. ### 1. Carbon Fixation or ## Key Concept
        // Strip the ### / ## / # hashtags completely
        const headerMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
        if (headerMatch) {
          const headingText = headerMatch[1];
          return (
            <h4
              key={idx}
              className="text-[13px] font-bold text-slate-900 mt-2.5 mb-1 first:mt-0 tracking-tight"
            >
              {parseStudyBuddyInline(headingText)}
            </h4>
          );
        }

        // 4. Bullet Point: e.g. "* **The Action:** ..." or "- Point"
        // Strip leading asterisk or hyphen and render as a clean bullet
        const bulletMatch = trimmed.match(/^(\*|-|•)\s+(.+)$/);
        if (bulletMatch) {
          const bulletContent = bulletMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2 my-1 pl-1">
              <span className="text-indigo-600 font-bold select-none text-xs leading-5">
                •
              </span>
              <span className="flex-1 text-slate-700 leading-relaxed">
                {parseStudyBuddyInline(bulletContent)}
              </span>
            </div>
          );
        }

        // 5. Standard paragraph line
        return (
          <p key={idx} className="my-0.5 leading-relaxed text-slate-700">
            {parseStudyBuddyInline(line)}
          </p>
        );
      })}
    </div>
  );
};
