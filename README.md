# hwpx2md-core

OWPML/HWPX to Markdown converter. One parser, two shells.

This package holds the parser itself. Its two consumers — the `hwpx2md` VS Code
extension and the wehangul Electron app — each wrap it in their own shell. Shell-specific
concerns (preview rendering, editor settings, KaTeX macros) stay out of here.

## Install

Consumers install from a git tag, not from npm:

```bash
npm install github:mskim/hwpx2md-core#v0.1.0
```

## Usage

```ts
const { createHwpxConverter } = require('hwpx2md-core')
const result = await createHwpxConverter().convert('/path/to/file.hwpx')
// result.markdown : string
// result.assets   : Array<{ relativePath: string, content: Buffer }> | undefined
// result.warnings : string[] | undefined   (declared but never populated today)
```

## `out/` is committed on purpose

The build output in `out/` is checked into git rather than ignored. Because consumers
install from a git tag, the usual `prepare`-script build never runs for them: one
consumer's CI runs `npm ci --ignore-scripts`, which suppresses `prepare` for git
dependencies. Such a package would install with no `out/` directory and fail at
`require()` time in CI while working fine locally. The committed build is what makes
a clean install work.

So `out/` has to be rebuilt and committed alongside any change to `src/`; the CI job
`build-freshness` fails if the two drift apart. `src/` ships too: source maps point
back at `../src`, so shipping `out/` alone would leave consumers with dead maps.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run compile` | Type-check and build `src/` into `out/` |
| `npm run watch` | Same, in watch mode |
| `npm run clean` | Remove `out/` |
| `npm run test:unit` | Run the unit tests |
| `npm run test:parity` | Run the parity tests against the spec |
| `npm run parity:update-spec` | Regenerate the parity spec |
| `npm run fixtures:regen` | Regenerate test fixtures |
| `npm run cross-check` | Compare output against the reference implementation |

`npm run cross-check` compares this parser's output against the Ruby reference
implementation, so it requires the Ruby gem to be installed. The other scripts do not.

## Deliberately-failing tests

The unit suite is green, but five tests are marked `it.fails` rather than
passing normally — in `test/hwpx/containers/image_node.test.ts`,
`containers/paragraph.test.ts`, `document.test.ts`, and `phase4-parity.test.ts`.

They assert that images are emitted under `images/`, which is what wehangul's
PRD §6.1 requires. The parser does not do that yet: it emits
`<sourceBasename>.assets/<sourceBasename>-<binItemId>.<ext>`. That is a real
unmet requirement, not stale test drift, so the assertions were left asserting
the requirement instead of being rewritten to match current behaviour — which
would have quietly converted "this is broken" into "this is fine".

`it.fails` asserts that the test *does* fail. The moment the parser starts
emitting `images/`, these turn red and have to be promoted back to ordinary
`it`. The gap therefore stays visible and cannot be closed by accident.

Note that the `v0.1.0` tag message predates this and still refers to "9 known
failures"; that tag is immutable. The current state is 4 reconciled and 5
pinned.

## License

MIT — see [LICENSE](./LICENSE).
