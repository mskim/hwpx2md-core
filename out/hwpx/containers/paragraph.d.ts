import type { BinItemTable } from "../ingest/bin_items";
import type { CharPrTable } from "../ingest/styles";
import type { StyleTable } from "../ingest/style_table";
import { ImageNode } from "./image_node";
import { MathNode } from "./math_node";
import { Table } from "./table";
import { TextRun } from "./text_run";
export interface BulletItemSentinel {
    type: "bullet_item";
    level: number;
    text: string;
    /**
     * Free-pic markdown to emit ABOVE this item, not inside it.
     *
     * The gem pushes the image as its own `content` entry and then the sentinel,
     * producing `![](p)\n\n  - text`. Folding the image into `text` would give
     * `- ![](p) text`, which is different bytes. `document.ts` renders this only
     * when present — interpolating it unguarded emits "undefined" into every
     * bullet in the corpus.
     */
    imagePrefix?: string;
}
export interface NumberedItemSentinel {
    type: "numbered_item";
    level: number;
    text: string;
    /** See BulletItemSentinel.imagePrefix. */
    imagePrefix?: string;
}
export type ParagraphContent = string | BulletItemSentinel | NumberedItemSentinel;
export declare class Paragraph {
    readonly textRuns: TextRun[];
    readonly table: Table | null;
    readonly images: ImageNode[];
    readonly equations: MathNode[];
    private readonly styleId;
    private readonly styleTable;
    private readonly paraPrId;
    private readonly headerDoc;
    private readonly _node;
    private readonly _charPrTable;
    private readonly _footnoteQueue;
    private constructor();
    static from(node: Element, charPrTable?: CharPrTable, binItems?: BinItemTable, styleTable?: StyleTable, headerDoc?: Document, fixtureBasename?: string, footnoteQueue?: Array<[string, string]>): Paragraph;
    /**
     * Free pics PLUS any held by this paragraph's table cells — everything that
     * must be written to disk for the markdown's links to resolve.
     *
     * Deliberately not `images`, which stays free-pics-only because that is what
     * `toMarkdown()` emits as a prefix; cells emit their own.
     */
    allImages(): ImageNode[];
    private runTextOnly;
    /**
     * Look up the paraPr's heading info from header.xml.
     * Returns null or { kind: 'bullet' | 'numbered', level: number }.
     *
     * Heuristic: distinguish real numbered lists from heading-style outline numbering.
     * HWPX paraPrs that reference an hh:numbering definition with start="0" are
     * treated as actual lists; start>0 is treated as heading-style and skipped here.
     * (Same heuristic as Ruby Phase 1.)
     */
    private listDescriptorForParaPr;
    /**
     * Free pics first, then the body.
     *
     * The separator is a BLANK LINE, and specifically not a single newline. The
     * gem pushes each image as its own `content` entry and
     * `ImageNode#to_markdown` already ends in "\n", so `content.join("\n")`
     * yields `![](a)\n\n![](b)\n`. That trailing newline in the gem is what this
     * depends on; deleting it there silently breaks parity here.
     */
    toMarkdown(): ParagraphContent;
    private bodyMarkdown;
    /**
     * Renders a paragraph that contains hp:equation nodes inline with text.
     * Walks run children: hp:t → emit text, hp:equation → emit converted LaTeX.
     * Mirrors the Ruby to_txt logic with hp:script handling.
     */
    private renderWithInlineEquations;
    /**
     * Scans the paragraph node for hp:fieldBegin[@type="HYPERLINK"] / hp:fieldEnd pairs.
     * Returns an array of span descriptors mirroring the Ruby scan_hyperlink_spans method.
     */
    private scanHyperlinkSpans;
    /**
     * Renders the text paragraph with hyperlink spans and/or footnotes applied.
     * Mirrors the Ruby to_markdown loop logic.
     */
    private renderWithHyperlinksAndFootnotes;
}
