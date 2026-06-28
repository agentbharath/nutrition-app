'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeName = 'dark' | 'light' | 'amoled' | 'cartoon' | 'voyage' | 'arcade' | 'bento' | 'candy' | 'safari' | 'matcha' | 'sunrise' | 'coastal' | 'fig' | 'salt'

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
      '--muted':'#A3A3A3','--accent':'#10B981','--accent-dim':'rgba(16,185,129,0.12)',
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
      '--muted':'#A3A3A3','--accent':'#00E5B4','--accent-dim':'rgba(0,229,180,0.10)',
      '--accent-border':'rgba(0,229,180,0.20)','--accent-text':'#00E5B4',
      '--red':'#FF4444','--amber':'#FFB300','--blue':'#4488FF','--purple':'#AA88FF','--pink':'#FF55CC',
      '--nav-bg':'rgba(0,0,0,0.97)','--input-bg':'#080808','--pill-bg':'#1A1A1A','--pill-text':'#FFFFFF',
    },
  },
  {
    name: 'cartoon', label: 'Cartoon Pop', emoji: '💥',
    preview: { bg: '#FFF275', card: '#FFFFFF', accent: '#FF4D6D', text: '#171321' },
    vars: {
      '--bg':'#FFF275','--bg2':'#7BDFF2','--card':'#FFFFFF','--card2':'#FDF0D5',
      '--border':'#171321','--border2':'#171321','--text':'#171321','--text2':'#302A3A',
      '--muted':'#4B3F5A','--accent':'#FF4D6D','--accent-dim':'rgba(255,77,109,0.18)',
      '--accent-border':'rgba(23,19,33,0.85)','--accent-text':'#E11D48',
      '--red':'#EF233C','--amber':'#FFB703','--blue':'#118AB2','--purple':'#8338EC','--pink':'#FF4D6D',
      '--nav-bg':'rgba(255,242,117,0.96)','--input-bg':'#FFFFFF','--pill-bg':'#171321','--pill-text':'#FFF275',
      '--theme-pattern':'radial-gradient(circle at 18px 18px, rgba(23,19,33,0.16) 0 2px, transparent 2.5px), radial-gradient(circle at 42px 46px, rgba(255,77,109,0.18) 0 7px, transparent 7.5px)',
      '--theme-pattern-soft':'radial-gradient(circle at 20px 20px, rgba(23,19,33,0.08) 0 2px, transparent 2.5px)',
      '--card-pattern':'linear-gradient(135deg, rgba(255,242,117,0.20) 0 25%, transparent 25% 50%, rgba(123,223,242,0.18) 50% 75%, transparent 75%)',
      '--header-art':'radial-gradient(circle at 88% 24%, rgba(255,77,109,0.32) 0 18px, transparent 19px), radial-gradient(circle at 78% 52%, rgba(255,183,3,0.30) 0 12px, transparent 13px)',
      '--card-shadow':'4px 4px 0 rgba(23,19,33,0.26)',
      '--card-shadow-soft':'3px 3px 0 rgba(23,19,33,0.16)',
    },
  },
  {
    name: 'voyage', label: 'Grand Voyage', emoji: '🏴‍☠️',
    preview: { bg: '#8EDAE6', card: '#FFF1C7', accent: '#D62839', text: '#151515' },
    vars: {
      '--bg':'#8EDAE6','--bg2':'#37A5B8','--card':'#FFF1C7','--card2':'#F8DDA4',
      '--border':'#17324D','--border2':'#C2872D','--text':'#151515','--text2':'#2D2A24',
      '--muted':'#4A3820','--accent':'#D62839','--accent-dim':'rgba(214,40,57,0.16)',
      '--accent-border':'rgba(23,50,77,0.58)','--accent-text':'#9F1D2B',
      '--red':'#D62839','--amber':'#B66A00','--blue':'#006A8E','--purple':'#6D28D9','--pink':'#BE185D',
      '--nav-bg':'rgba(255,241,199,0.96)','--input-bg':'#FFF9E8','--pill-bg':'#17324D','--pill-text':'#FFF1C7',
      '--theme-pattern':'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.45) 0 18%, transparent 19%), repeating-radial-gradient(ellipse at 50% 110%, rgba(23,50,77,0.18) 0 6px, transparent 7px 22px)',
      '--theme-pattern-soft':'repeating-linear-gradient(135deg, rgba(23,50,77,0.08) 0 8px, transparent 8px 18px)',
      '--card-pattern':'linear-gradient(90deg, rgba(194,135,45,0.12), transparent 45%), radial-gradient(circle at 92% 18%, rgba(214,40,57,0.13) 0 18px, transparent 19px)',
      '--header-art':'radial-gradient(circle at 92% 35%, rgba(255,241,199,0.60) 0 22px, transparent 23px)',
      '--card-shadow':'0 5px 0 rgba(23,50,77,0.28)',
      '--card-shadow-soft':'0 3px 0 rgba(23,50,77,0.18)',
    },
  },
  {
    name: 'arcade', label: 'Neon Arcade', emoji: '🕹️',
    preview: { bg: '#08031A', card: '#17102E', accent: '#00F5D4', text: '#F8F7FF' },
    vars: {
      '--bg':'#08031A','--bg2':'#11072B','--card':'#17102E','--card2':'#24164A',
      '--border':'#3A2D6E','--border2':'#5A3C98','--text':'#F8F7FF','--text2':'#DDD6FE',
      '--muted':'#9A8FC8','--accent':'#00F5D4','--accent-dim':'rgba(0,245,212,0.14)',
      '--accent-border':'rgba(0,245,212,0.36)','--accent-text':'#00F5D4',
      '--red':'#FF3864','--amber':'#FCEE09','--blue':'#00BBF9','--purple':'#9B5DE5','--pink':'#F15BB5',
      '--nav-bg':'rgba(8,3,26,0.96)','--input-bg':'#11072B','--pill-bg':'#2F1E68','--pill-text':'#F8F7FF',
      '--theme-pattern':'linear-gradient(rgba(0,245,212,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(241,91,181,0.08) 1px, transparent 1px), radial-gradient(circle at 82% 18%, rgba(252,238,9,0.22) 0 3px, transparent 4px)',
      '--theme-pattern-soft':'linear-gradient(rgba(0,245,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(241,91,181,0.05) 1px, transparent 1px)',
      '--card-pattern':'radial-gradient(circle at 88% 12%, rgba(0,245,212,0.12) 0 18px, transparent 19px)',
      '--header-art':'radial-gradient(circle at 86% 32%, rgba(241,91,181,0.30) 0 14px, transparent 15px), radial-gradient(circle at 74% 52%, rgba(0,245,212,0.24) 0 9px, transparent 10px)',
      '--card-shadow':'0 0 24px rgba(0,245,212,0.13)',
      '--card-shadow-soft':'0 0 18px rgba(155,93,229,0.12)',
    },
  },
  {
    name: 'bento', label: 'Bento Studio', emoji: '🍱',
    preview: { bg: '#F8F0E3', card: '#FFFDFC', accent: '#E94F37', text: '#263238' },
    vars: {
      '--bg':'#F8F0E3','--bg2':'#E6F2EF','--card':'#FFFDFC','--card2':'#F4D6CC',
      '--border':'#314E52','--border2':'#E3B23C','--text':'#263238','--text2':'#37474F',
      '--muted':'#6F7779','--accent':'#E94F37','--accent-dim':'rgba(233,79,55,0.13)',
      '--accent-border':'rgba(233,79,55,0.36)','--accent-text':'#C73E2B',
      '--red':'#E94F37','--amber':'#E3B23C','--blue':'#3A86FF','--purple':'#7B2CBF','--pink':'#FF6B9A',
      '--nav-bg':'rgba(248,240,227,0.96)','--input-bg':'#FFFDFC','--pill-bg':'#314E52','--pill-text':'#FFFDFC',
      '--theme-pattern':'linear-gradient(90deg, rgba(49,78,82,0.08) 1px, transparent 1px), linear-gradient(rgba(49,78,82,0.08) 1px, transparent 1px)',
      '--theme-pattern-soft':'linear-gradient(90deg, rgba(49,78,82,0.05) 1px, transparent 1px), linear-gradient(rgba(49,78,82,0.05) 1px, transparent 1px)',
      '--card-pattern':'radial-gradient(circle at 90% 12%, rgba(233,79,55,0.10) 0 22px, transparent 23px), radial-gradient(circle at 12% 88%, rgba(227,178,60,0.12) 0 16px, transparent 17px)',
      '--header-art':'radial-gradient(circle at 86% 36%, rgba(233,79,55,0.20) 0 18px, transparent 19px)',
      '--card-shadow':'0 4px 0 rgba(49,78,82,0.18)',
      '--card-shadow-soft':'0 2px 0 rgba(49,78,82,0.12)',
    },
  },
  {
    name: 'candy', label: 'Candy Shop', emoji: '🍬',
    preview: { bg: '#FFF0F6', card: '#FFFFFF', accent: '#FF5D8F', text: '#3A0B2E' },
    vars: {
      '--bg':'#FFF0F6','--bg2':'#E7F7FF','--card':'#FFFFFF','--card2':'#FFE3EC',
      '--border':'#F9B4D0','--border2':'#A5D8FF','--text':'#3A0B2E','--text2':'#4A2342',
      '--muted':'#94607D','--accent':'#FF5D8F','--accent-dim':'rgba(255,93,143,0.16)',
      '--accent-border':'rgba(255,93,143,0.34)','--accent-text':'#DB2777',
      '--red':'#F43F5E','--amber':'#F59E0B','--blue':'#38BDF8','--purple':'#A855F7','--pink':'#FF5D8F',
      '--nav-bg':'rgba(255,240,246,0.96)','--input-bg':'#FFFFFF','--pill-bg':'#FFE3EC','--pill-text':'#3A0B2E',
      '--theme-pattern':'repeating-linear-gradient(135deg, rgba(255,93,143,0.12) 0 10px, transparent 10px 24px), radial-gradient(circle at 82% 12%, rgba(56,189,248,0.18) 0 18px, transparent 19px)',
      '--theme-pattern-soft':'repeating-linear-gradient(135deg, rgba(255,93,143,0.06) 0 8px, transparent 8px 18px)',
      '--card-pattern':'radial-gradient(circle at 90% 18%, rgba(255,93,143,0.10) 0 20px, transparent 21px), radial-gradient(circle at 12% 84%, rgba(56,189,248,0.10) 0 16px, transparent 17px)',
      '--header-art':'radial-gradient(circle at 86% 28%, rgba(255,93,143,0.22) 0 18px, transparent 19px), radial-gradient(circle at 75% 50%, rgba(56,189,248,0.20) 0 12px, transparent 13px)',
      '--card-shadow':'0 5px 18px rgba(255,93,143,0.18)',
      '--card-shadow-soft':'0 4px 14px rgba(56,189,248,0.14)',
    },
  },
  {
    name: 'safari', label: 'Safari Paws', emoji: '🐾',
    preview: { bg: '#E9F5DB', card: '#FFF8D6', accent: '#2D6A4F', text: '#1F2D16' },
    vars: {
      '--bg':'#E9F5DB','--bg2':'#CFE8B8','--card':'#FFF8D6','--card2':'#F3E6B3',
      '--border':'#385A32','--border2':'#8B6B32','--text':'#1F2D16','--text2':'#2D3A23',
      '--muted':'#52643F','--accent':'#2D6A4F','--accent-dim':'rgba(45,106,79,0.14)',
      '--accent-border':'rgba(56,90,50,0.44)','--accent-text':'#1B5E40',
      '--red':'#B91C1C','--amber':'#A16207','--blue':'#0369A1','--purple':'#6D28D9','--pink':'#BE185D',
      '--nav-bg':'rgba(233,245,219,0.96)','--input-bg':'#FFFDF0','--pill-bg':'#2D6A4F','--pill-text':'#FFF8D6',
      '--theme-pattern':'radial-gradient(circle at 18px 18px, rgba(45,106,79,0.12) 0 7px, transparent 8px), radial-gradient(circle at 34px 28px, rgba(45,106,79,0.12) 0 3px, transparent 4px), radial-gradient(circle at 8px 28px, rgba(45,106,79,0.12) 0 3px, transparent 4px)',
      '--theme-pattern-soft':'radial-gradient(circle at 18px 18px, rgba(45,106,79,0.06) 0 7px, transparent 8px)',
      '--card-pattern':'linear-gradient(120deg, rgba(45,106,79,0.08), transparent 35%), radial-gradient(circle at 92% 16%, rgba(161,98,7,0.10) 0 20px, transparent 21px)',
      '--header-art':'radial-gradient(circle at 88% 32%, rgba(45,106,79,0.18) 0 20px, transparent 21px)',
      '--card-shadow':'0 5px 0 rgba(45,106,79,0.20)',
      '--card-shadow-soft':'0 3px 0 rgba(45,106,79,0.12)',
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

const DECORATIVE_DEFAULTS: Record<string, string> = {
  '--theme-pattern': 'none',
  '--theme-pattern-soft': 'none',
  '--card-pattern': 'none',
  '--header-art': 'none',
  '--card-shadow': 'none',
  '--card-shadow-soft': 'none',
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<ThemeName>('dark')

  useEffect(() => {
    void Promise.resolve().then(() => {
      const saved = localStorage.getItem('nutrition-theme') as ThemeName
      if (saved && THEMES.find(t => t.name === saved)) setName(saved)
    })
  }, [])

  const theme = THEMES.find(t => t.name === name) || THEMES[0]

  useEffect(() => {
    const root = document.documentElement
    Object.entries(DECORATIVE_DEFAULTS).forEach(([k, v]) => root.style.setProperty(k, v))
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
  }, [theme])

  function setTheme(n: ThemeName) { setName(n); localStorage.setItem('nutrition-theme', n) }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() { return useContext(ThemeContext) }
