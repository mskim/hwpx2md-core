import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { Text } from "../../../src/hwpx/elements/text";

const SAMPLE = new DOMParser().parseFromString(
  `<hp:t xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">hello</hp:t>`,
  "application/xml",
);

describe("Text", () => {
  it("extracts content from an hp:t element", () => {
    const t = Text.from(SAMPLE.documentElement);
    expect(t.content).toBe("hello");
  });

  it("returns empty string for an empty hp:t element", () => {
    const empty = new DOMParser().parseFromString(
      `<hp:t xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"/>`,
      "application/xml",
    );
    const t = Text.from(empty.documentElement);
    expect(t.content).toBe("");
  });
});
