#!/usr/bin/env bash
# Regenerate all HWPX parity fixtures by running the Ruby gem with equation
# fallback injection. Requires the hwpx2md Ruby gem to be installed.
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
