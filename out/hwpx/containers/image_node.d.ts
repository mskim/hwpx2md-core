import type { BinItemTable } from "../ingest/bin_items";
/**
 * Wraps an hp:pic element. Resolves a binary-item reference to an asset
 * path and emits `![](images/<basename>)` markdown.
 *
 * Phase 4 scope (Option C1):
 * - Empty alt text (no caption extraction).
 * - No width/height attributes.
 * - Resolves both the current `<hc:img binaryItemIDRef="...">` form and the
 *   older `<hp:img binItemIDRef="...">` form. Either populates `.binItemId`.
 */
export declare class ImageNode {
    readonly binItemId: string | null;
    readonly href: string | null;
    private readonly fixtureBasename;
    private constructor();
    static from(node: Element, binItems: BinItemTable, fixtureBasename: string): ImageNode;
    /**
     * Returns the canonical asset filename: `<fixture>-<binItemId>.<ext>`.
     * e.g. "image_hc-image1.png" for fixture "image_hc" with binItemId "image1".
     */
    assetFilename(): string | null;
    toMarkdown(): string;
}
