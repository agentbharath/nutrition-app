import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { createServiceSupabase } from '@/lib/health'

// Colors
const GREEN = '#1A6B4A'
const GREEN_LIGHT = '#E8F5EE'
const GREEN_DARK = '#12503A'
const AMBER = '#92620A'
const AMBER_LIGHT = '#FFF8E6'
const RED_LIGHT = '#FFF0F0'
const RED = '#8B0000'
const GRAY = '#F7F8F9'
const BORDER = '#E2E8E4'
const TEXT = '#1A1A1A'
const MUTED = '#6B7280'
const WHITE = '#FFFFFF'

const styles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: TEXT,
    paddingBottom: 60,
  },
  // Header
  header: {
    backgroundColor: GREEN_DARK,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  brandLabel: {
    fontSize: 8,
    color: '#A3D4BE',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    marginTop: 2,
  },
  headerMeta: {
    alignItems: 'flex-end',
  },
  headerDate: {
    fontSize: 9,
    color: '#A3D4BE',
    letterSpacing: 1,
  },
  headerModel: {
    fontSize: 8,
    color: '#6FAE8D',
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    lineHeight: 1.3,
    maxWidth: 460,
  },
  // Macro ribbon
  macroRibbon: {
    backgroundColor: GREEN,
    paddingHorizontal: 40,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 0,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroItemBorder: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#2A8060',
  },
  macroValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  macroLabel: {
    fontSize: 7,
    color: '#A3D4BE',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Health ribbon
  healthRibbon: {
    backgroundColor: '#F0F7F4',
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  healthItem: {
    flex: 1,
    alignItems: 'center',
  },
  healthItemBorder: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
  },
  healthValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  healthLabel: {
    fontSize: 7,
    color: MUTED,
    marginTop: 1,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Body
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: GREEN_LIGHT,
  },
  sectionText: {
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.65,
  },
  // Bullet items
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 16,
    fontSize: 10,
    color: GREEN,
    fontFamily: 'Helvetica-Bold',
    marginTop: 0.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.6,
  },
  // Opportunity item
  oppDot: {
    width: 16,
    fontSize: 10,
    color: AMBER,
    fontFamily: 'Helvetica-Bold',
    marginTop: 0.5,
  },
  oppText: {
    flex: 1,
    fontSize: 10,
    color: '#5C4500',
    lineHeight: 1.6,
  },
  // Food flags box
  flagBox: {
    backgroundColor: RED_LIGHT,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: RED,
    padding: 10,
    marginBottom: 20,
  },
  flagLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: RED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  flagText: {
    fontSize: 9.5,
    color: '#5C0000',
    lineHeight: 1.55,
    marginBottom: 3,
  },
  // Assessment box
  assessmentBox: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
  },
  assessmentText: {
    fontSize: 10.5,
    color: '#1A3A2A',
    lineHeight: 1.7,
    fontFamily: 'Helvetica',
  },
  // Two column layout
  twoCol: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  col: {
    flex: 1,
  },
  // Focus box
  focusBox: {
    backgroundColor: '#F0F7F4',
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
    borderTopWidth: 2,
    borderTopColor: GREEN,
  },
  focusLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  focusItem: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  focusArrow: {
    width: 14,
    fontSize: 10,
    color: GREEN,
    fontFamily: 'Helvetica-Bold',
  },
  focusText: {
    flex: 1,
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GRAY,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 40,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 8,
    color: MUTED,
  },
  footerRight: {
    fontSize: 8,
    color: MUTED,
  },
  footerBrand: {
    fontSize: 8,
    color: GREEN,
    fontFamily: 'Helvetica-Bold',
  },
})

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(safeStr).join(', ')
  return ''
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

interface ReportData {
  title?: string
  overall_assessment?: string
  biggest_wins?: string[]
  biggest_opportunities?: string[]
  food_analysis?: string
  recovery_analysis?: string
  pattern_detection?: string[]
  personalized_recommendations?: string[]
  food_flags?: string[]
}

interface HealthData {
  steps?: number
  sleep_minutes?: number
  active_zone_minutes?: number
  cardio_load?: number
  readiness_score?: number
  calories_out?: number
}

interface DailyLogData {
  cal_consumed?: number
  protein_consumed?: number
  sodium_consumed?: number
  fiber_consumed?: number
}

