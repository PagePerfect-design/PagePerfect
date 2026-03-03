-- fountain.lua — Pandoc Lua filter for screenplay formatting
--
-- Converts fenced divs produced by the text normalizer's Fountain parser
-- into proper screenplay geometry. Dual-format: emits LaTeX raw blocks
-- when targeting LaTeX, and Typst-native elements when targeting Typst.
--
--   ::: scene-heading  →  H1 slugline (template applies uppercase + spacing)
--   ::: character      →  Centered bold cue (3.5" indent per Hollywood standard)
--   ::: dialogue       →  Quote block (template styles as indented dialogue)
--   ::: parenthetical  →  Indented italic between character and dialogue
--   ::: transition     →  Right-aligned (CUT TO:, FADE OUT., etc.)
--
-- Injected by compile-worker.js exclusively for the cinema template.

local function is_typst()
  return FORMAT:match('typst')
end

function Div(el)
  if el.classes:includes('scene-heading') then
    local text = pandoc.utils.stringify(el)

    if is_typst() then
      -- Scene headings become H1; cinema.typ shows as uppercase bold slugline
      return pandoc.Header(1, pandoc.Inlines{pandoc.Str(text)})
    else
      return pandoc.RawBlock('latex',
        '\\section{' .. escape_latex(text) .. '}'
      )
    end

  elseif el.classes:includes('character') then
    local text = pandoc.utils.stringify(el)

    if is_typst() then
      -- Character cue: 2.2in indent from left margin, bold, uppercase
      return pandoc.RawBlock('typst',
        '#v(6pt)\n#h(2.2in)#text(weight: "bold")[' ..
        escape_typst(text:upper()) .. ']\n'
      )
    else
      return pandoc.RawBlock('latex',
        '{\\par\\vspace{6pt}\\hspace{2.2in}{\\bfseries ' ..
        escape_latex(text:upper()) ..
        '}\\par}\n'
      )
    end

  elseif el.classes:includes('parenthetical') then
    local text = pandoc.utils.stringify(el)

    if is_typst() then
      -- Parenthetical: 1.6in indent, normal size
      return pandoc.RawBlock('typst',
        '#h(1.6in)' .. escape_typst(text) .. '\n'
      )
    else
      return pandoc.RawBlock('latex',
        '{\\hspace{1.6in}{\\normalsize ' ..
        escape_latex(text) ..
        '}\\par}\n'
      )
    end

  elseif el.classes:includes('dialogue') then
    if is_typst() then
      -- Dialogue: quote block — cinema.typ pads 1in left, 0.5in right
      return pandoc.BlockQuote(el.content)
    else
      return {
        pandoc.RawBlock('latex', '\\begin{quote}'),
        pandoc.Div(el.content),
        pandoc.RawBlock('latex', '\\end{quote}'),
      }
    end

  elseif el.classes:includes('transition') then
    local text = pandoc.utils.stringify(el)

    if is_typst() then
      -- Transition: right-aligned (CUT TO:, FADE OUT., DISSOLVE TO:)
      return pandoc.RawBlock('typst',
        '#v(6pt)\n#align(right)[' .. escape_typst(text:upper()) .. ']\n#v(6pt)\n'
      )
    else
      return pandoc.RawBlock('latex',
        '{\\par\\vspace{6pt}\\hfill ' ..
        escape_latex(text:upper()) ..
        '\\par\\vspace{6pt}}\n'
      )
    end

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

-- Escape Typst content-mode special characters in user text
function escape_typst(s)
  s = s:gsub('\\', '\\\\')
  s = s:gsub('#', '\\#')
  s = s:gsub('%[', '\\[')
  s = s:gsub('%]', '\\]')
  s = s:gsub('<', '\\<')
  s = s:gsub('>', '\\>')
  s = s:gsub('@', '\\@')
  s = s:gsub('%$', '\\$')
  return s
end
