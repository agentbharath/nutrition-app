import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/health'

export const runtime = 'nodejs'

function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit')) || 90, 1), 365)
    const supabase = createServiceSupabase()
    const { data: logs, error } = await supabase
      .from('daily_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)

    if (error) return jsonError(error.message)

    const dates = (logs || []).map((log) => log.date).filter(Boolean)
    const quickAdds = dates.length
      ? await supabase.from('quick_adds').select('*').in('date', dates)
      : { data: [], error: null }

    if (quickAdds.error) return jsonError(quickAdds.error.message)

    return NextResponse.json({ logs: logs || [], quickAdds: quickAdds.data || [] })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to load logs')
  }
}
