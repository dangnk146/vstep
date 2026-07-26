export type DiffType = 'correct' | 'extra' | 'missing';

export interface DiffToken {
  char: string;
  type: DiffType;
}

/**
 * Computes Jaccard word similarity between two lines to align them.
 * Return values range from 0.0 (no overlap) to 1.0 (identical).
 */
function getLineSimilarity(a: string, b: string): number {
  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (cleanA === '' && cleanB === '') return 1.0;
  if (cleanA === '' || cleanB === '') return 0.0;
  if (cleanA === cleanB) return 1.0;

  const wordsA = new Set(cleanA.split(/\s+/));
  const wordsB = new Set(cleanB.split(/\s+/));
  let intersection = 0;
  wordsA.forEach(w => {
    if (wordsB.has(w)) intersection++;
  });
  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 ? intersection / union : 0.0;
}

/**
 * Determines similarity threshold based on line lengths (word counts).
 * Short lines (<= 3 words) require a higher threshold to prevent false matches.
 */
function getThreshold(lineA: string, lineB: string): number {
  const wordsA = lineA.trim().split(/\s+/).filter(Boolean).length;
  const wordsB = lineB.trim().split(/\s+/).filter(Boolean).length;
  return (wordsA <= 3 || wordsB <= 3) ? 0.45 : 0.3;
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
 * Computes character-level differences line-by-line using a line-level pre-alignment
 * pass (hybrid LCS) to prevent alignment drift and improve performance.
 */
export function diffChars(template: string, typed: string): DiffToken[] {
  // Replace smart quotes and unify line endings
  const cleanTemplate = template.replace(/\r\n/g, '\n').replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");
  const cleanTyped = typed.replace(/\r\n/g, '\n').replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");

  const templateLines = cleanTemplate.split('\n');
  const typedLines = cleanTyped.split('\n');

  const m = templateLines.length;
  const n = typedLines.length;

  // 1. Line-level LCS DP alignment using Jaccard word similarity and dynamic thresholds
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sim = getLineSimilarity(templateLines[i - 1], typedLines[j - 1]);
      const threshold = getThreshold(templateLines[i - 1], typedLines[j - 1]);
      if (sim >= threshold) {
        dp[i][j] = dp[i - 1][j - 1] + sim;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack line alignment path
  interface LineAlignment {
    templateLine: string | null;
    typedLine: string | null;
  }
  const alignment: LineAlignment[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const sim = getLineSimilarity(templateLines[i - 1], typedLines[j - 1]);
      const threshold = getThreshold(templateLines[i - 1], typedLines[j - 1]);
      if (sim >= threshold && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + sim)) < 0.0001) {
        alignment.unshift({ templateLine: templateLines[i - 1], typedLine: typedLines[j - 1] });
        i--;
        j--;
        continue;
      }
    }

    if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      alignment.unshift({ templateLine: null, typedLine: typedLines[j - 1] });
      j--;
    } else {
      alignment.unshift({ templateLine: templateLines[i - 1], typedLine: null });
      i--;
    }
  }

  // 2. Perform character diff on each aligned line pair
  const result: DiffToken[] = [];
  for (let idx = 0; idx < alignment.length; idx++) {
    const { templateLine, typedLine } = alignment[idx];

    if (templateLine !== null && typedLine !== null) {
      const lineDiff = diffSingleLine(templateLine, typedLine);
      result.push(...lineDiff);
    } else if (templateLine !== null) {
      const lineDiff = templateLine.split('').map(c => ({ char: c, type: 'missing' as const }));
      result.push(...lineDiff);
    } else if (typedLine !== null) {
      const lineDiff = typedLine.split('').map(c => ({ char: c, type: 'extra' as const }));
      result.push(...lineDiff);
    }

    // Add newline character after each line, except the last one
    if (idx < alignment.length - 1) {
      let nlType: DiffType = 'correct';
      if (templateLine !== null && typedLine === null) {
        nlType = 'missing';
      } else if (templateLine === null && typedLine !== null) {
        nlType = 'extra';
      }
      result.push({ char: '\n', type: nlType });
    }
  }

  return result;
}
