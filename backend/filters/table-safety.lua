-- table-safety.lua — Pandoc Lua filter for multi-column table protection
--
-- Pandoc's default LaTeX writer uses longtable for tables.
-- longtable CRASHES inside twocolumn or multicol environments with:
--   "Package longtable Error: longtable not in 1-column mode."
--
-- This filter re-renders each Table as a standard tabular inside a
-- table* float (which spans full page width in two-column mode).
-- In single-column mode, table* behaves identically to table,
-- so this filter is safe for ALL templates.
--
-- Injected by compile-worker.js for editorial/multi-column templates.

function Table(tbl)
  -- Render the table to LaTeX via Pandoc's writer
  local doc = pandoc.Pandoc({tbl})
  local ok, latex = pcall(pandoc.write, doc, 'latex')
  if not ok then return tbl end

  -- Strip any document wrapper that pandoc.write might add
  latex = latex:gsub('^.*\\begin{document}\n?', '')
  latex = latex:gsub('\n?\\end{document}%s*$', '')

  -- Replace longtable with tabular inside a full-width float
  latex = latex:gsub(
    '\\begin{longtable}(%b[])',
    '\\begin{table*}[!htbp]\n\\centering\n\\begin{tabular}%1'
  )
  -- Fallback: longtable without optional alignment arg
  latex = latex:gsub(
    '\\begin{longtable}',
    '\\begin{table*}[!htbp]\n\\centering\n\\begin{tabular}'
  )
  latex = latex:gsub('\\end{longtable}', '\\end{tabular}\n\\end{table*}')

  -- Remove longtable-specific commands that tabular doesn't understand
  latex = latex:gsub('\\endhead%s*\n?', '')
  latex = latex:gsub('\\endfirsthead%s*\n?', '')
  latex = latex:gsub('\\endfoot%s*\n?', '')
  latex = latex:gsub('\\endlastfoot%s*\n?', '')

  return pandoc.RawBlock('latex', latex)
end
