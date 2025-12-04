/**
 * Setup 页面 - 上传视频和字幕
 */

import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileVideo,
  FileText,
  Settings,
  Loader2,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react'
import { checkHealth, analyzeVideo } from '@/api/client'
import { useProjectStore, useSettingsStore } from '@/stores'
import SettingsModal from '@/components/SettingsModal'

export default function SetupPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Store
  const { videoPath, subtitlePath, setVideoPath, setSubtitlePath, setSubtitleContent, setNotes, setProcessing } = useProjectStore()
  const { apiKey, baseUrl, model, outputStyle } = useSettingsStore()

  // Local state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessingLocal] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCheckHealth = async () => {
    setHealthStatus('checking')
    try {
      await checkHealth()
      setHealthStatus('ok')
    } catch {
      setHealthStatus('error')
    }
  }

  // 处理文件
  const handleFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      
      if (ext === 'mp4' || ext === 'mkv' || ext === 'avi' || ext === 'mov' || ext === 'webm') {
        // 视频文件 - 获取完整路径
        setVideoPath((file as any).path || file.name)
      } else if (ext === 'srt' || ext === 'vtt' || ext === 'txt') {
        // 字幕文件 - 读取内容
        setSubtitlePath((file as any).path || file.name)
        const reader = new FileReader()
        reader.onload = (e) => {
          setSubtitleContent(e.target?.result as string)
        }
        reader.readAsText(file)
      }
    })
  }, [setVideoPath, setSubtitlePath, setSubtitleContent])

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // 点击选择视频
  const handleSelectVideo = async () => {
    const path = await (window as any).api.selectVideoFile()
    if (path) {
      setVideoPath(path)
    }
  }

  // 点击选择字幕
  const handleSelectSubtitle = async () => {
    const result = await (window as any).api.selectSubtitleFile()
    if (result) {
      setSubtitlePath(result.path)
      setSubtitleContent(result.content)
    }
  }

  // 点击上传区域 - 优先选择缺少的文件类型
  const handleClick = async () => {
    if (!videoPath) {
      await handleSelectVideo()
    } else if (!subtitlePath) {
      await handleSelectSubtitle()
    } else {
      // 都有了，让用户选择视频
      await handleSelectVideo()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  // 清除文件
  const clearVideo = () => setVideoPath(null)
  const clearSubtitle = () => {
    setSubtitlePath(null)
    setSubtitleContent(null)
  }

  // 开始处理
  const handleStart = async () => {
    if (!videoPath || !useProjectStore.getState().subtitleContent) {
      setErrorMsg('请先上传视频和字幕文件')
      return
    }

    if (!apiKey) {
      setErrorMsg('请先在设置中配置 API Key')
      setSettingsOpen(true)
      return
    }

    setIsProcessingLocal(true)
    setProcessing(true)
    setErrorMsg('')

    try {
      const result = await analyzeVideo({
        videoPath,
        subtitleText: useProjectStore.getState().subtitleContent!,
        apiKey,
        stylePrompt: outputStyle,
        baseUrl: baseUrl || undefined,
        model
      })

      if (result.success) {
        setNotes(result.data)
        navigate('/editor')
      } else {
        setErrorMsg(result.error || '处理失败')
      }
    } catch (err: any) {
      setErrorMsg(err.message || '处理失败')
    } finally {
      setIsProcessingLocal(false)
      setProcessing(false)
    }
  }

  const canStart = videoPath && subtitlePath

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <FileVideo className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Video2Note</h1>
            <p className="text-xs text-gray-400">AI 视频笔记生成器</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Health indicator */}
          <button
            onClick={handleCheckHealth}
            className={`p-2 rounded-lg transition-colors ${
              healthStatus === 'ok' ? 'text-green-400' : 
              healthStatus === 'error' ? 'text-red-400' : 'text-gray-400 hover:bg-gray-700/50'
            }`}
            title="检查后端服务"
          >
            {healthStatus === 'checking' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : healthStatus === 'ok' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
            title="设置"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-8 py-12">
        {/* 已选择的文件 */}
        <div className="w-full max-w-2xl mb-6 space-y-3">
          {/* 视频文件 */}
          <div
            onClick={handleSelectVideo}
            className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${
              videoPath
                ? 'bg-blue-500/10 border border-blue-500/30'
                : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileVideo className={`w-5 h-5 ${videoPath ? 'text-blue-400' : 'text-gray-500'}`} />
              <span className={`text-sm truncate max-w-md ${videoPath ? 'text-gray-300' : 'text-gray-500'}`}>
                {videoPath || '点击选择视频文件...'}
              </span>
            </div>
            {videoPath && (
              <button onClick={(e) => { e.stopPropagation(); clearVideo(); }} className="p-1 hover:bg-gray-700 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* 字幕文件 */}
          <div
            onClick={handleSelectSubtitle}
            className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${
              subtitlePath
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`w-5 h-5 ${subtitlePath ? 'text-green-400' : 'text-gray-500'}`} />
              <span className={`text-sm truncate max-w-md ${subtitlePath ? 'text-gray-300' : 'text-gray-500'}`}>
                {subtitlePath || '点击选择字幕文件 (.srt/.vtt/.txt)...'}
              </span>
            </div>
            {subtitlePath && (
              <button onClick={(e) => { e.stopPropagation(); clearSubtitle(); }} className="p-1 hover:bg-gray-700 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="w-full max-w-2xl">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".mp4,.mkv,.avi,.mov,.webm,.srt,.vtt,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer group
              ${isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-blue-500/50 hover:bg-blue-500/5'
              }
            `}
          >
            <div className="flex flex-col items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                isDragging ? 'bg-blue-500/20' : 'bg-gray-800 group-hover:bg-blue-500/20'
              }`}>
                <Upload className={`w-10 h-10 transition-colors ${
                  isDragging ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'
                }`} />
              </div>

              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">拖拽文件到此处</h2>
                <p className="text-gray-400">或点击选择文件</p>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50">
                  <FileVideo className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">视频文件</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50">
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">.srt/.vtt/.txt</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!canStart || isProcessing}
          className={`
            mt-8 px-8 py-4 rounded-xl font-semibold text-lg transition-all
            bg-gradient-to-r from-blue-600 to-purple-600
            ${canStart && !isProcessing
              ? 'hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-blue-500/25'
              : 'opacity-50 cursor-not-allowed'
            }
          `}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              处理中...
            </span>
          ) : (
            '开始生成笔记'
          )}
        </button>
        {!canStart && (
          <p className="mt-2 text-sm text-gray-500">请先上传视频和字幕文件</p>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
