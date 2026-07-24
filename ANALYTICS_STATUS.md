# Drishti Kavach — Analytics Status

## Current Situation

### ✅ What's Working

1. **Login Logging** ✅
   - Login events are being logged to `login_logs` table
   - Location enrichment is working (IP to city/country)
   - Real-time notifications are being sent

2. **User Sessions Table** ✅
   - 7 sessions recorded (all with website_id = 1)
   - Sessions are created but have no page views attached

3. **Database Schema** ✅
   - All analytics tables exist: `user_sessions`, `page_views`, `geographic_data`, `device_analytics`
   - RPC functions exist: `increment_session_page_count`, `update_session_duration`
   - RLS policies are properly configured

4. **Analytics API** ✅
   - All analytics routes are working
   - Fixed duplicate `/api` path in frontend
   - Fixed superadmin role check

5. **Frontend Dashboard** ✅
   - Analytics page displays correctly
   - Auto-refreshes every 10 seconds
   - Shows real-time visitor data (when available)

### ❌ What's NOT Working (Yet)

**Analytics data not showing because SDK tracking code is NOT installed on quickkaam.in**

The `page_views` table is empty because:
1. quickkaam.in doesn't have the SDK tracking code installed
2. No `session_start` or `page_view` events are being sent to the backend

## Data Flow

```
quickkaam.in (your website)
    ↓ [SDK Tracking Code]
    ↓ POST /api/sdk/engagement
    ↓ { event_type: "session_start", session_id: "...", data: { url: "/contact" } }
    ↓
backend.onrender.com
    ↓ Creates session in user_sessions table
    ↓ Auto-creates first page_view in page_views table (NEW FIX)
    ↓
Frontend Analytics Dashboard
    ↓ Shows sessions and page views
```

## Current Data in Database

```sql
-- User Sessions: 7 rows (all website_id = 1)
id | website_id | session_id                           | pages_visited | total_duration
---|------------|--------------------------------------|---------------|---------------
 2 |          1 | 4d607fb5-e3cd-4466-8a0c-c08b9bfdb686 |             0 |              0
 5 |          1 | f86692f5-ddef-435a-9e4a-b2d31d2d1335 |             0 |              0
 7 |          1 | 912a4717-b112-40e2-bfac-30ff39925247 |             0 |              0
 9 |          1 | 768e1510-ee63-460d-976b-555ea39f5abb |             1 |              0
11 |          1 | 26ea3039-67e5-40a9-bc00-7d67757e428e |             0 |              0
12 |          1 | 79c0d726-1b45-4b25-9795-ae707b8db4e7 |             1 |              0
13 |          1 | aa6ceee9-5972-4c19-99ac-0578054fa42a |             1 |              0

-- Page Views: 0 rows (EMPTY!)
-- This is why analytics shows "NO DATA AVAILABLE"
```

## Solution

### Install SDK Tracking Code on quickkaam.in

Add the JavaScript code from `TRACKING_CODE_INSTRUCTIONS.md` to the `<head>` section of your website.

**What the SDK does:**
1. Detects when a user visits a page
2. Creates/updates a session ID
3. Sends `session_start` event with page URL
4. Sends `page_view` event for each page loaded
5. Tracks time on page (every 30 seconds)
6. Tracks session end when user leaves

**After installation, you'll see:**
- `page_views` table populated with data
- Analytics dashboard shows real visitor stats
- Top pages, activity chart, device breakdown all working

### Quick Test

After adding the SDK code:

1. Open quickkaam.in in a browser
2. Check browser console for logs like `[SDK Session]`, `[SDK Track]`
3. Wait 5-10 seconds
4. Refresh the Analytics dashboard
5. You should see:
   - Sessions in "RECENT SESSIONS"
   - Page views in "TOP PAGES"
   - Activity in the chart

## Recent Fixes Applied

| Fix | Status | Description |
|-----|--------|-------------|
| Remove duplicate `/api` path | ✅ Done | Frontend now uses `/analytics/...` instead of `/api/analytics/...` |
| Fix superadmin role check | ✅ Done | Route now correctly checks for `superadmin` role |
| Auto-create page_view on session_start | ✅ Done | When `session_start` is received, also create first page_view |
| Handle null session objects | ✅ Done | Analytics overview now handles null values gracefully |

## Files Created

| File | Purpose |
|------|---------|
| `TRACKING_CODE_INSTRUCTIONS.md` | Full instructions for installing SDK tracking code |
| `ANALYTICS_STATUS.md` | This file - current status documentation |
| `frontend/src/pages/TrackingCode.jsx` | React component version of tracking code |

## Next Steps

1. ✅ Fix backend API issues - **DONE**
2. ✅ Add auto page_view creation on session_start - **DONE**
3. ⏳ Install SDK tracking code on quickkaam.in - **WAITING FOR YOU**
4. ⏳ Verify page_views table receives data
5. ⏳ Test analytics dashboard shows real data

## Need Help?

The tracking code is ready in `TRACKING_CODE_INSTRUCTIONS.md`. Just copy the `<script>` block and paste it in the `<head>` section of your website.

If you need the website API key for the SDK configuration:
1. Log in to Drishti Kavach as superadmin
2. Go to Websites section
3. Find quickkaam.in (ID: 1)
4. Copy the `api_key_hash` value
5. Replace `'YOUR_WEBSITE_API_KEY'` in the tracking code

---

**Note:** The `pages_visited` count shows 0 or 1 because:
- Sessions are created when SDK sends `session_start`
- But page views are only created when SDK sends `page_view` OR when we auto-create on session_start (new fix)
- The `total_duration` is 0 because `time_on_page` events aren't being tracked yet

Once the SDK is installed and sends proper events, all metrics will populate correctly.
