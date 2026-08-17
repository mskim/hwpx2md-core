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
export declare function escapeInline(text: string): string;
/**
 * Escape > and # when they appear at the start of a paragraph's text.
 */
export declare function escapeParagraphStart(text: string): string;
/**
 * Escape | inside table cells only.
 */
export declare function escapeTableCell(text: string): string;
