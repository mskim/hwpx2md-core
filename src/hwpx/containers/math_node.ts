/// <reference lib="dom" />

import { findAll } from "../ingest/xml";
import { Converter } from "../eq_to_latex/converter";

/**
 * Wraps an hp:equation element. Converts the HWP equation source using the
 * EqToLatex converter (ported from Ruby). Falls back to a fenced
 * `hwp-equation` code block if conversion throws.
 */
export class MathNode {
  private constructor(readonly source: string) {}

  static from(node: Element): MathNode {
    const scriptEl = findAll(node, ".//hp:script")[0];
    const raw = (scriptEl?.textContent ?? "").trim();
    return new MathNode(raw);
  }

  toMarkdown(): string {
    if (this.source === "") return "";
    try {
      return new Converter().convert(this.source, { wrap: "display" });
    } catch (_e) {
      return "```hwp-equation\n" + this.source + "\n```";
    }
  }
}
