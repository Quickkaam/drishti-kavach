// Fix email_encrypted field for user lunaphoenix009@gmail.com
// The format was incorrect - it used {encrypted_data, encryption_method} instead of {data, iv, authTag, algorithm}

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = 'lunaphoenix009@gmail.com';
const emailHash = crypto.createHash('sha512').update(email).digest('hex');

async function fixEmailEncrypted() {
  // Get the encryption key
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'drishti-kavach-encryption-key-2024';
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest().slice(0, 32);
  
  // Create new encrypted data with correct format
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(email, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  
  const emailEncrypted = {
    data: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: 'aes-256-gcm',
  };
  
  const { error } = await supabase
    .from('users')
    .update({
      email_encrypted: emailEncrypted,
    })
    .eq('email_hash', emailHash);
  
  if (error) {
    console.error('Error fixing email_encrypted:', error.message);
    process.exit(1);
  }
  
  console.log('email_encrypted field fixed for user:', email);
}

fixEmailEncrypted();
