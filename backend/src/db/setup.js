// ============================================
// Drishti Kavach — Database Setup Script
// Run this script to initialize the database
// ============================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const encryption = require('../utils/encryption');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  console.error('   Check your .env file in the backend folder');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedSuperAdmin() {
  console.log('\n👑 Seeding Super Admin account...');
  
  try {
    // Check if super admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email_hash', crypto.createHash('sha512').update('whitehatwolf22@gmail.com').digest('hex'))
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing admin:', checkError);
      return false;
    }
    
    if (existingAdmin) {
      console.log('  ⚠️  Super Admin already exists, skipping...');
      return true;
    }
    
    const defaultPassword = 'Coco@22/07/2001';
    const email = 'whitehatwolf22@gmail.com';
    
    // Generate salt for password
    const passwordSalt = crypto.randomBytes(32).toString('hex');
    
    // Create PBKDF2 hash (more secure than bcrypt for this use case)
    const passwordHash = crypto.pbkdf2Sync(
      defaultPassword,
      Buffer.from(passwordSalt, 'hex'),
      100000,
      64,
      'sha512'
    ).toString('hex');
    
    // Encrypt email
    const emailEncrypted = await encryption.encryptData(email);
    
    // Create email hash for lookup
    const emailHash = crypto.createHash('sha512').update(email).digest('hex');
    
    // Insert super admin with encrypted data
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        username: 'whitehatwolf',
        email_encrypted: emailEncrypted,
        email_hash: emailHash,
        password_hash: passwordHash,
        password_salt: passwordSalt,
        password_iterations: 100000,
        password_algorithm: 'pbkdf2-sha512',
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString(),
        storage_metadata: {
          encryption_enabled: true,
          last_password_update: new Date().toISOString(),
          security_level: 'maximum',
        },
      });
    
    if (insertError) {
      console.error('❌ Failed to seed super admin:', insertError);
      return false;
    }
    
    console.log('  ✅ Super Admin seeded successfully');
    console.log(`     Email: whitehatwolf22@gmail.com`);
    console.log(`     Password: ${defaultPassword}`);
    console.log('     ⚠️  Please change the password immediately after first login!');
    
    return true;
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    return false;
  }
}

async function seedFirstWebsite() {
  console.log('\n🌐 Seeding first website (Quick Kaam)...');
  
  try {
    // Check if website already exists
    const { data: existingWebsite, error: checkError } = await supabase
      .from('websites')
      .select('*')
      .eq('domain', 'quickkaam.in')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing website:', checkError);
      return false;
    }
    
    if (existingWebsite) {
      console.log('  ⚠️  Website already exists, skipping...');
      return true;
    }
    
    // Generate API key
    const apiKey = `dk_${crypto.randomBytes(24).toString('hex')}`;
    
    // Encrypt API key
    const apiKeyEncrypted = await encryption.encryptData(apiKey);
    
    // Create API key hash for lookup
    const apiKeyHash = crypto.createHash('sha512').update(apiKey).digest('hex');
    
    // Insert website with encrypted data
    const { error: insertError } = await supabase
      .from('websites')
      .insert({
        name: 'Quick Kaam Official Website',
        domain: 'quickkaam.in',
        status: 'active',
        api_key_encrypted: apiKeyEncrypted,
        api_key_hash: apiKeyHash,
        settings: {
          monitoring_enabled: true,
          ddos_protection_enabled: true,
          auto_block_enabled: true,
          report_recipients: ['whitehatwolf22@gmail.com'],
          alert_channels: ['email'],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        storage_metadata: {
          compression_enabled: true,
          encryption_enabled: true,
          last_optimized: new Date().toISOString(),
        },
      });
    
    if (insertError) {
      console.error('❌ Failed to seed website:', insertError);
      return false;
    }
    
    console.log('  ✅ Website seeded successfully');
    console.log(`     Name: Quick Kaam Official Website`);
    console.log(`     Domain: quickkaam.in`);
    console.log(`     API Key: ${apiKey}`);
    console.log(`     ⚠️  Save this API key for SDK integration!`);
    
    return true;
  } catch (error) {
    console.error('❌ Error seeding website:', error);
    return false;
  }
}

