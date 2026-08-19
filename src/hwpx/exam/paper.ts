/// <reference lib="dom" />

import * as path from "node:path";

// Aliased: the parser's Document would otherwise shadow the DOM Document that
// findAll and parseXml are typed against.
import { Document as HwpxDocument } from "../document";
import { parseBinItemTable } from "../ingest/bin_items";
import { findAll, parseXml } from "../ingest/xml";
import { openHwpx } from "../ingest/zip";
import { parseAnswerKey } from "./answer_key";
import { emitExam, type ExamFrontMatter } from "./emit";
import { assembleItems, type Item, type SourceParagraph } from "./item";
import { splitByTrack, TRACKS, type Track } from "./tracks";

export interface ExamFile {
  readonly track: Track;
  readonly front: ExamFrontMatter;
  readonly items: Item[];
  readonly markdown: string;
  /** `22-11-실전-미적분.md` */
  readonly filename: string;
}

export interface OpenOptions {
  /** Printed on the paper; falls back to the file's basename. */
  readonly source?: string;
  /** quiz_maker requires it and no 수능 paper states it. */
  readonly grade?: string;
}

/**
 * One 수능 수학 `.hwpx` becomes FOUR markdown files, one per track.
 *
 * A paper holds 공통 plus three electives — 46 items in one file, with 23-30
 * appearing three times over. Splitting is not cosmetic: anything keyed on the
 * item number alone collapses those three into one, which is why
 * quiz_maker_math has an exam_track_splitter of its own.
 */
export class ExamPaper {
  static async open(sourcePath: string, opts: OpenOptions = {}): Promise<ExamFile[]> {
    const basename = path.basename(sourcePath, path.extname(sourcePath));
    const entries = await openHwpx(sourcePath);
    const binItems = entries.has("Contents/content.hpf")
      ? parseBinItemTable(parseXml(entries.get("Contents/content.hpf")!))
      : new Map();

    // The rendered markdown recognises choice paragraphs; the nodes carry the
    // endnotes and the stems. Both are needed, in step.
    const doc = await HwpxDocument.open(sourcePath, basename);
    const rendered = doc.paragraphs().map(p => String(p.toMarkdown()));

    const nodes: Element[] = [];
    for (const name of [...entries.keys()].filter(n => /^Contents\/section\d+\.xml$/.test(n)).sort()) {
      nodes.push(...findAll(parseXml(entries.get(name)!), "//hs:sec/hp:p"));
    }

    const key = parseAnswerKey(parseXml(entries.get("Contents/section0.xml")!));
    const source = opts.source ?? basename;

    const byNode = new Map<Element, SourceParagraph>();
    nodes.forEach((node, i) => byNode.set(node, { node, markdown: rendered[i] ?? "" }));

    return splitByTrack(nodes).map(section => {
      const paragraphs = section.nodes
        .map(n => byNode.get(n))
        .filter((p): p is SourceParagraph => p !== undefined);

      const items = assembleItems(
        paragraphs,
        n => key?.get(section.track)?.get(n),
        binItems,
        basename,
      );

      const front: ExamFrontMatter = {
        kind: "exam",
        subject: "수학",
        track: section.track,
        source,
        ...(opts.grade ? { grade: opts.grade } : {}),
      };

      return {
        track: section.track,
        front,
        items,
        markdown: emitExam(front, items),
        filename: `${slug(source)}-${section.track}.md`,
      };
    });
  }
}

/** `2022-11 실전` → `2022-11-실전`, so four files sit together in a listing. */
function slug(source: string): string {
  return source.trim().replace(/\s+/g, "-").replace(/[/\\:*?"<>|]/g, "_");
}

export { TRACKS };
