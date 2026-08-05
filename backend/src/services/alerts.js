// ============================================
// Drishti Kavach — Alert Service
// Slack + Telegram + Database Logging
// ============================================

const axios = require('axios');
const { logSecurityEvent, logError: logErrorLog } = require('./logging');

const SEVERITY_EMOJI = {
  info: 'ℹ️',
  low: '🟡',
  medium: '🟠',
  high: '🔴',
  critical: '🚨',
  warning: '⚠️',
};

const SEVERITY_COLOR = {
  info: '#3498db',
  low: '#f1c40f',
  medium: '#e67e22',
  high: '#e74c3c',
  critical: '#c0392b',
  warning: '#f39c12',
};

/**
 * Send formatted alert to Slack with rich embed
 */
async function sendSlack({ title, message, severity = 'info', websiteId = null, attachments = [] }) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.log('[SLACK] Webhook URL not configured');
    return;
  }

  const emoji = SEVERITY_EMOJI[severity] || 'ℹ️';
  const color = SEVERITY_COLOR[severity] || '#3498db';
  const timestamp = new Date().toISOString();

  const payload = {
    username: 'Drishti Kavach',
    icon_emoji: ':shield:',
    attachments: [
      {
        fallback: `${emoji} ${title}`,
        color: color,
        title: `${emoji} ${title}`,
        text: message || 'No additional details',
        fields: [
          {
            title: 'Severity',
            value: severity.toUpperCase(),
            short: true
          },
          websiteId ? {
            title: 'Website ID',
            value: String(websiteId),
            short: true
          } : null,
          {
            title: 'Timestamp',
            value: timestamp,
            short: true
          }
        ].filter(Boolean),
        footer: 'Drishti Kavach SOC',
        footer_icon: 'https://drishtikavach.in/logo.png',
        ts: Math.floor(new Date().getTime() / 1000)
      }
    ]
  };

  // Add custom attachments if provided
  if (attachments && attachments.length > 0) {
    payload.attachments = [...payload.attachments, ...attachments];
  }

  try {
    const response = await axios.post(process.env.SLACK_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('[SLACK] Alert sent successfully', response.status);
  } catch (err) {
    console.error('[SLACK ERROR]', err.message);
    if (err.response?.data) {
      console.error('[SLACK Response]', err.response.data);
    }
    await logErrorLog({ 
      message: 'Failed to send Slack alert', 
      context: { 
        error: err.message,
        title,
        severity,
        websiteId 
      } 
    });
  }
}

/**
 * Send formatted alert to Telegram with markdown
 */
async function sendTelegram({ title, message, severity = 'info', websiteId = null, attachments = [] }) {
  console.log('[TELEGRAM] Checking configuration...');
  console.log('[TELEGRAM] BOT_TOKEN configured:', !!process.env.TELEGRAM_BOT_TOKEN);
  console.log('[TELEGRAM] CHAT_ID configured:', !!process.env.TELEGRAM_CHAT_ID);
  
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('[TELEGRAM] Bot token not configured, skipping');
    return;
  }
  
  // Use TELEGRAM_CHAT_ID if set, otherwise use default
  const chatId = process.env.TELEGRAM_CHAT_ID || '@White_wolf227';
  console.log('[TELEGRAM] Chat ID:', chatId);

  const emoji = SEVERITY_EMOJI[severity] || 'ℹ️';
  const timestamp = new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Build message with proper markdown formatting
  let markdown = `*${emoji} ${title}*\n`;
  
  if (message) {
    markdown += `\n${message}`;
  }

  // Add severity badge
  markdown += `\n\n*Severity:* \`${severity.toUpperCase()}\``;

  // Add website ID
  if (websiteId) {
    markdown += `\n*Website ID:* \`${websiteId}\``;
  }

  // Add timestamp
  markdown += `\n\n*${timestamp}*\n`;
  markdown += `_Drishti Kavach SOC_`;

  // Add attachments if provided (for images, files, etc.)
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (attachment.url) {
        markdown += `\n\n[📎 ${attachment.title || 'Attachment'}](${attachment.url})`;
      }
    }
  }

  const maxLength = 4096; // Telegram message length limit
  if (markdown.length > maxLength) {
    markdown = markdown.substring(0, maxLength - 100) + `\n\n..._message truncated_`;
  }

  console.log('[TELEGRAM] Sending message:', markdown.substring(0, 100) + '...');
  
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: markdown,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        disable_notification: severity !== 'critical' && severity !== 'high'
      },
      {
        timeout: 15000
      }
    );
    console.log('[TELEGRAM] Alert sent successfully', response.data.ok);
  } catch (err) {
    console.error('[TELEGRAM ERROR]', err.message);
    if (err.response?.data) {
      console.error('[TELEGRAM Response]', err.response.data);
    }
    await logErrorLog({ 
      message: 'Failed to send Telegram alert', 
      context: { 
        error: err.message,
        title,
        severity,
        websiteId,
        chatId 
      } 
    });
  }
}

