/// <reference lib="dom" />

import * as path from "node:path";
import type { Asset } from "../types";
import { Paragraph } from "./containers/paragraph";
import type { ParagraphContent } from "./containers/paragraph";
import { parseBinItemTable, type BinItemTable } from "./ingest/bin_items";
import { parseCharPrTable, type CharPrTable } from "./ingest/styles";
import { StyleTable } from "./ingest/style_table";
import { findAll, parseXml } from "./ingest/xml";
import { openHwpx } from "./ingest/zip";

/**
 * Opens an HWPX file and exposes its paragraphs as typed containers.
 *
 * Phase 4: parses Contents/content.hpf (bin-item manifest) and
 * Contents/header.xml (character properties) at open time, threads the
 * resulting lookup tables into Paragraph construction, and collects the
 * binary buffers for any referenced images into `assets()`.
 */
export class Document {
  private constructor(
    private readonly _paragraphs: Paragraph[],
    private readonly _assets: Asset[],
    private readonly _footnoteQueue: Array<[string, string]> = [],
  ) {}

  static async open(sourcePath: string, fixtureBasename?: string): Promise<Document> {
    const basename = fixtureBasename ?? path.basename(sourcePath, path.extname(sourcePath));
    const entries = await openHwpx(sourcePath);

    const headerBuf = entries.get("Contents/header.xml");
    const headerDoc = headerBuf ? parseXml(headerBuf) : null;
    const charPrTable: CharPrTable = headerDoc
      ? parseCharPrTable(headerDoc)
      : new Map();
    const styleTable: StyleTable = headerDoc
      ? StyleTable.fromHeader(headerDoc)
      : StyleTable.empty();

    const hpfBuf = entries.get("Contents/content.hpf");
    const binItemTable: BinItemTable = hpfBuf
      ? parseBinItemTable(parseXml(hpfBuf))
      : new Map();

    const sectionNames = [...entries.keys()]
      .filter(name => /^Contents\/section\d+\.xml$/.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const footnoteQueue: Array<[string, string]> = [];
    const paragraphs: Paragraph[] = [];
    for (const name of sectionNames) {
      const buffer = entries.get(name)!;
      const xml = parseXml(buffer);
      for (const p of findAll(xml, "//hs:sec/hp:p")) {
        paragraphs.push(Paragraph.from(p, charPrTable, binItemTable, styleTable, headerDoc ?? undefined, basename, footnoteQueue));
      }
    }

    const assets = collectImageAssets(paragraphs, entries, basename);
    return new Document(paragraphs, assets, footnoteQueue);
  }

  paragraphs(): Paragraph[] {
    return this._paragraphs;
  }

  toMarkdown(): string {
    const rawContent: ParagraphContent[] = this._paragraphs.map(p => p.toMarkdown());

    // Resolve numbered sentinels with per-level sequential counters.
    // Also resolve bullet sentinels to markdown strings.
    const counters: Record<number, number> = {};
    let prevLevel = -1;

    const resolved: string[] = rawContent.map((entry) => {
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
        return `${indent}- ${entry.text}`;
      }

      if (entry.type === "numbered_item") {
        const level = entry.level;
        if (level > prevLevel) {
          counters[level] = 1;
        } else {
          counters[level] = (counters[level] ?? 0) + 1;
          // Reset deeper counters on level decrease
          Object.keys(counters).forEach((k) => {
            if (Number(k) > level) delete counters[Number(k)];
          });
        }
        prevLevel = level;
        const indent = "  ".repeat(level);
        return `${indent}${counters[level]}. ${entry.text}`;
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
    const parts: string[] = [];

    for (let i = 0; i < rawContent.length; i++) {
      const entry = rawContent[i];
      const text = resolved[i];

      const isListItem = typeof entry !== "string" && (entry.type === "bullet_item" || entry.type === "numbered_item");

      if (isListItem) {
        // List items have no trailing \n — the join \n between items provides the line break.
        parts.push(text);
      } else if (text === "") {
        // Empty paragraph: contributes a single \n (the linesegarray newline in Ruby).
        parts.push("\n");
      } else {
        // Regular non-empty block: append trailing \n to simulate Ruby's linesegarray,
        // unless the block already ends with \n (e.g. tables add their own padding).
        parts.push(text.endsWith("\n") ? text : text + "\n");
      }
    }

    let result = parts.join("\n");
    // Ensure the output ends with exactly one newline.
    if (!result.endsWith("\n")) result += "\n";

    // Append GFM footnote definitions in document-position order
    if (this._footnoteQueue.length > 0) {
      result += "\n";
      for (const [num, body] of this._footnoteQueue) {
        result += `[^${num}]: ${body}\n`;
      }
    }

    return result;
  }

  assets(): Asset[] {
    return this._assets;
  }
}

function collectImageAssets(
  paragraphs: Paragraph[],
  entries: Map<string, Buffer>,
  fixtureBasename: string,
): Asset[] {
  const seen = new Set<string>();
  const assets: Asset[] = [];
  for (const p of paragraphs) {
    for (const img of p.images) {
      if (!img.href || seen.has(img.href)) continue;
      const buffer = entries.get(img.href);
      if (!buffer) continue;
      seen.add(img.href);
      const filename = img.assetFilename() ?? (img.href.split("/").pop() ?? img.href);
      assets.push({ relativePath: filename, content: buffer });
    }
  }
  return assets;
}
