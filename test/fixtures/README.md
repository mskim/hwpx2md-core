# Test Fixtures

This directory is where we mirror the test corpus from the Ruby `hwpx2md` and
`docx2md` gems so that the eventual v1.1 TypeScript port has a clear spec.

## Layout

```
fixtures/
├── hwpx/
│   ├── simple/         # plain paragraphs, headings, lists
│   ├── tables/         # including merged cells
│   ├── equations/      # HWP equation → LaTeX
│   ├── images/         # embedded binary assets
│   └── real-world/     # anonymized user documents
└── docx/
    └── (same shape)
```

For each fixture, store both the input (`.hwpx` / `.docx`) and the expected
Markdown output (`expected.md`) alongside any expected assets.

## Populating

- Import the Ruby gem's existing test fixtures verbatim (same filenames).
- Keep anything user-sourced under `real-world/` anonymized.
- Large binary fixtures should use Git LFS.

## Using in tests

Tests under `test/*.test.ts` walk this tree and compare converter output to
`expected.md` byte-for-byte. When the v1.1 TypeScript engine is ported, the
same tests run against both engines and any divergence is a regression.
