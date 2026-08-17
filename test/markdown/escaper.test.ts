import { describe, test, expect } from "vitest";
import { escapeInline, escapeParagraphStart, escapeTableCell } from "../../src/hwpx/markdown/escaper";

describe("escapeInline", () => {
  test("backslash", () => expect(escapeInline("\\")).toBe("\\\\"));
  test("asterisk", () => expect(escapeInline("*")).toBe("\\*"));
  test("multiple specials", () => expect(escapeInline("[*]")).toBe("\\[\\*\\]"));
  test("plain text unchanged", () => expect(escapeInline("hello")).toBe("hello"));
});

describe("escapeParagraphStart", () => {
  test("hash at start", () => expect(escapeParagraphStart("# heading")).toBe("\\# heading"));
  test("gt at start", () => expect(escapeParagraphStart("> quote")).toBe("\\> quote"));
  test("hash mid-text", () => expect(escapeParagraphStart("foo # bar")).toBe("foo # bar"));
});

describe("escapeTableCell", () => {
  test("pipe inside cell", () => expect(escapeTableCell("a|b")).toBe("a\\|b"));
});
