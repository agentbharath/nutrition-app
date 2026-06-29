import { NextResponse } from 'next/server'
import { getHealthConnection, getLatestHealthMetrics, healthIntegrationConfigured } from '@/lib/health'

export const runtime = 'nodejs'

export async function GET() {
  if (!healthIntegrationConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: 'Add SUPABASE_SERVICE_ROLE_KEY and GOOGLE_HEALTH_CLIENT_ID to enable Google Health sync.',
    })
  }

  try {
    const connection = await getHealthConnection()
    const latest = await getLatestHealthMetrics(14)
    const expectedDates = getLastPacificDates(7)
    const storedDates = latest.map((item) => item.date)
    return NextResponse.json({
      configured: true,
      connected: Boolean(connection),
      provider: connection?.provider || null,
      last_sync_at: connection?.last_sync_at || null,
      connected_at: connection?.connected_at || null,
      latest,
      diagnostics: {
        expected_dates: expectedDates,
        stored_dates: storedDates,
        missing_dates: expectedDates.filter((date) => !storedDates.includes(date)),
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ configured: true, connected: false, error: 'Could not load health status.' }, { status: 500 })
  }
}

function getLastPacificDates(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - index)
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  })
}
