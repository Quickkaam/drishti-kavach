# Security Reports & AI Guardian Mode - Tasks

## Phase 1: Backend Implementation

### 1. Reports API Routes
- [ ] Create `/api/reports/ai` endpoint for AI-generated reports
- [ ] Create `/api/reports/preview` endpoint for PDF preview
- [ ] Create `/api/reports/download` endpoint for PDF download
- [ ] Support time period parameters (7d, 30d)

### 2. AI Guardian Service
- [ ] Create `aiGuardian.js` service
- [ ] Auto-investigate security events (threshold-based)
- [ ] Auto-block IPs with threat score > 80
- [ ] Generate daily summaries (scheduled task)
- [ ] Alert notifications (Slack, Telegram, Email)

### 3. IP Management
- [ ] Capture attacker IPs from all security events
- [ ] Auto-blocking based on threat intelligence
- [ ] IP reputation checking (AbuseIPDB, GreyNoise)
- [ ] Whitelist/Blacklist management

## Phase 2: Frontend Implementation

### 1. Security Reports Page
- [ ] Create `SecurityReports.jsx` page
- [ ] Time period selector (7 days, 30 days)
- [ ] Report preview (PDF viewer)
- [ ] Download button
- [ ] Report date range filters

### 2. AI Guardian Status
- [ ] AI Guardian status indicator
- [ ] Auto-investigation toggle
- [ ] Auto-blocking toggle
- [ ] Alert channel preferences

## Phase 3: Testing & Deployment
- [ ] Test report generation
- [ ] Test AI Guardian mode
- [ ] Test IP capture & blocking
- [ ] Deploy to production
- [ ] Document the new features
