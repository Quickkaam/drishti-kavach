# Drishti Kavach — Role-Based Notification System

## Overview

The notification system provides role-based notifications with multiple delivery channels:
- **In-App Notifications** — Real-time via WebSocket, displayed in notification bell
- **Email Notifications** — Sent via configured SMTP
- **Slack Notifications** — Via Slack webhook
- **Telegram Notifications** — Via Telegram bot

## User Roles & Notification Rules

| Role | Receives Notifications For |
|------|---------------------------|
| **superadmin** | ALL categories (security, ddos, login, system, ai, incidents, forms) |
| **admin** | Security, DDoS, Login, System, Incidents, AI |
| **analyst** | Security, Incidents, Forms |
| **viewer** | System announcements only |
| **client** | Security, Forms (own website only) |

## Notification Categories

| Category | Description |
|----------|-------------|
| `security` | Security events (SQLi, XSS, attacks) |
| `ddos` | DDoS attack alerts |
| `login` | User login events |
| `system` | System announcements |
| `ai` | AI assistant notifications |
| `incidents` | Incident management |
| `forms` | Form submission notifications |

## Severity Levels

| Level | Priority |
|-------|----------|
| `info` | 1 (lowest) |
| `low` | 2 |
| `medium` | 3 |
| `high` | 4 |
| `critical` | 5 (highest) |

## Setup Instructions

### 1. Create Database Tables

Run this SQL file in Supabase SQL Editor:
```
e:\Quick Kaam\Drishti Kavach\CREATE_NOTIFICATIONS.sql
```

### 2. Environment Variables

Add these to your `.env` file (optional for external notifications):
```env
# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Telegram Integration
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. Restart Backend

```bash
cd "e:\Quick Kaam\Drishti Kavach\backend"
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user's notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| POST | `/api/notifications/mark-read` | Mark single notification as read |
| POST | `/api/notifications/mark-all-read` | Mark all as read |
| GET | `/api/notifications/preferences` | Get notification preferences |
| PUT | `/api/notifications/preferences` | Update preferences |
| POST | `/api/notifications/test` | Send test notification (admin only) |
| DELETE | `/api/notifications/:id` | Delete a notification |

## Frontend Components

### Notification Bell
Located at: `frontend/src/components/ui/NotificationBell.jsx`
- Shows unread count badge
- Dropdown with recent notifications
- Mark as read functionality

### Notifications Page
Located at: `frontend/src/pages/Notifications.jsx`
- Full notification list with pagination
- Filter by type and read status
- User preference settings

## User Preferences

Each user can configure:
- **Category toggles** — Enable/disable per category
- **Channel toggles** — Enable/disable per channel (email, slack, telegram, in-app)
- **Severity thresholds** — Minimum severity for each channel
- **Quiet hours** — Time window when notifications are suppressed

## Integration Examples

### Send Login Notification
```javascript
const { notifyLogin } = require('./services/notifications');
await notifyLogin(user, ip, location);
```

### Send Security Alert
```javascript
const { notifySecurityEvent, SEVERITY } = require('./services/notifications');
await notifySecurityEvent({
  title: 'SQL Injection Attempt',
  message: 'Blocked SQL injection from IP 1.2.3.4',
  severity: SEVERITY.HIGH,
  websiteId: 1,
  eventId: 123
});
```

### Send DDoS Alert
```javascript
const { notifyDDoS, SEVERITY } = require('./services/notifications');
await notifyDDoS({
  title: 'DDoS Attack Detected',
  message: 'Traffic spike detected: 10x normal',
  severity: SEVERITY.CRITICAL,
  websiteId: 1,
  ddosId: 456
});
```

### Send Incident Notification
```javascript
const { notifyIncident, SEVERITY } = require('./services/notifications');
await notifyIncident({
  title: 'New Incident Assigned',
  message: 'SQL injection incident assigned to you',
  severity: SEVERITY.HIGH,
  incidentId: 789,
  assignTo: userId
});
```

### Send Form Submission Notification
```javascript
const { notifyFormSubmission } = require('./services/notifications');
await notifyFormSubmission(websiteId, formData);
```

## Real-Time Notifications

The system uses Socket.io for real-time notifications. When a notification is created, it's immediately pushed to the user's browser via WebSocket.

### Socket Events
- `notification` — New notification received
- `login_event` — New login event (admin only)

## Automatic Notifications

The system automatically sends notifications for:
1. **User login** — When any user logs in
2. **Security events** — When threats are detected
3. **DDoS attacks** — When attacks are detected
4. **Form submissions** — When forms are submitted

## Cleanup

Notifications are automatically cleaned up after 30 days via the `cleanupOldNotifications()` function. This can be scheduled via the cron jobs.