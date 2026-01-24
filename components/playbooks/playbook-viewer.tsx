'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PlaybookViewerProps {
  content: string
  className?: string
}

export function PlaybookViewer({ content, className = '' }: PlaybookViewerProps) {
  if (!content) {
    return (
      <div className={`text-center py-8 text-[#9B9BAD] ${className}`}>
        <p>אין תוכן להצגה</p>
      </div>
    )
  }

  return (
    <div className={`prose prose-sm max-w-none rtl ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-[#323338] mb-4 pb-2 border-b border-[#E6E9EF]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-[#323338] mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium text-[#323338] mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-[#676879] mb-3 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-4 text-sm text-[#676879] mr-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-4 text-sm text-[#676879] mr-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-[#676879]">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-r-4 border-[#00A0B0] pr-4 my-4 bg-[#F5F6F8] py-2 rounded-l-lg">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-[#F5F6F8] px-1.5 py-0.5 rounded text-[#D83A52] text-xs">
                  {children}
                </code>
              )
            }
            return (
              <code className="block bg-[#323338] text-white p-4 rounded-lg text-xs overflow-x-auto" dir="ltr">
                {children}
              </code>
            )
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-[#323338]">{children}</strong>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00A0B0] hover:underline"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-6 border-[#E6E9EF]" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse border border-[#E6E9EF]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-[#F5F6F8] px-3 py-2 text-right font-medium text-[#323338] border border-[#E6E9EF]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-[#676879] border border-[#E6E9EF]">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
