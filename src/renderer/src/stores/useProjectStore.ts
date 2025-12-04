/**
 * 项目状态管理 - 管理当前项目的视频、字幕、笔记数据
 */

import { create } from 'zustand'
import type { NoteNode, ProjectState } from '@/types'

interface ProjectStore extends ProjectState {
  // Actions
  setVideoPath: (path: string | null) => void
  setSubtitlePath: (path: string | null) => void
  setSubtitleContent: (content: string | null) => void
  setNotes: (notes: NoteNode[]) => void
  updateNote: (id: string, updates: Partial<NoteNode>) => void
  deleteNote: (id: string) => void
  setProcessing: (isProcessing: boolean) => void
  setProgress: (progress: number) => void
  setError: (error: string | null) => void
  resetProject: () => void
}

const initialState: ProjectState = {
  videoPath: null,
  subtitlePath: null,
  subtitleContent: null,
  notes: [],
  isProcessing: false,
  processingProgress: 0,
  error: null
}

export const useProjectStore = create<ProjectStore>((set) => ({
  ...initialState,

  setVideoPath: (path) => set({ videoPath: path }),
  setSubtitlePath: (path) => set({ subtitlePath: path }),
  setSubtitleContent: (content) => set({ subtitleContent: content }),
  setNotes: (notes) => set({ notes }),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, isEdited: true } : note
      )
    })),

  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id)
    })),

  setProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (progress) => set({ processingProgress: progress }),
  setError: (error) => set({ error }),
  resetProject: () => set(initialState)
}))
