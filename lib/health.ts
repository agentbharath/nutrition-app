import crypto from 'crypto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type HealthProvider = 'google_health' | 'fitbit'

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
  readiness_score?: number | null
  readiness_note?: string | null
  raw?: unknown
}

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
}

interface RollupSpec {
  dataType: string
  rollupField: string
  valuePaths: string[][]
  combine?: (record: Record<string, unknown>) => number | null
}

const PROVIDER: HealthProvider = 'google_health'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_HEALTH_API_BASE = 'https://health.googleapis.com'
const GOOGLE_HEALTH_SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
]

const DAILY_ROLLUPS: Record<string, RollupSpec> = {
  steps: {
    dataType: 'steps',
    rollupField: 'steps',
    valuePaths: [['countSum']],
  },
  total_calories: {
    dataType: 'total-calories',
    rollupField: 'totalCalories',
    valuePaths: [['kcalSum']],
  },
  active_energy: {
    dataType: 'active-energy-burned',
    rollupField: 'activeEnergyBurned',
    valuePaths: [['kcalSum']],
  },
  active_minutes: {
    dataType: 'active-minutes',
    rollupField: 'activeMinutes',
    valuePaths: [['activeMinutesRollupByActivityLevel', 'activeMinutesSum']],
    combine: (record) => sumNestedNumbers(record.activeMinutesRollupByActivityLevel, 'activeMinutesSum'),
  },
  active_zone_minutes: {
    dataType: 'active-zone-minutes',
    rollupField: 'activeZoneMinutes',
    valuePaths: [['sumInCardioHeartZone'], ['sumInPeakHeartZone'], ['sumInFatBurnHeartZone']],
    combine: (record) => sumNumbers(
      numberOrNull(record.sumInCardioHeartZone),
      numberOrNull(record.sumInPeakHeartZone),
      numberOrNull(record.sumInFatBurnHeartZone)
    ),
  },
  sleep_minutes: {
    dataType: 'sleep',
    rollupField: 'sleep',
    valuePaths: [['sleepDurationMillisSum'], ['durationMillisSum'], ['sleepMinutesSum']],
    combine: (record) => {
      const minutes = firstNumberByKey(record, [/sleep.*minute/i, /minute.*sleep/i])
      if (minutes !== null) return minutes
      const millis = firstNumberByKey(record, [/sleep.*millis/i, /duration.*millis/i, /millis.*sleep/i])
      return millis === null ? null : millis / 60000
    },
  },
  sleep_efficiency: {
    dataType: 'sleep',
    rollupField: 'sleep',
    valuePaths: [['sleepEfficiencyPercentageAvg'], ['efficiencyPercentageAvg'], ['sleepScoreAvg']],
    combine: (record) => firstNumberByKey(record, [/efficiency/i, /sleep.*score/i]),
  },
  resting_heart_rate: {
    dataType: 'daily-resting-heart-rate',
    rollupField: 'restingHeartRatePersonalRange',
    valuePaths: [['beatsPerMinuteMin'], ['beatsPerMinuteMax']],
    combine: (record) => averageNumbers(numberOrNull(record.beatsPerMinuteMin), numberOrNull(record.beatsPerMinuteMax)),
  },
  weight_kg: {
    dataType: 'weight',
    rollupField: 'weight',
    valuePaths: [['weightGramsAvg']],
    combine: (record) => {
      const grams = numberOrNull(record.weightGramsAvg)
      return grams === null ? null : grams / 1000
    },
  },
  body_fat_pct: {
    dataType: 'body-fat',
    rollupField: 'bodyFat',
    valuePaths: [['bodyFatPercentageAvg']],
  },
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export function healthIntegrationConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.GOOGLE_HEALTH_CLIENT_ID
  )
}

export function createServiceSupabase(): SupabaseClient {
  return createClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}

export function getGoogleHealthRedirectUri(origin: string) {
  return process.env.GOOGLE_HEALTH_REDIRECT_URI || `${origin}/api/health/callback`
}

export function generateOauthVerifier() {
  return base64Url(crypto.randomBytes(48))
}

export function generateOauthState() {
  return base64Url(crypto.randomBytes(32))
}