async function seedAdminAccounts() {
  console.log('\n👥 Seeding admin accounts...');
  
  const adminAccounts = [
    {
      username: 'admin1',
      email: 'admin1@quickkaam.in',
      password: 'Admin123!@#',
      role: 'admin',
    },
    {
      username: 'admin2',
      email: 'admin2@quickkaam.in',
      password: 'Admin456!@#',
      role: 'admin',
    },
  ];
  
  let successCount = 0;
  
  for (const admin of adminAccounts) {
    try {
      // Check if admin already exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('username', admin.username)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`  ❌ Error checking admin ${admin.email}:`, checkError.message);
        continue;
      }
      
      if (existingAdmin) {
        console.log(`  ⚠️  Admin ${admin.email} already exists, skipping...`);
        successCount++;
        continue;
      }
      
      // Generate salt for password
      const passwordSalt = crypto.randomBytes(32).toString('hex');
      
      // Create PBKDF2 hash
      const passwordHash = crypto.pbkdf2Sync(
        admin.password,
        Buffer.from(passwordSalt, 'hex'),
        100000,
        64,
        'sha512'
      ).toString('hex');
      
      // Insert admin
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username: admin.username,
          email_encrypted: await encryption.encryptData(admin.email),
          email_hash: crypto.createHash('sha512').update(admin.email).digest('hex'),
          password_hash: passwordHash,
          password_salt: passwordSalt,
          password_iterations: 100000,
          password_algorithm: 'pbkdf2-sha512',
          role: admin.role,
          is_active: true,
          created_at: new Date().toISOString(),
          storage_metadata: {
            encryption_enabled: true,
            last_password_update: new Date().toISOString(),
            security_level: 'standard',
          },
        });
      
      if (insertError) {
        console.error(`  ❌ Failed to seed admin ${admin.email}:`, insertError.message);
        continue;
      }
      
      console.log(`  ✅ Admin ${admin.email} seeded successfully`);
      console.log(`     Password: ${admin.password}`);
      successCount++;
      
    } catch (error) {
      console.error(`  ❌ Error seeding admin ${admin.email}:`, error.message);
    }
  }
  
  console.log(`\n  📊 Admin seeding summary: ${successCount}/${adminAccounts.length} successful`);
  return successCount > 0;
}

async function seedAssistantSettings() {
  console.log('\n🤖 Seeding Drishti AI settings...');
  
  const defaultSettings = [
    {
      setting_key: 'guardian_mode',
      setting_value: { enabled: true, auto_block_threshold: 80 },
    },
    {
      setting_key: 'auto_investigate',
      setting_value: { enabled: true, min_severity: 'medium' },
    },
    {
      setting_key: 'daily_summary_enabled',
      setting_value: { enabled: true, send_at: '08:00' },
    },
  ];
  
  let successCount = 0;
  
  for (const setting of defaultSettings) {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('assistant_settings')
        .select('setting_key')
        .eq('setting_key', setting.setting_key)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`  ❌ Error checking setting ${setting.setting_key}:`, checkError.message);
        continue;
      }
      
      if (existing) {
        console.log(`  ⚠️  Setting ${setting.setting_key} already exists, skipping...`);
        successCount++;
        continue;
      }
      
      const { error: insertError } = await supabase
        .from('assistant_settings')
        .insert({
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          created_at: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error(`  ❌ Failed to seed ${setting.setting_key}:`, insertError.message);
        continue;
      }
      
      console.log(`  ✅ ${setting.setting_key} seeded`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error seeding ${setting.setting_key}:`, error.message);
    }
  }
  
  console.log(`\n  🤖 AI settings summary: ${successCount}/${defaultSettings.length} successful`);
  return successCount > 0;
}

async function main() {
  console.log('\n🕉️  Drishti Kavach — Database Setup');
  console.log('============================================\n');
  
  try {
    // Seed data
    const superAdminSuccess = await seedSuperAdmin();
    const websiteSuccess = await seedFirstWebsite();
    const adminSuccess = await seedAdminAccounts();
    const settingsSuccess = await seedAssistantSettings();
    
    console.log('\n============================================');
    console.log('🎉 Database setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update environment variables with the generated API key');
    console.log('   2. Change default passwords immediately');
    console.log('   3. Test the login with super admin credentials');
    console.log('   4. Configure additional websites as needed');
    console.log('\nदृष्टिः रक्षति, रक्षा दृश्यते');
    console.log('"Vision protects, and protection is seen."\n');
    
  } catch (error) {
    console.error('❌ Fatal error during setup:', error);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  seedSuperAdmin,
  seedFirstWebsite,
  seedAdminAccounts,
};