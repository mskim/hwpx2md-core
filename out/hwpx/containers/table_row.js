"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableRow = void 0;
const xml_1 = require("../ingest/xml");
const table_cell_1 = require("./table_cell");
/**
 * Wraps an hp:tr element. Holds one TableCell per direct hp:tc child.
 * Direct children only — descendants would double-count cells inside
 * any nested tables (which are out of scope per spec §3 Phase 3).
 *
 * Ruby reference: TableRow#to_markdown (without expanded_cells — span
 * handling is deferred per plan Option A).
 */
class TableRow {
    cells;
    constructor(cells) {
        this.cells = cells;
    }
    static from(node, binItems, fixtureBasename) {
        const cellNodes = (0, xml_1.findAll)(node, "hp:tc");
        return new TableRow(cellNodes.map(c => table_cell_1.TableCell.from(c, binItems, fixtureBasename)));
    }
    /** Every image held by this row's cells, for the document's asset manifest. */
    images() {
        return this.cells.flatMap(c => c.images);
    }
    /**
     * Returns cells excluding those absorbed by another cell's span.
     * Mirrors Ruby's TableRow#expanded_cells / cells_for_html.
     */
    cellsForHtml() {
        const skipPositions = new Set();
        for (const cell of this.cells) {
            if (!cell.merged)
                continue;
            for (let c = 0; c < cell.colSpan; c++) {
                for (let r = 0; r < cell.rowSpan; r++) {
                    if (c === 0 && r === 0)
                        continue; // skip own position
                    skipPositions.add(`${cell.colAddr + c},${cell.rowAddr + r}`);
                }
            }
        }
        return this.cells.filter(cell => !skipPositions.has(`${cell.colAddr},${cell.rowAddr}`));
    }
    toMarkdown() {
        return "| " + this.cells.map(c => c.toMarkdown()).join(" | ") + " |";
    }
}
exports.TableRow = TableRow;
//# sourceMappingURL=table_row.js.map