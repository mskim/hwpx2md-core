/// <reference lib="dom" />

/**
 * Thin wrapper over an hp:t element's text content. Mirrors Ruby's
 * `Hwpx2md::Elements::Text#content`. Read-only — we never write HWPX.
 */
export class Text {
  private constructor(readonly content: string) {}

  static from(node: Element): Text {
    // hp:t is always a leaf in the HWPX spec; textContent is safe.
    return new Text(node.textContent ?? "");
  }
}
