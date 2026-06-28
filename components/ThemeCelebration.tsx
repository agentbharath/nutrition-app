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
        {Array.from({ length: 72 }).map((_, index) => {
          const lane = index % 12
          const row = Math.floor(index / 12)
          const direction = index % 2 === 0 ? 1 : -1
          const x = (lane - 5.5) * 8.5 + direction * (18 + (row % 3) * 5)
          const y = -36 + row * 13 + ((lane % 3) - 1) * 7

          return (
            <span
              key={index}
              className="theme-confetti-piece"
              style={{
                '--x': `${x}vw`,
                '--y': `${y}vh`,
                '--delay': `${(index % 16) * 0.055}s`,
                '--spin': `${direction * (280 + (index % 5) * 90)}deg`,
                '--size': `${20 + (index % 4) * 4}px`,
              } as CSSProperties}
            >
              {pieces[index % pieces.length]}
            </span>
          )
        })}
      </div>
      <div className="theme-celebration-card t-card">
        <p className="text-3xl mb-1">{pieces[0]}</p>
        <p className="text-sm font-bold t-text">{LABELS[metric]}</p>
      </div>
    </div>
  )
}
