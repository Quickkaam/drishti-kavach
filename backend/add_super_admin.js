// Add new super admin user
// Email: lunaphoenix009@gmail.com
// Password: Shinystar@121

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addSuperAdmin() {
  const email = 'lunaphoenix009@gmail.com';
  const password = 'Shinystar@121';
  const username = 'lunaphoenix009';
  
  const emailHash = require('crypto').createHash('sha512').update(email).digest('hex');
  const passwordHash = bcrypt.hashSync(password, 10);
  
  // First check if user exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id, email_hash, role')
    .eq('email_hash', emailHash)
    .single();
  
  if (existingUser) {
    console.log('User already exists. Updating role to superadmin...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'superadmin',
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('email_hash', emailHash);
    
    if (updateError) {
      console.error('Error updating user:', updateError.message);
      process.exit(1);
    }
    console.log('User role updated to superadmin!');
    console.log('User ID:', existingUser.id);
    console.log('Email:', email);
  } else {
    console.log('Creating new super admin user...');
    
    // For email_encrypted, store a simple encrypted version (just base64 encoded for now)
    const emailEncrypted = {
      encrypted_data: Buffer.from(email).toString('base64'),
      encryption_method: 'base64',
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        email_encrypted: emailEncrypted,
        email_hash: emailHash,
        password_hash: passwordHash,
        password_algorithm: 'bcrypt',
        password_salt: '',
        password_iterations: 0,
        is_active: true,
        role: 'superadmin',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding super admin:', error.message);
      console.error('Error details:', error);
      process.exit(1);
    }
    
    console.log('Super admin added successfully!');
    console.log('User ID:', data.id);
    console.log('Username:', data.username);
    console.log('Email:', email);
    console.log('Role:', data.role);
  }
}

addSuperAdmin();