/**
 * Send alert with full formatting to all configured channels
 */
async function sendAlert({ title, message, severity = 'info', websiteId = null, attachments = [] }) {
  const emoji = SEVERITY_EMOJI[severity] || 'ℹ️';
  const text = `${emoji} *${title}*\n${message}`;

  // Log to database
  await logSecurityEvent({
    type: 'alert',
    severity,
    description: title,
    websiteId,
    data: { message, timestamp: new Date().toISOString(), severity }
  }).catch(err => console.error('[ALERT LOG ERROR]', err));

  // Send to all configured channels in parallel
  await Promise.allSettled([
    sendSlack({ title, message, severity, websiteId, attachments }),
    sendTelegram({ title, message, severity, websiteId, attachments }),
  ]);
}

/**
 * Send critical alert (to all channels regardless of settings)
 */
async function sendCriticalAlert({ title, message, websiteId = null }) {
  console.warn(`[CRITICAL ALERT] ${title}: ${message.substring(0, 100)}...`);
  
  await Promise.allSettled([
    sendSlack({
      title: `🚨 ${title}`,
      message: `*CRITICAL:* ${message}`,
      severity: 'critical',
      websiteId
    }),
    sendTelegram({
      title: `🚨 ${title}`,
      message: `*CRITICAL ALERT* 🔔\n\n${message}`,
      severity: 'critical',
      websiteId
    })
  ]);
}

/**
 * Send security event alert with detailed information
 */
async function sendSecurityAlert({ 
  title, 
  message, 
  severity = 'info', 
  websiteId = null, 
  eventId = null,
  ip = null,
  eventType = null
}) {
  const attachments = [];

  if (ip || eventType) {
    const fields = [];
    if (ip) fields.push({ title: 'Source IP', value: `\`${ip}\``, short: true });
    if (eventType) fields.push({ title: 'Event Type', value: eventType, short: true });
    if (eventId) fields.push({ title: 'Event ID', value: `\`${eventId}\``, short: true });

    attachments.push({
      color: SEVERITY_COLOR[severity] || '#3498db',
      title: 'Details',
      fields,
      footer: 'Security Event',
      footer_icon: 'https://drishtikavach.in/logo.png'
    });
  }

  return sendAlert({ title, message, severity, websiteId, attachments });
}

/**
 * Send DDoS alert with attack details
 */
async function sendDdosAlert({ 
  title, 
  message, 
  severity = 'info', 
  websiteId = null,
  attackType = null,
  affectedIp = null,
  attackStats = {}
}) {
  const attachments = [];

  const fields = [];
  if (attackType) fields.push({ title: 'Attack Type', value: attackType, short: true });
  if (affectedIp) fields.push({ title: 'Affected IP', value: `\`${affectedIp}\``, short: true });

  if (Object.keys(attackStats).length > 0) {
    fields.push({
      title: 'Attack Statistics',
      value: Object.entries(attackStats).map(([k, v]) => `${k}: ${v}`).join('\n'),
      short: false
    });
  }

  if (fields.length > 0) {
    attachments.push({
      color: SEVERITY_COLOR[severity] || '#3498db',
      title: 'Attack Details',
      fields,
      footer: 'DDoS Alert',
      footer_icon: 'https://drishtikavach.in/logo.png'
    });
  }

  return sendAlert({ title, message, severity, websiteId, attachments });
}

