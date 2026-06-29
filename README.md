# Bharath Nutrition Tracker 🥗

Personal daily nutrition tracker — 1800 cal | 140g protein | <1500mg sodium

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bharathvaddineniK/bharath-nutrition-tracker&project-name=bharath-nutrition&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,VAPID_EMAIL,CRON_SECRET)

## Environment Variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fahdzhlpnkvctfqrgjkp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaGR6aGxwbmt2Y3RmcXJnamtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTI2NzEsImV4cCI6MjA5ODE2ODY3MX0.IOFdJWxh9a3bb2SAvsIjUrQI2VAHy9MVYU4T5s4dwHk` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BBPrC8z7uhPCAHsLutNYjgXa_P-dRXvFglg3GS5cvzJo65G2_AndRMZdDhAAjdk4n0W-1aqeowEInym90Bfz9Yw` |
| `VAPID_PRIVATE_KEY` | `FatTUWdv4pvkCTMRWH0OALwAsL1QFq174tUkM6pnhaQ` |
| `VAPID_EMAIL` | `mailto:bharath@nutrition.app` |
| `CRON_SECRET` | `nutrition-cron-secret-2026` |
| `ANTHROPIC_API_KEY` | Claude API key for scheduled food analysis |
| `ANTHROPIC_MODEL` | Optional, defaults to `claude-sonnet-4-5-20250929` |

## Claude Analysis Setup

1. Run `supabase/nutrition_ai_reports.sql` in the Supabase SQL editor.
2. Add `ANTHROPIC_API_KEY` to Vercel environment variables.
3. Optional: set `ANTHROPIC_MODEL=claude-haiku-4-5-20251001` for cheaper daily/weekly reports, or leave unset for Sonnet.

Claude is prompted with a body-composition goal profile: reduce belly/visceral fat while preserving lean muscle, using the June 19, 2026 body snapshot as context.

## Features
- 📋 Today screen with 5 progress rings
- 🥗 Meal suggestions by day type (WFH/Office/Chipotle/Soya/Chana/Sunday)
- ✓ Meal confirmation + swap options
- 🔔 Push notifications at 12 PM (lunch) and 6 PM (dinner) PST
- 🤖 Claude daily food analysis + progressive weekly reports
- 📅 History list with expandable day details
- ⚙️ Settings with notification toggle
- 📱 PWA — installable to phone home screen
