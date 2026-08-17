import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { MathNode } from "../../../src/hwpx/containers/math_node";

const NS = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;

function parseEquation(inner: string) {
  const doc = new DOMParser().parseFromString(
    `<hp:equation ${NS}>${inner}</hp:equation>`,
    "application/xml",
  );
  return doc.documentElement;
}

describe("MathNode", () => {
  it("converts equation source to display LaTeX via EqToLatex", () => {
    const node = MathNode.from(
      parseEquation(`<hp:script>{3x} over {y+z+b}</hp:script>`),
    );
    expect(node.source).toBe("{3x} over {y+z+b}");
    // EqToLatex converts "over" to \dfrac with display wrap
    expect(node.toMarkdown()).toBe("$$\\dfrac {3x}{y+z+b}$$");
  });

  it("converts simple equation source to display LaTeX", () => {
    const node = MathNode.from(
      parseEquation(`<hp:script>   a + b   </hp:script>`),
    );
    expect(node.source).toBe("a + b");
    // Simple expression passes through EqToLatex unchanged
    expect(node.toMarkdown()).toBe("$$a + b$$");
  });

  it("returns empty string when no hp:script is present", () => {
    const node = MathNode.from(parseEquation(`<hp:shapeComment>수식</hp:shapeComment>`));
    expect(node.source).toBe("");
    expect(node.toMarkdown()).toBe("");
  });

  it("returns empty string when hp:script is empty", () => {
    const node = MathNode.from(parseEquation(`<hp:script></hp:script>`));
    expect(node.source).toBe("");
    expect(node.toMarkdown()).toBe("");
  });
});
