import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/health'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const { data, error } = await createServiceSupabase()
      .from('nutrition_ai_reports')
      .select('id, report_type, period_start, period_end, model, analysis')
      .order('period_end', { ascending: false })
      .limit(30)

    if (error) throw error
    return NextResponse.json({ reports: data || [] })
  } catch (error) {
    console.error('Could not load reports', error)
    return NextResponse.json({ error: 'Could not load reports.' }, { status: 500 })
  }
}
