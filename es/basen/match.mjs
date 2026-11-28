// Compares what the speech recogniser heard with the expected verse.
// Alignment is a longest common subsequence over normalised words, so one
// missing or wrong word does not shift every following word into "wrong".

export function normalizeWord(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function tokens(text) {
  return text.split(/\s+/).filter(w => normalizeWord(w) !== '');
}

export function compareVerse(expected, heard) {
  const exp = tokens(expected);
  const got = tokens(heard || '');
  const a = exp.map(normalizeWord);
  const b = got.map(normalizeWord);

  // dp[i][j] = LCS length of a[i..] and b[j..]
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ok = new Array(a.length).fill(false);
  const used = new Array(b.length).fill(false);
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { ok[i] = true; used[j] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }

  const words = exp.map((text, k) => ({ text, ok: ok[k] }));
  const extra = got.filter((_, k) => !used[k]);
  const score = exp.length ? ok.filter(Boolean).length / exp.length : 0;
  return { words, extra, score };
}
