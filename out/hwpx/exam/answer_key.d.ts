/** track → problem number → answer, `"1"`–`"5"` for MC or the integer for 단답형. */
export type AnswerKey = ReadonlyMap<string, ReadonlyMap<number, string>>;
export declare function parseAnswerKey(scope: Element): AnswerKey | null;
