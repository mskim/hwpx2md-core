"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableCell = void 0;
const xml_1 = require("../ingest/xml");
/**
 * Wraps an hp:tc element. Phase 3 emits plain text only — no inline styling,
 * no line breaks, no nested tables (if a cell's paragraph contains another
 * hp:tbl, its text descendants are flattened into the cell text).
 *
 * Mirrors Ruby's TableCell#to_markdown: concatenate hp:t text, strip, escape
 * pipe characters, substitute &nbsp; when empty.
 *
 * Also supports HTML emission for span tables (Task 8).
 */
class TableCell {
    _rawText;
    _colSpan;
    _rowSpan;
    colAddr;
    rowAddr;
    constructor(_rawText, _colSpan, _rowSpan, colAddr, rowAddr) {
        this._rawText = _rawText;
        this._colSpan = _colSpan;
        this._rowSpan = _rowSpan;
        this.colAddr = colAddr;
        this.rowAddr = rowAddr;
    }
    static from(node) {
        // Join paragraph texts with a space (mirrors Ruby text_for_html for multi-paragraph cells)
        const paragraphNodes = (0, xml_1.findAll)(node, ".//hp:p");
        let joined;
        if (paragraphNodes.length > 0) {
            const paraTexts = paragraphNodes
                .map(p => {
                const ts = (0, xml_1.findAll)(p, ".//hp:t");
                return ts.map(t => t.textContent ?? "").join("").trim();
            })
                .filter(s => s !== "");
            joined = paraTexts.join(" ");
        }
        else {
            const texts = (0, xml_1.findAll)(node, ".//hp:t");
            joined = texts.map(t => t.textContent ?? "").join("");
        }
        // Read span info from hp:cellSpan child element
        const spanNodes = (0, xml_1.findAll)(node, "hp:cellSpan");
        const spanNode = spanNodes[0];
        const colSpan = spanNode ? parseInt(spanNode.getAttribute("colSpan") ?? "1", 10) : 1;
        const rowSpan = spanNode ? parseInt(spanNode.getAttribute("rowSpan") ?? "1", 10) : 1;
        // Read position from hp:cellAddr child element
        const addrNodes = (0, xml_1.findAll)(node, "hp:cellAddr");
        const addrNode = addrNodes[0];
        const colAddr = addrNode ? parseInt(addrNode.getAttribute("colAddr") ?? "0", 10) : 0;
        const rowAddr = addrNode ? parseInt(addrNode.getAttribute("rowAddr") ?? "0", 10) : 0;
        return new TableCell(joined, colSpan, rowSpan, colAddr, rowAddr);
    }
    get colSpan() { return this._colSpan; }
    get rowSpan() { return this._rowSpan; }
    get merged() {
        return this._colSpan > 1 || this._rowSpan > 1;
    }
    toMarkdown() {
        const trimmed = this._rawText.trim();
        if (trimmed === "")
            return "&nbsp;";
        return trimmed.replace(/\|/g, "\\|");
    }
    /** Emit <td> with colspan/rowspan for HTML table fallback. */
    toHtmlTd() {
        let attrs = "";
        if (this._colSpan > 1)
            attrs += ` colspan="${this._colSpan}"`;
        if (this._rowSpan > 1)
            attrs += ` rowspan="${this._rowSpan}"`;
        // Join paragraphs with a space (mirrors Ruby text_for_html)
        const inner = this._rawText
            .trim()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return `<td${attrs}>${inner}</td>`;
    }
}
exports.TableCell = TableCell;
//# sourceMappingURL=table_cell.js.map