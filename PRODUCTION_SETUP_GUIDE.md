# 🔧 Drishti Kavach Production Setup Guide

## ⚠️ Critical: Complete These Steps Before Going Live

This guide will help you configure all missing services to make Drishti Kavach fully operational.

---

## 📋 Summary of What's Done vs What's Missing

| Task | Status | Notes |
|------|--------|-------|
| AI Integration (DeepSeek) | ✅ Done | 2 API keys configured with fallback |
| Email Proxy Service | ✅ Done | Service ready, needs credentials |
| Turnstile Middleware | ✅ Done | Service ready, needs keys |
| Frontend Build | ✅ Done | Production build completed |
| Backend Routes | ✅ Done | All endpoints configured |
| **Turnstile Credentials** | ❌ **Missing** | Get keys from Cloudflare |
| **EmailJS Credentials** | ❌ **Missing** | Get keys from EmailJS |
| **Production API URL** | ⚠️ **Placeholder** | Replace with your deployment URL |

---

## 🎯 Step 1: Get Cloudflare Turnstile Keys

### Why? Required for all public forms (contact, booking) to prevent spam/bots

1. Go to: https://dash.cloudflare.com/
2. Sign up / Log in
3. Navigate to **Turnstile** (left sidebar)
4. Click **Add Site**
5. Enter:
   - **Domain**: `quickkaam.in` (and `app.quickkaam.in`)
   - **Mode**: Non-interactive
   - **Enable check box**: YES
6. Click **Add**
7. Copy the **Site Key** and **Secret Key**

### Update Your Environment:

**Backend (`backend/.env`):**
```bash
TURNSTILE_SECRET_KEY=your_secret_key_from_cloudflare
```

**Frontend (`frontend/.env`):**
```bash
VITE_TURNSTILE_SITE_KEY=your_site_key_from_cloudflare
```

---

## 🎯 Step 2: Get EmailJS Credentials

### Why? Required for email proxy service (contact form submissions, notifications)

1. Go to: https://www.emailjs.com/
2. Sign up / Log in
3. **Add Email Service**:
   - Go to **Email Services** → **Add New Service**
   - Connect your email (Gmail/Outlook/etc.)
   - Copy the **Service ID**

4. **Create Email Template**:
   - Go to **Email Templates** → **Create New Template**
   - Use this template:
   ```
   Name: {{name}}
   Email: {{email}}
   Phone: {{phone}}
   Message: {{message}}
   Service: {{service}}
   ```
   - Copy the **Template ID**

5. **Get Public Key**:
   - Go to **Account** → **General**
   - Copy the **Public Key**

### Update Your Environment:

**Backend (`backend/.env`):**
```bash
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
```

---

## 🎯 Step 3: Update API URLs for Production

### Backend (when deployed to Render):
```bash
# In backend/.env (don't change - uses Render URL)
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://app.quickkaam.in,https://quickkaam.in
```

### Frontend (before build):
```bash
# In frontend/.env
VITE_API_URL=https://your-render-url.herokuapp.com/api
# OR if you have a custom domain:
VITE_API_URL=https://api.quickkaam.in/api
```

---

## 🎯 Step 4: Deploy Backend to Render

### Option A: Deploy to Render (Recommended)

1. Go to: https://render.com/
2. Sign up / Log in
3. Click **New Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `drishti-kavach-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `Drishti Kavach/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run dev`
6. **Environment Variables**: Add all from `backend/.env`
7. Click **Create Web Service**

### Option B: Deploy to Any Other Host

Use your preferred hosting (DigitalOcean, AWS, etc.) and set environment variables from `backend/.env`.

---

## 🎯 Step 5: Deploy Frontend to Vercel

### Option A: Deploy to Vercel (Recommended)

1. Go to: https://vercel.com/
2. Sign up / Log in
3. Click **New Project**
4. Import your GitHub repository
5. Configure:
   - **Root Directory**: `Drishti Kavach/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. **Environment Variables**: Add all from `frontend/.env`
7. Click **Deploy**

### Option B: Deploy to Any Other Host

Use your preferred hosting (Netlify, AWS S3, etc.) and upload the `frontend/dist` folder.

---

