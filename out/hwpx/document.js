"use strict";
/// <reference lib="dom" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
const path = __importStar(require("node:path"));
const paragraph_1 = require("./containers/paragraph");
const bin_items_1 = require("./ingest/bin_items");
const styles_1 = require("./ingest/styles");
const style_table_1 = require("./ingest/style_table");
const xml_1 = require("./ingest/xml");
const zip_1 = require("./ingest/zip");
/**
 * Opens an HWPX file and exposes its paragraphs as typed containers.
 *
 * Phase 4: parses Contents/content.hpf (bin-item manifest) and
 * Contents/header.xml (character properties) at open time, threads the
 * resulting lookup tables into Paragraph construction, and collects the
 * binary buffers for any referenced images into `assets()`.
 */
class Document {
    _paragraphs;
    _assets;
    _footnoteQueue;
    constructor(_paragraphs, _assets, _footnoteQueue = []) {
        this._paragraphs = _paragraphs;
        this._assets = _assets;
        this._footnoteQueue = _footnoteQueue;
    }
    static async open(sourcePath, fixtureBasename) {
        const basename = fixtureBasename ?? path.basename(sourcePath, path.extname(sourcePath));
        const entries = await (0, zip_1.openHwpx)(sourcePath);
        const headerBuf = entries.get("Contents/header.xml");
        const headerDoc = headerBuf ? (0, xml_1.parseXml)(headerBuf) : null;
        const charPrTable = headerDoc
            ? (0, styles_1.parseCharPrTable)(headerDoc)
            : new Map();
        const styleTable = headerDoc
            ? style_table_1.StyleTable.fromHeader(headerDoc)
            : style_table_1.StyleTable.empty();
        const hpfBuf = entries.get("Contents/content.hpf");
        const binItemTable = hpfBuf
            ? (0, bin_items_1.parseBinItemTable)((0, xml_1.parseXml)(hpfBuf))
            : new Map();
        const sectionNames = [...entries.keys()]
            .filter(name => /^Contents\/section\d+\.xml$/.test(name))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const footnoteQueue = [];
        const paragraphs = [];
        for (const name of sectionNames) {
            const buffer = entries.get(name);
            const xml = (0, xml_1.parseXml)(buffer);
            for (const p of (0, xml_1.findAll)(xml, "//hs:sec/hp:p")) {
                paragraphs.push(paragraph_1.Paragraph.from(p, charPrTable, binItemTable, styleTable, headerDoc ?? undefined, basename, footnoteQueue));
            }
        }
        const assets = collectImageAssets(paragraphs, entries, basename);
        return new Document(paragraphs, assets, footnoteQueue);
    }
    paragraphs() {
        return this._paragraphs;
    }
    toMarkdown() {
        const rawContent = this._paragraphs.map(p => p.toMarkdown());
        // Resolve numbered sentinels with per-level sequential counters.
        // Also resolve bullet sentinels to markdown strings.
        const counters = {};
        let prevLevel = -1;
        const resolved = rawContent.map((entry) => {
            if (typeof entry === "string") {
                // Reset list counter tracking on non-list content
                prevLevel = -1;
                Object.keys(counters).forEach(k => delete counters[Number(k)]);
                return entry;
            }
            if (entry.type === "bullet_item") {
                const indent = "  ".repeat(entry.level);
                // Reset numbered counters when we hit a bullet
                prevLevel = -1;
                Object.keys(counters).forEach(k => delete counters[Number(k)]);
                return withImagePrefix(entry.imagePrefix, `${indent}- ${entry.text}`);
            }
            if (entry.type === "numbered_item") {
                const level = entry.level;
                if (level > prevLevel) {
                    counters[level] = 1;
                }
                else {
                    counters[level] = (counters[level] ?? 0) + 1;
                    // Reset deeper counters on level decrease
                    Object.keys(counters).forEach((k) => {
                        if (Number(k) > level)
                            delete counters[Number(k)];
                    });
                }
                prevLevel = level;
                const indent = "  ".repeat(level);
                return withImagePrefix(entry.imagePrefix, `${indent}${counters[level]}. ${entry.text}`);
            }
            return "";
        });
        // Mirror the Ruby to_txt approach: join all content items with a single "\n".
        // - Empty paragraphs (source blank lines) contribute "\n" (their linesegarray newline).
        // - Non-empty, non-list paragraphs contribute "text\n" (text + paragraph-end newline).
        // - List items contribute "- text" / "N. text" with NO trailing "\n".
        // This ensures list items separated by one empty paragraph produce exactly
        // 2 blank lines (matching Ruby's canonical output), rather than the 3 blank
        // lines that \n\n-joining of a flushed list block would generate.
        const parts = [];
        for (let i = 0; i < rawContent.length; i++) {
            const entry = rawContent[i];
            const text = resolved[i];
            const isListItem = typeof entry !== "string" && (entry.type === "bullet_item" || entry.type === "numbered_item");
            if (isListItem) {
                // List items have no trailing \n — the join \n between items provides the line break.
                parts.push(text);
            }
            else if (text === "") {
                // Empty paragraph: contributes a single \n (the linesegarray newline in Ruby).
                parts.push("\n");
            }
            else {
                // Regular non-empty block: append trailing \n to simulate Ruby's linesegarray,
                // unless the block already ends with \n (e.g. tables add their own padding).
                parts.push(text.endsWith("\n") ? text : text + "\n");
            }
        }
        let result = parts.join("\n");
        // Ensure the output ends with exactly one newline.
        if (!result.endsWith("\n"))
            result += "\n";
        // Append GFM footnote definitions in document-position order
        if (this._footnoteQueue.length > 0) {
            result += "\n";
            for (const [num, body] of this._footnoteQueue) {
                result += `[^${num}]: ${body}\n`;
            }
        }
        return result;
    }
    assets() {
        return this._assets;
    }
}
exports.Document = Document;
/**
 * A list item's free pics go ABOVE the item, matching the gem, which pushes the
 * image as its own `content` entry and then the sentinel.
 *
 * GUARDED, not interpolated. `${entry.imagePrefix}` on a sentinel without one
 * renders the string "undefined" into every bullet in the corpus.
 */
function withImagePrefix(prefix, line) {
    return prefix ? `${prefix}\n\n${line}` : line;
}
function collectImageAssets(paragraphs, entries, fixtureBasename) {
    const seen = new Set();
    const assets = [];
    for (const p of paragraphs) {
        for (const img of p.images) {
            if (!img.href || seen.has(img.href))
                continue;
            const buffer = entries.get(img.href);
            if (!buffer)
                continue;
            seen.add(img.href);
            const filename = img.assetFilename() ?? (img.href.split("/").pop() ?? img.href);
            assets.push({ relativePath: filename, content: buffer });
        }
    }
    return assets;
}
//# sourceMappingURL=document.js.map