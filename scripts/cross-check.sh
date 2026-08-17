#!/usr/bin/env bash
# Cross-check: convert each fixture through both the Ruby gem and the
# TypeScript extension, then diff the outputs against each other AND
# against the golden. Three failure modes are caught:
#   1. Ruby output != golden (Ruby drifted from spec)
#   2. TS output != golden (TS drifted from spec)
#   3. Ruby output != TS output (both drifted in different directions)
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
done

if [ $failures -eq 0 ]; then
  echo "OK: all ${#fixtures[@]} fixtures cross-check clean."
  exit 0
else
  echo "$failures cross-check failures." >&2
  exit 1
fi
