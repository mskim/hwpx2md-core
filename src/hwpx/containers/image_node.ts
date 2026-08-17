/// <reference lib="dom" />

import type { BinItemTable } from "../ingest/bin_items";
import { findAll } from "../ingest/xml";

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
