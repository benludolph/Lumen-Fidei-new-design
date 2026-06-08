import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Image } from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { useEffect, useRef, useState } from 'react'
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Trash2,
  Image as ImageIcon,
  X,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const TEXT_COLORS = [
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#ffffff' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Gold', value: '#eab308' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Orange', value: '#f97316' },
]

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Cyan', value: '#a5f3fc' },
  { label: 'Lime', value: '#bbf7d0' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Lavender', value: '#ddd6fe' },
  { label: 'Peach', value: '#fed7aa' },
]

function ColorPicker({
  currentColor,
  colors,
  onSelectColor,
  onClear,
  label,
  testIdPrefix,
}: {
  currentColor: string | null
  colors: { label: string; value: string }[]
  onSelectColor: (color: string) => void
  onClear: () => void
  label: string
  testIdPrefix: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid={`${testIdPrefix}-toggle`}
        title={label}
        className="flex flex-col items-center justify-center w-8 h-8 rounded hover:bg-accent focus:outline-none"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-xs font-bold leading-none select-none" style={{ color: currentColor || 'currentColor' }}>
          {testIdPrefix === 'text-color' ? 'A' : 'H'}
        </span>
        <span
          className="mt-0.5 h-1 w-5 rounded-sm border border-border"
          style={{ backgroundColor: currentColor || 'transparent' }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 p-2 bg-popover border border-border rounded-md shadow-md min-w-[160px]"
          data-testid={`${testIdPrefix}-palette`}
        >
          <div className="flex flex-wrap gap-1 mb-2">
            {colors.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                data-testid={`${testIdPrefix}-swatch-${c.label.toLowerCase()}`}
                className={cn(
                  "w-6 h-6 rounded border-2 transition-transform hover:scale-110 focus:outline-none",
                  currentColor === c.value ? 'border-primary' : 'border-border'
                )}
                style={{ backgroundColor: c.value }}
                onClick={() => { onSelectColor(c.value); setOpen(false) }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 mb-2">
            <input
              ref={customInputRef}
              type="color"
              title="Custom color"
              data-testid={`${testIdPrefix}-custom-input`}
              className="w-6 h-6 rounded border border-border cursor-pointer p-0"
              defaultValue={currentColor || '#000000'}
              onChange={e => onSelectColor(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">Custom</span>
          </div>

          <button
            type="button"
            data-testid={`${testIdPrefix}-clear`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full px-1 py-0.5 rounded hover:bg-accent"
            onClick={() => { onClear(); setOpen(false) }}
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null
  }

  const currentTextColor = editor.getAttributes('textStyle').color || null
  const currentHighlight = editor.getAttributes('highlight').color || null

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30" data-testid="rich-text-toolbar">
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-testid="button-bold"
        className="px-2"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-testid="button-italic"
        className="px-2"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        data-testid="button-underline"
        className="px-2"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        data-testid="button-heading1"
        className="px-2"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        data-testid="button-heading2"
        className="px-2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        data-testid="button-bullet-list"
        className="px-2"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        data-testid="button-ordered-list"
        className="px-2"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <div className="w-px bg-border mx-1" />
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        data-testid="button-blockquote"
        className="px-2"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      <ColorPicker
        currentColor={currentTextColor}
        colors={TEXT_COLORS}
        onSelectColor={color => editor.chain().focus().setColor(color).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
        label="Text color"
        testIdPrefix="text-color"
      />

      <ColorPicker
        currentColor={currentHighlight}
        colors={HIGHLIGHT_COLORS}
        onSelectColor={color => editor.chain().focus().setHighlight({ color }).run()}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
        label="Highlight color"
        testIdPrefix="highlight-color"
      />

      <div className="w-px bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant={editor.isActive('table') ? 'secondary' : 'ghost'}
        onClick={() => {
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }}
        data-testid="button-table"
        className="px-2"
      >
        <TableIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant='ghost'
        onClick={() => editor.chain().focus().deleteTable().run()}
        data-testid="button-delete-table"
        className="px-2"
        disabled={!editor.isActive('table')}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant='ghost'
        onClick={() => {
          const url = window.prompt('Enter image URL')
          if (url) {
            editor.chain().focus().setImage({ src: url }).run()
          }
        }}
        data-testid="button-image"
        className="px-2"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        data-testid="button-align-left"
        className="px-2"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        data-testid="button-align-center"
        className="px-2"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        data-testid="button-align-right"
        className="px-2"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[120px] p-3 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background", className)} data-testid="rich-text-editor">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
