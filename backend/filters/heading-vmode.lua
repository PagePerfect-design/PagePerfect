-- heading-vmode.lua — Ensure vertical mode before all headings
--
-- Prevents "Package titlesec Error: Entered in horizontal mode" by
-- inserting \par\leavevmode\par before every heading in the Pandoc AST.
-- \par alone may not suffice if TeX is in restricted horizontal mode
-- (e.g. inside an \mbox or after certain font selection commands).
-- The \leavevmode\par sequence forces a full return to vertical mode.
--
-- Also recurses into Div blocks to catch nested headings.
--
-- Applied universally to all templates that use titlesec.

local vmode_guard = pandoc.RawBlock("latex", "\\par\\leavevmode\\par")

local function inject_vmode(blocks)
  local new = {}
  for _, block in ipairs(blocks) do
    if block.t == "Header" then
      table.insert(new, vmode_guard)
    elseif block.t == "Div" then
      -- Recurse into div contents
      block.content = inject_vmode(block.content)
    end
    table.insert(new, block)
  end
  return new
end

function Pandoc(doc)
  return pandoc.Pandoc(inject_vmode(doc.blocks), doc.meta)
end
