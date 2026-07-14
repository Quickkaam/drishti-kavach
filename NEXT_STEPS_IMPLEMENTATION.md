# 🔜 Drishti Kavach - Next Steps Implementation

---

## 🚀 Priority 1 - Critical Production Issues

### 1. Add Groq API Key to Render
**Status:** ⏳ Pending  
**Action:** Add to Render environment variables  
**Details:** The backend `.env` file needs the Groq API key in Render dashboard  
**Steps:**
1. Go to https://dashboard.render.com/web/srv-d9afvh81juns739qr96g
2. Click "Environment" tab
3. Add:
   - `AI_PROVIDER` = `groq`
   - `DEEPSEEK_API_KEY` = `gsk_JLZzlpBncMXrN0Py33i1WGdyb3FYxNi8xqkmQm5oiRXqIYWHGpQ`
4. Click "Save Changes"

---

### 2. Configure EmailJS for Form Submissions
**Status:** ⏳ Pending  
**Action:** Set up EmailJS service  
**Details:** Forms won't work without EmailJS credentials  
**Steps:**
1. Sign up at https://www.emailjs.com/
2. Create an Email Service (connect Gmail/Outlook)
3. Create an Email Template (use `{{name}} {{email}} {{message}}` variables)
4. Get Public Key, Service ID, Template ID
5. Add to `backend/.env`:
   ```env
   EMAILJS_PUBLIC_KEY=your_public_key
   EMAILJS_SERVICE_ID=your_service_id
   EMAILJS_TEMPLATE_ID=your_template_id
   ```

---

### 3. Enable Helmet Security Headers
**Status:** ⏳ Pending  
**Action:** Add security middleware to backend  
**File:** `backend/src/server.js`  
**Steps:**
```javascript
const helmet = require('helmet');
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  }
}));
```

---

### 4. Remove Demo Mode from AuthContext
**Status:** ⏳ Pending  
**Action:** Remove bypass for security  
**File:** `frontend/src/context/AuthContext.jsx`  
**Change:** Remove demo login fallback

---

## 🔧 Priority 2 - Configuration & Deployment

### 5. Website SDK Setup
**Status:** ⏳ Pending  
**Action:** Add tracking to quickkaam.in  
**Steps:**
1. Go to Websites page in dashboard
2. Find quickkaam.in entry
3. Copy the SDK snippet
4. Add to `quickkaam.in` before `</body>` tag

---

### 6. Database Backup Schedule
**Status:** ⏳ Pending  
**Action:** Set up automated backups  
**Option A - Supabase:**
- Supabase has built-in backups (enable in Dashboard)
- Set up weekly snapshots

**Option B - External:**
- Use pg_dump with cron
- Store in S3/Backblaze

---

### 7. Uptime Monitoring
**Status:** ⏳ Pending  
**Action:** Set up monitoring service  
**Options:**
- UptimeRobot (free up to 50 monitors)
- Better Stack (free tier)
- Pingdom

**Endpoints to Monitor:**
- `https://drishti-kavach-backend.onrender.com`
- `https://drishti-kavach.vercel.app`

---

## 🌐 Priority 3 - External Integrations (API Keys Needed)

### 8. AbuseIPDB API
**Status:** ⏳ Pending  
**Action:** Get API key from https://www.abuseipdb.com/  
**Use:** Enhanced IP intelligence

### 9. GreyNoise API
**Status:** ⏳ Pending  
**Action:** Get API key from https://www.greynoise.io/  
**Use:** IP reputation data

### 10. VirusTotal API
**Status:** ⏳ Pending  
**Action:** Get API key from https://www.virustotal.com/  
**Use:** URL/Domain malware scanning

### 11. Cloudflare API Integration
**Status:** ⏳ Pending  
**Action:** Get API token from Cloudflare Dashboard  
**Use:** Automatic firewall rules

---

## 📱 Priority 4 - Alerting & Notifications

### 12. Slack Integration
**Status:** ⏳ Pending  
**Action:** Create Slack app and webhook  
**Use:** Real-time security alerts

### 13. Telegram Bot
**Status:** ⏳ Pending  
**Action:** Create Telegram bot via @BotFather  
**Use:** Mobile push notifications

---

## 🧪 Priority 5 - Testing & QA

### 14. End-to-End Testing
**Status:** ⏳ Pending  
**Tests:**
- [ ] Login flow
- [ ] AI chat with Groq
- [ ] Security events
- [ ] IP block/unblock
- [ ] Form submissions
- [ ] Mobile responsiveness

### 15. Cross-Browser Testing
**Status:** ⏳ Pending  
**Browsers:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## 📊 Priority 6 - Monitoring & Analytics

### 16. Sentry Integration
**Status:** ⏳ Pending  
**Action:** Get DSN from https://sentry.io/  
**Use:** Error tracking

### 17. Analytics
**Status:** ⏳ Pending  
**Options:**
- Plausible (privacy-focused)
- PostHog (feature-rich)

---

## 📝 Priority 7 - Documentation

### 18. User Guide
**Status:** ⏳ Pending  
**Content:**
- Getting started
- Using AI assistant
- Managing IPs
- Understanding threats

### 19. API Documentation
**Status:** ⏳ Pending  
**Content:**
- All endpoints
- Request/response examples
- Authentication

---

## 🎯 Quick Implementation Tasks

### Immediate (Today/Tomorrow)
1. ✅ Add Groq API key to Render
2. ✅ Set up EmailJS
3. ✅ Enable Helmet security headers
4. ✅ Add Website SDK to quickkaam.in
5. ✅ Set up uptime monitoring

### Short-term (This Week)
6. Configure AbuseIPDB/GreyNoise
7. Set up Slack/Telegram alerts
8. Run end-to-end tests
9. Create user guide
10. Add Sentry for error tracking

### Medium-term (Next Week)
11. Cross-browser testing
12. Analytics setup
13. API documentation
14. Security audit
15. Backup schedule

---

## 📈 Current Production Status

| Component | Status | URL |
|-----------|--------|-----|
| Backend | ✅ Running | https://drishti-kavach-backend.onrender.com |
| Frontend | ✅ Running | https://drishti-kavach.vercel.app |
| AI Chat | ⚠️ Needs Key | Groq API key in Render |
| Map View | ✅ Fixed | OpenStreetMap tiles |
| IP Lookups | ✅ Fixed | ipapi.co integration |
| Email Forms | ❌ Pending | Needs EmailJS |
| Website SDK | ❌ Pending | Need to add to quickkaam.in |

---

## 🚨 Critical Blocking Issues

1. **Groq API Key** - AI won't work until added to Render
2. **EmailJS** - Forms won't submit without credentials
3. **Website SDK** - Tracking won't work until added to quickkaam.in

---

**Last Updated:** July 14, 2026  
**Next Review:** July 15, 2026
