# Security Reports & AI Guardian Mode - Design

## Architecture

### Reports System
```
User Request → API Route → Data Aggregation → AI Analysis → PDF Generation → Response
```

### AI Guardian System
```
Security Event → Threat Assessment → Decision (Block/Investigate/Ignore) → Action
```

## Data Flow

### Report Generation
1. User selects time period
2. Backend aggregates data from:
   - `security_events` table
   - `ip_block_list` table
   - `events` table
   - `ddos_events` table
3. AI analyzes data and generates insights
4. PDF is generated with charts and tables
5. Preview and download options provided

### AI Guardian Flow
1. Security event detected
2. AI checks threat score from IP intel cache
3. If score > threshold: Auto-block
4. Otherwise: Log for investigation
5. Alert sent to admin channels
6. Daily summary generated

## UI Components

### Security Reports Page
- Header with title and date range selector
- Report preview area (PDF viewer)
- Download button
- Export options (CSV, JSON)

### AI Guardian Settings
- Toggle for auto-investigation
- Toggle for auto-blocking
- Threat score threshold slider
- Alert channel checkboxes

## Database Schema

### New Tables (if needed)
- No new tables needed - use existing tables

### Modified Queries
- Add aggregate queries for reports
- Add Guardian mode status tracking