export function getGoogleHealthAuthorizeUrl(origin: string, state: string, verifier: string) {
  const codeChallenge = base64Url(crypto.createHash('sha256').update(verifier).digest())
  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', getRequiredEnv('GOOGLE_HEALTH_CLIENT_ID'))
  url.searchParams.set('redirect_uri', getGoogleHealthRedirectUri(origin))
  url.searchParams.set('scope', GOOGLE_HEALTH_SCOPES.join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  return url
}

export async function exchangeGoogleHealthCode(code: string, verifier: string, origin: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getGoogleHealthRedirectUri(origin),
    client_id: getRequiredEnv('GOOGLE_HEALTH_CLIENT_ID'),
    code_verifier: verifier,
  })
  if (process.env.GOOGLE_HEALTH_CLIENT_SECRET) {
    body.set('client_secret', process.env.GOOGLE_HEALTH_CLIENT_SECRET)
  }
  return googleTokenRequest(body)
}

async function refreshGoogleHealthToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: getRequiredEnv('GOOGLE_HEALTH_CLIENT_ID'),
  })
  if (process.env.GOOGLE_HEALTH_CLIENT_SECRET) {
    body.set('client_secret', process.env.GOOGLE_HEALTH_CLIENT_SECRET)
  }
  return googleTokenRequest(body)
}

async function googleTokenRequest(body: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Google Health token request failed: ${response.status} ${JSON.stringify(data).slice(0, 300)}`)
  }
  return data as GoogleTokenResponse
}

export async function saveGoogleHealthConnection(token: GoogleTokenResponse) {
  const existing = await getHealthConnection().catch(() => null)
  const refreshToken = token.refresh_token || existing?.refresh_token
  if (!refreshToken) throw new Error('Google did not return a refresh token. Reconnect and approve offline access.')

  const supabase = createServiceSupabase()
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()
  const row: HealthConnection = {
    provider: PROVIDER,
    provider_user_id: null,
    access_token: token.access_token,
    refresh_token: refreshToken,
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
    .eq('provider', PROVIDER)
    .maybeSingle<HealthConnection>()
  if (error) throw error
  return data
}

async function getValidGoogleHealthConnection(supabase = createServiceSupabase()) {
  const connection = await getHealthConnection(supabase)
  if (!connection) return null

  const expiresAt = new Date(connection.expires_at).getTime()
  if (expiresAt > Date.now() + 5 * 60 * 1000) return connection

  const refreshed = await refreshGoogleHealthToken(connection.refresh_token)
  const updated: Partial<HealthConnection> = {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token || connection.refresh_token,
    scope: refreshed.scope || connection.scope,
    expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
  }
  const { data, error } = await supabase
    .from('health_connections')
    .update(updated)
    .eq('provider', PROVIDER)
    .select('*')
    .single<HealthConnection>()
  if (error) throw error
  return data
}

export async function syncGoogleHealthDate(date: string, supabase = createServiceSupabase()) {
  const connection = await getValidGoogleHealthConnection(supabase)
  if (!connection) return null

  const entries = await Promise.all(
    Object.entries(DAILY_ROLLUPS).map(async ([key, spec]) => {
      const rollup = await googleDailyRollupOptional(connection.access_token, spec.dataType, date)
      const value = extractRollupValue(rollup, spec)
      return [key, value, rollup] as const
    })
  )

  const values = Object.fromEntries(entries.map(([key, value]) => [key, value])) as Record<string, number | null>
  const raw = Object.fromEntries(entries.map(([key, , rollup]) => [key, rollup]))
  const activeByLevel = extractActiveMinutesByLevel(raw.active_minutes)
  const readiness = calculateReadinessScore({
    steps: roundOrNull(values.steps),
    activity_calories: roundOrNull(values.active_energy),
    active_minutes: roundOrNull(values.active_minutes),
    sleep_minutes: roundOrNull(values.sleep_minutes),
  })

  const metrics: HealthDailyMetrics = {
    provider: PROVIDER,
    date,
    steps: roundOrNull(values.steps),
    calories_out: roundOrNull(values.total_calories),
    activity_calories: roundOrNull(values.active_energy),
    lightly_active_minutes: roundOrNull(activeByLevel.light),
    fairly_active_minutes: roundOrNull(activeByLevel.moderate),
    very_active_minutes: roundOrNull(activeByLevel.vigorous),
    active_minutes: roundOrNull(values.active_minutes),
    active_zone_minutes: roundOrNull(values.active_zone_minutes),
    resting_heart_rate: roundOrNull(values.resting_heart_rate),
    sleep_minutes: roundOrNull(values.sleep_minutes),
    sleep_efficiency: roundOrNull(values.sleep_efficiency),
    readiness_score: readiness.score,
    readiness_note: readiness.note,
    weight_kg: values.weight_kg,
    body_fat_pct: values.body_fat_pct,
    raw,
  }

  const { data, error } = await upsertHealthMetrics(supabase, metrics)
  if (error) throw error

  await supabase
    .from('health_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('provider', PROVIDER)

  return data
}

export async function syncRecentHealthDays(daysBack = 7) {
  const supabase = createServiceSupabase()
  const dates = Array.from({ length: daysBack }, (_, index) => getPacificDate(-index))
  const results = []
  for (const date of dates) {
    try {
      results.push(await syncGoogleHealthDate(date, supabase))
    } catch (error) {
      console.error(`Health sync failed for ${date}`, error)
      results.push({ date, error: error instanceof Error ? error.message : String(error) })
    }
  }
  return results.filter(Boolean)
}

export async function getLatestHealthMetrics(limit = 14) {
  const { data, error } = await createServiceSupabase()
    .from('health_daily_metrics')
    .select('*')
    .eq('provider', PROVIDER)
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
    .eq('provider', PROVIDER)
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
    activity_calories: metrics.activity_calories,
    active_minutes: metrics.active_minutes,
    lightly_active_minutes: metrics.lightly_active_minutes,
    fairly_active_minutes: metrics.fairly_active_minutes,
    very_active_minutes: metrics.very_active_minutes,
    active_zone_minutes: metrics.active_zone_minutes,
    resting_heart_rate: metrics.resting_heart_rate,
    sleep_minutes: metrics.sleep_minutes,
    sleep_efficiency: metrics.sleep_efficiency,
    readiness_score: metrics.readiness_score,
    readiness_note: metrics.readiness_note,
    weight_kg: metrics.weight_kg,
    body_fat_pct: metrics.body_fat_pct,
  }
}

async function googleDailyRollupOptional(accessToken: string, dataType: string, date: string) {
  try {
    return await googleDailyRollup(accessToken, dataType, date)
  } catch (error) {
    console.error(error)
    return {
      error: error instanceof Error ? error.message : String(error),
      dataType,
    }
  }
}

async function googleDailyRollup(accessToken: string, dataType: string, date: string) {
  const response = await fetch(`${GOOGLE_HEALTH_API_BASE}/v4/users/me/dataTypes/${encodeURIComponent(dataType)}/dataPoints:dailyRollUp`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      range: toCivilDayRange(date),
      windowSizeDays: 1,
      dataSourceFamily: 'users/me/dataSourceFamilies/all-sources',
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Google Health rollup failed: ${response.status} ${dataType} ${JSON.stringify(data).slice(0, 300)}`)
  }
  return data as Record<string, unknown>
}

