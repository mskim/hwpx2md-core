# HWPX parity fixtures (expected outputs)

These `.md.expected` files are the ground-truth Markdown output produced by the
Ruby gem `hwpx2md` at `~/hwpx2md/`, with equations forced to `hwp-equation`
fenced-code fallback (because v1 of this extension emits that format, not real
LaTeX — see spec §6.5).

**Do not edit these files by hand.** Regenerate with:

```
npm run fixtures:regen
```

That invokes `ruby/regen-hwpx-fallback.rb` against each source. If the Ruby gem
has been updated, commit the regenerated fixtures in a separate
"regenerate fixtures" commit so the diff is reviewable.
