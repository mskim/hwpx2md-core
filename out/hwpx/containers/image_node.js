"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageNode = void 0;
const xml_1 = require("../ingest/xml");
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
 * - Alt text comes from the pic's own hp:caption (see `caption()`).
 * - No width/height attributes.
 * - Resolves both the current `<hc:img binaryItemIDRef="...">` form and the
 *   older `<hp:img binItemIDRef="...">` form. Either populates `.binItemId`.
 */
class ImageNode {
    binItemId;
    href;
    fixtureBasename;
    node;
    constructor(binItemId, href, fixtureBasename, 
    /** Retained so `caption()` can be read lazily, at markdown time. */
    node) {
        this.binItemId = binItemId;
        this.href = href;
        this.fixtureBasename = fixtureBasename;
        this.node = node;
    }
    static from(node, binItems, fixtureBasename) {
        // Use plain descendant XPath then filter in TS, rather than an XPath
        // attribute predicate (`.//hc:img[@binaryItemIDRef]`) — the xpath
        // package's predicate support is reliable for simple bracketed
        // expressions but silently returns zero for unsupported forms, and
        // filtering explicitly here is diagnosable.
        const hcImg = (0, xml_1.findAll)(node, ".//hc:img").find(el => el.hasAttribute("binaryItemIDRef"));
        const hpImg = (0, xml_1.findAll)(node, ".//hp:img").find(el => el.hasAttribute("binItemIDRef"));
        const id = hcImg?.getAttribute("binaryItemIDRef") ??
            hpImg?.getAttribute("binItemIDRef") ??
            null;
        const href = id ? (binItems.get(id)?.href ?? null) : null;
        return new ImageNode(id, href, fixtureBasename, node);
    }
    /**
     * Returns the canonical asset filename: `<fixture>-<binItemId>.<ext>`.
     * e.g. "image_hc-image1.png" for fixture "image_hc" with binItemId "image1".
     */
    assetFilename() {
        if (!this.binItemId || !this.href)
            return null;
        const ext = this.href.split(".").pop() ?? "";
        return `${this.fixtureBasename}-${this.binItemId}.${ext}`;
    }
    /**
     * The pic's caption, which is this image's alt text — and NOT part of the
     * prose of the paragraph the image sits in. It lives at
     * `hp:pic > hp:caption > hp:subList > hp:p > hp:run > hp:t`, which every
     * descendant-axis query in `Paragraph` and `TextRun` used to reach; see the
     * `not(ancestor::hp:pic)` scoping there for the other half of this.
     *
     * EVERY `hp:t`, joined, not just the first. The Ruby gem took `at_xpath`, and
     * that is indistinguishable from correct across all 11 captions in the
     * reference book only because the extra nodes are whitespace — a caption
     * split across two styled runs silently loses everything after the first.
     *
     * Returns "" rather than null for an absent or whitespace-only caption, so
     * callers interpolate it directly.
     */
    caption() {
        return (0, xml_1.findAll)(this.node, ".//hp:caption//hp:t")
            .map(t => t.textContent ?? "")
            .join("")
            .trim();
    }
    toMarkdown() {
        const filename = this.assetFilename();
        if (!filename)
            return "";
        return `![${this.caption()}](${this.fixtureBasename}.assets/${filename})`;
    }
}
exports.ImageNode = ImageNode;
//# sourceMappingURL=image_node.js.map