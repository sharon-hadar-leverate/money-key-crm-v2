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
        .rtl-editor .w-md-editor {
          border: 1px solid #E6E9EF;
          border-radius: 0.5rem;
          box-shadow: none;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .rtl-editor .w-md-editor-toolbar {
          direction: ltr;
          border-bottom: 1px solid #E6E9EF;
          background: #F9FAFB;
          padding: 4px 8px;
        }

        .rtl-editor .w-md-editor-content {
          display: flex !important;
          flex-direction: row-reverse !important; /* Fix for RTL split */
          height: 100% !important;
        }

        .rtl-editor .w-md-editor-input,
        .rtl-editor .w-md-editor-preview {
          flex: 1 !important;
          width: 50% !important;
          height: 100% !important;
          min-width: 0;
        }

        .rtl-editor .w-md-editor-input {
          border-left: 1px solid #E6E9EF !important;
          border-right: none !important;
        }

        .rtl-editor .w-md-editor-text-pre > code,
        .rtl-editor .w-md-editor-text-input {
          direction: rtl !important;
          text-align: right !important;
          padding: 16px !important;
          font-family: inherit !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        }

        .rtl-editor .wmde-markdown {
          direction: rtl !important;
          text-align: right !important;
          padding: 20px !important;
          background: white !important;
          font-family: inherit !important;
        }

        /* Markdown Preview Styling */
        .rtl-editor .wmde-markdown h1 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          color: #323338 !important;
          border-bottom: 2px solid #E5F6F7 !important;
          padding-bottom: 0.75rem !important;
          margin-top: 0 !important;
          margin-bottom: 1.5rem !important;
        }

        .rtl-editor .wmde-markdown h2 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          color: #323338 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 1rem !important;
        }

        .rtl-editor .wmde-markdown h3 {
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          color: #676879 !important;
        }

        .rtl-editor .wmde-markdown p {
          line-height: 1.7 !important;
          color: #323338 !important;
          margin-bottom: 1rem !important;
        }

        .rtl-editor .wmde-markdown ul, 
        .rtl-editor .wmde-markdown ol {
          padding-right: 1.5rem !important;
          padding-left: 0 !important;
          margin-bottom: 1rem !important;
        }

        .rtl-editor .wmde-markdown li {
          margin-bottom: 0.5rem !important;
        }

        .rtl-editor .wmde-markdown blockquote {
          border-right: 4px solid #00A0B0 !important;
          border-left: none !important;
          padding: 12px 20px !important;
          margin: 1.5rem 0 !important;
          background: #F5F6F8 !important;
          border-radius: 0 0.5rem 0.5rem 0 !important;
          color: #676879 !important;
          font-style: italic !important;
        }

        /* Hide the bar between editor and preview that might cause issues */
        .rtl-editor .w-md-editor-bar {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
