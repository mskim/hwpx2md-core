/// <reference lib="dom" />

import { ImageNode } from "../containers/image_node";
import { MathNode } from "../containers/math_node";
import type { BinItemTable } from "../ingest/bin_items";
import { findAll } from "../ingest/xml";
import { splitAnswerAndExplanation } from "./answer";
import { type Choice, extractChoices, splitLeadingFigure } from "./choices";
import { EndNote } from "./endnote";
import { normaliseLatex } from "./latex";

export interface Item {
  readonly number: number;
  readonly stem: string;
  readonly figures: string[];
  readonly choices: Choice[];
  readonly type: "multiple_choice" | "short_answer";
  /** 배점, when the paper prints one. 수학 never does; 국어 does on 21% of items. */
  readonly points: number | null;
  readonly answer: string;
  readonly explanation: string;
  readonly mismatch: string | null;
  readonly images: ImageNode[];
}

/** Everything inside a note, a picture or a table belongs to those, not the stem. */
const OWN_RUN =
  ".//hp:run[not(ancestor::hp:pic) and not(ancestor::hp:tbl)" +
  " and not(ancestor::hp:endNote) and not(ancestor::hp:footNote)]";

/**
 * A paragraph's own prose, with its equations in place.
 *
 * Built from the NODE rather than `Paragraph.toMarkdown()`, which cannot serve
 * here for two reasons. Its table branch returns before the equation branch, so
 * item 1 — whose stem sits beside the masthead table — loses its equation and
 * emits only "의 값은?". And it renders the masthead table itself, which is
 * running-head furniture rather than part of the question.
 */
export function stemMarkdown(node: Element): string {
  let out = "";
  for (const run of findAll(node, OWN_RUN)) {
    for (const child of Array.from(run.childNodes) as Element[]) {
      if (child.nodeType !== 1) continue;
      if (child.localName === "t") out += child.textContent ?? "";
      else if (child.localName === "equation") out += MathNode.from(child).toMarkdown();
    }
  }
  return normaliseLatex(out).trim();
}

export interface SourceParagraph {
  readonly node: Element;
  /** Emitted markdown, used to recognise choice paragraphs. */
  readonly markdown: string;
}

/**
 * Groups a track's paragraphs into items.
 *
 * An item opens at a paragraph carrying an endNote and runs to the next one.
 * Everything before its first choice paragraph is stem; the rest are choices,
 * which a 수능 paper splits across the print column.
 */
export function assembleItems(
  paragraphs: readonly SourceParagraph[],
  answerFor: (n: number) => string | undefined,
  binItems?: BinItemTable,
  fixtureBasename?: string,
): Item[] {
  const starts: number[] = [];
  paragraphs.forEach((p, i) => {
    if (findAll(p.node, ".//hp:endNote").length > 0) starts.push(i);
  });

  return starts.map((start, k) => {
    const end = starts[k + 1] ?? paragraphs.length;
    const slice = paragraphs.slice(start, end);
    const note = EndNote.from(
      findAll(slice[0]!.node, ".//hp:endNote")[0]!,
      binItems,
      fixtureBasename,
    );

    const figures: string[] = [];
    const choices: Choice[] = [];
    let stem = "";

    for (const p of slice) {
      const { figure, rest } = splitLeadingFigure(p.markdown);
      const asChoices = extractChoices(p.markdown);
      if (asChoices) {
        if (figure) figures.push(figure);
        choices.push(...asChoices);
        continue;
      }
      if (choices.length > 0) continue; // trailing furniture after the choices
      if (figure) figures.push(figure);
      const own = stemMarkdown(p.node);
      if (own !== "") stem = stem === "" ? own : `${stem}\n\n${own}`;
      void rest;
    }

    // One item in the corpus glues choice ① to the end of its stem paragraph,
    // so the recognised run starts at ②. Recover it rather than emit four
    // choices numbered 2-5.
    if (choices.length > 0 && choices[0]!.index !== 1) {
      const recovered = recoverFirstChoices(stem);
      if (recovered) {
        stem = recovered.stem;
        choices.unshift(...recovered.choices);
      }
    }

    const type = choices.length > 0 ? "multiple_choice" : "short_answer";
    const split = splitAnswerAndExplanation(note.bodyMarkdown, {
      type,
      keyed: answerFor(note.number),
    });

    return {
      number: note.number,
      stem,
      figures,
      choices,
      type,
      points: null,
      answer: split.answer,
      explanation: split.explanation,
      mismatch: split.mismatch,
      images: note.images,
    };
  });
}

/** Splits a trailing `①…` run off a stem that swallowed its first choice. */
function recoverFirstChoices(stem: string): { stem: string; choices: Choice[] } | null {
  const at = stem.indexOf("①");
  if (at < 0) return null;
  const choices = extractChoices(stem.slice(at));
  return choices ? { stem: stem.slice(0, at).trim(), choices } : null;
}
