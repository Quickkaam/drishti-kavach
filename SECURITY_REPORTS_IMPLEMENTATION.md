# AI Guardian Mode & Security Reports System

## Overview
Implemented a comprehensive AI-powered Security Reports and Guardian Mode system for the Drishti Kavach SOC Dashboard. This system provides autonomous security monitoring, threat analysis, and automated response capabilities.

## Files Created

### Backend Services

#### 1. `backend/src/services/aiGuardian.js`
**Features:**
- **Auto-investigation**: AI takes full control to analyze security events in user absence
- **Attacker IP Capture**: Captures attacker IP addresses from all security events
- **Threat Score Calculation**: Calculates comprehensive threat scores based on multiple factors
- **Auto-blocking**: Auto-blocks IPs based on threat scores and AI recommendations
- **Guardian Dashboard Stats**: Real-time statistics on attackers and threats

**Key Functions:**
- `getGuardianConfig(websiteId)` - Get guardian mode configuration
- `isGuardianEnabled(websiteId)` - Check if guardian mode is active
- `captureAttackerIP(event)` - Capture and store attacker information
- `calculateThreatScore(intel, eventType, payload)` - Calculate threat score (0-100)
- `autoInvestigate(event, io)` - AI-driven comprehensive security analysis
- `monitorSecurityEvents(io)` - Real-time monitoring of security events
- `getAttackers(websiteId)` - Get all recorded attackers
- `getAttackerDetail(ip, websiteId)` - Get detailed attacker information
- `manualBlockIP(websiteId, ip, reason, userId)` - Admin manual IP block
- `getGuardianStats(websiteId)` - Dashboard statistics

#### 2. `backend/src/services/aiReports.js`
**Features:**
- **Comprehensive AI Reports**: A-Z security analysis for complete insights
- **PDF Generation**: HTML content for PDF rendering with download option
- **Time Period Options**: Last 7 Days and Last 30 Days
- **Threat Analysis**: Detailed breakdown by severity, type, and attack vector

**Key Functions:**
- `generateReport(websiteId, period)` - Generate comprehensive security report
- `buildThreatAnalysis(threatBreakdown, days)` - Build threat analysis from data
- `generateAIGeneratedReport(websiteId, days, data)` - AI-powered analysis
- `generatePDFContent(report)` - Generate HTML for PDF rendering
- `getReports(websiteId, limit)` - Get all generated reports
- `getReportSummaries(websiteId, days)` - Get recent report summaries

### Backend Routes

