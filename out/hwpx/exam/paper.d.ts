import { type ExamFrontMatter } from "./emit";
import { type Item } from "./item";
import { TRACKS, type Track } from "./tracks";
export interface ExamFile {
    readonly track: Track;
    readonly front: ExamFrontMatter;
    readonly items: Item[];
    readonly markdown: string;
    /** `22-11-실전-미적분.md` */
    readonly filename: string;
}
export interface OpenOptions {
    /** Printed on the paper; falls back to the file's basename. */
    readonly source?: string;
    /** quiz_maker requires it and no 수능 paper states it. */
    readonly grade?: string;
}
/**
 * One 수능 수학 `.hwpx` becomes FOUR markdown files, one per track.
 *
 * A paper holds 공통 plus three electives — 46 items in one file, with 23-30
 * appearing three times over. Splitting is not cosmetic: anything keyed on the
 * item number alone collapses those three into one, which is why
 * quiz_maker_math has an exam_track_splitter of its own.
 */
export declare class ExamPaper {
    static open(sourcePath: string, opts?: OpenOptions): Promise<ExamFile[]>;
}
export { TRACKS };
