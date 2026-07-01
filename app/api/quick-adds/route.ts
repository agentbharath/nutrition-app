import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/health'
import { getPacificDate } from '@/lib/nutrition-monitor'

export const runtime = 'nodejs'

function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit')) || 50, 1), 200)
    const supabase = createServiceSupabase()
    const { data, error } = await supabase
      .from('quick_adds')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)

    if (error) return jsonError(error.message)
    return NextResponse.json({ quickAdds: data || [] })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to load quick adds')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServiceSupabase()
    const { data, error } = await supabase
      .from('quick_adds')
      .insert({ date: body.date || getPacificDate(0), ...body })
      .select()
      .single()

    if (error) return jsonError(error.message)
    return NextResponse.json({ quickAdd: data })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to add quick item')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const id = req.nextUrl.searchParams.get('id') || body.id
    const ids = body.ids as string[] | undefined
    const date = req.nextUrl.searchParams.get('date') || body.date

    const supabase = createServiceSupabase()
    let query = supabase.from('quick_adds').delete()
    if (ids?.length) query = query.in('id', ids)
    else if (id) query = query.eq('id', id)
    else if (date) query = query.eq('date', date)
    else return jsonError('Missing quick add id, ids, or date', 400)

    const { error } = await query
    if (error) return jsonError(error.message)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to delete quick item')
  }
}
