/// <reference lib="dom" />

import { Text } from "../elements/text";
import type { CharPrTable, StyleFlags } from "../ingest/styles";
import { findAll } from "../ingest/xml";
import { escapeInline } from "../markdown/escaper";

const NO_STYLE: StyleFlags = { bold: false, italic: false, underline: false, strikethrough: false, supscript: false, subscript: false };

/**
 * Wraps an hp:run element. Phase 2 exposed only concatenated text; Phase 4
 * adds `toMarkdown()` which applies inline Markdown style markers when the
 * caller passes a charPr lookup table to `from()`.
 *
 * Style ordering: if both bold and italic, emit `***text***` (outer triple).
 * If underline combines with any other style, underline wraps on the outside:
 *   bold + underline    → `<u>**text**</u>`
 *   italic + underline  → `<u>*text*</u>`
 *   all three           → `<u>***text***</u>`
 *
 * Styling combinations beyond bold/italic/underline are out of Phase 4 scope.
 */
export class TextRun {
  private constructor(
    private readonly _texts: Text[],
    private readonly _style: StyleFlags,
  ) {}

  static from(node: Element, charPrTable?: CharPrTable): TextRun {
    // NOT into an hp:pic. A pic carries its caption at
    // hp:pic > hp:caption > hp:subList > hp:p > hp:run > hp:t, and a bare
    // `.//hp:t` reaches it — splicing the caption into the middle of the
    // sentence the image sits beside:
    //   "…훌륭한 우리나" + "이 태 섭" + "라는 고조선(古朝鮮)에 이어…"
    // Caption text is the image's alt text (ImageNode.caption()) and nothing else.
    const textNodes = findAll(node, ".//hp:t[not(ancestor::hp:pic)]");
    const ref = node.getAttribute("charPrIDRef") ?? "";
    const style = (charPrTable && charPrTable.get(ref)) ?? NO_STYLE;
    return new TextRun(textNodes.map(t => Text.from(t)), style);
  }

  get text(): string {
    return this._texts.map(t => t.content).join("\n");
  }

  toMarkdown(): string {
    const raw = this.text;
    if (raw === "") return "";
    const escaped = escapeInline(raw);
    return applyStyles(escaped, this._style);
  }
}

function applyStyles(text: string, s: StyleFlags): string {
  let out = text;
  if (s.bold && s.italic) out = `***${out}***`;
  else if (s.bold) out = `**${out}**`;
  else if (s.italic) out = `*${out}*`;
  if (s.strikethrough) out = `~~${out}~~`;
  if (s.supscript) out = `<sup>${out}</sup>`;
  if (s.subscript) out = `<sub>${out}</sub>`;
  if (s.underline) out = `<u>${out}</u>`;
  return out;
}
