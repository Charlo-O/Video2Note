/**
 * Video2Note 核心类型定义
 */

// 核心笔记节点结构
export interface NoteNode {
  id: string
  timestamp: string // 格式 "HH:MM:SS"
  seconds: number // 用于视频跳转的秒数
  title: string // 小标题
  content: string // AI 润色后的正文 (Markdown)
  imagePath: string // 本地图片绝对路径
  isEdited: boolean // 标记用户是否修改过
}

// 应用配置结构
export interface AppSettings {
  llmProvider: 'openai' | 'anthropic' | 'local'
  apiKey: string
  baseUrl?: string
  model: string
  screenshotDensity: 'smart' | 'high' | 'low'
  outputStyle: 'professional' | 'blog' | 'tutorial'
}

// 项目状态
export interface ProjectState {
  videoPath: string | null
  subtitlePath: string | null
  subtitleContent: string | null
  notes: NoteNode[]
  isProcessing: boolean
  processingProgress: number
  error: string | null
}

// API 响应类型
export interface HealthResponse {
  status: string
  message: string
  version: string
}

export interface AnalyzeResponse {
  success: boolean
  data: NoteNode[]
  error?: string
}
