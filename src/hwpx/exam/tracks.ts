/// <reference lib="dom" />

import { findAll } from "../ingest/xml";

/** 공통 first, then the three electives in the order the paper prints them. */
export const TRACKS = ["공통", "확률과통계", "미적분", "기하"] as const;
export type Track = (typeof TRACKS)[number];

export interface TrackSection {
  readonly track: Track;
  readonly nodes: Element[];
}

/**
 * Splits a paper's paragraphs into 공통 plus the three electives.
 *
 * `endNote/@number` cannot do this: it runs 1…30, 23…30, 23…30 CONTINUOUSLY, so
 * nothing in the numbering marks where 공통 ends. The body does — each elective
 * section opens with a divider paragraph naming it.
 *
 * A paper has SIX such paragraphs: three opening the sections, and three more
 * clustered together beside the printed answer key at the end. Take the first
 * three; the cluster is a table of contents for the key, not a boundary.
 *
 * Match on the paragraph's RAW text, not on emitted markdown. A pattern anchored
 * on bold markers would need those markers to exist, and they appear only after
 * rendering — where the name is also DOUBLED, because the divider is drawn with
 * two overlapping runs.
 */
export function splitByTrack(paragraphs: readonly Element[]): TrackSection[] {
  const sections: TrackSection[] = [{ track: "공통", nodes: [] }];
  let remaining = TRACKS.slice(1) as readonly Track[];

  for (const p of paragraphs) {
    const name = dividerName(p);
    // Only a divider we are still expecting opens a section; the trailing
    // cluster arrives after all three are used up and is treated as content.
    if (name && remaining.includes(name)) {
      sections.push({ track: name, nodes: [] });
      remaining = remaining.filter(t => t !== name);
      continue;
    }
    sections[sections.length - 1]!.nodes.push(p);
  }

  // Always four sections, even for a paper that has no electives.
  for (const track of remaining) sections.push({ track, nodes: [] });
  return sections;
}

/**
 * The track this paragraph names, if it is a divider.
 *
 * Whitespace is stripped before comparing: the divider writes `확률과 통계` with
 * a space and the answer-key table writes `확률과통계` without one.
 */
function dividerName(p: Element): Track | null {
  const text = findAll(p, ".//hp:t").map(t => t.textContent ?? "").join("").replace(/\s/g, "");
  if (text === "") return null;
  return (TRACKS.slice(1) as readonly Track[]).find(t => t === text) ?? null;
}