function ReportPDF({
  report,
  date,
  log,
  health,
  model,
}: {
  report: ReportData
  date: string
  log: DailyLogData | null
  health: HealthData | null
  model: string
}) {
  const hasMacros = log && (log.cal_consumed || log.protein_consumed)
  const hasHealth = health && (health.steps || health.sleep_minutes)
  const hasFlags = report.food_flags && report.food_flags.length > 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ─── HEADER ─── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brandLabel}>Personal Nutrition Report</Text>
              <Text style={styles.brandName}>Bharath Nutrition</Text>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.headerDate}>{formatDate(date)}</Text>
              <Text style={styles.headerModel}>{model}</Text>
            </View>
          </View>
          <Text style={styles.reportTitle}>{report.title || 'Daily Nutrition Analysis'}</Text>
        </View>

        {/* ─── MACRO RIBBON ─── */}
        {hasMacros && (
          <View style={styles.macroRibbon}>
            {[
              [String(log!.cal_consumed ?? '—'), 'Calories'],
              [log!.protein_consumed ? `${log!.protein_consumed}g` : '—', 'Protein'],
              [log!.sodium_consumed ? `${log!.sodium_consumed}mg` : '—', 'Sodium'],
              [log!.fiber_consumed ? `${log!.fiber_consumed}g` : '—', 'Fiber'],
            ].map(([val, lbl], i) => (
              <View key={lbl} style={i === 0 ? styles.macroItem : styles.macroItemBorder}>
                <Text style={styles.macroValue}>{val}</Text>
                <Text style={styles.macroLabel}>{lbl}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── HEALTH RIBBON ─── */}
        {hasHealth && (
          <View style={styles.healthRibbon}>
            {[
              [health!.steps ? `${(health!.steps / 1000).toFixed(1)}k` : '—', 'Steps'],
              [health!.sleep_minutes ? `${Math.floor(health!.sleep_minutes / 60)}h ${health!.sleep_minutes % 60}m` : '—', 'Sleep'],
              [health!.active_zone_minutes ? `${health!.active_zone_minutes} AZM` : '—', 'Active Zones'],
              [health!.cardio_load ? String(health!.cardio_load) : '—', 'Cardio Load'],
              [health!.readiness_score ? String(health!.readiness_score) : '—', 'Readiness'],
            ].map(([val, lbl], i) => (
              <View key={lbl} style={i === 0 ? styles.healthItem : styles.healthItemBorder}>
                <Text style={styles.healthValue}>{val}</Text>
                <Text style={styles.healthLabel}>{lbl}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── BODY ─── */}
        <View style={styles.body}>

          {/* Overall Assessment */}
          {report.overall_assessment && (
            <View style={styles.assessmentBox}>
              <Text style={styles.assessmentText}>{report.overall_assessment}</Text>
            </View>
          )}

          {/* Food Flags */}
          {hasFlags && (
            <View style={styles.flagBox} wrap={false}>
              <Text style={styles.flagLabel}>⚠ Food Flags</Text>
              {report.food_flags!.map((flag, i) => (
                <Text key={i} style={styles.flagText}>• {flag}</Text>
              ))}
            </View>
          )}

          {/* Wins */}
          {report.biggest_wins && report.biggest_wins.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionLabel}>Biggest Wins</Text>
              {report.biggest_wins.map((win, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>+</Text>
                  <Text style={styles.bulletText}>{win}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Opportunities */}
          {report.biggest_opportunities && report.biggest_opportunities.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionLabel}>Opportunities</Text>
              {report.biggest_opportunities.map((opp, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.oppDot}>-</Text>
                  <Text style={styles.oppText}>{opp}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Food Analysis */}
          {report.food_analysis && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Food Analysis</Text>
              <Text style={styles.sectionText}>{report.food_analysis}</Text>
            </View>
          )}

          {/* Recovery Analysis */}
          {report.recovery_analysis && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Recovery Analysis</Text>
              <Text style={styles.sectionText}>{report.recovery_analysis}</Text>
            </View>
          )}

          {/* Pattern Detection */}
          {report.pattern_detection && report.pattern_detection.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionLabel}>Patterns Emerging</Text>
              {report.pattern_detection.map((p, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>*</Text>
                  <Text style={styles.bulletText}>{p}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Focus / Recommendations */}
          {report.personalized_recommendations && report.personalized_recommendations.length > 0 && (
            <View style={styles.focusBox} wrap={false}>
              <Text style={styles.focusLabel}>Focus for Today</Text>
              {report.personalized_recommendations.map((rec, i) => (
                <View key={i} style={styles.focusItem}>
                  <Text style={styles.focusArrow}>&gt;</Text>
                  <Text style={styles.focusText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

        </View>

        {/* ─── FOOTER ─── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>Generated by <Text style={styles.footerBrand}>Bharath Nutrition Coach</Text></Text>
          <Text style={styles.footerRight}>{formatDate(date)} · Confidential</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })
  const supabase = createServiceSupabase()

  // Fetch report
  const { data: reportRow } = await supabase
    .from('nutrition_ai_reports')
    .select('*')
    .eq('report_type', 'daily')
    .eq('period_end', date)
    .maybeSingle()

  if (!reportRow) return NextResponse.json({ error: 'No report found for this date' }, { status: 404 })

  // Fetch daily log for macro ribbon
  const { data: log } = await supabase
    .from('daily_logs')
    .select('cal_consumed, protein_consumed, sodium_consumed, fiber_consumed')
    .eq('date', date)
    .maybeSingle()

  // Fetch health metrics
  const { data: health } = await supabase
    .from('health_daily_metrics')
    .select('steps, sleep_minutes, active_zone_minutes, cardio_load, readiness_score, calories_out')
    .eq('date', date)
    .maybeSingle()

  const report = reportRow.analysis as ReportData
  const model = reportRow.model || ''

  const buffer = await renderToBuffer(
    <ReportPDF
      report={report}
      date={date}
      log={log}
      health={health}
      model={model}
    />
  )

  const filename = `nutrition-report-${date}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.byteLength),
    },
  })
}