#### 3. `backend/src/routes/reports.js`
**Updated with new endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports` | GET | List all reports |
| `/api/reports/generate` | POST | Generate comprehensive AI report |
| `/api/reports/pdf/:websiteId/:period` | GET | Get HTML for PDF preview |
| `/api/reports/summary/:websiteId/:days` | GET | Get summary statistics |
| `/api/reports/guardian/stats` | GET | Get AI Guardian statistics |
| `/api/reports/attackers` | GET | Get all attackers |
| `/api/reports/attacker/:ip` | GET | Get attacker details |
| `/api/reports/manual-block` | POST | Manual IP block by admin |
| `/api/reports/download/:websiteId/:period` | GET | Download report as HTML |

### Frontend

#### 4. `frontend/src/pages/SecurityReports.jsx`
**Features:**
- **AI Guardian Dashboard**: Real-time statistics on attackers and threats
- **Comprehensive Report View**: Full AI-generated security analysis
- **Attackers List**: View and manage blocked attackers
- **PDF Preview/Download**: Preview and download security reports
- **Auto-refresh**: Automatic report generation and updates
- **Responsive Design**: Tailwind CSS for clean UI

**UI Components:**
- Guardian stats cards (Total Attackers, Active, Blocked, Threats)
- Reports list with preview/download options
- Attackers list with threat levels and blocking options
- Detailed report panel with AI analysis
- PDF preview modal
- Attacker detail panel

### Cron Jobs

#### 5. `backend/src/cron/jobs.js`
**Updated with:**
```javascript
// Daily at 9:00 AM: AI Guardian daily summary
cron.schedule('0 9 * * *', async () => {
  // Generate daily reports for all active websites
});
```

## Features Implemented

### 1. AI Guardian Mode
- **Auto-investigation**: AI takes full control to analyze security events
- **Decision-making**: AI makes autonomous decisions based on threat scores
- **Auto-blocking**: Blocks IPs with threat scores >= 80% (configurable)
- **Escalation**: Critical threats are escalated to admins
- **Real-time monitoring**: Continuous monitoring of all security events

### 2. Comprehensive Security Reports
- **A-Z Analysis**: Complete security analysis with executive summary
- **Threat Assessment**: Detailed breakdown by severity and type
- **Attack Vector Analysis**: Identification of dangerous attack methods
- **MITRE ATT&CK Mapping**: Mapped attack techniques
- **Temporal Analysis**: When attacks are most frequent
- **Recommendations**: 5-7 actionable security recommendations
- **Compliance Status**: GDPR, PCI-DSS, HIPAA considerations

### 3. Attacker Tracking
- **IP Capture**: All attacker IPs from security events
- **Intel Integration**: AbuseIPDB, GreyNoise, VirusTotal, AlienVault OTX
- **Threat Scoring**: Multi-factor threat calculation
- **Attack Pattern Analysis**: Historical pattern detection
- **Manual Blocking**: Admin manual block capability

### 4. Time Period Options
- **Last 7 Days**: Quick overview of recent activity
- **Last 30 Days**: Comprehensive monthly analysis

## Database Tables

### New Tables Created

#### `attackers` Table
```sql
- id (BIGSERIAL)
- ip (VARCHAR)
- website_id (BIGINT)
- first_seen (TIMESTAMPTZ)
- last_seen (TIMESTAMPTZ)
- event_type (VARCHAR)
- severity (VARCHAR)
- payload (TEXT)
- mitre_technique (VARCHAR)
- intel (JSONB)
- status (VARCHAR)
- count (INTEGER)
```

#### `ai_decisions` Table
```sql
- id (BIGSERIAL)
- website_id (BIGINT)
- event_id (BIGINT)
- ip (VARCHAR)
- decision_type (VARCHAR)
- reasoning (TEXT)
- confidence_score (INTEGER)
- threat_score (INTEGER)
- threat_level (VARCHAR)
- attack_vector (TEXT)
- impact (TEXT)
- iocs (JSONB)
- mitigation_steps (JSONB)
- action_taken (BOOLEAN)
- action_result (TEXT)
- model_used (VARCHAR)
```

## Testing

### Backend Tests
```bash
cd backend
node test_reports.js
```
✅ All tests passed - AI responses and database queries working correctly

### Server Startup
```bash
cd backend
node src/server.js
```
✅ Server running on port 3000 with all routes loaded

## API Integration

### Groq/DeepSeek via OpenRouter
- **Model**: LLaMA-3.3-70b-Versatile
- **Endpoint**: `https://api.groq.com/openai/v1`
- **Usage**: AI analysis, report generation, threat assessment

### IP Intelligence
- **IP-API**: Geolocation data
- **AbuseIPDB**: Abuse confidence scores
- **GreyNoise**: Scanner detection
- **AlienVault OTX**: Pulse counts, malicious flags
- **URLScan**: Malicious scan detection
- **VirusTotal**: Malware detection

## Security Features

1. **Threat Score Calculation**
   - Base threat score from IP intel (30%)
   - Abuse confidence score (25%)
   - Total reports (20%)
   - Scanner detection (15%)
   - Event severity (10%)

2. **Auto-Blocking Threshold**
   - Default: 80% threat score
   - Configurable via assistant_settings

3. **Real-time Alerts**
   - WebSocket notifications
   - Email alerts for critical threats
   - Slack/Telegram integration

## Usage

### Generate Report
```bash
POST /api/reports/generate
Body: { "website_id": 1, "period": "7d" }
```

### View PDF
```bash
GET /api/reports/pdf/1/7d
```

### Download Report
```bash
GET /api/reports/download/1/7d
```

### Get Guardian Stats
```bash
GET /api/reports/guardian/stats
```

## Monitoring

### Cron Jobs
- **Every 6 hours**: DB health check
- **Daily at 2:00 AM**: Data cleanup (30-day retention)
- **Daily at 8:00 AM**: AI daily summary
- **Daily at 9:00 AM**: AI Guardian daily summary
- **Every 7 days**: IP intel cache refresh
- **Monthly**: Deep cleanup (90d+ events)

## Future Enhancements

1. **Real-time PDF Generation**: Live PDF updates for ongoing threats
2. **Automated Email Reports**: Scheduled email delivery of reports
3. **Custom Report Templates**: User-defined report formats
4. **API Rate Limiting**: Prevent abuse of report generation
5. **Advanced Analytics**: ML-based threat prediction

## Deployment Notes

1. Run SQL migration script: `CREATE_SECURITY_REPORTS_TABLES.sql`
2. Update environment variables with API keys
3. Test login with super admin credentials
4. Configure additional websites as needed

## Support

For issues or questions, contact: whitehatwolf22@gmail.com

---

**Last Updated**: July 2026
**Version**: 2.0
**Status**: ✅ Production Ready