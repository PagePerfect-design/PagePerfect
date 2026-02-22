'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Undo, Redo, Code,
} from 'lucide-react'

// ── Markdown ↔ HTML conversion helpers ──

function markdownToHtml(md: string): string {
  // Lightweight Markdown → HTML for TipTap ingestion
  // Handles: headings, bold, italic, lists, blockquotes, code, hr
  let html = md
    // Headings (must come before other inline patterns)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Horizontal rules
    .replace(/^---+$/gm, '<hr>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
    return `<ul>${match}</ul>`
  })

  // Wrap remaining plain text lines in <p> tags
  html = html
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('<')) return trimmed
      return `<p>${trimmed}</p>`
    })
    .join('\n')

  return html
}

function htmlToMarkdown(html: string): string {
  // HTML → Markdown for compile pipeline
  const md = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n\n')
    .replace(/<blockquote[^>]*>\s*<p>(.*?)<\/p>\s*<\/blockquote>/gi, '> $1\n\n')
    .replace(/<strong><em>(.*?)<\/em><\/strong>/gi, '***$1***')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
      return inner.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n'
    })
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
      let i = 0
      return inner.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
        i++
        return `${i}. `
      }) + '\n'
    })
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines

  return md.trim() + '\n'
}

// ── Toolbar Button ──

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center transition-colors ${
        active
          ? 'bg-[#FF3333]/10 text-[#FF3333]'
          : 'text-[#111111]/40 hover:bg-[#111111]/[0.06] hover:text-[#111111]/70'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

// ── Main Component ──

export default function RichTextEditor({
  markdown,
  onChange,
  onClose,
}: {
  markdown: string
  onChange: (md: string) => void
  onClose: () => void
}) {
  const isUpdatingRef = useRef(false)
  // Track what the editor last emitted so we can skip echo-backs
  const lastEmittedRef = useRef(markdown)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your manuscript...',
      }),
      Highlight,
      Typography,
    ],
    content: markdownToHtml(markdown),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-4 font-body text-[15px] leading-[1.8] text-[#111111]/80',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isUpdatingRef.current) return
      const html = ed.getHTML()
      const md = htmlToMarkdown(html)
      lastEmittedRef.current = md
      onChange(md)
    },
  })

  // Sync external markdown changes into editor (skip echo-backs from our own onUpdate)
  useEffect(() => {
    if (!editor) return
    if (markdown === lastEmittedRef.current) return

    isUpdatingRef.current = true
    const html = markdownToHtml(markdown)
    editor.commands.setContent(html, { emitUpdate: false })
    lastEmittedRef.current = markdown
    isUpdatingRef.current = false
  }, [markdown, editor])

  const toggleHeading = useCallback((level: 1 | 2 | 3) => {
    if (!editor) return
    editor.chain().focus().toggleHeading({ level }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-[#111111]/[0.06] px-4 py-1.5">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1.5 h-4 w-px bg-[#111111]/[0.08]" />

        <ToolbarButton onClick={() => toggleHeading(1)} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleHeading(2)} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleHeading(3)} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1.5 h-4 w-px bg-[#111111]/[0.08]" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1.5 h-4 w-px bg-[#111111]/[0.08]" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="flex-1" />

        {/* Mode toggle */}
        <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/25">
          Rich Text
        </span>
        <button
          onClick={onClose}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/40 hover:text-[#111111]/70"
        >
          Switch to Markdown
        </button>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
