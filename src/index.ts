import { Document } from "./hwpx/document";
import type { ConversionResult, Converter } from "./types";

/**
 * Native TypeScript HWPX converter.
 *
 * Extracted from the hwpx2md VS Code extension. The extension's own
 * `getHwpxConverter(extensionRoot: vscode.Uri)` is now a thin adapter over
 * `createHwpxConverter()`; it still takes and still ignores the Uri.
 */
class HwpxConverter implements Converter {
  readonly name = "typescript:hwpx2md";

  async convert(sourcePath: string): Promise<ConversionResult> {
    const doc = await Document.open(sourcePath);
    return {
      markdown: doc.toMarkdown(),
      assets: doc.assets(),
    };
  }
}

export function createHwpxConverter(): Converter {
  return new HwpxConverter();
}

// The low-level API. Parity is measured on Document, not on ConversionResult,
// so the parity harness and cross-check.sh both reach for this.
export { Document } from "./hwpx/document";

export { ConversionError } from "./types";
export type { Asset, ConversionResult, Converter } from "./types";
