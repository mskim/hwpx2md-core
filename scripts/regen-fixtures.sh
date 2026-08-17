#!/usr/bin/env bash
# Regenerate all HWPX parity fixtures by running the Ruby gem with equation
# fallback injection. Requires the hwpx2md Ruby gem to be installed.
#
# ⚠️  THIS SCRIPT IS STALE AND REGENERATES MORE THAN YOU PROBABLY WANT.
#
# It rewrites EVERY .md.expected, and two of them come back wrong:
#
#   sample_math.md.expected  — ruby/regen-hwpx-fallback.rb monkey-patches
#     EqToLatex::Converter#convert to emit ```hwp-equation fenced blocks (the v1
#     fallback). The parser now emits real LaTeX ($$\dfrac{...}$$), so regenerating
#     REPLACES CORRECT GOLDENS WITH STALE ONES and breaks phase5-parity, a test
#     that was passing.
#
#   sample_image.md.expected — comes back with the Ruby gem's own filename scheme
#     (images/1_1_image.jpg) rather than the TS parser's.
#
# Observed 2026-08-18 while reconciling test expectations: `3 fixture(s) updated`
# when only sample_table needed it. Run it, then `git diff` and revert everything
# you did not intend — or regenerate a single fixture by hand.
set -euo pipefail

RUBY_CMD="${HWPX2MD_RUBY:-ruby}"
WRAPPER="$(dirname "$0")/../ruby/regen-hwpx-fallback.rb"
SOURCES_DIR="$(dirname "$0")/../test/fixtures/hwpx/sources"
EXPECTED_DIR="$(dirname "$0")/../test/fixtures/hwpx/expected"

if [ ! -d "$SOURCES_DIR" ]; then
  echo "missing sources dir: $SOURCES_DIR" >&2
  exit 1
fi

updated=0
for src in "$SOURCES_DIR"/*.hwpx; do
  name="$(basename "$src" .hwpx)"
  out="$EXPECTED_DIR/$name.md.expected"
  tmp="$(mktemp)"
  "$RUBY_CMD" "$WRAPPER" "$src" > "$tmp"
  if [ ! -f "$out" ] || ! diff -q "$out" "$tmp" > /dev/null; then
    mv "$tmp" "$out"
    echo "updated: $name.md.expected"
    updated=$((updated + 1))
  else
    rm "$tmp"
  fi
done

echo "$updated fixture(s) updated"
