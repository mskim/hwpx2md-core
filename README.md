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

## License

MIT — see [LICENSE](./LICENSE).
