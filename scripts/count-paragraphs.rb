#!/usr/bin/env ruby
# frozen_string_literal: true
#
# Prints JSON: { "<fixture-basename>": <paragraph count>, ... }
# Used once to generate test/fixtures/hwpx/paragraph-counts.json as the
# Phase 1 parity gate reference.
#
# Ruby accessor: Document#paragraphs uses //hs:sec/hp:p (direct children of
# hs:sec elements — top-level paragraphs only, excluding those nested in tables).
# The TS Document.paragraphs() XPath is aligned to match this exact semantic.

require "hwpx2md"
require "json"

sources_dir = ARGV[0] or abort "usage: count-paragraphs.rb <sources-dir>"
counts = {}
Dir.glob(File.join(sources_dir, "*.hwpx")).sort.each do |path|
  name = File.basename(path, ".hwpx")
  doc = Hwpx2md::Document.new(path)
  counts[name] = doc.paragraphs.length
end
puts JSON.pretty_generate(counts)
