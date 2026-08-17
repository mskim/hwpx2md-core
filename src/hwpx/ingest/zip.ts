import * as fs from "node:fs/promises";
import JSZip from "jszip";

/**
 * Reads the HWPX (zip) file at `sourcePath` and returns a map from entry
 * name to its raw Buffer contents. Directories are skipped.
 *
 * HWPX files are small (<10 MB typical) so we read the whole archive into
 * memory; no streaming.
 */
export async function openHwpx(sourcePath: string): Promise<Map<string, Buffer>> {
  const buffer = await fs.readFile(sourcePath);
  const zip = await JSZip.loadAsync(buffer);
  const out = new Map<string, Buffer>();
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    out.set(name, Buffer.from(await entry.async("nodebuffer")));
  }
  return out;
}
