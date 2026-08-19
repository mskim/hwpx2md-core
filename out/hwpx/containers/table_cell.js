"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableCell = void 0;
const xml_1 = require("../ingest/xml");
const image_node_1 = require("./image_node");
const math_node_1 = require("./math_node");
/** A pic's caption is its alt text, not text of the cell that holds it. */
const NOT_IN_PIC = "[not(ancestor::hp:pic)]";
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
/**
 * A cell's content in document order — text AND equations.
 *
 * This used to harvest `.//hp:t` alone, so an equation inside a cell simply
 * vanished. In a 수능 exam paper the first item's stem lives in the masthead
 * table cell, so item 1 emitted `<td></td>` — an entire question lost. Same
 * shape as the caption and plate defects: collect one node type, silently drop
 * everything else that carries meaning.
 *
 * Walks runs rather than using a descendant `hp:t` query, because interleaving
 * is the whole point: "함수" + eq + "의 값은?" must come back in that order.
 */
function renderCellParagraph(scope) {
    let out = "";
    for (const run of (0, xml_1.findAll)(scope, `.//hp:run${NOT_IN_PIC}`)) {
        for (const child of Array.from(run.childNodes)) {
            if (child.nodeType !== 1)
                continue;
            if (child.localName === "t")
                out += child.textContent ?? "";
            else if (child.localName === "equation")
                out += math_node_1.MathNode.from(child).toMarkdown();
        }
    }
    return out;
}
class TableCell {
    _rawText;
    _colSpan;
    _rowSpan;
    colAddr;
    rowAddr;
    images;
    constructor(_rawText, _colSpan, _rowSpan, colAddr, rowAddr, 
    /** Pics living in THIS cell. The paragraph owns only the free ones. */
    images) {
        this._rawText = _rawText;
        this._colSpan = _colSpan;
        this._rowSpan = _rowSpan;
        this.colAddr = colAddr;
        this.rowAddr = rowAddr;
        this.images = images;
    }
    /**
     * `binItems` and `fixtureBasename` are OPTIONAL, and must stay that way: the
     * container unit tests call TableCell.from / TableRow.from / Table.from
     * directly with the original arity.
     */
    static from(node, binItems, fixtureBasename) {
        // Join paragraph texts with a space (mirrors Ruby text_for_html for multi-paragraph cells)
        const paragraphNodes = (0, xml_1.findAll)(node, ".//hp:p");
        let joined;
        if (paragraphNodes.length > 0) {
            const paraTexts = paragraphNodes
                .map(p => renderCellParagraph(p).trim())
                .filter(s => s !== "");
            joined = paraTexts.join(" ");
        }
        else {
            joined = renderCellParagraph(node);
        }
        const images = binItems
            ? (0, xml_1.findAll)(node, ".//hp:pic").map(p => image_node_1.ImageNode.from(p, binItems, fixtureBasename ?? ""))
            : [];
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
        return new TableCell(joined, colSpan, rowSpan, colAddr, rowAddr, images);
    }
    get colSpan() { return this._colSpan; }
    get rowSpan() { return this._rowSpan; }
    get merged() {
        return this._colSpan > 1 || this._rowSpan > 1;
    }
    toMarkdown() {
        const parts = this.images.map(i => i.toMarkdown()).filter(md => md !== "");
        const trimmed = this._rawText.trim();
        if (trimmed !== "")
            parts.push(trimmed);
        if (parts.length === 0)
            return "&nbsp;";
        // Escape the COMPOSED cell, not just the harvested text — a caption
        // containing a pipe would otherwise break the row. Asset paths cannot
        // contain one.
        return parts.join(" ").replace(/\|/g, "\\|");
    }
    /** Emit <td> with colspan/rowspan for HTML table fallback. */
    toHtmlTd() {
        let attrs = "";
        if (this._colSpan > 1)
            attrs += ` colspan="${this._colSpan}"`;
        if (this._rowSpan > 1)
            attrs += ` rowspan="${this._rowSpan}"`;
        // Join paragraphs with a space (mirrors Ruby text_for_html)
        const text = this._rawText
            .trim()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        const parts = this.images.map(i => i.toHtml()).filter(html => html !== "");
        if (text !== "")
            parts.push(text);
        return `<td${attrs}>${parts.join(" ")}</td>`;
    }
}
exports.TableCell = TableCell;
//# sourceMappingURL=table_cell.js.map