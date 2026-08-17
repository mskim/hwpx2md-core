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
    static from(node: Element): Table;
    /** Returns true if any cell has colSpan>1 or rowSpan>1. */
    hasSpans(): boolean;
    /** Emit raw HTML <table> for tables with spanning cells. */
    toHtmlTable(): string;
    toMarkdown(): string;
}
