import { NextResponse } from 'next/server'
import { createServiceSupabase, healthIntegrationConfigured } from '@/lib/health'

export const runtime = 'nodejs'

export async function POST() {
  if (!healthIntegrationConfigured()) {
    return NextResponse.json({ error: 'Health integration is not configured.' }, { status: 400 })
  }

  try {
    const supabase = createServiceSupabase()
    await supabase.from('health_connections').delete().eq('provider', 'google_health')
    return NextResponse.json({ disconnected: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Could not disconnect health integration.' }, { status: 500 })
  }
}
