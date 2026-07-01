'use client'
import { useRouter } from 'next/navigation'
import QuickAdd from '@/components/QuickAdd'

interface QuickItem {
  name: string
  emoji: string
  cal: number
  protein: number
  sodium: number
  carbs: number
  fiber: number
}

export default function QuickAddPage() {
  const router = useRouter()

  async function handleAdd(item: QuickItem) {
    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    await fetch('/api/quick-adds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        name: item.name,
        emoji: item.emoji,
        cal: item.cal,
        protein: item.protein,
        sodium: item.sodium,
        carbs: item.carbs,
        fiber: item.fiber,
      }),
    })
    router.back()
  }

  return (
    <main className="max-w-md mx-auto min-h-screen t-bg">
      <div className="app-header px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-xl btn-secondary w-8 h-8 flex items-center justify-center rounded-full">←</button>
        <h1 className="text-lg font-bold t-text">Quick Add</h1>
      </div>
      <div className="px-4 pb-10">
        <QuickAdd onAdd={handleAdd} onClose={() => router.back()} />
      </div>
    </main>
  )
}
