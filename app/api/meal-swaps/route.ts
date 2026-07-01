import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/health'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServiceSupabase()
    const { error } = await supabase.from('meal_swaps_log').insert(body)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to log meal swap' },
      { status: 500 }
    )
  }
}
