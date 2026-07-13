// ============================================
// Drishti Kavach — Alert Service
// Slack + Telegram + Email
// ============================================

const axios = require('axios');
const nodemailer = require('nodemailer');

const SEVERITY_EMOJI = {
  info: 'ℹ️',
  low: '🟡',
  medium: '🟠',
  high: '🔴',
  critical: '🚨',
  warning: '⚠️',
};

async function sendAlert({ title, message, severity = 'info', data = {} }) {
  const emoji = SEVERITY_EMOJI[severity] || 'ℹ️';
  const text = `${emoji} *${title}*\n${message}`;

  // Send to all configured channels in parallel
  await Promise.allSettled([
    sendSlack(text),
    sendTelegram(text),
    severity === 'critical' ? sendEmail(title, message) : Promise.resolve(),
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

async function sendEmail(subject, html) {
  if (!process.env.SMTP_USER) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `🚨 Drishti Kavach: ${subject}`,
    html: `<h2>${subject}</h2><p>${html}</p>`,
  });
}

module.exports = { sendAlert, sendSlack, sendTelegram, sendEmail };
