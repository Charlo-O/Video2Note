/**
 * 设置状态管理 - 使用 Zustand 持久化到 localStorage
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings } from '@/types'

interface SettingsState extends AppSettings {
  // Actions
  setLlmProvider: (provider: AppSettings['llmProvider']) => void
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setModel: (model: string) => void
  setScreenshotDensity: (density: AppSettings['screenshotDensity']) => void
  setOutputStyle: (style: AppSettings['outputStyle']) => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  llmProvider: 'openai',
  apiKey: '',
  baseUrl: '',
  model: 'gpt-4o-mini',
  screenshotDensity: 'smart',
  outputStyle: 'professional'
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setLlmProvider: (provider) => set({ llmProvider: provider }),
      setApiKey: (key) => set({ apiKey: key }),
      setBaseUrl: (url) => set({ baseUrl: url }),
      setModel: (model) => set({ model: model }),
      setScreenshotDensity: (density) => set({ screenshotDensity: density }),
      setOutputStyle: (style) => set({ outputStyle: style }),
      resetSettings: () => set(defaultSettings)
    }),
    {
      name: 'video2note-settings'
    }
  )
)
