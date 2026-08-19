import type { Item } from "./item";

export interface ExamFrontMatter {
  readonly kind: "exam";
  readonly subject: string;
  readonly track: string;
  readonly source: string;
  /** quiz_maker requires it and no 수능 paper states it — supplied at import. */
  readonly grade?: string;
}

/**
 * One track's markdown, in the convention.
 *
 * Nothing here escapes: stems and explanations are built from `textContent` and
 * `MathNode`, neither of which routes through `escapeInline`. That is
 * deliberate — the shared escaper turns `[3점]` into `\[3점\]` and `[출제의도]`
 * into `\[출제의도\]`, which breaks the round-trip AND quiz_maker's
 * `Question.extract_intent`. Widening the escaper's exemptions would touch the
 * path three goldens depend on; emitting exam text unescaped does not.
 */
export function emitExam(front: ExamFrontMatter, items: readonly Item[]): string {
  const parts: string[] = [frontMatter(front)];
  for (const item of items) parts.push(emitItem(item));
  return `${parts.join("\n\n")}\n`;
}

function frontMatter(f: ExamFrontMatter): string {
  const lines = [
    `kind: ${f.kind}`,
    `subject: ${f.subject}`,
    `track: ${f.track}`,
    `source: ${f.source}`,
  ];
  if (f.grade) lines.push(`grade: ${f.grade}`);
  return `---\n${lines.join("\n")}\n---`;
}

function emitItem(item: Item): string {
  const heading = item.points ? `## ${item.number}  [${item.points}점]` : `## ${item.number}`;
  const blocks: string[] = [heading];

  if (item.stem !== "") blocks.push(item.stem);
  for (const figure of item.figures) blocks.push(figure);

  if (item.choices.length > 0) {
    blocks.push(item.choices.map(c => `${c.index}. ${c.text}`).join("\n"));
  }

  blocks.push("### 정답", item.answer);

  if (item.explanation !== "") {
    // A blockquote, so a reader can tell solution from question at a glance —
    // and NOT a fenced code block, which would render the 해설's equations as
    // literal text. They carry 27 of them on average.
    blocks.push("### 해설", quote(item.explanation));
  }
  return blocks.join("\n\n");
}

function quote(text: string): string {
  return text
    .split("\n")
    .map(line => (line === "" ? ">" : `> ${line}`))
    .join("\n");
}
