// ============================================
// Drishti Kavach — Email Service
// Secure server-side email sending
// ============================================

const axios = require('axios');

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;

/**
 * Send email via EmailJS
 * @param {string} toEmail - Recipient email
 * @param {string} subject - Email subject
 * @param {object} templateParams - Email template parameters
 * @returns {Promise} EmailJS response
 */
async function sendEmail(toEmail, subject, templateParams) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.warn('[EMAIL] EmailJS not configured - emails will be logged only');
    console.log('[EMAIL] Would send to:', toEmail);
    console.log('[EMAIL] Subject:', subject);
    console.log('[EMAIL] Params:', templateParams);
    return { success: true, message: 'EmailJS not configured - logged to console' };
  }

  try {
    const response = await axios.post(
      'https://api.emailjs.com/api/v1.0/email/send-form',
      {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          subject: subject,
          ...templateParams,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification alert to Slack
 * @param {string} message - Alert message
 * @param {string} channel - Slack channel (optional)
 * @returns {Promise} Slack response
 */
async function sendSlackAlert(message, channel = '#security-alerts') {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[SLACK] Webhook not configured - alerts will be logged only');
    console.log('[SLACK] Alert:', message);
    return { success: true, message: 'Webhook not configured' };
  }

  try {
    const response = await axios.post(
      webhookUrl,
      {
        text: `*Drishti Kavach Alert* ${channel}\n\n${message}`,
        channel: channel,
        username: 'Drishti Kavach Bot',
        icon_emoji: '🛡️',
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[SLACK] Error sending alert:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to Telegram
 * @param {string} message - Alert message
 * @returns {Promise} Telegram response
 */
async function sendTelegramAlert(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('[TELEGRAM] Bot not configured - alerts will be logged only');
    console.log('[TELEGRAM] Alert:', message);
    return { success: true, message: 'Bot not configured' };
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: `*Drishti Kavach Alert* 🛡️\n\n${message}`,
        parse_mode: 'Markdown',
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[TELEGRAM] Error sending alert:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send email via EmailJS proxy endpoint
 * @param {object} params - Email parameters
 * @returns {Promise} EmailJS response
 */
async function sendEmailViaProxy(params) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    return { success: false, error: 'EmailJS not configured' };
  }

  try {
    const response = await axios.post(
      'https://api.emailjs.com/api/v1.0/email/send-form',
      {
        service_id: EMAILJS_SERVICE_ID,
        template_id: params.template_id || EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: params.template_params,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[EMAIL PROXY] Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  sendSlackAlert,
  sendTelegramAlert,
  sendEmailViaProxy,
};
