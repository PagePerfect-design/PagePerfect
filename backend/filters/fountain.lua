-- fountain.lua — Pandoc Lua filter for screenplay formatting
--
-- Converts fenced divs produced by the text normalizer's Fountain parser
-- into proper LaTeX screenplay geometry:
--
--   ::: scene-heading  →  \section{SLUG LINE}
--   ::: character      →  Centered bold (3.5" indent per Hollywood standard)
--   ::: dialogue       →  quote environment (cinema.latex styles this at 1"L / 0.5"R)
--   ::: parenthetical  →  Indented italic between character and dialogue
--   ::: transition     →  Right-aligned (CUT TO:, FADE OUT., etc.)
--
-- Injected by compile-worker.js exclusively for the cinema template.

function Div(el)
  if el.classes:includes('scene-heading') then
    local text = pandoc.utils.stringify(el)
    -- Scene headings become \section (cinema.latex applies \MakeUppercase)
    return pandoc.RawBlock('latex',
      '\\section{' .. escape_latex(text) .. '}'
    )

  elseif el.classes:includes('character') then
    local text = pandoc.utils.stringify(el)
    -- Character cue: centered, bold, uppercase
    -- 2.2in from left margin = ~3.7in from page edge (with 1.5in left margin)
    return pandoc.RawBlock('latex',
      '{\\par\\vspace{6pt}\\hspace{2.2in}{\\bfseries ' ..
      escape_latex(text:upper()) ..
      '}\\par}\n'
    )

  elseif el.classes:includes('parenthetical') then
    local text = pandoc.utils.stringify(el)
    -- Parenthetical: indented italic, between character name and dialogue
    return pandoc.RawBlock('latex',
      '{\\hspace{1.6in}{\\normalsize ' ..
      escape_latex(text) ..
      '}\\par}\n'
    )

  elseif el.classes:includes('dialogue') then
    -- Dialogue: use the quote environment (cinema.latex indents 1"L, 0.5"R)
    return {
      pandoc.RawBlock('latex', '\\begin{quote}'),
      pandoc.Div(el.content),
      pandoc.RawBlock('latex', '\\end{quote}'),
    }

  elseif el.classes:includes('transition') then
    local text = pandoc.utils.stringify(el)
    -- Transition: right-aligned (CUT TO:, FADE OUT., DISSOLVE TO:)
    return pandoc.RawBlock('latex',
      '{\\par\\vspace{6pt}\\hfill ' ..
      escape_latex(text:upper()) ..
      '\\par\\vspace{6pt}}\n'
    )

  elseif el.classes:includes('action') then
    -- Action lines: standard paragraphs (pass through)
    return el
  end

  return el
end

-- Escape LaTeX special characters in user text
function escape_latex(s)
  s = s:gsub('\\', '\\textbackslash{}')
  s = s:gsub('([#$%%&_{}\x5E~])', '\\%1')
  return s
end
