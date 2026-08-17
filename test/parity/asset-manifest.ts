// test/parity/asset-manifest.ts
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

/**
 * Returns a sorted-by-name map of `{filename: sha256hex}` for all regular
 * files in `dir`. Returns an empty object for missing or non-existent dir.
 * Mirrors the Ruby GoldenHelpers.asset_manifest helper.
 */
export function assetManifest(dir: string): Record<string, string> {
  if (!dir || !fs.existsSync(dir)) return {};
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) return {};

  const out: Record<string, string> = {};
  const entries = fs.readdirSync(dir).sort();
  for (const name of entries) {
    const full = path.join(dir, name);
    const s = fs.statSync(full);
    if (!s.isFile()) continue;
    out[name] = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
  }
  return out;
}

export function tmpAssetsDir(testName: string, baseDir: string): string {
  if (/[\\/]|\.\./.test(testName)) {
    throw new Error(`unsafe test name: ${JSON.stringify(testName)}`);
  }
  const dir = path.join(baseDir, "tmp", "parity", `${testName}.assets`);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
