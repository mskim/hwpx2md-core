/// <reference lib="dom" />

import type { BinItemTable } from "../ingest/bin_items";
import { findAll } from "../ingest/xml";
import type { ImageNode } from "./image_node";
import { TableCell } from "./table_cell";

/**
 * Wraps an hp:tr element. Holds one TableCell per direct hp:tc child.
 * Direct children only — descendants would double-count cells inside
 * any nested tables (which are out of scope per spec §3 Phase 3).
 *
 * Ruby reference: TableRow#to_markdown (without expanded_cells — span
 * handling is deferred per plan Option A).
 */
export class TableRow {
  private constructor(readonly cells: TableCell[]) {}

  static from(node: Element, binItems?: BinItemTable, fixtureBasename?: string): TableRow {
    const cellNodes = findAll(node, "hp:tc");
    return new TableRow(cellNodes.map(c => TableCell.from(c, binItems, fixtureBasename)));
  }

  /** Every image held by this row's cells, for the document's asset manifest. */
  images(): ImageNode[] {
    return this.cells.flatMap(c => c.images);
  }

  /**
   * Returns cells excluding those absorbed by another cell's span.
   * Mirrors Ruby's TableRow#expanded_cells / cells_for_html.
   */
  cellsForHtml(): TableCell[] {
    const skipPositions = new Set<string>();

    for (const cell of this.cells) {
      if (!cell.merged) continue;
      for (let c = 0; c < cell.colSpan; c++) {
        for (let r = 0; r < cell.rowSpan; r++) {
          if (c === 0 && r === 0) continue; // skip own position
          skipPositions.add(`${cell.colAddr + c},${cell.rowAddr + r}`);
        }
      }
    }

    return this.cells.filter(cell => !skipPositions.has(`${cell.colAddr},${cell.rowAddr}`));
  }

  toMarkdown(): string {
    return "| " + this.cells.map(c => c.toMarkdown()).join(" | ") + " |";
  }
}
