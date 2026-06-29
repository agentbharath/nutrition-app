import crypto from 'crypto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type HealthProvider = 'fitbit'

export interface HealthConnection {
  id?: string
  provider: HealthProvider
  provider_user_id?: string | null
  access_token: string
  refresh_token: string
  scope?: string | null
  expires_at: string
  connected_at?: string
  last_sync_at?: string | null
}

export interface HealthDailyMetrics {
  id?: string
  provider: HealthProvider
  date: string
  steps?: number | null
  calories_out?: number | null
  activity_calories?: number | null
  lightly_active_minutes?: number | null
  fairly_active_minutes?: number | null
  very_active_minutes?: number | null
  active_minutes?: number | null
  active_zone_minutes?: number | null
  resting_heart_rate?: number | null
  sleep_minutes?: number | null
  sleep_efficiency?: number | null
  weight_kg?: number | null
  body_fat_pct?: number | null
  raw?: unknown
}

interface FitbitTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope?: string
  user_id?: string
}

const FITBIT_AUTHORIZE_URL = 'https://www.fitbit.com/oauth2/authorize'
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token'
const FITBIT_API_BASE = 'https://api.fitbit.com'
const FITBIT_SCOPES = [
  'activity',
  'heartrate',
  'sleep',
  'weight',
  'profile',
]

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export function healthIntegrationConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.FITBIT_CLIENT_ID
  )
}

export function createServiceSupabase(): SupabaseClient {
  return createClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}

export function getFitbitRedirectUri(origin: string) {
  return process.env.FITBIT_REDIRECT_URI || `${origin}/api/health/callback`
}

export function generateOauthVerifier() {
  return base64Url(crypto.randomBytes(48))
}

export function generateOauthState() {
  return base64Url(crypto.randomBytes(32))
}

export function getFitbitAuthorizeUrl(origin: string, state: string, verifier: string) {
  const codeChallenge = base64Url(crypto.createHash('sha256').update(verifier).digest())
  const url = new URL(FITBIT_AUTHORIZE_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', getRequiredEnv('FITBIT_CLIENT_ID'))
  url.searchParams.set('redirect_uri', getFitbitRedirectUri(origin))
  url.searchParams.set('scope', FITBIT_SCOPES.join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  return url
}

export async function exchangeFitbitCode(code: string, verifier: string, origin: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getFitbitRedirectUri(origin),
    client_id: getRequiredEnv('FITBIT_CLIENT_ID'),
    code_verifier: verifier,
  })
  return fitbitTokenRequest(body)
}

async function refreshFitbitToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: getRequiredEnv('FITBIT_CLIENT_ID'),
  })
  return fitbitTokenRequest(body)
}

