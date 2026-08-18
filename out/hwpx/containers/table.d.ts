import type { BinItemTable } from "../ingest/bin_items";
import type { ImageNode } from "./image_node";
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
export declare class Table {
    readonly rows: TableRow[];
    private constructor();
    static from(node: Element, binItems?: BinItemTable, fixtureBasename?: string): Table;
    /**
     * Every image held by this table's cells.
     *
     * `Paragraph.images` is FREE pics only, and `collectImageAssets` walks it —
     * so without this route the markdown would link plate files that are never
     * written. The gem does not have this problem: its image extractor walks
     * //hp:pic document-wide, which is why the port is the side that would go red.
     */
    images(): ImageNode[];
    /** Returns true if any cell has colSpan>1 or rowSpan>1. */
    hasSpans(): boolean;
    /** Emit raw HTML <table> for tables with spanning cells. */
    toHtmlTable(): string;
    toMarkdown(): string;
}
