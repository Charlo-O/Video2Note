/**
 * 设置模态框组件
 */

import { useState } from 'react'
import { X, Key, Globe, Cpu, FileText, Sparkles } from 'lucide-react'
import { useSettingsStore } from '@/stores'
import type { AppSettings } from '@/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const OUTPUT_STYLES: { value: AppSettings['outputStyle']; label: string; desc: string }[] = [
  { value: 'professional', label: '专业文档', desc: '严谨准确的技术文档风格' },
  { value: 'blog', label: '博客风格', desc: '轻松易读，适合分享' },
  { value: 'tutorial', label: '教程风格', desc: '循序渐进，详细解释' }
]

const PRESET_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (推荐)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'qwen-turbo', label: '通义千问 Turbo' },
  { value: 'glm-4', label: 'GLM-4' }
]

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    apiKey,
    baseUrl,
    model,
    outputStyle,
    setApiKey,
    setBaseUrl,
    setModel,
    setOutputStyle
  } = useSettingsStore()

  const [showApiKey, setShowApiKey] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">设置</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* API Key */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Key className="w-4 h-4" />
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                {showApiKey ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Globe className="w-4 h-4" />
              API Base URL (可选)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500">留空使用默认地址，或填入自定义代理地址</p>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Cpu className="w-4 h-4" />
              模型
            </label>
            {/* 预设模型快速选择 */}
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_MODELS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setModel(m.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    model === m.value
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {/* 手动输入模型名称 */}
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="或直接输入模型名称，如 gpt-4o-mini"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
            />
            <p className="text-xs text-gray-500">支持任何 OpenAI 兼容 API 的模型名称</p>
          </div>

          {/* Output Style */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <FileText className="w-4 h-4" />
              输出风格
            </label>
            <div className="grid grid-cols-1 gap-3">
              {OUTPUT_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setOutputStyle(style.value)}
                  className={`
                    flex items-start gap-3 p-4 rounded-xl border transition-all text-left
                    ${outputStyle === style.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
                    }
                  `}
                >
                  <Sparkles className={`w-5 h-5 mt-0.5 ${outputStyle === style.value ? 'text-blue-400' : 'text-gray-500'}`} />
                  <div>
                    <div className={`font-medium ${outputStyle === style.value ? 'text-white' : 'text-gray-300'}`}>
                      {style.label}
                    </div>
                    <div className="text-sm text-gray-500">{style.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
}
