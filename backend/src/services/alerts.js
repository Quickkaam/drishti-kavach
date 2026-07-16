// ============================================
// Drishti Kavach — Alert Service
// Slack + Telegram
// ============================================

const axios = require('axios');

const SEVERITY_EMOJI = {
  info: 'ℹ️',
  low: '🟡',
  medium: '🟠',
  high: '🔴',
  critical: '🚨',
  warning: '⚠️',
};

async function sendAlert({ title, message, severity = 'info' }) {
  const emoji = SEVERITY_EMOJI[severity] || 'ℹ️';
  const text = `${emoji} *${title}*\n${message}`;

  // Send to all configured channels in parallel
  await Promise.allSettled([
    sendSlack(text),
    sendTelegram(text),
  ]);
}

async function sendSlack(text) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text,
    username: 'Drishti Kavach',
    icon_emoji: ':shield:',
  });
}

async function sendTelegram(text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
    }
  );
}

module.exports = { sendAlert, sendSlack, sendTelegram };
