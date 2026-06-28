'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeName = 'dark' | 'light' | 'amoled' | 'matcha' | 'sunrise' | 'coastal' | 'fig' | 'salt'

export interface Theme {
  name: ThemeName
  label: string
  emoji: string
  preview: { bg: string; card: string; accent: string; text: string }
  vars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    name: 'dark', label: 'Dark', emoji: '🌑',
    preview: { bg: '#0A0A0A', card: '#1A1A1A', accent: '#10B981', text: '#fff' },
    vars: {
      '--bg':'#0A0A0A','--bg2':'#0F0F0F','--card':'#1A1A1A','--card2':'#222222',
      '--border':'#2A2A2A','--border2':'#333333','--text':'#FFFFFF','--text2':'#CCCCCC',
      '--muted':'#777777','--accent':'#10B981','--accent-dim':'rgba(16,185,129,0.12)',
      '--accent-border':'rgba(16,185,129,0.25)','--accent-text':'#10B981',
      '--red':'#EF4444','--amber':'#F59E0B','--blue':'#3B82F6','--purple':'#8B5CF6','--pink':'#EC4899',
      '--nav-bg':'rgba(10,10,10,0.92)','--input-bg':'#111111','--pill-bg':'#2A2A2A','--pill-text':'#FFFFFF',
    },
  },
  {
    name: 'light', label: 'Light', emoji: '☀️',
    preview: { bg: '#F0F2F5', card: '#FFFFFF', accent: '#059669', text: '#111' },
    vars: {
      '--bg':'#F0F2F5','--bg2':'#E8EBF0','--card':'#FFFFFF','--card2':'#F8F9FA',
      '--border':'#E0E4EA','--border2':'#D0D5DD','--text':'#111827','--text2':'#374151',
      '--muted':'#6B7280','--accent':'#059669','--accent-dim':'rgba(5,150,105,0.10)',
      '--accent-border':'rgba(5,150,105,0.25)','--accent-text':'#047857',
      '--red':'#DC2626','--amber':'#D97706','--blue':'#2563EB','--purple':'#7C3AED','--pink':'#DB2777',
      '--nav-bg':'rgba(240,242,245,0.95)','--input-bg':'#F8F9FA','--pill-bg':'#F0F2F5','--pill-text':'#111827',
    },
  },
  {
    name: 'amoled', label: 'AMOLED', emoji: '⬛',
    preview: { bg: '#000000', card: '#0D0D0D', accent: '#00E5B4', text: '#fff' },
    vars: {
      '--bg':'#000000','--bg2':'#020202','--card':'#0D0D0D','--card2':'#141414',
      '--border':'#1A1A1A','--border2':'#222222','--text':'#FFFFFF','--text2':'#E0E0E0',
      '--muted':'#666666','--accent':'#00E5B4','--accent-dim':'rgba(0,229,180,0.10)',
      '--accent-border':'rgba(0,229,180,0.20)','--accent-text':'#00E5B4',
      '--red':'#FF4444','--amber':'#FFB300','--blue':'#4488FF','--purple':'#AA88FF','--pink':'#FF55CC',
      '--nav-bg':'rgba(0,0,0,0.97)','--input-bg':'#080808','--pill-bg':'#1A1A1A','--pill-text':'#FFFFFF',
    },
  },
  {
    name: 'matcha', label: 'Matcha & Oat', emoji: '🍵',
    preview: { bg: '#FDFBF7', card: '#F5F2EB', accent: '#7A9A78', text: '#2C2520' },
    vars: {
      '--bg':'#FDFBF7','--bg2':'#F8F5F0','--card':'#F5F2EB','--card2':'#EDE9E1',
      '--border':'#DDD9D0','--border2':'#C8C3B8','--text':'#2C2520','--text2':'#3D3530',
      '--muted':'#9A8F85','--accent':'#7A9A78','--accent-dim':'rgba(122,154,120,0.12)',
      '--accent-border':'rgba(122,154,120,0.30)','--accent-text':'#5A7A58',
      '--red':'#B85C5C','--amber':'#B8883C','--blue':'#5C7896','--purple':'#7A6896','--pink':'#A87888',
      '--nav-bg':'rgba(253,251,247,0.95)','--input-bg':'#F5F2EB','--pill-bg':'#EDE9E1','--pill-text':'#2C2520',
    },
  },
  {
    name: 'sunrise', label: 'Sunrise Citrus', emoji: '🌅',
    preview: { bg: '#1A1625', card: '#241F33', accent: '#FF9E64', text: '#F3EFF5' },
    vars: {
      '--bg':'#1A1625','--bg2':'#1E1A2C','--card':'#241F33','--card2':'#2E2840',
      '--border':'#3A3350','--border2':'#4A4360','--text':'#F3EFF5','--text2':'#D8D4E0',
      '--muted':'#8880A0','--accent':'#FF9E64','--accent-dim':'rgba(255,158,100,0.12)',
      '--accent-border':'rgba(255,158,100,0.30)','--accent-text':'#FF9E64',
      '--red':'#FF6B6B','--amber':'#FFD56B','--blue':'#6B9EFF','--purple':'#C09EFF','--pink':'#FF9ECC',
      '--nav-bg':'rgba(26,22,37,0.95)','--input-bg':'#1A1625','--pill-bg':'#2E2840','--pill-text':'#F3EFF5',
    },
  },
  {
    name: 'coastal', label: 'Coastal Earth', emoji: '🌊',
    preview: { bg: '#F4F3EF', card: '#E6E8E3', accent: '#4E6E58', text: '#2B2D2F' },
    vars: {
      '--bg':'#F4F3EF','--bg2':'#ECEAE5','--card':'#FFFFFF','--card2':'#E6E8E3',
      '--border':'#D4D6D1','--border2':'#C4C6C1','--text':'#2B2D2F','--text2':'#3B3D3F',
      '--muted':'#7A8075','--accent':'#4E6E58','--accent-dim':'rgba(78,110,88,0.10)',
      '--accent-border':'rgba(78,110,88,0.28)','--accent-text':'#3D5A46',
      '--red':'#8B3A3A','--amber':'#8B6A2A','--blue':'#6B8E9B','--purple':'#6B6E9B','--pink':'#8E6B6B',
      '--nav-bg':'rgba(244,243,239,0.95)','--input-bg':'#F4F3EF','--pill-bg':'#E6E8E3','--pill-text':'#2B2D2F',
    },
  },
  {
    name: 'fig', label: 'Twilight Fig', emoji: '🫐',
    preview: { bg: '#1E121E', card: '#2A1B2A', accent: '#E5A93C', text: '#F9F6F0' },
    vars: {
      '--bg':'#1E121E','--bg2':'#241722','--card':'#2A1B2A','--card2':'#352233',
      '--border':'#452A45','--border2':'#553355','--text':'#F9F6F0','--text2':'#E0D8D0',
      '--muted':'#997788','--accent':'#E5A93C','--accent-dim':'rgba(229,169,60,0.12)',
      '--accent-border':'rgba(229,169,60,0.28)','--accent-text':'#E5A93C',
      '--red':'#E56B6B','--amber':'#E5C83C','--blue':'#6BA8E5','--purple':'#C09EE5','--pink':'#E59EC0',
      '--nav-bg':'rgba(30,18,30,0.95)','--input-bg':'#1E121E','--pill-bg':'#352233','--pill-text':'#F9F6F0',
    },
  },
  {
    name: 'salt', label: 'Himalayan Salt', emoji: '🌿',
    preview: { bg: '#FAF5F3', card: '#F0EAE6', accent: '#607762', text: '#3D3531' },
    vars: {
      '--bg':'#FAF5F3','--bg2':'#F5EEE9','--card':'#FFFFFF','--card2':'#F0EAE6',
      '--border':'#E0D8D2','--border2':'#D0C8C0','--text':'#3D3531','--text2':'#4D4540',
      '--muted':'#9A8A85','--accent':'#607762','--accent-dim':'rgba(96,119,98,0.10)',
      '--accent-border':'rgba(96,119,98,0.28)','--accent-text':'#4A5E4C',
      '--red':'#A05050','--amber':'#A07840','--blue':'#507080','--purple':'#706080','--pink':'#A07080',
      '--nav-bg':'rgba(250,245,243,0.95)','--input-bg':'#F5EEE9','--pill-bg':'#F0EAE6','--pill-text':'#3D3531',
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

  function setTheme(n: ThemeName) { setName(n); localStorage.setItem('nutrition-theme', n) }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() { return useContext(ThemeContext) }
