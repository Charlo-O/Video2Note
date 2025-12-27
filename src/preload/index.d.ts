import { ElectronAPI } from '@electron-toolkit/preload'

type AppApi = {
  selectVideoFile: () => Promise<string | null>
  selectSubtitleFile: () => Promise<{ path: string; content: string } | null>
  selectImageFile: () => Promise<string | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppApi
  }
}
