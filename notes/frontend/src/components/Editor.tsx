import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import { useEffect } from 'react'
// import css from 'highlight.js/lib/languages/css'
// import js from 'highlight.js/lib/languages/javascript'
// import ts from 'highlight.js/lib/languages/typescript'
// import html from 'highlight.js/lib/languages/xml'
// import yaml from 'highlight.js/lib/languages/yaml'

// Create a lowlight instance with all languages
const lowlight = createLowlight(all)

// You can also register specific languages if you want to optimize bundle size
// lowlight.register('html', html)
// lowlight.register('css', css)
// lowlight.register('js', js)
// lowlight.register('ts', ts)
// lowlight.register('yaml', yaml)

interface EditorProps {
  content: string
  onUpdate: (content: string) => void
}

const Editor = ({ content, onUpdate }: EditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none m-8 focus:outline-none min-h-[500px]',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className="h-full overflow-y-auto">
      <EditorContent editor={editor} />
    </div>
  )
}

export default Editor
