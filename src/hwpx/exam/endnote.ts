/// <reference lib="dom" />

import { ImageNode } from "../containers/image_node";
import { MathNode } from "../containers/math_node";
import { Table } from "../containers/table";
import type { BinItemTable } from "../ingest/bin_items";
import { findAll } from "../ingest/xml";
import { normaliseLatex } from "./latex";

/**
 * One `hp:endNote` — in a 수능 exam paper, an item's number, answer and 해설.
 *
 * A separate extractor, deliberately NOT a clone of the footnote path. That path
 * (`paragraph.ts`) collects `hp:t` and nothing else, which is right for a
 * footnote of prose and catastrophic here: endnote bodies across the four exam
 * papers hold 4,867 equations — an average of 27 per item, 132 in the worst —
 * plus 16–26 figures and up to 4 tables each. Cloning it would emit every worked
 * solution as its connecting words with all the mathematics removed, and look
 * like it had worked.
 *
 * The footnote path is also the wrong SHAPE: it emits a `[^n]` reference and
 * queues the body to the document tail, where an answer key does not belong.
 */
export class EndNote {
  private constructor(
    readonly number: number,
    readonly bodyMarkdown: string,
    /** Figures inside the explanation, so the document can write them to disk. */
    readonly images: ImageNode[],
  ) {}

  static from(node: Element, binItems?: BinItemTable, fixtureBasename?: string): EndNote {
    const number = parseInt(node.getAttribute("number") ?? "0", 10);
    const images: ImageNode[] = [];
    let body = "";

    // `hp:subList/hp:p`, single slash. The descendant form also returns the
    // paragraphs inside this note's own table cells — 30 against 12 in one real
    // endnote — so their text would render once in the table and again loose.
    for (const p of findAll(node, "hp:subList/hp:p")) {
      for (const run of findAll(p, "hp:run")) {
        for (const child of Array.from(run.childNodes) as Element[]) {
          if (child.nodeType !== 1) continue;
          switch (child.localName) {
            case "t":
              body += child.textContent ?? "";
              break;
            case "equation":
              body += MathNode.from(child).toMarkdown();
              break;
            case "pic": {
              if (!binItems) break;
              const img = ImageNode.from(child, binItems, fixtureBasename ?? "");
              images.push(img);
              body += img.toMarkdown();
              break;
            }
            case "tbl":
              body += Table.from(child, binItems, fixtureBasename).toMarkdown();
              break;
            default:
              break; // ctrl, secPr, linesegarray …
          }
        }
      }
    }

    return new EndNote(number, normaliseLatex(body), images);
  }
}
