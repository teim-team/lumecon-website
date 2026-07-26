/**
 * Short-lived acquisition-flow state (signup -> choose-plan ->
 * checkout -> welcome), kept in sessionStorage instead of the URL.
 * Personally identifiable information never belongs in a query
 * string: URLs leak into history, logs, analytics, referrers and
 * screenshots. Plan ids may travel in the URL; the email may not.
 */
const EMAIL_KEY = 'lumecon:flow:email';

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
