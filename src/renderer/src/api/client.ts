/**
 * API 客户端 - 与 Python 后端通信
 */

import axios from 'axios'
import type { HealthResponse } from '@/types'

const API_BASE_URL = 'http://127.0.0.1:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5分钟超时，因为 AI 处理长字幕可能较慢
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 健康检查
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/health')
  return response.data
}

/**
 * 分析视频
 */
export async function analyzeVideo(params: {
  videoPath: string
  subtitleText: string
  apiKey: string
  stylePrompt: string
  baseUrl?: string
  model?: string
}) {
  const response = await apiClient.post('/analyze_video', {
    video_path: params.videoPath,
    subtitle_text: params.subtitleText,
    api_key: params.apiKey,
    style: params.stylePrompt,
    base_url: params.baseUrl,
    model: params.model || 'gpt-4o-mini'
  })
  return response.data
}
