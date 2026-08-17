/// <reference lib="dom" />

import { findAll } from "../ingest/xml";

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
  ) {}

  static from(node: Element): TableCell {
    // Join paragraph texts with a space (mirrors Ruby text_for_html for multi-paragraph cells)
    const paragraphNodes = findAll(node, ".//hp:p");
    let joined: string;
    if (paragraphNodes.length > 0) {
      const paraTexts = paragraphNodes
        .map(p => {
          const ts = findAll(p, ".//hp:t");
          return ts.map(t => t.textContent ?? "").join("").trim();
        })
        .filter(s => s !== "");
      joined = paraTexts.join(" ");
    } else {
      const texts = findAll(node, ".//hp:t");
      joined = texts.map(t => t.textContent ?? "").join("");
    }

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

    return new TableCell(joined, colSpan, rowSpan, colAddr, rowAddr);
  }

  get colSpan(): number { return this._colSpan; }
  get rowSpan(): number { return this._rowSpan; }

  get merged(): boolean {
    return this._colSpan > 1 || this._rowSpan > 1;
  }

  toMarkdown(): string {
    const trimmed = this._rawText.trim();
    if (trimmed === "") return "&nbsp;";
    return trimmed.replace(/\|/g, "\\|");
  }

  /** Emit <td> with colspan/rowspan for HTML table fallback. */
  toHtmlTd(): string {
    let attrs = "";
    if (this._colSpan > 1) attrs += ` colspan="${this._colSpan}"`;
    if (this._rowSpan > 1) attrs += ` rowspan="${this._rowSpan}"`;

    // Join paragraphs with a space (mirrors Ruby text_for_html)
    const inner = this._rawText
      .trim()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<td${attrs}>${inner}</td>`;
  }
}
