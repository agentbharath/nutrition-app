'use client'

import Link from 'next/link'
import { CalendarIcon, ChartIcon, ClipboardIcon, SettingsIcon } from './Icons'

type NavKey = 'today' | 'history' | 'analysis' | 'settings'

const ITEMS = [
  { key: 'today', label: 'Today', href: '/', Icon: ClipboardIcon },
  { key: 'history', label: 'History', href: '/history', Icon: CalendarIcon },
  { key: 'analysis', label: 'Analysis', href: '/monitor', Icon: ChartIcon },
  { key: 'settings', label: 'Settings', href: '/settings', Icon: SettingsIcon },
] as const

export default function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav border-t t-border flex">
      {ITEMS.map(({ key, label, href, Icon }) => {
        const isActive = key === active
        const content = (
          <>
            <Icon size={20} />
            <span className={`text-[11px] ${isActive ? 'font-semibold' : ''}`}>{label}</span>
          </>
        )
        const className = `flex-1 py-4 flex flex-col items-center gap-1 ${isActive ? 't-accent' : 't-muted hover:t-text transition-colors'}`

        return isActive ? (
          <button key={key} className={className} aria-current="page">
            {content}
          </button>
        ) : (
          <Link key={key} href={href} className={className}>
            {content}
          </Link>
        )
      })}
    </nav>
  )
}
