import { describe, test, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { Document } from "../../src/hwpx/document";
import { assetManifest } from "./asset-manifest";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SUBMODULE = path.join(REPO_ROOT, "vendor", "hwpx2md-spec");
const FIXTURES_DIR = path.join(SUBMODULE, "test", "data");
const GOLDEN_DIR = path.join(SUBMODULE, "test", "golden");

/**
 * Fixtures whose parity test is expected to fail today because the TS
 * implementation does not yet satisfy the spec. Phase 3 removes entries
 * one fixture at a time. Keys are basenames; values are short labels
 * grepable as "phase-3:*".
 *
 * Each entry SHOULD be REMOVED (not just set to undefined) when its
 * implementation lands and passes — that way `Object.keys(PHASE_3_PENDING).length`
 * tracks remaining work.
 */
const PHASE_3_PENDING: Record<string, string> = {
};

function bufferManifest(assets: Array<{ relativePath: string; content: Buffer }> | undefined): Record<string, string> {
  if (!assets || assets.length === 0) return {};
  const out: Record<string, string> = {};
  const sorted = [...assets].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  for (const a of sorted) {
    const name = path.basename(a.relativePath);
    out[name] = crypto.createHash("sha256").update(a.content).digest("hex");
  }
  return out;
}

/**
 * The number of fixtures the shared spec submodule is known to carry.
 *
 * This is asserted, not inferred, because the harness used to `test.skip` itself
 * when the submodule was missing — which meant a clone without
 * `--recurse-submodules` printed a GREEN parity suite that had run zero fixtures.
 * A parity contract that passes while measuring nothing is worse than no contract.
 *
 * Raise it when the shared spec grows. Never lower it to make a run pass.
 */
const MIN_FIXTURES = 17;

const fixtures = fs.existsSync(FIXTURES_DIR)
  ? fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".hwpx")).sort()
  : [];

describe("golden-parity (shared spec)", () => {
  test("the spec submodule is present and carries its fixtures", () => {
    expect(
      fixtures.length,
      `Found ${fixtures.length} .hwpx fixtures in ${FIXTURES_DIR}, expected at least ` +
        `${MIN_FIXTURES}. Run scripts/update-spec.sh, or clone with --recurse-submodules.`,
    ).toBeGreaterThanOrEqual(MIN_FIXTURES);
  });

  for (const fixture of fixtures) {
    const name = path.basename(fixture, ".hwpx");
    const fixturePath = path.join(FIXTURES_DIR, fixture);
    const goldenPath = path.join(GOLDEN_DIR, `${name}.md`);
    const skipReason = PHASE_3_PENDING[name];

    test.skipIf(skipReason != null)(name, async () => {
      const expectedMd = fs.readFileSync(goldenPath, "utf8");
      const expectedAssetsDir = path.join(GOLDEN_DIR, `${name}.assets`);
      const expectedManifest = assetManifest(expectedAssetsDir);

      const doc = await Document.open(fixturePath);
      const actualMd = doc.toMarkdown();           // sync, returns string
      const actualAssets = doc.assets();           // method call, returns Asset[]
      const actualManifest = bufferManifest(actualAssets);

      expect(actualMd).toBe(expectedMd);
      expect(actualManifest).toEqual(expectedManifest);
    });
  }
});
