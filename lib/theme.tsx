'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeName = 'dark' | 'light' | 'amoled'

export interface Theme {
  name: ThemeName
  label: string
  emoji: string
  preview: { bg: string; card: string; accent: string }
  vars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    name: 'dark',
    label: 'Dark',
    emoji: '🌑',
    preview: { bg: '#0A0A0A', card: '#1A1A1A', accent: '#10B981' },
    vars: {
      '--bg': '#0A0A0A',
      '--bg2': '#0F0F0F',
      '--card': '#1A1A1A',
      '--card2': '#222222',
      '--border': '#2A2A2A',
      '--border2': '#333333',
      '--text': '#FFFFFF',
      '--text2': '#CCCCCC',
      '--muted': '#777777',
      '--accent': '#10B981',
      '--accent-dim': 'rgba(16,185,129,0.12)',
      '--accent-border': 'rgba(16,185,129,0.25)',
      '--accent-text': '#10B981',
      '--red': '#EF4444',
      '--amber': '#F59E0B',
      '--blue': '#3B82F6',
      '--purple': '#8B5CF6',
      '--pink': '#EC4899',
      '--nav-bg': 'rgba(10,10,10,0.92)',
      '--input-bg': '#111111',
      '--pill-bg': '#2A2A2A',
      '--pill-text': '#FFFFFF',
    },
  },
  {
    name: 'light',
    label: 'Light',
    emoji: '☀️',
    preview: { bg: '#F0F2F5', card: '#FFFFFF', accent: '#059669' },
    vars: {
      '--bg': '#F0F2F5',
      '--bg2': '#E8EBF0',
      '--card': '#FFFFFF',
      '--card2': '#F8F9FA',
      '--border': '#E0E4EA',
      '--border2': '#D0D5DD',
      '--text': '#111827',
      '--text2': '#374151',
      '--muted': '#6B7280',
      '--accent': '#059669',
      '--accent-dim': 'rgba(5,150,105,0.10)',
      '--accent-border': 'rgba(5,150,105,0.25)',
      '--accent-text': '#047857',
      '--red': '#DC2626',
      '--amber': '#D97706',
      '--blue': '#2563EB',
      '--purple': '#7C3AED',
      '--pink': '#DB2777',
      '--nav-bg': 'rgba(240,242,245,0.95)',
      '--input-bg': '#F8F9FA',
      '--pill-bg': '#F0F2F5',
      '--pill-text': '#111827',
    },
  },
  {
    name: 'amoled',
    label: 'AMOLED',
    emoji: '⬛',
    preview: { bg: '#000000', card: '#0D0D0D', accent: '#00E5B4' },
    vars: {
      '--bg': '#000000',
      '--bg2': '#020202',
      '--card': '#0D0D0D',
      '--card2': '#141414',
      '--border': '#1A1A1A',
      '--border2': '#222222',
      '--text': '#FFFFFF',
      '--text2': '#E0E0E0',
      '--muted': '#666666',
      '--accent': '#00E5B4',
      '--accent-dim': 'rgba(0,229,180,0.10)',
      '--accent-border': 'rgba(0,229,180,0.20)',
      '--accent-text': '#00E5B4',
      '--red': '#FF4444',
      '--amber': '#FFB300',
      '--blue': '#4488FF',
      '--purple': '#AA88FF',
      '--pink': '#FF55CC',
      '--nav-bg': 'rgba(0,0,0,0.97)',
      '--input-bg': '#080808',
      '--pill-bg': '#1A1A1A',
      '--pill-text': '#FFFFFF',
    },
  },
]

const ThemeContext = createContext<{ theme: Theme; setTheme: (n: ThemeName) => void }>({
  theme: THEMES[0], setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<ThemeName>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('nutrition-theme') as ThemeName
    if (saved && THEMES.find(t => t.name === saved)) setName(saved)
  }, [])

  const theme = THEMES.find(t => t.name === name) || THEMES[0]

  useEffect(() => {
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
  }, [theme])

  function setTheme(n: ThemeName) {
    setName(n)
    localStorage.setItem('nutrition-theme', n)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() { return useContext(ThemeContext) }
