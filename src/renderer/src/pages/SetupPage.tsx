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
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-40 border-b border-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <FileVideo className="w-6 h-6 text-white" strokeWidth="2.5" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tighter block leading-none">Video2Note <span className="text-indigo-600">AI</span></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">智能视频笔记生成</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Health Status */}
            <div className="hidden sm:flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold border border-green-100 uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${healthStatus === 'ok' ? 'bg-green-500 animate-pulse' : healthStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
              {healthStatus === 'ok' ? 'AI 就绪' : healthStatus === 'error' ? '服务异常' : '检查中'}
            </div>
            
            <button
              onClick={handleCheckHealth}
              className={`p-2 rounded-xl transition-all ${
                healthStatus === 'ok' ? 'text-green-600 bg-green-50 hover:bg-green-100' : 
                healthStatus === 'error' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-slate-500 hover:bg-slate-100'
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
              className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-500 hover:text-slate-900"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid lg:grid-cols-5 gap-16 items-start">
          
          {/* Left Column - Instructions & Controls */}
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-6">
              <h1 className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                智能提取。<br /><span className="gradient-text">重塑</span> 笔记体验。
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                上传您的视频内容和字幕文件，AI 将为您进行深度分析，生成结构化的学习笔记。
              </p>
            </div>

            {/* File Selection Steps */}
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">01</span>
                  选择视频文件
                </label>
                <div
                  onClick={handleSelectVideo}
                  className={`group relative overflow-hidden p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                    videoPath 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-inner' 
                      : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${videoPath ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <FileVideo className="w-6 h-6" strokeWidth="2.5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 mb-1">
                          {videoPath ? videoPath.split(/[/\\]/).pop() : '点击选择视频文件'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {videoPath ? '已选择文件' : 'MP4, AVI, MOV, MKV, WEBM'}
                        </div>
                      </div>
                    </div>
                    {videoPath && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); clearVideo(); }} 
                        className="p-2 hover:bg-red-100 rounded-xl transition-all text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">02</span>
                  选择字幕文件
                </label>
                <div
                  onClick={handleSelectSubtitle}
                  className={`group relative overflow-hidden p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                    subtitlePath 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-inner' 
                      : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${subtitlePath ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <FileText className="w-6 h-6" strokeWidth="2.5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 mb-1">
                          {subtitlePath ? subtitlePath.split(/[/\\]/).pop() : '点击选择字幕文件'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {subtitlePath ? '已选择文件' : 'SRT, VTT, TXT 格式'}
                        </div>
                      </div>
                    </div>
                    {subtitlePath && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); clearSubtitle(); }} 
                        className="p-2 hover:bg-red-100 rounded-xl transition-all text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Start Generation Button */}
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart || isProcessing}
              className={`group w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 transition-all ${
                canStart && !isProcessing
                  ? 'bg-indigo-600 hover:bg-slate-900 text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>AI 深度分析中...</span>
                </>
              ) : (
                <>
                  <span>开始 AI 笔记生成</span>
                  <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Error Message */}
            {errorMsg && (
              <div className="px-6 py-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 text-sm font-medium">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Upload Zone & Preview */}
          <div className="lg:col-span-3 min-h-[700px] flex flex-col relative">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".mp4,.mkv,.avi,.mov,.webm,.srt,.vtt,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className={`flex-grow bg-white/50 backdrop-blur-sm rounded-[3rem] p-10 border-4 border-white shadow-2xl transition-all ${isProcessing ? 'opacity-90 grayscale-[0.5]' : ''}`}>
              {!isProcessing && (!videoPath || !subtitlePath) && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div 
                    onClick={handleClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group cursor-pointer transition-all duration-300 ${isDragging ? 'scale-105' : 'hover:scale-[1.02]'}`}
                  >
                    <div className={`w-40 h-40 rounded-[2.5rem] flex items-center justify-center mb-8 border-4 transition-all ${
                      isDragging 
                        ? 'border-indigo-400 bg-indigo-50 border-dashed' 
                        : 'border-slate-100 bg-slate-50 border-dashed hover:border-indigo-200 hover:bg-indigo-50'
                    }`}>
                      <Upload className={`w-20 h-20 transition-all ${
                        isDragging ? 'text-indigo-500 scale-110' : 'text-slate-300 group-hover:text-indigo-400 group-hover:scale-105'
                      }`} />
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">拖拽上传文件</h3>
                  <p className="text-slate-400 max-w-sm mx-auto font-medium mb-8">支持视频与字幕文件同时上传，让 AI 开始智能分析。</p>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-100">
                      <FileVideo className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm font-bold text-slate-700">视频文件</span>
                    </div>
                    <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-100">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm font-bold text-slate-700">字幕文件</span>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-10">
                  <div className="relative">
                    <div className="w-32 h-32 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] shadow-xl animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-900">AI 正在深度分析...</h3>
                    <div className="px-8 py-3 bg-indigo-50 rounded-full border border-indigo-100">
                      <p className="text-indigo-600 font-black text-sm uppercase tracking-widest">智能内容解析进行中</p>
                    </div>
                  </div>
                </div>
              )}

              {videoPath && subtitlePath && !isProcessing && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-32 h-32 bg-green-50 rounded-[2.5rem] flex items-center justify-center border border-green-100 shadow-inner">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">文件准备就绪</h3>
                    <p className="text-slate-400 max-w-md mx-auto font-medium">视频和字幕文件已成功上传，点击左侧按钮开始 AI 分析。</p>
                  </div>
                  
                  <div className="flex flex-col gap-4 w-full max-w-md">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <FileVideo className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm font-bold text-slate-700 truncate">{videoPath.split(/[/\\]/).pop()}</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <FileText className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm font-bold text-slate-700 truncate">{subtitlePath.split(/[/\\]/).pop()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-10 opacity-30">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">AI 驱动分析</span>
               <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">结构化笔记生成</span>
               <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">智能内容提取</span>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
