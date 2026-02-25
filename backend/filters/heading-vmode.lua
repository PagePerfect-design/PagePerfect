-- heading-vmode.lua — Ensure vertical mode before all headings
--
-- Prevents "Package titlesec Error: Entered in horizontal mode" by
-- inserting \par before every heading in the Pandoc AST. This is a
-- no-op when TeX is already in vertical mode, but guarantees
-- correctness when the preceding content (tight lists, images,
-- blockquotes, environments) leaves TeX in horizontal mode.
--
-- Applied universally to all templates that use titlesec.

function Pandoc(doc)
  local new = {}
  for _, block in ipairs(doc.blocks) do
    if block.t == "Header" then
      table.insert(new, pandoc.RawBlock("latex", "\\par"))
    end
    table.insert(new, block)
  end
  return pandoc.Pandoc(new, doc.meta)
end