async function fitbitTokenRequest(body: URLSearchParams) {
  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
  }
  if (process.env.FITBIT_CLIENT_SECRET) {
    const credentials = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64')
    headers.authorization = `Basic ${credentials}`
  }

  const response = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers,
    body,
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Fitbit token request failed: ${response.status} ${JSON.stringify(data).slice(0, 300)}`)
  }
  return data as FitbitTokenResponse
}

export async function saveFitbitConnection(token: FitbitTokenResponse) {
  const supabase = createServiceSupabase()
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()
  const row: HealthConnection = {
    provider: 'fitbit',
    provider_user_id: token.user_id || null,
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    scope: token.scope || null,
    expires_at: expiresAt,
  }

  const { error } = await supabase
    .from('health_connections')
    .upsert(row, { onConflict: 'provider' })
  if (error) throw error
}

export async function getHealthConnection(supabase = createServiceSupabase()) {
  const { data, error } = await supabase
    .from('health_connections')
    .select('*')
    .eq('provider', 'fitbit')
    .maybeSingle<HealthConnection>()
  if (error) throw error
  return data
}

async function getValidFitbitConnection(supabase = createServiceSupabase()) {
  const connection = await getHealthConnection(supabase)
  if (!connection) return null

  const expiresAt = new Date(connection.expires_at).getTime()
  if (expiresAt > Date.now() + 5 * 60 * 1000) return connection

  const refreshed = await refreshFitbitToken(connection.refresh_token)
  const updated: Partial<HealthConnection> = {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    scope: refreshed.scope || connection.scope,
    expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
  }
  const { data, error } = await supabase
    .from('health_connections')
    .update(updated)
    .eq('provider', 'fitbit')
    .select('*')
    .single<HealthConnection>()
  if (error) throw error
  return data
}

export async function syncFitbitDate(date: string, supabase = createServiceSupabase()) {
  const connection = await getValidFitbitConnection(supabase)
  if (!connection) return null

  const [activity, heart, sleep, weight, fat] = await Promise.all([
    fitbitGetOptional(connection.access_token, `/1/user/-/activities/date/${date}.json`),
    fitbitGetOptional(connection.access_token, `/1/user/-/activities/heart/date/${date}/1d.json`),
    fitbitGetOptional(connection.access_token, `/1.2/user/-/sleep/date/${date}.json`),
    fitbitGetOptional(connection.access_token, `/1/user/-/body/log/weight/date/${date}.json`),
    fitbitGetOptional(connection.access_token, `/1/user/-/body/log/fat/date/${date}.json`),
  ])

  const summary = asRecord(activity.summary)
  const activeZone = asRecord(summary.activeZoneMinutes)
  const heartEntry = Array.isArray(heart['activities-heart']) ? asRecord(heart['activities-heart'][0]) : {}
  const heartValue = asRecord(heartEntry.value)
  const sleepSummary = asRecord(sleep.summary)
  const weightRows = Array.isArray(weight.weight) ? weight.weight : []
  const fatRows = Array.isArray(fat.fat) ? fat.fat : []
  const weightRow = asRecord(weightRows[0])
  const fatRow = asRecord(fatRows[0])
  const lightly = numberOrNull(summary.lightlyActiveMinutes)
  const fairly = numberOrNull(summary.fairlyActiveMinutes)
  const very = numberOrNull(summary.veryActiveMinutes)

  const metrics: HealthDailyMetrics = {
    provider: 'fitbit',
    date,
    steps: numberOrNull(summary.steps),
    calories_out: numberOrNull(summary.caloriesOut),
    activity_calories: numberOrNull(summary.activityCalories),
    lightly_active_minutes: lightly,
    fairly_active_minutes: fairly,
    very_active_minutes: very,
    active_minutes: sumNumbers(lightly, fairly, very),
    active_zone_minutes: numberOrNull(activeZone.totalMinutes) ?? numberOrNull(summary.activeZoneMinutes),
    resting_heart_rate: numberOrNull(heartValue.restingHeartRate),
    sleep_minutes: numberOrNull(sleepSummary.totalMinutesAsleep),
    sleep_efficiency: numberOrNull(sleepSummary.efficiency),
    weight_kg: numberOrNull(weightRow.weight),
    body_fat_pct: numberOrNull(fatRow.fat),
    raw: { activity, heart, sleep, weight, fat },
  }

  const { data, error } = await supabase
    .from('health_daily_metrics')
    .upsert(metrics, { onConflict: 'provider,date' })
    .select('*')
    .single<HealthDailyMetrics>()
  if (error) throw error

  await supabase
    .from('health_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('provider', 'fitbit')

  return data
}

export async function syncRecentFitbitDays(daysBack = 7) {
  const supabase = createServiceSupabase()
  const dates = Array.from({ length: daysBack }, (_, index) => getPacificDate(-index))
  const results = []
  for (const date of dates) {
    results.push(await syncFitbitDate(date, supabase))
  }
  return results.filter(Boolean)
}

export async function getLatestHealthMetrics(limit = 14) {
  const { data, error } = await createServiceSupabase()
    .from('health_daily_metrics')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit)
    .returns<HealthDailyMetrics[]>()
  if (error) throw error
  return data || []
}

export async function getHealthMetricsForDates(dates: string[]) {
  if (dates.length === 0 || !healthIntegrationConfigured()) return []
  const { data, error } = await createServiceSupabase()
    .from('health_daily_metrics')
    .select('*')
    .in('date', dates)
    .returns<HealthDailyMetrics[]>()
  if (error) {
    console.error('Could not load health metrics', error)
    return []
  }
  return data || []
}

export function compactHealthMetrics(metrics?: HealthDailyMetrics | null) {
  if (!metrics) return null
  return {
    date: metrics.date,
    steps: metrics.steps,
    calories_out: metrics.calories_out,
    active_minutes: metrics.active_minutes,
    active_zone_minutes: metrics.active_zone_minutes,
    resting_heart_rate: metrics.resting_heart_rate,
    sleep_minutes: metrics.sleep_minutes,
    sleep_efficiency: metrics.sleep_efficiency,
    weight_kg: metrics.weight_kg,
    body_fat_pct: metrics.body_fat_pct,
  }
}

async function fitbitGet(accessToken: string, path: string) {
  const response = await fetch(`${FITBIT_API_BASE}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Fitbit API failed: ${response.status} ${path} ${JSON.stringify(data).slice(0, 300)}`)
  }
  return data as Record<string, unknown>
}

async function fitbitGetOptional(accessToken: string, path: string) {
  try {
    return await fitbitGet(accessToken, path)
  } catch (error) {
    console.error(error)
    return {}
  }
}

function base64Url(buffer: Buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function numberOrNull(value: unknown) {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(number) ? number : null
}

function sumNumbers(...values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === 'number')
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) : null
}

function getPacificDate(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
}
