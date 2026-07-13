# 📊 Quick Kaam Monitoring Integration

## What's Monitored

All Quick Kaam website activity is sent to Drishti Kavach backend for monitoring and logging.

## Endpoints Used

### 1. `/api/log` - General Activity Tracking
**What's tracked:**
- Page views
- CTA clicks
- Button clicks
- Form submissions
- User interactions

**Payload:**
```json
{
  "action": "page_view|cta_click|button_click|...",
  "page": "https://quickkaam.in/page",
  "agent": "Mozilla/5.0...",
  "visitor": "vis_1234567890_abc123",
  "extra": { ... }
}
```

### 2. `/api/forms` - Form Submissions
**What's tracked:**
- Contact form submissions
- Booking form submissions
- Service inquiries
- Lead generation

**Payload:**
```json
{
  "type": "contact_form|booking_form",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+91 1234567890",
  "services": "Brand Building, SEO",
  "message": "Project requirements...",
  "data": { ... }
}
```

## Configuration

### For Drishti Kavach Backend
- **URL:** `http://localhost:3000/api` (development)
- **URL:** `https://app.quickkaam.in/api` (production)

### Update in Quick Kaam Files
Add this before `common.js` loads:

```html
<script>
  window.__API_BASE = 'https://app.quickkaam.in/api';
  window.__DEBUG = true; // Set to false in production
</script>
<script src="common.js"></script>
```

## Data Stored in Drishti Kavach

All tracking data is stored in Supabase database:
- **`events` table** - General activity
- **`form_submissions` table** - Form data
- **`audit_logs` table** - Admin actions

## Testing

1. Open Drishti Kavach dashboard at `http://localhost:5173`
2. Navigate to **Security Events** or **Forms** sections
3. Visit Quick Kaam website and interact with forms
4. Check Drishti Kavach dashboard for logged data

## Monitoring What Happens

When users visit Quick Kaam:
1. **Page views** → Logged to `/api/log`
2. **Button clicks** → Logged to `/api/log`
3. **Form submissions** → Sent to `/api/forms` AND `/api/log`
4. **Security alerts** → Logged to `/api/security`

All data flows to Drishti Kavach for:
- **Analytics** - See what users are doing
- **Security** - Detect suspicious behavior
- **Lead tracking** - Monitor form conversion
- **Performance** - Track engagement metrics

---

**Note:** If backend is not running, all tracking fails silently (no errors for users).