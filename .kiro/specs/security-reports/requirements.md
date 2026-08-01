# Security Reports & AI Guardian Mode - Requirements

## Overview
Generate comprehensive AI-powered security intelligence reports with PDF download, and implement AI Guardian Mode that takes full control in user absence.

## Requirements

### 1. AI Security Reports
- Generate detailed security reports based on time period (7 days, 30 days)
- PDF format with preview and download option
- Include:
  - All security events (SQLi, XSS, DDoS, brute force, etc.)
  - Attack types and their frequencies
  - Attacker IP addresses with geolocation
  - Blocked IPs list
  - Threat severity breakdown
  - Weekly/Monthly trends
  - Recommendations

### 2. AI Guardian Mode
- Auto-investigate security events when user is away
- Auto-block malicious IPs automatically
- Make decisions on threat mitigation
- Send alerts to admin channels (Slack, Telegram, Email)
- Generate daily summary reports

### 3. IP Capture & Blocking
- Capture attacker IP addresses from all security events
- Automatic blocking based on threat scores
- Manual and automatic unblocking
- IP whitelist/blacklist management

## Technical Requirements
- Backend: Express.js with Node.js
- Database: Supabase PostgreSQL
- Frontend: React + Tailwind CSS
- PDF: Use puppeteer or jsPDF
- AI: Groq/DeepSeek for analysis

## Files to Create/Modify
- Backend: `/api/reports/*` routes
- Backend: `aiGuardian.js` service
- Frontend: `SecurityReports.jsx` page
- Database: Add new tables if needed
