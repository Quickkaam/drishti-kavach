// ============================================
// Drishti Kavach — Reset Super Admin Password
// ============================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = 'whitehatwolf22@gmail.com';
const newPassword = 'Coco@22/07/2001';

async function resetSuperAdmin() {
  console.log('\n🔄 Resetting super admin password...\n');
  console.log('   Email:', email);
  console.log('   New password:', newPassword);
  
  const emailHash = crypto.createHash('sha512').update(email).digest('hex');
  
  // Check if user exists
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email_hash', emailHash)
    .single();
  
  if (fetchError || !user) {
    console.error('❌ User not found in database');
    console.log('   Email hash:', emailHash);
    return false;
  }
  
  console.log('\n✅ User found:');
  console.log('   ID:', user.id);
  console.log('   Username:', user.username);
  console.log('   Is active:', user.is_active);
  console.log('   Role:', user.role);
  
  // Generate new salt and hash
  const passwordSalt = crypto.randomBytes(32).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(
    newPassword,
    Buffer.from(passwordSalt, 'hex'),
    100000,
    64,
    'sha512'
  ).toString('hex');
  
  console.log('\n🔄 Updating password in database...');
  
  const { error: updateError } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      password_salt: passwordSalt,
      password_iterations: 100000,
      password_algorithm: 'pbkdf2-sha512',
    })
    .eq('id', user.id);
  
  if (updateError) {
    console.error('❌ Failed to update password:', updateError.message);
    return false;
  }
  
  // Verify the new password
  const verifyHash = crypto.pbkdf2Sync(
    newPassword,
    Buffer.from(passwordSalt, 'hex'),
    100000,
    64,
    'sha512'
  ).toString('hex');
  
  if (verifyHash !== passwordHash) {
    console.error('❌ Password verification failed');
    return false;
  }
  
  console.log('\n✅ Password reset successfully!');
  console.log('   Verify with:', email, newPassword);
  
  return true;
}

resetSuperAdmin();