async function upsertHealthMetrics(supabase: SupabaseClient, metrics: HealthDailyMetrics) {
  const result = await supabase
    .from('health_daily_metrics')
    .upsert(metrics, { onConflict: 'provider,date' })
    .select('*')
    .single<HealthDailyMetrics>()

  if (!result.error || !isMissingColumnError(result.error.message)) return result

  const fallbackMetrics = { ...metrics }
  delete fallbackMetrics.readiness_score
  delete fallbackMetrics.readiness_note
  return supabase
    .from('health_daily_metrics')
    .upsert(fallbackMetrics, { onConflict: 'provider,date' })
    .select('*')
    .single<HealthDailyMetrics>()
}

function isMissingColumnError(message?: string) {
  return Boolean(message && (
    message.includes('readiness_score') ||
    message.includes('readiness_note') ||
    message.includes('schema cache') ||
    message.includes('Could not find')
  ))
}

function base64Url(buffer: Buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function toCivilDayRange(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(`${date}T12:00:00.000Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  const [endYear, endMonth, endDay] = next.toISOString().slice(0, 10).split('-').map(Number)
  return {
    start: { date: { year, month, day }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } },
    end: { date: { year: endYear, month: endMonth, day: endDay }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } },
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function getNumberAtPath(value: unknown, path: string[]): number | null {
  let cursor: unknown = value
  for (const key of path) {
    if (Array.isArray(cursor)) cursor = cursor[0]
    cursor = asRecord(cursor)[key]
  }
  return numberOrNull(cursor)
}

function extractRollupValue(rollup: unknown, spec: RollupSpec) {
  const points = Array.isArray(asRecord(rollup).rollupDataPoints) ? asRecord(rollup).rollupDataPoints as unknown[] : []
  for (const point of points) {
    const valueRecord = asRecord(asRecord(point)[spec.rollupField])
    if (!Object.keys(valueRecord).length) continue
    if (spec.combine) {
      const combined = spec.combine(valueRecord)
      if (combined !== null) return combined
    }
    for (const path of spec.valuePaths) {
      const value = getNumberAtPath(valueRecord, path)
      if (value !== null) return value
    }
  }
  return null
}

function extractActiveMinutesByLevel(rollup: unknown) {
  const result = { light: null as number | null, moderate: null as number | null, vigorous: null as number | null }
  const points = Array.isArray(asRecord(rollup).rollupDataPoints) ? asRecord(rollup).rollupDataPoints as unknown[] : []
  for (const point of points) {
    const activeMinutes = asRecord(asRecord(point).activeMinutes)
    const rows = activeMinutes.activeMinutesRollupByActivityLevel
    if (!Array.isArray(rows)) continue
    rows.forEach((row) => {
      const record = asRecord(row)
      const level = String(record.activityLevel || '').toLowerCase()
      const minutes = numberOrNull(record.activeMinutesSum)
      if (minutes === null) return
      if (level === 'light') result.light = (result.light || 0) + minutes
      if (level === 'moderate') result.moderate = (result.moderate || 0) + minutes
      if (level === 'vigorous') result.vigorous = (result.vigorous || 0) + minutes
    })
  }
  return result
}

function numberOrNull(value: unknown) {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(number) ? number : null
}

function sumNestedNumbers(value: unknown, field: string) {
  if (!Array.isArray(value)) return null
  return sumNumbers(...value.map((item) => numberOrNull(asRecord(item)[field])))
}

function sumNumbers(...values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === 'number')
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) : null
}

function averageNumbers(...values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === 'number')
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null
}

function firstNumberByKey(value: unknown, patterns: RegExp[]): number | null {
  if (!value || typeof value !== 'object') return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstNumberByKey(item, patterns)
      if (found !== null) return found
    }
    return null
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (patterns.some((pattern) => pattern.test(key))) {
      const number = numberOrNull(child)
      if (number !== null) return number
    }
    const nested = firstNumberByKey(child, patterns)
    if (nested !== null) return nested
  }
  return null
}

function roundOrNull(value: number | null | undefined) {
  return typeof value === 'number' ? Math.round(value) : null
}

function calculateReadinessScore(metrics: Pick<HealthDailyMetrics, 'steps' | 'activity_calories' | 'active_minutes' | 'sleep_minutes'>) {
  const hasSignal = [metrics.steps, metrics.activity_calories, metrics.active_minutes, metrics.sleep_minutes]
    .some((value) => typeof value === 'number')
  if (!hasSignal) return { score: null, note: null }

  let score = 70
  const notes: string[] = []
  const sleepMinutes = metrics.sleep_minutes
  if (typeof sleepMinutes === 'number') {
    const hours = sleepMinutes / 60
    if (hours >= 7 && hours <= 9) {
      score += 18
      notes.push('sleep on target')
    } else if (hours < 6) {
      score -= 18
      notes.push('short sleep')
    } else if (hours < 7) {
      score -= 8
      notes.push('light sleep')
    } else {
      score += 5
      notes.push('long sleep')
    }
  } else {
    score = Math.min(score, 78)
    notes.push('no sleep signal')
  }

  const activeMinutes = metrics.active_minutes || 0
  const moveCalories = metrics.activity_calories || 0
  const steps = metrics.steps || 0
  if (activeMinutes > 180 || moveCalories > 650 || steps > 15000) {
    score -= 10
    notes.push('high activity load')
  } else if (activeMinutes >= 45 || steps >= 6000) {
    score += 8
    notes.push('solid movement')
  } else if (activeMinutes < 20 && steps < 2500) {
    score -= 5
    notes.push('low movement')
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    note: notes.join('; '),
  }
}

function getPacificDate(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
}
