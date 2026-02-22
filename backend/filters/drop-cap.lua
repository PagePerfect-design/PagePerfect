-- drop-cap.lua — Pandoc Lua filter for lettrine drop caps
--
-- Applies \lettrine to the first paragraph after each chapter heading.
-- If the paragraph starts with a quotation mark (curly or straight),
-- the quote is hung in the margin via lettrine's `ante` option,
-- and the drop cap is applied to the actual first letter.
--
-- Requires \usepackage{lettrine} in the LaTeX preamble.
-- Injected conditionally by compile-worker.js for fiction/literary templates.

local awaiting_drop_cap = false

function Header(el)
  -- Only trigger drop caps after H1 (chapter-level headings)
  if el.level == 1 then
    awaiting_drop_cap = true
  end
  return el
end

function Para(el)
  if not awaiting_drop_cap then return el end
  awaiting_drop_cap = false

  if #el.content == 0 then return el end

  local first = el.content[1]

  -- ── Case 1: Paragraph starts with a Quoted inline ──
  -- Pandoc's smart extension wraps "..." in Quoted DoubleQuote [...]
  if first.t == 'Quoted' then
    local ante_cmd
    if first.quotetype == 'DoubleQuote' then
      ante_cmd = '\\textquotedblleft{}'
    else
      ante_cmd = '\\textquoteleft{}'
    end

    local inner = first.content
    if #inner == 0 then return el end

    -- Find the first Str inside the quote
    local first_str = inner[1]
    if first_str.t ~= 'Str' or #first_str.text == 0 then return el end

    local drop = first_str.text:sub(1, 1)
    local rest_word = first_str.text:sub(2)

    -- Build the lettrine command with hanging ante punctuation
    local lettrine = string.format(
      '\\lettrine[ante={%s}]{%s}{%s}',
      ante_cmd, drop, rest_word
    )

    -- Reconstruct: lettrine + rest of quoted content + closing quote + rest of para
    local new_content = { pandoc.RawInline('latex', lettrine) }
    for i = 2, #inner do
      table.insert(new_content, inner[i])
    end

    -- Closing quote
    if first.quotetype == 'DoubleQuote' then
      table.insert(new_content, pandoc.RawInline('latex', '\\textquotedblright{}'))
    else
      table.insert(new_content, pandoc.RawInline('latex', '\\textquoteright{}'))
    end

    -- Rest of paragraph after the Quoted element
    for i = 2, #el.content do
      table.insert(new_content, el.content[i])
    end

    return pandoc.Para(new_content)
  end

  -- ── Case 2: Paragraph starts with a plain Str ──
  if first.t == 'Str' and #first.text > 0 then
    local text = first.text
    local ante = ''

    -- Check for leading quotation mark characters (curly or straight)
    local quote_map = {
      ['\xE2\x80\x9C'] = '\\textquotedblleft{}',   -- U+201C "
      ['\xE2\x80\x98'] = '\\textquoteleft{}',       -- U+2018 '
      ['\xC2\xAB']     = '\\guillemotleft{}',       -- U+00AB «
      ['"']            = '``',                       -- straight double
      ["'"]            = '`',                        -- straight single
    }

    for q, latex_q in pairs(quote_map) do
      if text:sub(1, #q) == q then
        ante = latex_q
        text = text:sub(#q + 1)
        break
      end
    end

    if #text == 0 then return el end

    local drop = text:sub(1, 1)
    local rest_word = text:sub(2)

    local lettrine
    if ante ~= '' then
      lettrine = string.format('\\lettrine[ante={%s}]{%s}{%s}', ante, drop, rest_word)
    else
      lettrine = string.format('\\lettrine{%s}{%s}', drop, rest_word)
    end

    local new_content = { pandoc.RawInline('latex', lettrine) }
    for i = 2, #el.content do
      table.insert(new_content, el.content[i])
    end

    return pandoc.Para(new_content)
  end

  return el
end
