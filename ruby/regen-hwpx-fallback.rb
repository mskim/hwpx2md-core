#!/usr/bin/env ruby
# frozen_string_literal: true
#
# Regenerates .md.expected fixtures from HWPX sources with equations rendered
# as `hwp-equation` fenced-code blocks instead of real LaTeX. This matches the
# v1 output format of the hwpx2md VSCode extension (see spec §6.5).
#
# Usage:
#   ruby ruby/regen-hwpx-fallback.rb <source.hwpx>
#
# Writes Markdown to stdout.

require "hwpx2md"

# Override the instance method invoked by Hwpx2md::Paragraph#to_txt:
#   EqToLatex::Converter.new.convert(raw_equation)
# The original would return LaTeX; we return a fenced `hwp-equation` block so
# the Ruby gem's output matches the TS engine's v1 fallback format byte-for-byte.
module EqToLatex
  class Converter
    def convert(raw_equation, *_args, **_kwargs)
      "```hwp-equation\n#{raw_equation.to_s.strip}\n```"
    end
  end
end

source = ARGV[0] or abort "usage: regen-hwpx-fallback.rb <source.hwpx>"
puts Hwpx2md::Document.new(source).to_markdown
