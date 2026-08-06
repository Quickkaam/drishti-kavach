require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTelegramChatId() {
  console.log('Fetching chat ID from Telegram...');
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not found');
    return;
  }
  
  try {
    // Get updates to find chat ID
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.ok && response.data.result.length > 0) {
      const update = response.data.result[0];
      const chat = update.message?.chat || update.channel_post?.chat;
      
      if (chat) {
        console.log(`\n✅ Chat ID found: ${chat.id}`);
        console.log(`Chat type: ${chat.type}`);
        console.log(`Chat username: ${chat.username || 'N/A'}`);
        console.log(`Chat title: ${chat.title || 'N/A'}`);
        
        // Update .env file
        console.log(`\nUpdate .env with: TELEGRAM_CHAT_ID=${chat.id}`);
      }
    } else {
      console.log('No messages found. Send a message to your bot first!');
      console.log(`Then run: curl https://api.telegram.org/bot${botToken}/getUpdates`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getTelegramChatId();
