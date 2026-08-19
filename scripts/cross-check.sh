#!/usr/bin/env bash
# Cross-check: convert each fixture through both the Ruby gem and the
# TypeScript extension, then diff the outputs against each other AND
# against the golden. Three failure modes are caught:
#   1. Ruby output != golden (Ruby drifted from spec)
#   2. TS output != golden (TS drifted from spec)
#   3. Ruby output != TS output (both drifted in different directions)
#   4. Ruby assets != TS assets (one side links an image it never writes)
#
# Mode 4 was missing for the whole life of this script: both assets directories
# were written and neither was ever read. That is not a theoretical gap. When
# table cells learned to hold images, the TypeScript side emitted 94 plate
# references while extracting none of them, because its collector walked only
# the paragraph's free pics — markdown pointing at files that do not exist. The
# markdown diff is identical in that state, so modes 1-3 all pass.
#
# Usage:
#   ./scripts/cross-check.sh
# Env:
#   RUBY_REPO_PATH  Path to a hwpx2md Ruby gem checkout (required if gem
#                   not installed in the current Bundler environment).
#   FIXTURES_DIR    Override fixtures directory (default: vendor/hwpx2md-spec/test/data).
#   GOLDEN_DIR      Override golden directory (default: vendor/hwpx2md-spec/test/golden).

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FIXTURES_DIR="${FIXTURES_DIR:-vendor/hwpx2md-spec/test/data}"
GOLDEN_DIR="${GOLDEN_DIR:-vendor/hwpx2md-spec/test/golden}"
TMP_DIR="$(mktemp -d -t cross-check.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

if [ ! -d "$FIXTURES_DIR" ]; then
  echo "ERROR: fixtures dir missing — run scripts/update-spec.sh first" >&2
  exit 1
fi

ruby_invoke() {
  local fixture="$1" out="$2" assets_dir="$3"
  if [ -n "${RUBY_REPO_PATH:-}" ]; then
    (cd "$RUBY_REPO_PATH" && \
     bundle exec ruby -Ilib -rhwpx2md -e "puts Hwpx2md::Document.open('$fixture').to_markdown(assets_dir: '$assets_dir')") > "$out"
  else
    bundle exec ruby -rhwpx2md -e "puts Hwpx2md::Document.open('$fixture').to_markdown(assets_dir: '$assets_dir')" > "$out"
  fi
}

ts_invoke() {
  local fixture="$1" out="$2" assets_dir="$3"
  node -e "
    const { Document } = require('./out/index.js');
    Document.open('$fixture').then(doc => {
      const md = doc.toMarkdown();
      const fs = require('fs');
      const path = require('path');
      fs.writeFileSync('$out', md);
      const assets = doc.assets ? doc.assets() : [];
      for (const a of assets) {
        fs.writeFileSync('$assets_dir/' + path.basename(a.relativePath), a.content);
      }
    }).catch(e => { console.error(e); process.exit(1); });
  "
}

failures=0
fixtures=("$FIXTURES_DIR"/*.hwpx)
echo "Cross-checking ${#fixtures[@]} fixtures..."

for fixture in "${fixtures[@]}"; do
  fixture="$(cd "$(dirname "$fixture")" && pwd)/$(basename "$fixture")"
  name="$(basename "$fixture" .hwpx)"
  golden="$REPO_ROOT/$GOLDEN_DIR/$name.md"
  ruby_out="$TMP_DIR/$name.ruby.md"
  ts_out="$TMP_DIR/$name.ts.md"
  ruby_assets="$TMP_DIR/$name.ruby.assets"
  ts_assets="$TMP_DIR/$name.ts.assets"
  mkdir -p "$ruby_assets" "$ts_assets"

  if ! ruby_invoke "$fixture" "$ruby_out" "$ruby_assets" 2>/dev/null; then
    echo "FAIL [$name]: Ruby gem raised on conversion" >&2
    failures=$((failures + 1))
    continue
  fi
  if ! ts_invoke "$fixture" "$ts_out" "$ts_assets" 2>/dev/null; then
    echo "FAIL [$name]: TS extension raised on conversion" >&2
    failures=$((failures + 1))
    continue
  fi

  if ! diff -q "$ruby_out" "$golden" > /dev/null 2>&1; then
    echo "FAIL [$name]: Ruby output != golden" >&2
    diff -u "$golden" "$ruby_out" | head -20 >&2 || true
    failures=$((failures + 1))
  fi
  if ! diff -q "$ts_out" "$golden" > /dev/null 2>&1; then
    echo "FAIL [$name]: TS output != golden" >&2
    diff -u "$golden" "$ts_out" | head -20 >&2 || true
    failures=$((failures + 1))
  fi
  if ! diff -q "$ruby_out" "$ts_out" > /dev/null 2>&1; then
    echo "FAIL [$name]: Ruby output != TS output (lockstep drift)" >&2
    diff -u "$ruby_out" "$ts_out" | head -20 >&2 || true
    failures=$((failures + 1))
  fi

  # Compare what each side actually WROTE, by name and by bytes. `diff -r`
  # reports files present on one side only, which is the case that matters:
  # markdown that links an asset nobody extracted.
  if ! diff -r -q "$ruby_assets" "$ts_assets" > /dev/null 2>&1; then
    echo "FAIL [$name]: Ruby assets != TS assets" >&2
    diff -r -q "$ruby_assets" "$ts_assets" 2>&1 | head -20 >&2 || true
    failures=$((failures + 1))
  fi

  # Every image the markdown points at must exist on disk. Catches the case
  # where BOTH sides are wrong in the same way, which no diff between them can.
  while IFS= read -r target; do
    case "$target" in
      *://*) continue ;;   # external URL, not ours to extract
    esac
    if [ ! -e "$ts_assets/$(basename "$target")" ]; then
      echo "FAIL [$name]: markdown links '$target' but no such asset was written" >&2
      failures=$((failures + 1))
    fi
  done < <(grep -o '!\[[^]]*\]([^)]*)' "$ts_out" 2>/dev/null | sed -E 's/.*\((.*)\)/\1/' | sort -u)
done

if [ $failures -eq 0 ]; then
  echo "OK: all ${#fixtures[@]} fixtures cross-check clean."
  exit 0
else
  echo "$failures cross-check failures." >&2
  exit 1
fi
