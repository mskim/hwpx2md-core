import { describe, expect, it } from "vitest";

import { findAll, parseXml } from "../../../src/hwpx/ingest/xml";

const SAMPLE_XML = Buffer.from(
  `<?xml version="1.0" encoding="UTF-8"?>
   <hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"
           xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
     <hp:p><hp:run><hp:t>hello</hp:t></hp:run></hp:p>
     <hp:p><hp:run><hp:t>world</hp:t></hp:run></hp:p>
   </hs:sec>`,
  "utf8",
);

describe("ingest/xml", () => {
  it("parses XML into a DOM Document", () => {
    const doc = parseXml(SAMPLE_XML);
    expect(doc.documentElement).toBeTruthy();
    expect(doc.documentElement.localName).toBe("sec");
  });

  it("finds all hp:p elements by namespace-aware xpath", () => {
    const doc = parseXml(SAMPLE_XML);
    const paragraphs = findAll(doc, "//hp:p");
    expect(paragraphs).toHaveLength(2);
  });

  it("finds descendant elements from a subtree", () => {
    const doc = parseXml(SAMPLE_XML);
    const firstP = findAll(doc, "//hp:p")[0];
    const texts = findAll(firstP, ".//hp:t");
    expect(texts).toHaveLength(1);
    expect(texts[0].textContent).toBe("hello");
  });
});
