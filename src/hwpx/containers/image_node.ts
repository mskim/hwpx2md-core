/// <reference lib="dom" />

import type { BinItemTable } from "../ingest/bin_items";
import { findAll } from "../ingest/xml";

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
export class ImageNode {
  private constructor(
    readonly binItemId: string | null,
    readonly href: string | null,
    private readonly fixtureBasename: string,
  ) {}

  static from(node: Element, binItems: BinItemTable, fixtureBasename: string): ImageNode {
    // Use plain descendant XPath then filter in TS, rather than an XPath
    // attribute predicate (`.//hc:img[@binaryItemIDRef]`) — the xpath
    // package's predicate support is reliable for simple bracketed
    // expressions but silently returns zero for unsupported forms, and
    // filtering explicitly here is diagnosable.
    const hcImg = findAll(node, ".//hc:img").find(el =>
      el.hasAttribute("binaryItemIDRef"),
    );
    const hpImg = findAll(node, ".//hp:img").find(el =>
      el.hasAttribute("binItemIDRef"),
    );
    const id =
      hcImg?.getAttribute("binaryItemIDRef") ??
      hpImg?.getAttribute("binItemIDRef") ??
      null;
    const href = id ? (binItems.get(id)?.href ?? null) : null;
    return new ImageNode(id, href, fixtureBasename);
  }

  /**
   * Returns the canonical asset filename: `<fixture>-<binItemId>.<ext>`.
   * e.g. "image_hc-image1.png" for fixture "image_hc" with binItemId "image1".
   */
  assetFilename(): string | null {
    if (!this.binItemId || !this.href) return null;
    const ext = this.href.split(".").pop() ?? "";
    return `${this.fixtureBasename}-${this.binItemId}.${ext}`;
  }

  toMarkdown(): string {
    const filename = this.assetFilename();
    if (!filename) return "";
    return `![](${this.fixtureBasename}.assets/${filename})`;
  }
}
