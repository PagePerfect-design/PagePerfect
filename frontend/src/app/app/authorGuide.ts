export const AUTHOR_GUIDE_MD = `# Page Perfect — Author Guide

This short guide helps you format a manuscript for Page Perfect (Markdown in, PDF out).

## 1) Write in Markdown
Headings:
# H1 Title
## H2 Chapter
### H3 Section

Emphasis: *italics* and **bold**.  
Lists:
- Bullet one
- Bullet two

Blockquotes:
> A short quoted excerpt.

Code / literals:
\`inline code\` or triple backticks for longer blocks.

## 2) Citations & Bibliography
Cite sources using Pandoc's syntax: \`[@Key]\`. Multiple: \`[@Key1; @Key2]\`.

Example:
As noted by [@Finch2023], Bristol's networks reshaped Atlantic economies.

Your references live on the server in \`references.bib\`. Ask your editor to add missing keys.

## 3) Page Setup
Choose **Template**:
- **Classic Academic (Chicago)** — serif, indented paragraphs.
- **Modern Trade Paperback** — sans, spaced paragraphs.

Choose **Page Size**: A4, Letter, 6×9", 5.5×8.5", 7×10", A5.  
Choose **Margins**: Normal / Narrow / Wide.

## 4) From Microsoft Word
1. Open your document in Word.
2. Strip hard styling (keep text only) or export to plain text.
3. Paste into Page Perfect's editor.
4. Add headings (##), italics (*text*), and citations ([@Key]) as needed.

Tip: If you prefer automation, save as \`.docx\` and use a docx→Markdown converter; then paste the result.

## 5) Errors & Warnings
- **Undefined citations** → check spelling and presence in \`references.bib\`.
- **Missing LaTeX package** → ask maintainer; they'll add it to the compiler image.
- **Style warnings** (e.g., double spaces) → not fatal, but fix for polish.

## 6) Downloading
Use **Download PDF** for a submission-ready file.

## 7) Support
If something fails, include the last lines of the error console when asking for help.
`
