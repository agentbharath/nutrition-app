'use client'
import type { CSSProperties } from 'react'
import { ThemeName } from '@/lib/theme'

type CelebrationMetric = 'cal' | 'protein' | 'fiber' | 'carbs'

interface Props {
  metric: CelebrationMetric
  themeName: ThemeName
  onDone: () => void
}

const PIECES: Record<string, string[]> = {
  voyage: ['👒', '⚔️', '🗺️', '🍊', '🔥', '🏴‍☠️', '🌊'],
  cartoon: ['💥', '⭐', '⚡', '🎈', '🎉', '🍌'],
  arcade: ['🕹️', '👾', '💎', '⚡', '🟦', '🟪'],
  bento: ['🍱', '🍙', '🌸', '🍵', '🥢', '⭐'],
  candy: ['🍬', '🍭', '🧁', '✨', '💖', '🍓'],
  safari: ['🐾', '🌿', '🦁', '🦒', '🦓', '☀️'],
  matcha: ['🍵', '🌿', '✨', '🍃', '🥣'],
  coastal: ['🌊', '🐚', '☀️', '🫧', '⛵'],
  fig: ['🫐', '🌙', '✨', '🍯', '⭐'],
  sunrise: ['🌅', '🍊', '✨', '☀️', '🌺'],
  salt: ['🌿', '🧂', '✨', '🍋', '🥗'],
  default: ['🎉', '✨', '⭐', '💪', '✅'],
}

const LABELS: Record<CelebrationMetric, string> = {
  cal: 'Calorie ring complete',
  protein: 'Protein target hit',
  fiber: 'Fiber target hit',
  carbs: 'Carb ring complete',
}

export default function ThemeCelebration({ metric, themeName, onDone }: Props) {
  const pieces = PIECES[themeName] || PIECES.default

  return (
    <div
      className="theme-celebration"
      onAnimationEnd={(event) => {
        if (event.currentTarget === event.target) onDone()
      }}
    >
      <div className="theme-celebration-burst">
        {Array.from({ length: 28 }).map((_, index) => (
          <span
            key={index}
            className="theme-confetti-piece"
            style={{
              '--x': `${Math.cos(index * 0.9) * (70 + (index % 5) * 22)}px`,
              '--y': `${Math.sin(index * 1.2) * (70 + (index % 4) * 26)}px`,
              '--delay': `${(index % 8) * 0.035}s`,
            } as CSSProperties}
          >
            {pieces[index % pieces.length]}
          </span>
        ))}
      </div>
      <div className="theme-celebration-card t-card">
        <p className="text-3xl mb-1">{pieces[0]}</p>
        <p className="text-sm font-bold t-text">{LABELS[metric]}</p>
      </div>
    </div>
  )
}
