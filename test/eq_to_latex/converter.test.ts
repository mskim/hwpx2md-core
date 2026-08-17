import { describe, test, expect, beforeEach } from "vitest";
import { Converter } from "../../src/hwpx/eq_to_latex/converter";
import { Processor } from "../../src/hwpx/eq_to_latex/processor";

describe("EqToLatex::Converter", () => {
  let converter: Converter;

  beforeEach(() => {
    converter = new Converter();
  });

  describe("#convert - basic conversion", () => {
    test("wraps output in dollar signs by default", () => {
      const result = converter.convert("a");
      expect(result.startsWith("$")).toBe(true);
      expect(result.endsWith("$")).toBe(true);
    });

    test("does not wrap in dollar signs when dollarSign: false", () => {
      const result = converter.convert("a", { dollarSign: false });
      expect(result.startsWith("$")).toBe(false);
      expect(result.endsWith("$")).toBe(false);
    });

    test("wraps in display mode with $$", () => {
      const result = converter.convert("a", { wrap: "display" });
      expect(result.startsWith("$$")).toBe(true);
      expect(result.endsWith("$$")).toBe(true);
    });

    test("returns raw with wrap: none", () => {
      const result = converter.convert("a", { wrap: "none" });
      expect(result).toBe("a");
    });
  });

  describe("#convert - fractions (over)", () => {
    test("converts simple fraction", () => {
      const result = converter.convert("a over b", { dollarSign: false });
      expect(result).toContain("\\dfrac");
      expect(result).toContain("{a}");
      expect(result).toContain("{b}");
    });

    test("converts fraction with complex terms", () => {
      const result = converter.convert("{x+1} over {y-1}", { dollarSign: false });
      expect(result).toContain("\\dfrac");
    });
  });

  describe("#convert - square roots (sqrt)", () => {
    test("converts simple sqrt", () => {
      const result = converter.convert("sqrt a", { dollarSign: false });
      expect(result).toContain("\\sqrt");
      expect(result).toContain("{a}");
    });

    test("converts sqrt with index (nth root)", () => {
      const result = converter.convert("sqrt 3 of x", { dollarSign: false });
      expect(result).toContain("\\sqrt");
      expect(result).toContain("[3]");
      expect(result).toContain("{x}");
    });
  });

  describe("#convert - subscript and superscript", () => {
    test("converts subscript (sub)", () => {
      const result = converter.convert("x sub i", { dollarSign: false });
      expect(result).toContain("_");
      expect(result).toContain("{i}");
    });

    test("converts superscript (sup)", () => {
      const result = converter.convert("x sup 2", { dollarSign: false });
      expect(result).toContain("^");
      expect(result).toContain("{2}");
    });
  });

  describe("#convert - Greek letters", () => {
    test("converts lowercase alpha", () => {
      const result = converter.convert("alpha", { dollarSign: false });
      expect(result).toContain("\\alpha");
    });

    test("converts uppercase Alpha", () => {
      const result = converter.convert("Alpha", { dollarSign: false });
      expect(result).toContain("\\mathit {A}");
    });

    test("converts beta", () => {
      const result = converter.convert("beta", { dollarSign: false });
      expect(result).toContain("\\beta");
    });

    test("converts gamma", () => {
      const result = converter.convert("gamma", { dollarSign: false });
      expect(result).toContain("\\gamma");
    });

    test("converts delta", () => {
      const result = converter.convert("delta", { dollarSign: false });
      expect(result).toContain("\\delta");
    });

    test("converts pi", () => {
      const result = converter.convert("pi", { dollarSign: false });
      expect(result).toContain("\\pi");
    });

    test("converts omega", () => {
      const result = converter.convert("omega", { dollarSign: false });
      expect(result).toContain("\\omega");
    });

    test("converts theta", () => {
      const result = converter.convert("theta", { dollarSign: false });
      expect(result).toContain("\\theta");
    });
  });

  describe("#convert - mathematical functions", () => {
    test("converts sin", () => {
      const result = converter.convert("sin", { dollarSign: false });
      expect(result).toContain("\\mathrm {sin}");
    });

    test("converts cos", () => {
      const result = converter.convert("cos", { dollarSign: false });
      expect(result).toContain("\\mathrm {cos}");
    });

    test("converts tan", () => {
      const result = converter.convert("tan", { dollarSign: false });
      expect(result).toContain("\\mathrm {tan}");
    });

    test("converts log", () => {
      const result = converter.convert("log", { dollarSign: false });
      expect(result).toContain("\\mathrm {log}");
    });

    test("converts ln", () => {
      const result = converter.convert("ln", { dollarSign: false });
      expect(result).toContain("\\mathrm {ln}");
    });

    test("converts lim", () => {
      const result = converter.convert("lim", { dollarSign: false });
      expect(result).toContain("\\mathrm {lim}");
    });

    test("converts exp", () => {
      const result = converter.convert("exp", { dollarSign: false });
      expect(result).toContain("\\mathrm {exp}");
    });
  });

  describe("#convert - operators", () => {
    test("converts sum", () => {
      const result = converter.convert("sum", { dollarSign: false });
      expect(result).toContain("\\sum");
    });

    test("converts int (integral)", () => {
      const result = converter.convert("int", { dollarSign: false });
      expect(result).toContain("\\int");
    });

    test("converts oint (contour integral)", () => {
      const result = converter.convert("oint", { dollarSign: false });
      expect(result).toContain("\\oint");
    });

    test("converts prod", () => {
      const result = converter.convert("prod", { dollarSign: false });
      expect(result).toContain("\\prod");
    });
  });

  describe("#convert - comparison operators", () => {
    test("converts leq", () => {
      const result = converter.convert("leq", { dollarSign: false });
      expect(result).toContain("\\leq");
    });

    test("converts geq", () => {
      const result = converter.convert("geq", { dollarSign: false });
      expect(result).toContain("\\geq");
    });

    test("converts neq", () => {
      const result = converter.convert("neq", { dollarSign: false });
      expect(result).toContain("\\neq");
    });

    test("converts approx", () => {
      const result = converter.convert("approx", { dollarSign: false });
      expect(result).toContain("\\approx");
    });

    test("converts equiv", () => {
      const result = converter.convert("equiv", { dollarSign: false });
      expect(result).toContain("\\equiv");
    });
  });

  describe("#convert - set operations", () => {
    test("converts subset", () => {
      const result = converter.convert("subset", { dollarSign: false });
      expect(result).toContain("\\subset");
    });

    test("converts supset", () => {
      const result = converter.convert("supset", { dollarSign: false });
      expect(result).toContain("\\supset");
    });

    test("converts in", () => {
      const result = converter.convert("in", { dollarSign: false });
      expect(result).toContain("\\in");
    });

    test("converts union", () => {
      const result = converter.convert("union", { dollarSign: false });
      expect(result).toContain("\\bigcup");
    });

    test("converts inter", () => {
      const result = converter.convert("inter", { dollarSign: false });
      expect(result).toContain("\\bigcap");
    });
  });

  describe("#convert - arrows", () => {
    test("converts rightarrow", () => {
      const result = converter.convert("rightarrow", { dollarSign: false });
      expect(result).toContain("\\rightarrow");
    });

    test("converts leftarrow", () => {
      const result = converter.convert("leftarrow", { dollarSign: false });
      expect(result).toContain("\\leftarrow");
    });

    test("converts Rightarrow (double)", () => {
      const result = converter.convert("Rightarrow", { dollarSign: false });
      expect(result).toContain("\\Rightarrow");
    });

    test("converts ->", () => {
      const result = converter.convert("->", { dollarSign: false });
      expect(result).toContain("\\to");
    });
  });

  describe("#convert - special symbols", () => {
    test("converts infty", () => {
      const result = converter.convert("infty", { dollarSign: false });
      expect(result).toContain("\\infty");
    });

    test("converts partial", () => {
      const result = converter.convert("partial", { dollarSign: false });
      expect(result).toContain("\\partial");
    });

    test("converts nabla", () => {
      const result = converter.convert("nabla", { dollarSign: false });
      expect(result).toContain("\\nabla");
    });

    test("converts emptyset", () => {
      const result = converter.convert("emptyset", { dollarSign: false });
      expect(result).toContain("\\emptyset");
    });

    test("converts cdots", () => {
      const result = converter.convert("cdots", { dollarSign: false });
      expect(result).toContain("\\cdots");
    });

    test("converts ldots", () => {
      const result = converter.convert("ldots", { dollarSign: false });
      expect(result).toContain("\\ldots");
    });
  });

  describe("#convert - block commands (matrices)", () => {
    test("converts matrix", () => {
      const result = converter.convert("matrix {a # b}", { dollarSign: false });
      expect(result).toContain("\\begin{matrix}");
      expect(result).toContain("\\end{matrix}");
    });

    test("converts pmatrix (parentheses)", () => {
      const result = converter.convert("pmatrix {a # b}", { dollarSign: false });
      expect(result).toContain("\\begin{pmatrix}");
      expect(result).toContain("\\end{pmatrix}");
    });

    test("converts cases", () => {
      const result = converter.convert("cases {a # b}", { dollarSign: false });
      expect(result).toContain("\\begin{cases}");
      expect(result).toContain("\\end{cases}");
    });
  });

  describe("#convert - decorations", () => {
    test("converts bar (overline)", () => {
      const result = converter.convert("bar x", { dollarSign: false });
      expect(result).toContain("\\overline");
    });

    test("converts hat", () => {
      const result = converter.convert("hat x", { dollarSign: false });
      expect(result).toContain("\\hat");
    });

    test("converts vec", () => {
      const result = converter.convert("vec x", { dollarSign: false });
      expect(result).toContain("\\vec");
    });

    test("converts tilde", () => {
      const result = converter.convert("tilde x", { dollarSign: false });
      expect(result).toContain("\\tilde");
    });

    test("converts dot", () => {
      const result = converter.convert("dot x", { dollarSign: false });
      expect(result).toContain("\\dot");
    });
  });

  describe("#convert - complex expressions", () => {
    test("converts fraction with greek letters", () => {
      const result = converter.convert("alpha over beta", { dollarSign: false });
      expect(result).toContain("\\dfrac");
      expect(result).toContain("\\alpha");
      expect(result).toContain("\\beta");
    });

    test("handles plus-minus", () => {
      const result = converter.convert("+-", { dollarSign: false });
      expect(result).toContain("\\pm");
    });

    test("handles times", () => {
      const result = converter.convert("times", { dollarSign: false });
      expect(result).toContain("\\times");
    });
  });
});

describe("Processor#convertBackslashToRoman", () => {
  const processor = new Processor();

  test("converts lone backslash at start of string", () => {
    const result = processor.convertBackslashToRoman("\\ x");
    expect(result).toContain("\\rm");
    expect(result).not.toContain("\\ x");
  });

  test("converts lone backslash after space", () => {
    const result = processor.convertBackslashToRoman("x \\ y");
    expect(result).toContain("\\rm");
  });

  test("does not convert \\sqrt (latex command preserved)", () => {
    const result = processor.convertBackslashToRoman("\\sqrt");
    expect(result).toBe("\\sqrt");
    expect(result).not.toContain("\\rm");
  });

  test("does not convert \\dfrac (latex command preserved)", () => {
    const result = processor.convertBackslashToRoman("\\dfrac");
    expect(result).toBe("\\dfrac");
    expect(result).not.toContain("\\rm");
  });
});
