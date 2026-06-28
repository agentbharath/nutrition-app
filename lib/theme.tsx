'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeName = 'dark' | 'light' | 'forest' | 'midnight' | 'warm'

export interface Theme {
  name: ThemeName
  label: string
  emoji: string
  bg: string
  card: string
  border: string
  accent: string
  accentText: string
  text: string
  muted: string
  preview: string[]
}

export const THEMES: Theme[] = [
  {
    name: 'dark',
    label: 'Dark',
    emoji: '🌑',
    bg: '#080808',
    card: '#111111',
    border: '#1E1E1E',
    accent: '#10B981',
    accentText: '#10B981',
    text: '#FFFFFF',
    muted: '#555555',
    preview: ['#080808', '#111111', '#10B981'],
  },
  {
    name: 'light',
    label: 'Light',
    emoji: '☀️',
    bg: '#F5F5F5',
    card: '#FFFFFF',
    border: '#E5E5E5',
    accent: '#059669',
    accentText: '#059669',
    text: '#111111',
    muted: '#888888',
    preview: ['#F5F5F5', '#FFFFFF', '#059669'],
  },
  {
    name: 'forest',
    label: 'Forest',
    emoji: '🌲',
    bg: '#060F08',
    card: '#0C1A0E',
    border: '#1A3020',
    accent: '#22C55E',
    accentText: '#4ADE80',
    text: '#E8F5E9',
    muted: '#4A6B50',
    preview: ['#060F08', '#0C1A0E', '#22C55E'],
  },
  {
    name: 'midnight',
    label: 'Midnight',
    emoji: '🌌',
    bg: '#05060F',
    card: '#0D0F1E',
    border: '#1A1D3A',
    accent: '#6366F1',
    accentText: '#818CF8',
    text: '#E8E8FF',
    muted: '#4A4D6B',
    preview: ['#05060F', '#0D0F1E', '#6366F1'],
  },
  {
    name: 'warm',
    label: 'Warm',
    emoji: '🔥',
    bg: '#0F0906',
    card: '#1A1008',
    border: '#2E1E0A',
    accent: '#F97316',
    accentText: '#FB923C',
    text: '#FFF7ED',
    muted: '#6B4A28',
    preview: ['#0F0906', '#1A1008', '#F97316'],
  },
]

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (name: ThemeName) => void
}>({
  theme: THEMES[0],
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('nutrition-theme') as ThemeName
    if (saved && THEMES.find(t => t.name === saved)) {
      setThemeName(saved)
    }
  }, [])

  const theme = THEMES.find(t => t.name === themeName) || THEMES[0]

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bg', theme.bg)
    root.style.setProperty('--card', theme.card)
    root.style.setProperty('--border', theme.border)
    root.style.setProperty('--accent', theme.accent)
    root.style.setProperty('--accent-text', theme.accentText)
    root.style.setProperty('--text', theme.text)
    root.style.setProperty('--muted', theme.muted)
    document.body.style.backgroundColor = theme.bg
    document.body.style.color = theme.text
  }, [theme])

  function setTheme(name: ThemeName) {
    setThemeName(name)
    localStorage.setItem('nutrition-theme', name)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
