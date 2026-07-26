export type DiffType = 'correct' | 'extra' | 'missing';

export interface DiffToken {
  char: string;
  type: DiffType;
}

/**
 * Computes character-level differences between template and typed text.
 * To align comparison from the beginning of the text, we reverse both strings,
 * run the LCS DP alignment, and reverse the final token output array.
 */
export function diffChars(template: string, typed: string): DiffToken[] {
  // Replace smart quotes and unify line endings
  const cleanTemplate = template.replace(/\r\n/g, '\n').replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");
  const cleanTyped = typed.replace(/\r\n/g, '\n').replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");

  // Reverse strings to force alignment from the beginning
  const revTemplate = cleanTemplate.split('').reverse().join('');
  const revTyped = cleanTyped.split('').reverse().join('');

  const m = revTemplate.length;
  const n = revTyped.length;
  
  // Safe fallback for very large inputs to prevent browser thread freeze (cap at 4000 characters)
  if (m * n > 16000000) {
    const tokens: DiffToken[] = [];
    const minLen = Math.min(m, n);
    for (let i = 0; i < minLen; i++) {
      if (cleanTemplate[i] === cleanTyped[i]) {
        tokens.push({ char: cleanTemplate[i], type: 'correct' });
      } else {
        tokens.push({ char: cleanTyped[i], type: 'extra' });
      }
    }
    if (n > m) {
      for (let i = minLen; i < n; i++) {
        tokens.push({ char: cleanTyped[i], type: 'extra' });
      }
    } else if (m > n) {
      for (let i = minLen; i < m; i++) {
        tokens.push({ char: cleanTemplate[i], type: 'missing' });
      }
    }
    return tokens;
  }

  // DP table for LCS on reversed strings
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
  
  // Reversing the reversed results aligns them in the original forward order
  return revResult.reverse();
}
