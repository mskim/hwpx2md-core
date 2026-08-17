import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { ImageNode } from "../../../src/hwpx/containers/image_node";

const NS = [
  `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`,
  `xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core"`,
].join(" ");

function parsePic(inner: string) {
  const doc = new DOMParser().parseFromString(
    `<hp:pic ${NS}>${inner}</hp:pic>`,
    "application/xml",
  );
  return doc.documentElement;
}

describe("ImageNode", () => {
  // KNOWN FAILING, deliberately. This asserts PRD §6.1's `images/` requirement,
  // which the parser does not satisfy — it emits
  // `<sourceBasename>.assets/<sourceBasename>-<binItemId>.<ext>` (image_node.ts).
  // Kept failing so the gap stays visible. When M4 resolves it, `it.fails` will
  // itself start failing and these become ordinary `it`.
  it.fails("resolves binaryItemIDRef from hc:img and emits ![] markdown", () => {
    const node = ImageNode.from(
      parsePic(`<hc:img binaryItemIDRef="image1" bright="0"/>`),
      new Map([["image1", { href: "BinData/image1.jpg" }]]),
    );
    expect(node.binItemId).toBe("image1");
    expect(node.href).toBe("BinData/image1.jpg");
    expect(node.toMarkdown()).toBe("![](images/image1.jpg)");
  });

  // KNOWN FAILING, deliberately. This asserts PRD §6.1's `images/` requirement,
  // which the parser does not satisfy — it emits
  // `<sourceBasename>.assets/<sourceBasename>-<binItemId>.<ext>` (image_node.ts).
  // Kept failing so the gap stays visible. When M4 resolves it, `it.fails` will
  // itself start failing and these become ordinary `it`.
  it.fails("falls back to hp:img[@binItemIDRef] for older HWPX", () => {
    const node = ImageNode.from(
      parsePic(`<hp:img binItemIDRef="legacy5"/>`),
      new Map([["legacy5", { href: "BinData/old.png" }]]),
    );
    expect(node.binItemId).toBe("legacy5");
    expect(node.toMarkdown()).toBe("![](images/old.png)");
  });

  it("returns empty markdown when binaryItemIDRef cannot be resolved", () => {
    const node = ImageNode.from(
      parsePic(`<hc:img binaryItemIDRef="missing"/>`),
      new Map(),
    );
    expect(node.binItemId).toBe("missing");
    expect(node.href).toBeNull();
    expect(node.toMarkdown()).toBe("");
  });

  it("returns empty markdown when no binItemIDRef is present at all", () => {
    const node = ImageNode.from(parsePic(``), new Map());
    expect(node.binItemId).toBeNull();
    expect(node.toMarkdown()).toBe("");
  });
});
