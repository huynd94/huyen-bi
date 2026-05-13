/**
 * Escapes the five HTML metacharacters so the returned string is safe to
 * interpolate into HTML markup as text content.
 *
 * The replacement order matters: `&` MUST be escaped first so we do not
 * double-escape the entities produced for the subsequent characters.
 *
 * Reference: post-opus-audit-remediation design §3 (H1).
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
