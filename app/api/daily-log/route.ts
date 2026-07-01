import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/health'
import { getPacificDate } from '@/lib/nutrition-monitor'

export const runtime = 'nodejs'

function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get('date') || getPacificDate(0)
    const supabase = createServiceSupabase()
    const [{ data: log, error: logError }, { data: quickAdds, error: quickError }] = await Promise.all([
      supabase.from('daily_logs').select('*').eq('date', date).maybeSingle(),
      supabase.from('quick_adds').select('*').eq('date', date),
    ])

    if (logError) return jsonError(logError.message)
    if (quickError) return jsonError(quickError.message)

    return NextResponse.json({ log, quickAdds: quickAdds || [] })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to load day')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServiceSupabase()
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(body, { onConflict: 'date' })
      .select()
      .single()

    if (error) return jsonError(error.message)
    return NextResponse.json({ log: data })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to save day')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, updates } = await req.json()
    if (!id || !updates) return jsonError('Missing daily log id or updates', 400)

    const supabase = createServiceSupabase()
    const { data, error } = await supabase
      .from('daily_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return jsonError(error.message)
    return NextResponse.json({ log: data })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to update day')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get('date') || getPacificDate(0)
    const supabase = createServiceSupabase()
    const [logResult, quickResult] = await Promise.all([
      supabase.from('daily_logs').delete().eq('date', date),
      supabase.from('quick_adds').delete().eq('date', date),
    ])

    if (logResult.error) return jsonError(logResult.error.message)
    if (quickResult.error) return jsonError(quickResult.error.message)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to reset day')
  }
}
