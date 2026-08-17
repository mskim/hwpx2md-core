/// <reference lib="dom" />

import { findAll } from "./xml";

const TOC_HEADING_LEVEL: Record<string, number> = {
  "차례 제목": 1,
  "차례 1": 2,
  "차례 2": 3,
  "차례 3": 4,
};

export class StyleTable {
  private readonly names: Map<string, string>;

  private constructor(names: Map<string, string>) {
    this.names = names;
  }

  static empty(): StyleTable {
    return new StyleTable(new Map());
  }

  static fromHeader(headerDoc: Document): StyleTable {
    const names = new Map<string, string>();
    for (const styleEl of findAll(headerDoc, "//hh:style")) {
      const id = styleEl.getAttribute("id");
      const name = styleEl.getAttribute("name");
      if (id != null && name != null) {
        names.set(id, name);
      }
    }
    return new StyleTable(names);
  }

  nameFor(id: string): string | undefined {
    return this.names.get(id);
  }

  headingLevelFor(id: string): number | undefined {
    const name = this.nameFor(id);
    if (name == null) return undefined;
    return TOC_HEADING_LEVEL[name];
  }
}
