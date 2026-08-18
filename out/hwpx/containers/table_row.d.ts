import type { BinItemTable } from "../ingest/bin_items";
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
export declare class TableRow {
    readonly cells: TableCell[];
    private constructor();
    static from(node: Element, binItems?: BinItemTable, fixtureBasename?: string): TableRow;
    /** Every image held by this row's cells, for the document's asset manifest. */
    images(): ImageNode[];
    /**
     * Returns cells excluding those absorbed by another cell's span.
     * Mirrors Ruby's TableRow#expanded_cells / cells_for_html.
     */
    cellsForHtml(): TableCell[];
    toMarkdown(): string;
}
