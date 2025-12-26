/**
 * 编辑器页面 - 双栏布局，左侧视频预览，右侧笔记编辑
 */

import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  ArrowLeft,
  Clock,
  Trash2,
  Download,
  Image as ImageIcon
} from 'lucide-react'
import { useProjectStore } from '@/stores'
import type { NoteNode } from '@/types'

export default function EditorPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const { videoPath, notes, updateNote, deleteNote } = useProjectStore()
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)

  // 如果没有笔记数据，返回首页
  useEffect(() => {
    if (notes.length === 0) {
      navigate('/')
    }
  }, [notes, navigate])

  // 视频时间更新 - 高亮当前播放位置对应的笔记
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      // 高亮当前时间对应的笔记
      const currentNote = notes.find((note, index) => {
        const nextNote = notes[index + 1]
        return note.seconds <= video.currentTime && 
               (!nextNote || nextNote.seconds > video.currentTime)
      })
      if (currentNote) {
        setActiveNoteId(currentNote.id)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [notes])

  // 跳转到指定时间
  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds
      videoRef.current.play()
    }
  }


  return (
    <div className="h-screen flex flex-col bg-white text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        <h1 className="text-lg font-semibold">编辑笔记</h1>

        <button
          onClick={() => navigate('/export')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>导出</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Player */}
        <div className="w-[40%] flex flex-col border-r border-gray-200">
          <div className="flex-1 bg-black flex items-center justify-center">
            {videoPath ? (
              <video
                ref={videoRef}
                src={`file://${videoPath}`}
                className="max-w-full max-h-full"
                controls
              />
            ) : (
              <div className="text-gray-400">无视频</div>
            )}
          </div>

        </div>

        {/* Right: Notes List */}
        <div className="w-[60%] overflow-y-auto p-6 space-y-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              onSeek={() => seekTo(note.seconds)}
              onUpdate={(updates) => updateNote(note.id, updates)}
              onDelete={() => deleteNote(note.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// 笔记卡片组件
interface NoteCardProps {
  note: NoteNode
  isActive: boolean
  onSeek: () => void
  onUpdate: (updates: Partial<NoteNode>) => void
  onDelete: () => void
}

function NoteCard({ note, isActive, onSeek, onUpdate, onDelete }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`
        rounded-xl border transition-all
        ${isActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={onSeek}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
        >
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm">{note.timestamp}</span>
        </button>

        {isHovered && (
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full text-lg font-semibold bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
          placeholder="章节标题"
        />

        {/* Image */}
        {note.imagePath && (
          <div className="relative group">
            <img
              src={`file://${note.imagePath}`}
              alt={note.title}
              className="w-full rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm text-gray-700">
                <ImageIcon className="w-4 h-4" />
                微调截图
              </button>
            </div>
          </div>
        )}

        {/* Content - 使用 ReactMarkdown 渲染 */}
        <div className="prose prose-sm max-w-none text-gray-700">
          <ReactMarkdown
            components={{
              img: ({ ...props }) => (
                <img
                  {...props}
                  className="w-full max-w-2xl rounded-lg my-4"
                  style={{ display: 'block' }}
                />
              )
            }}
          >
            {note.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