/**
 * Send form submission alert
 */
async function sendFormAlert({ 
  title, 
  message, 
  severity = 'info', 
  websiteId = null,
  formType = null,
  email = null,
  formData = {}
}) {
  const attachments = [];

  const fields = [];
  if (formType) fields.push({ title: 'Form Type', value: formType, short: true });
  if (email) fields.push({ title: 'Submitter Email', value: email, short: true });

  if (Object.keys(formData).length > 0) {
    const dataPreview = JSON.stringify(formData).substring(0, 500);
    fields.push({
      title: 'Form Data',
      value: `\`\`\`${dataPreview}\`\`\``,
      short: false
    });
  }

  if (fields.length > 0) {
    attachments.push({
      color: SEVERITY_COLOR[severity] || '#3498db',
      title: 'Submission Details',
      fields,
      footer: 'Form Submission',
      footer_icon: 'https://drishtikavach.in/logo.png'
    });
  }

  return sendAlert({ title, message, severity, websiteId, attachments });
}

/**
 * Send login alert with geolocation
 */
async function sendLoginAlert({ 
  title, 
  message, 
  severity = 'info', 
  websiteId = null,
  username = null,
  email = null,
  ip = null,
  location = {}
}) {
  const attachments = [];

  const fields = [];
  if (username) fields.push({ title: 'Username', value: username, short: true });
  if (email) fields.push({ title: 'Email', value: email, short: true });
  if (ip) fields.push({ title: 'IP Address', value: `\`${ip}\``, short: true });

  if (location && (location.country || location.city)) {
    const locationStr = `${location.city || 'Unknown'}, ${location.country || 'Unknown'}`;
    fields.push({ title: 'Location', value: locationStr, short: true });
  }

  if (fields.length > 0) {
    attachments.push({
      color: SEVERITY_COLOR[severity] || '#3498db',
      title: 'Login Details',
      fields,
      footer: 'Authentication Alert',
      footer_icon: 'https://drishtikavach.in/logo.png'
    });
  }

  return sendAlert({ title, message, severity, websiteId, attachments });
}

module.exports = {
  sendAlert,
  sendSlack,
  sendTelegram,
  sendCriticalAlert,
  sendSecurityAlert,
  sendDdosAlert,
  sendFormAlert,
  sendLoginAlert,
  SEVERITY_EMOJI,
  SEVERITY_COLOR
};
/**
 * Test alert to verify Slack and Telegram are working
 */
async function testAlerts() {
  console.log('[TEST ALERTS] Sending test alerts...');

  const testMessage = `*🔔 Drishti Kavach Test Alert*\n\nThis is a test to verify Slack and Telegram alerts are working properly.\n\n*Status:* 🟢 Working\n*Timestamp:* ${new Date().toISOString()}`;

  await Promise.allSettled([
    sendSlack({
      title: '🔔 Drishti Kavach Test Alert',
      message: 'This is a test to verify Slack alerts are working properly. Status: Working',
      severity: 'info'
    }),
    sendTelegram({
      title: '🔔 Drishti Kavach Test Alert',
      message: 'This is a test to verify Telegram alerts are working properly.\n\n*Status:* Working',
      severity: 'info'
    })
  ]);

  console.log('[TEST ALERTS] Test alerts sent');
}

module.exports = {
  sendAlert,
  sendSlack,
  sendTelegram,
  sendCriticalAlert,
  sendSecurityAlert,
  sendDdosAlert,
  sendFormAlert,
  sendLoginAlert,
  testAlerts,
  SEVERITY_EMOJI,
  SEVERITY_COLOR
};