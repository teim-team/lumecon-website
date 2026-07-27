/**
 * Short-lived acquisition-flow state (signup -> choose-plan ->
 * checkout -> welcome), kept in sessionStorage instead of the URL.
 * Personally identifiable information never belongs in a query
 * string: URLs leak into history, logs, analytics, referrers and
 * screenshots. Plan ids may travel in the URL; the email may not.
 */
const EMAIL_KEY = 'lumecon:flow:email';
const SIGNED_UP_KEY = 'lumecon:flow:signedup';

export function rememberFlowEmail(email: string): void {
  try {
    if (email) sessionStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* storage unavailable: the flow still works, without prefill */
  }
}

export function getFlowEmail(): string {
  try {
    return sessionStorage.getItem(EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Mark that this visitor actually created an account in this flow. Kept
 * separate from the prefill email: entering an email at checkout is not
 * proof of signup, so only the signup step sets this. `/choose-plan` reads
 * it to decide whether "Start free" can skip straight to the workspace.
 */
export function markSignedUp(): void {
  try {
    sessionStorage.setItem(SIGNED_UP_KEY, '1');
  } catch {
    /* storage unavailable: the visitor simply passes through signup again */
  }
}

export function hasSignedUp(): boolean {
  try {
    return sessionStorage.getItem(SIGNED_UP_KEY) === '1';
  } catch {
    return false;
  }
}
