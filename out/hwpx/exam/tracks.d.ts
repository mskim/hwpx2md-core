/** 공통 first, then the three electives in the order the paper prints them. */
export declare const TRACKS: readonly ["공통", "확률과통계", "미적분", "기하"];
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
export declare function splitByTrack(paragraphs: readonly Element[]): TrackSection[];
