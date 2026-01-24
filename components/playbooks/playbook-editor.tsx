'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

// Dynamic import to avoid SSR issues with the markdown editor
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-[#F5F6F8] rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-[#9B9BAD]">טוען עורך...</span>
      </div>
    ),
  }
)

interface PlaybookEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
}

export function PlaybookEditor({ value, onChange, height = 400 }: PlaybookEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="bg-[#F5F6F8] rounded-lg animate-pulse flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-[#9B9BAD]">טוען עורך...</span>
      </div>
    )
  }

  return (
    <div data-color-mode="light" className="rtl-editor">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={height}
        preview="live"
        hideToolbar={false}
        enableScroll={true}
        textareaProps={{
          placeholder: 'כתבו את תוכן ההדרכה כאן...',
          dir: 'rtl',
        }}
      />
      <style jsx global>{`
        .rtl-editor .w-md-editor-text-pre > code,
        .rtl-editor .w-md-editor-text-input,
        .rtl-editor .wmde-markdown {
          direction: rtl;
          text-align: right;
        }
        .rtl-editor .w-md-editor-toolbar {
          direction: ltr;
        }
        .rtl-editor .w-md-editor {
          border: 1px solid #E6E9EF;
          border-radius: 0.5rem;
        }
        .rtl-editor .w-md-editor-toolbar {
          border-bottom: 1px solid #E6E9EF;
          background: #F9FAFB;
        }
        .rtl-editor .wmde-markdown h1 {
          font-size: 1.25rem;
          border-bottom: 1px solid #E6E9EF;
          padding-bottom: 0.5rem;
        }
        .rtl-editor .wmde-markdown h2 {
          font-size: 1.125rem;
        }
        .rtl-editor .wmde-markdown h3 {
          font-size: 1rem;
        }
        .rtl-editor .wmde-markdown blockquote {
          border-right: 4px solid #00A0B0;
          border-left: none;
          padding-right: 1rem;
          padding-left: 0;
          margin-right: 0;
          background: #F5F6F8;
          border-radius: 0 0.5rem 0.5rem 0;
        }
      `}</style>
    </div>
  )
}
