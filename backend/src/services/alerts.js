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

async function sendAlert({ title, message, severity = 'info', websiteId = null }) {
  const emoji = SEVERITY_EMOJI[severity] || 'ℹ️';
  const text = `${emoji} *${title}*\n${message}`;

  // Log to database
  await logSecurityEvent({
    type: 'alert',
    severity,
    description: title,
    websiteId,
    data: { message, timestamp: new Date().toISOString() }
  }).catch(err => console.error('[ALERT LOG ERROR]', err));

  // Send to all configured channels in parallel
  await Promise.allSettled([
    sendSlack(text),
    sendTelegram(text),
  ]);
}

async function sendSlack(text) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text,
      username: 'Drishti Kavach',
      icon_emoji: ':shield:',
    });
  } catch (err) {
    console.error('[SLACK ERROR]', err.message);
    await logErrorLog({ message: 'Failed to send Slack alert', context: { error: err.message } });
  }
}

async function sendTelegram(text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }
    );
  } catch (err) {
    console.error('[TELEGRAM ERROR]', err.message);
    await logErrorLog({ message: 'Failed to send Telegram alert', context: { error: err.message } });
  }
}

module.exports = { sendAlert, sendSlack, sendTelegram };
