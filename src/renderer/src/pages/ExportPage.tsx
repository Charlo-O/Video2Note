/**
 * 导出页面 - Markdown/PDF 导出
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  ArrowLeft,
  FileText,
  FileDown,
  Copy,
  Check,
  Printer
} from 'lucide-react'
import { useProjectStore } from '@/stores'

export default function ExportPage() {
  const navigate = useNavigate()
  const { notes, videoPath } = useProjectStore()
  const [copied, setCopied] = useState(false)
  const [imageMode, setImageMode] = useState<'path' | 'base64'>('path')

  // 生成 Markdown 内容
  const generateMarkdown = () => {
    const lines: string[] = []
    
    // 标题
    const videoName = videoPath?.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || 'Video Notes'
    lines.push(`# ${videoName}`)
    lines.push('')
    lines.push(`> 由 Video2Note 自动生成`)
    lines.push('')
    lines.push('---')
    lines.push('')

    // 目录
    lines.push('## 目录')
    lines.push('')
    notes.forEach((note, index) => {
      lines.push(`${index + 1}. [${note.title}](#${note.timestamp.replace(/:/g, '')})`)
    })
    lines.push('')
    lines.push('---')
    lines.push('')

    // 内容
    notes.forEach((note) => {
      lines.push(`## ${note.title} {#${note.timestamp.replace(/:/g, '')}}`)
      lines.push('')
      lines.push(`**时间戳**: \`${note.timestamp}\``)
      lines.push('')
      
      if (note.imagePath) {
        if (imageMode === 'path') {
          lines.push(`![${note.title}](${note.imagePath})`)
        } else {
          // Base64 模式需要实际读取文件，这里暂时用路径
          lines.push(`![${note.title}](${note.imagePath})`)
        }
        lines.push('')
      }
      
      lines.push(note.content)
      lines.push('')
      lines.push('---')
      lines.push('')
    })

    return lines.join('\n')
  }

  const markdown = generateMarkdown()

  // 复制到剪贴板
  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 下载 Markdown 文件
  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notes.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  // 打印 PDF
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 print:hidden">
        <button
          onClick={() => navigate('/editor')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回编辑</span>
        </button>

        <h1 className="text-lg font-semibold">导出笔记</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>下载 .md</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>打印 PDF</span>
          </button>
        </div>
      </header>

      {/* Options */}
      <div className="px-6 py-4 border-b border-gray-200 print:hidden">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">图片处理:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="imageMode"
              checked={imageMode === 'path'}
              onChange={() => setImageMode('path')}
              className="accent-blue-500"
            />
            <span className="text-sm">本地路径</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="imageMode"
              checked={imageMode === 'base64'}
              onChange={() => setImageMode('base64')}
              className="accent-blue-500"
            />
            <span className="text-sm">内嵌 Base64</span>
          </label>
        </div>
      </div>

      {/* Preview */}
      <div className="flex">
        {/* Markdown Source */}
        <div className="w-1/2 border-r border-gray-200 print:hidden">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4 text-gray-500">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Markdown 源码</span>
            </div>
            <pre className="p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-auto max-h-[calc(100vh-200px)] text-sm text-gray-700 font-mono whitespace-pre-wrap">
              {markdown}
            </pre>
          </div>
        </div>

        {/* Rendered Preview */}
        <div className="w-1/2 print:w-full">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4 text-gray-500 print:hidden">
              <FileDown className="w-4 h-4" />
              <span className="text-sm font-medium">预览</span>
            </div>
            <div className="prose max-w-none p-6 bg-gray-50 border border-gray-200 rounded-lg print:bg-white print:text-black">
              {notes.map((note, index) => (
                <div key={note.id} className="mb-8">
                  <h2 className="text-xl font-bold mb-2">{note.title}</h2>
                  <p className="text-sm text-gray-500 print:text-gray-600 mb-4">
                    时间戳: {note.timestamp}
                  </p>
                  {note.imagePath && (
                    <img
                      src={`file://${note.imagePath}`}
                      alt={note.title}
                      className="w-full max-w-lg rounded-lg mb-4"
                    />
                  )}
                  <div className="text-gray-700 print:text-gray-800 prose prose-sm max-w-none">
                    <ReactMarkdown
                      urlTransform={(url) => url}
                      components={{
                        img: ({ src, alt, ...props }) => (
                          <img
                            {...props}
                            src={src}
                            alt={alt}
                            className="w-full max-w-2xl rounded-lg my-4"
                            style={{ display: 'block' }}
                          />
                        )
                      }}
                    >
                      {note.content}
                    </ReactMarkdown>
                  </div>
                  {index < notes.length - 1 && (
                    <hr className="my-6 border-gray-200 print:border-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:w-full {
            width: 100% !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:text-black {
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}
