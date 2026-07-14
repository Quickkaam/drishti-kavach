// ============================================
// Drishti Kavach — Encryption Utility
// AES-256-GCM encryption for sensitive data
// ============================================

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (key) {
    return crypto.createHash('sha256').update(key).digest().slice(0, KEY_LENGTH);
  }
  
  console.warn('⚠️  ENCRYPTION_KEY not set in .env - using fallback key');
  return crypto.createHash('sha256').update('drishti-kavach-encryption-key-2024').digest().slice(0, KEY_LENGTH);
}

function encryptData(data, options = {}) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  return {
    data: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: ALGORITHM,
  };
}

function decryptData(encryptedData, options = {}) {
  const key = getEncryptionKey();
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

function encryptString(data) {
  const encrypted = encryptData(data);
  return JSON.stringify(encrypted);
}

function decryptString(encryptedString) {
  const encryptedData = JSON.parse(encryptedString);
  const decrypted = decryptData(encryptedData);
  return decrypted.toString('utf8');
}

function hashData(data) {
  return crypto.createHash('sha512').update(data).digest('hex');
}

function isConfigured() {
  return !!process.env.ENCRYPTION_KEY;
}

module.exports = {
  encryptData,
  decryptData,
  encryptString,
  decryptString,
  hashData,
  isConfigured,
  ALGORITHM,
  IV_LENGTH,
  KEY_LENGTH,
  getEncryptionKey,
};