## 🎯 Step 6: Configure DNS (Optional but Recommended)

Point your domains to the deployments:

```
quickkaam.in      → Your frontend host (Vercel/Netlify)
app.quickkaam.in  → Your frontend host (Vercel/Netlify)
api.quickkaam.in  → Your backend host (Render/Heroku)
```

---

## 🎯 Step 7: Update Frontend common.js (If Self-Hosted)

If you're using the `common.js` in the root `e:\Quick Kaam\` folder, update the API URL:

```javascript
// At the top of common.js
const API_URL = "https://your-render-url.herokuapp.com/api";
// OR
const API_URL = "https://api.quickkaam.in/api";
```

---

## 🧪 Step 8: Test Everything

After deployment, test:

1. **Health Check**:
   ```
   https://api.quickkaam.in/api/health
   ```
   Should return: `{"status":"ok","service":"Drishti Kavach API"}`

2. **Login**:
   ```
   https://app.quickkaam.in
   ```
   Use your super admin credentials from `.env`

3. **Contact Form** (tests Turnstile + EmailJS):
   - Fill out the form
   - Submit
   - Check if email is received (or logged in console)

4. **AI Chat** (tests DeepSeek API):
   - Click the Drishti AI icon
   - Ask: "Show me today's threats"
   - Should see AI response

---

## 🔐 Optional: Configure Slack/Telegram Alerts

### Slack Webhook:
1. Go to: https://api.slack.com/apps
2. Create new app → Incoming Webhooks
3. Add webhook to channel
4. Copy webhook URL → Add to `backend/.env` as `SLACK_WEBHOOK_URL`

### Telegram Bot:
1. Go to: https://t.me/BotFather
2. Create new bot → Get token
3. Get your chat ID from: https://t.me/getidsbot
4. Add to `backend/.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

---

## 📊 Environment Variables Reference

### Backend (all required):
```bash
# Database (from Supabase)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth (generate your own secrets)
JWT_SECRET=your_40_char_secret_here
JWT_REFRESH_SECRET=your_40_char_refresh_secret_here

# Super Admin
SUPER_ADMIN_EMAIL=your_email@example.com
SUPER_ADMIN_PASSWORD=your_secure_password

# Production
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://app.quickkaam.in,https://quickkaam.in

# Cloudflare Turnstile (REQUIRED)
TURNSTILE_SECRET_KEY=your_secret_key

# EmailJS (REQUIRED)
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key

# DeepSeek AI (REQUIRED for AI features)
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_API_KEY_BACKUP=your_backup_api_key

# Optional: Alerts
SLACK_WEBHOOK_URL=your_slack_webhook
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Frontend (all required):
```bash
VITE_API_URL=https://your-api-url/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TURNSTILE_SITE_KEY=your_site_key
```

---

## 🚀 Next Steps After Setup

1. Monitor logs for any errors
2. Set up uptime monitoring (Better Stack, UptimeRobot)
3. Configure error tracking (Sentry)
4. Set up daily backups for Supabase
5. Document your team on how to use the dashboard

---

## 🆘 Troubleshooting

### AI Chat Shows "API Key Configuration":
- Verify `DEEPSEEK_API_KEY` is correct
- Check API key hasn't expired
- Verify backend can reach DeepSeek servers

### Forms Not Sending Emails:
- Verify EmailJS credentials
- Check EmailJS account has credits
- Look for errors in backend console

### Turnstile Errors:
- Verify site key matches domain
- Check Turnstile secret key in backend
- Ensure domain is added to Turnstile dashboard

### Connection Refused:
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check CORS settings in backend
- Ensure firewall isn't blocking port

---

## ✅ Final Checklist

- [ ] Cloudflare Turnstile keys added
- [ ] EmailJS credentials added
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] API URL updated in frontend
- [ ] All environment variables set
- [ ] Health check passing
- [ ] Login working
- [ ] Contact form sending
- [ ] AI chat responding
- [ ] DNS configured (if using custom domains)

---

**Need Help?** Check the logs in your hosting provider's dashboard or run locally with `npm run dev` to debug.

**ドリシタ ヴァク**, **ラクシャ ドリシヤते** — Vision protects, and protection is seen. 🛡️