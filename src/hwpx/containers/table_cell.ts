/// <reference lib="dom" />

import type { BinItemTable } from "../ingest/bin_items";
import { findAll } from "../ingest/xml";
import { ImageNode } from "./image_node";

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
export class TableCell {
  private constructor(
    private readonly _rawText: string,
    private readonly _colSpan: number,
    private readonly _rowSpan: number,
    readonly colAddr: number,
    readonly rowAddr: number,
    /** Pics living in THIS cell. The paragraph owns only the free ones. */
    readonly images: ImageNode[],
  ) {}

  /**
   * `binItems` and `fixtureBasename` are OPTIONAL, and must stay that way: the
   * container unit tests call TableCell.from / TableRow.from / Table.from
   * directly with the original arity.
   */
  static from(node: Element, binItems?: BinItemTable, fixtureBasename?: string): TableCell {
    // Join paragraph texts with a space (mirrors Ruby text_for_html for multi-paragraph cells)
    const paragraphNodes = findAll(node, ".//hp:p");
    let joined: string;
    if (paragraphNodes.length > 0) {
      const paraTexts = paragraphNodes
        .map(p => {
          const ts = findAll(p, `.//hp:t${NOT_IN_PIC}`);
          return ts.map(t => t.textContent ?? "").join("").trim();
        })
        .filter(s => s !== "");
      joined = paraTexts.join(" ");
    } else {
      const texts = findAll(node, `.//hp:t${NOT_IN_PIC}`);
      joined = texts.map(t => t.textContent ?? "").join("");
    }

    const images = binItems
      ? findAll(node, ".//hp:pic").map(p => ImageNode.from(p, binItems, fixtureBasename ?? ""))
      : [];

    // Read span info from hp:cellSpan child element
    const spanNodes = findAll(node, "hp:cellSpan");
    const spanNode = spanNodes[0];
    const colSpan = spanNode ? parseInt(spanNode.getAttribute("colSpan") ?? "1", 10) : 1;
    const rowSpan = spanNode ? parseInt(spanNode.getAttribute("rowSpan") ?? "1", 10) : 1;

    // Read position from hp:cellAddr child element
    const addrNodes = findAll(node, "hp:cellAddr");
    const addrNode = addrNodes[0];
    const colAddr = addrNode ? parseInt(addrNode.getAttribute("colAddr") ?? "0", 10) : 0;
    const rowAddr = addrNode ? parseInt(addrNode.getAttribute("rowAddr") ?? "0", 10) : 0;

    return new TableCell(joined, colSpan, rowSpan, colAddr, rowAddr, images);
  }

  get colSpan(): number { return this._colSpan; }
  get rowSpan(): number { return this._rowSpan; }

  get merged(): boolean {
    return this._colSpan > 1 || this._rowSpan > 1;
  }

  toMarkdown(): string {
    const parts = this.images.map(i => i.toMarkdown()).filter(md => md !== "");
    const trimmed = this._rawText.trim();
    if (trimmed !== "") parts.push(trimmed);
    if (parts.length === 0) return "&nbsp;";
    // Escape the COMPOSED cell, not just the harvested text — a caption
    // containing a pipe would otherwise break the row. Asset paths cannot
    // contain one.
    return parts.join(" ").replace(/\|/g, "\\|");
  }

  /** Emit <td> with colspan/rowspan for HTML table fallback. */
  toHtmlTd(): string {
    let attrs = "";
    if (this._colSpan > 1) attrs += ` colspan="${this._colSpan}"`;
    if (this._rowSpan > 1) attrs += ` rowspan="${this._rowSpan}"`;

    // Join paragraphs with a space (mirrors Ruby text_for_html)
    const text = this._rawText
      .trim()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const parts = this.images.map(i => i.toHtml()).filter(html => html !== "");
    if (text !== "") parts.push(text);
    return `<td${attrs}>${parts.join(" ")}</td>`;
  }
}
