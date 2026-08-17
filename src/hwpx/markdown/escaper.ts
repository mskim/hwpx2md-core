/**
 * Markdown escaping utilities for HWPX source text.
 *
 * These functions apply to hp:t source text only — never to gem-emitted
 * markup like `<u>`, `<sup>`, `**`, etc.
 *
 * Reference: lib/hwpx2md/markdown/escaper.rb
 */

/**
 * Escape characters that are special in Markdown inline context.
 * Single-pass regex to avoid double-escaping.
 */
export function escapeInline(text: string): string {
  return text.replace(/[\\*_`\[\]<~]/g, c => "\\" + c);
}

/**
 * Escape > and # when they appear at the start of a paragraph's text.
 */
export function escapeParagraphStart(text: string): string {
  if (!text) return text;
  if (text[0] === "#" || text[0] === ">") return "\\" + text;
  return text;
}

/**
 * Escape | inside table cells only.
 */
export function escapeTableCell(text: string): string {
  return text.replace(/\|/g, "\\|");
}
