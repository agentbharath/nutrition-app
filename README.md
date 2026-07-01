# Bharath Nutrition Tracker 🥗

Personal daily nutrition tracker — 1800 cal | 140g protein | <1500mg sodium

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bharathvaddineniK/bharath-nutrition-tracker&project-name=bharath-nutrition&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,VAPID_EMAIL,CRON_SECRET)

## Environment Variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://projectid.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `` |
| `ANTHROPIC_API_KEY` | Claude API key for scheduled food analysis |
| `ANTHROPIC_MODEL` | Optional, defaults to `claude-sonnet-4-5-20250929` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key for health OAuth token storage |
| `GOOGLE_HEALTH_CLIENT_ID` | Google Health API OAuth client ID |
| `GOOGLE_HEALTH_CLIENT_SECRET` | Optional Google Health OAuth client secret |
| `GOOGLE_HEALTH_REDIRECT_URI` | Optional, defaults to `/api/health/callback` on the current app origin |

## Claude Analysis Setup

1. Run `supabase/nutrition_ai_reports.sql` in the Supabase SQL editor.
2. Add `ANTHROPIC_API_KEY` to Vercel environment variables.
3. Optional: set `ANTHROPIC_MODEL=claude-haiku-4-5-20251001` for cheaper daily/weekly reports, or leave unset for Sonnet.

Claude is prompted with a body-composition goal profile: reduce belly/visceral fat while preserving lean muscle, using the June 19, 2026 body snapshot as context.

## Google Health Setup

This app connects through the new Google Health API OAuth flow, then stores normalized daily health metrics for analysis. Fitbit Charge 6 data should flow through the Google Health/Fitbit account connection rather than a newly registered legacy Fitbit Web API app.

1. Run `supabase/health_metrics.sql` in the Supabase SQL editor.
2. Register the app through the Google Health API developer setup and add this redirect URL:
   - Production: `https://YOUR-VERCEL-DOMAIN/api/health/callback`
   - Local: `http://localhost:3000/api/health/callback`
3. Add `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_HEALTH_CLIENT_ID`, and optionally `GOOGLE_HEALTH_CLIENT_SECRET` to Vercel.
4. Open Settings -> Google Health Sync -> Connect Google Health.

Health sync adds steps, active minutes, Active Zone Minutes, resting heart rate, calories burned, weight, and body fat context to Claude. Sleep fields are reserved in the schema and can be filled once Google Health exposes the connected sleep data shape for the account. It does not subtract calories burned from food calories.

## Features
- 📋 Today screen with 5 progress rings
- 🥗 Meal suggestions by day type (WFH/Office/Chipotle/Soya/Chana/Sunday)
- ✓ Meal confirmation + swap options
- 🔔 Push notifications at 12 PM (lunch) and 6 PM (dinner) PST
- 🤖 Claude daily food analysis + progressive weekly reports
- ⌚ Google Health sync for activity/body trend context
- 📅 History list with expandable day details
- ⚙️ Settings with notification toggle
- 📱 PWA — installable to phone home screen
