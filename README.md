# 🛡️ Drishti Kavach — दृष्टि कवच
## The Vision Shield | SOC Dashboard

> *दृष्टिः रक्षति, रक्षा दृश्यते*
> "Vision protects, and protection is seen."

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd "Drishti Kavach/backend"
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### 2. Frontend Setup
```bash
cd "Drishti Kavach/frontend"
npm install
# Create .env with: VITE_API_URL=http://localhost:3000/api
npm run dev
```

### 3. Database Setup
- Create a free project at [supabase.com](https://supabase.com)
- Copy your connection string into `.env`
- Run `backend/src/db/schema.sql` in Supabase SQL editor
- Create the first admin user (see below)

### 4. Create First Admin User
Run this SQL in Supabase:
```sql
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@drishti-kavach.com',
  '$2b$12$REPLACE_WITH_BCRYPT_HASH', 'admin');
```
Generate hash: `node -e "const b=require('bcryptjs'); console.log(b.hashSync('yourpassword',12))"`

---

## 📁 Project Structure

```
Drishti Kavach/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express + Socket.io server
│   │   ├── db/
│   │   │   ├── supabase.js    # DB client
│   │   │   └── schema.sql     # Full DB schema (run in Supabase)
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT + API key auth
│   │   │   └── validate.js    # Zod input validation
│   │   ├── routes/            # All API endpoints
│   │   ├── services/
│   │   │   ├── ai.js          # Drishti AI (DeepSeek)
│   │   │   ├── ddos.js        # DDoS detection & mitigation
│   │   │   ├── ipIntel.js     # IP intelligence (ip-api, AbuseIPDB)
│   │   │   ├── alerts.js      # Slack + Telegram + Email
│   │   │   └── security.js    # MITRE ATT&CK mapping
│   │   ├── websocket/
│   │   │   └── socket.js      # Real-time Socket.io
│   │   └── cron/
│   │       └── jobs.js        # Scheduled tasks
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx            # Router + protected routes
    │   ├── api/client.js      # Axios + auto-refresh
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   └── layout/DashboardLayout.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Overview.jsx       # Main dashboard
    │       ├── SecurityEvents.jsx
    │       ├── DdosMonitor.jsx
    │       ├── IPManagement.jsx
    │       ├── Incidents.jsx
    │       ├── Forms.jsx
    │       ├── DrishtiAI.jsx      # AI chat interface
    │       ├── Websites.jsx       # Multi-tenant
    │       ├── Reports.jsx
    │       ├── Users.jsx
    │       ├── AuditLog.jsx
    │       └── Settings.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🔌 Add Drishti Kavach to Your Website

### Step 1: Create your website in the dashboard
Go to **Websites → Add Website**, enter your domain.

### Step 2: Copy your API key and snippet
Go to **Websites → Get Snippet** and add before `</body>`:

```html
<!-- Drishti Kavach SDK -->
<script>
(function(){
  const DK = { apiKey: 'dk_YOUR_API_KEY', api: 'https://your-api.onrender.com/api/sdk' };
  function send(type, data) {
    navigator.sendBeacon(DK.api + '/log',
      JSON.stringify({ event_type: type, page_url: location.href, event_data: data }));
  }
  send('page_view', { title: document.title });
})();
</script>
```

---

## 🌐 Deployment (Free — $0/month)

| Service | What | Free Tier |
|---------|------|-----------|
| **Supabase** | PostgreSQL | 500MB, 2GB bandwidth |
| **Render** | Backend API | 750 hrs/month |
| **Vercel** | Frontend | Unlimited static |
| **cron-job.org** | Scheduled jobs | Unlimited |

### Deploy Backend to Render
1. Connect GitHub repo to Render
2. Set environment variables from `.env.example`
3. Build: `npm install` | Start: `npm start`

### Deploy Frontend to Vercel
1. Connect GitHub repo to Vercel
2. Set `VITE_API_URL=https://your-api.onrender.com/api`
3. Deploy

---

## 🔑 Environment Variables (Required)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
JWT_SECRET=your-32-char-secret
JWT_REFRESH_SECRET=another-32-char-secret
DEEPSEEK_API_KEY=sk-xxx          # For Drishti AI
ABUSEIPDB_API_KEY=xxx            # IP threat intel
GREYNOISE_API_KEY=xxx            # Scanner detection
SLACK_WEBHOOK_URL=https://...    # Alerts
TELEGRAM_BOT_TOKEN=xxx           # Alerts
FRONTEND_URL=https://your-dashboard.vercel.app
```

---

## ✅ Features

- 🔐 Security threat detection (SQLi, XSS, Honeypot, Path Traversal)
- 🌊 DDoS detection & auto-mitigation (Cloudflare integration)
- 🌐 IP intelligence & block/unblock management
- 🚨 Incident lifecycle management
- 📨 Form submission tracking
- 🤖 Drishti AI — autonomous threat investigation & chat
- 🏗️ Multi-tenant — monitor unlimited websites
- 📋 AI-generated security reports
- ⚡ Real-time WebSocket alerts
- 👥 RBAC user management (admin/analyst/viewer/client)
- 📜 Full audit logging
- 🗑️ Automated data retention

---

*अहं रक्षामि, अहं दृश्यामि — I protect, I see all.*
