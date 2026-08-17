/// <reference lib="dom" />

import { findAll } from "./xml";

export interface StyleFlags {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strikethrough: boolean;
  readonly supscript: boolean;
  readonly subscript: boolean;
}

export type CharPrTable = ReadonlyMap<string, StyleFlags>;

/**
 * Parse `Contents/header.xml` and return a lookup from charPr id to its
 * style flags. Recognises bold (`<hh:bold/>`), italic (`<hh:italic/>`), and
 * underline (`<hh:underline type="..."/>` where type != "NONE").
 *
 * Other charPr properties (color, size, ratio, etc.) are intentionally
 * ignored for Phase 4 Option C1 scope.
 */
export function parseCharPrTable(xmldoc: Document): CharPrTable {
  const table = new Map<string, StyleFlags>();
  for (const charPr of findAll(xmldoc, "//hh:charPr")) {
    const id = charPr.getAttribute("id");
    if (!id) continue;
    const bold = findAll(charPr, "hh:bold").length > 0;
    const italic = findAll(charPr, "hh:italic").length > 0;
    const underlineEls = findAll(charPr, "hh:underline");
    const underline =
      underlineEls.length > 0 && underlineEls[0].getAttribute("type") !== "NONE";
    const strikeoutEls = findAll(charPr, "hh:strikeout");
    const strikethrough =
      strikeoutEls.length > 0 && strikeoutEls[0].getAttribute("shape") !== "NONE";
    const supscript = findAll(charPr, "hh:supscript").length > 0;
    const subscript = findAll(charPr, "hh:subscript").length > 0;
    table.set(id, { bold, italic, underline, strikethrough, supscript, subscript });
  }
  return table;
}
