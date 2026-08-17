#!/usr/bin/env bash
# Update vendor/hwpx2md-spec to the latest commit on its tracked branch,
# re-apply sparse-checkout (since neither `git submodule update` nor
# `actions/checkout` runs the sparse-checkout config automatically),
# and run the parity tests.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SUBMODULE="vendor/hwpx2md-spec"

cd "$REPO_ROOT"

git submodule update --init --remote "$SUBMODULE"
git -C "$SUBMODULE" sparse-checkout init --cone
git -C "$SUBMODULE" sparse-checkout set spec test/data test/golden

echo "Submodule pinned at: $(git -C "$SUBMODULE" rev-parse HEAD)"
ls "$SUBMODULE/test/data/"*.hwpx 2>/dev/null | wc -l | xargs printf "Fixture count: %s\n"
ls "$SUBMODULE/test/golden/"*.md 2>/dev/null | wc -l | xargs printf "Golden count: %s\n"

if [ "${SKIP_TESTS:-0}" != "1" ]; then
  npm run test:parity
fi
