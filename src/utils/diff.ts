export type DiffType = 'correct' | 'extra' | 'missing';

export interface DiffToken {
  char: string;
  type: DiffType;
}

/**
 * Computes character-level differences on a single line (no newlines).
 * Uses reversed LCS DP to align matching sections from the start.
 */
function diffSingleLine(template: string, typed: string): DiffToken[] {
  const revTemplate = template.split('').reverse().join('');
  const revTyped = typed.split('').reverse().join('');

  const m = revTemplate.length;
  const n = revTyped.length;

  if (m === 0) {
    return typed.split('').map(c => ({ char: c, type: 'extra' as const }));
  }
  if (n === 0) {
    return template.split('').map(c => ({ char: c, type: 'missing' as const }));
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (revTemplate[i - 1] === revTyped[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const revResult: DiffToken[] = [];
  let i = m;
  let j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && revTemplate[i - 1] === revTyped[j - 1]) {
      revResult.unshift({ char: revTemplate[i - 1], type: 'correct' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      revResult.unshift({ char: revTyped[j - 1], type: 'extra' });
      j--;
    } else {
      revResult.unshift({ char: revTemplate[i - 1], type: 'missing' });
      i--;
    }
  }
  
  return revResult.reverse();
}

/**
 * Computes character-level differences line-by-line to prevent alignment drift.
 */
export function diffChars(template: string, typed: string): DiffToken[] {
  // Replace smart quotes and unify line endings
  const cleanTemplate = template.replace(/\r\n/g, '\n').replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");
  const cleanTyped = typed.replace(/\r\n/g, '\n').replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");

  const templateLines = cleanTemplate.split('\n');
  const typedLines = cleanTyped.split('\n');

  const maxLines = Math.max(templateLines.length, typedLines.length);
  const result: DiffToken[] = [];

  for (let i = 0; i < maxLines; i++) {
    const tLine = templateLines[i] !== undefined ? templateLines[i] : null;
    const pLine = typedLines[i] !== undefined ? typedLines[i] : null;

    if (tLine !== null && pLine !== null) {
      // Both lines exist, run diff on this line
      const lineDiff = diffSingleLine(tLine, pLine);
      result.push(...lineDiff);
    } else if (tLine !== null) {
      // Template line exists, but user hasn't typed it
      const lineDiff = tLine.split('').map(c => ({ char: c, type: 'missing' as const }));
      result.push(...lineDiff);
    } else if (pLine !== null) {
      // User typed extra line, template doesn't have it
      const lineDiff = pLine.split('').map(c => ({ char: c, type: 'extra' as const }));
      result.push(...lineDiff);
    }

    // Add newline character between lines
    if (i < maxLines - 1) {
      let nlType: DiffType = 'correct';
      if (tLine !== null && pLine === null) {
        nlType = 'missing';
      } else if (tLine === null && pLine !== null) {
        nlType = 'extra';
      } else {
        nlType = 'correct';
      }
      result.push({ char: '\n', type: nlType });
    }
  }

  return result;
}
