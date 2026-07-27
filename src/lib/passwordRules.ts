/**
 * Password rules, shared by /login (reset mode) and /signup and
 * copied from the product's AuthGate so a password accepted on one
 * surface is never rejected by another: 12+ characters AND at least
 * three of the four character classes.
 */
export const PASSWORD_RULES: Array<{ key: string; test: (pw: string) => boolean }> = [
  { key: 'length', test: (pw) => pw.length >= 12 },
  { key: 'case', test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { key: 'number', test: (pw) => /\d/.test(pw) },
  { key: 'symbol', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function evaluatePassword(pw: string): {
  acceptable: boolean;
  level: number;
  label: string;
} {
  const results = PASSWORD_RULES.map((r) => r.test(pw));
  const met = results.filter(Boolean).length;
  const acceptable = results[0] && met >= 3;
  if (!pw) return { acceptable: false, level: 0, label: '' };
  if (met <= 1) return { acceptable, level: 1, label: 'Weak' };
  if (met === 2) return { acceptable, level: 2, label: 'Fair' };
  if (acceptable && met === 3) return { acceptable, level: 3, label: 'Good' };
  if (acceptable) return { acceptable, level: 4, label: 'Strong' };
  return { acceptable, level: 2, label: 'Fair' };
}
