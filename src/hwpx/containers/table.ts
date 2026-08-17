/// <reference lib="dom" />

import { findAll } from "../ingest/xml";
import { TableRow } from "./table_row";

/**
 * Wraps an hp:tbl element. Renders as GFM pipe table with a default
 * left-aligned separator after row 0.
 *
 * Option A scope (spec §6.3 Phase 2+3 exception, plan §P3):
 * - Always left-align every column (`:---`). No per-column alignment detection.
 * - Always treat row 0 as header. `hp:tbl[repeatHeader]` is ignored.
 * - Falls back to HTML <table> when any cell has colSpan>1 or rowSpan>1.
 *
 * Ruby reference: Table#to_markdown default-separator branch (ignores
 * has_header? and column_alignments).
 */
export class Table {
  private constructor(readonly rows: TableRow[]) {}

  static from(node: Element): Table {
    const trNodes = findAll(node, "hp:tr");
    return new Table(trNodes.map(tr => TableRow.from(tr)));
  }

  /** Returns true if any cell has colSpan>1 or rowSpan>1. */
  hasSpans(): boolean {
    for (const row of this.rows) {
      for (const cell of row.cells) {
        if (cell.colSpan > 1 || cell.rowSpan > 1) return true;
      }
    }
    return false;
  }

  /** Emit raw HTML <table> for tables with spanning cells. */
  toHtmlTable(): string {
    let out = "<table>\n";
    for (const row of this.rows) {
      out += "<tr>" + row.cellsForHtml().map(c => c.toHtmlTd()).join("") + "</tr>\n";
    }
    out += "</table>";
    return out;
  }

  toMarkdown(): string {
    if (this.rows.length === 0) return "";
    if (this.hasSpans()) return this.toHtmlTable();

    const columnCount = this.rows[0].cells.length;
    const separator = "|" + Array(columnCount).fill("---").join("|") + "|";

    const lines = this.rows.map(r => r.toMarkdown());
    lines.splice(1, 0, separator);
    // Mirror Ruby Table#to_markdown: leading \n and trailing \n\n so that when
    // joined by the document's single-\n joiner the table gets proper blank-line
    // spacing (same as Ruby's content.join("\n") with the table's own \n padding).
    return "\n" + lines.join("\n") + "\n\n";
  }
}
