import type { BinItemTable } from "../ingest/bin_items";
/**
 * Wraps an hp:pic element. Resolves a binary-item reference to an asset
 * path and emits `![](<sourceBasename>.assets/<sourceBasename>-<binItemId>.<ext>)`.
 *
 * NOTE: that is NOT what wehangul's PRD §6.1 ("Images → extracted to `images/`")
 * and §6.4 ("extracted once to a shared `images/` … Do not duplicate per chapter")
 * require. An earlier version of this comment claimed `images/`, which read as
 * "already satisfied". It is not, and five unit tests assert the `images/` form
 * and fail because of it. M4 must either rewrite references after conversion or
 * add an `assetsDir` option here — the Ruby gem already takes `assets_dir:`.
 *
 * Note also that `Asset.relativePath` (document.ts) is a BARE FILENAME, so a
 * caller that writes assets at `relativePath` and markdown from `toMarkdown()`
 * gets a BROKEN LINK. The `<sourceBasename>.assets/` prefix exists only here.
 * Whatever M4 chooses has to reconcile the two, not just the `images/` path.
 *
 * Second-order hazard: the source basename is embedded in both the directory and
 * each filename, so `내 책.hwpx` yields `내 책.assets/내 책-image1.jpg` — unescaped
 * Hangul and a space inside a markdown link target.
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
