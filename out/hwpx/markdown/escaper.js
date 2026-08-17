"use strict";
/**
 * Markdown escaping utilities for HWPX source text.
 *
 * These functions apply to hp:t source text only — never to gem-emitted
 * markup like `<u>`, `<sup>`, `**`, etc.
 *
 * Reference: lib/hwpx2md/markdown/escaper.rb
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeInline = escapeInline;
exports.escapeParagraphStart = escapeParagraphStart;
exports.escapeTableCell = escapeTableCell;
/**
 * Escape characters that are special in Markdown inline context.
 * Single-pass regex to avoid double-escaping.
 */
function escapeInline(text) {
    return text.replace(/[\\*_`\[\]<~]/g, c => "\\" + c);
}
/**
 * Escape > and # when they appear at the start of a paragraph's text.
 */
function escapeParagraphStart(text) {
    if (!text)
        return text;
    if (text[0] === "#" || text[0] === ">")
        return "\\" + text;
    return text;
}
/**
 * Escape | inside table cells only.
 */
function escapeTableCell(text) {
    return text.replace(/\|/g, "\\|");
}
//# sourceMappingURL=escaper.js.map