import type { Asset } from "../types";
import { Paragraph } from "./containers/paragraph";
/**
 * Opens an HWPX file and exposes its paragraphs as typed containers.
 *
 * Phase 4: parses Contents/content.hpf (bin-item manifest) and
 * Contents/header.xml (character properties) at open time, threads the
 * resulting lookup tables into Paragraph construction, and collects the
 * binary buffers for any referenced images into `assets()`.
 */
export declare class Document {
    private readonly _paragraphs;
    private readonly _assets;
    private readonly _footnoteQueue;
    private constructor();
    static open(sourcePath: string, fixtureBasename?: string): Promise<Document>;
    paragraphs(): Paragraph[];
    toMarkdown(): string;
    assets(): Asset[];
}
