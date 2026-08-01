// ============================================
// Drishti Kavach — AI Memory Service
// Persistent per-user memory for Drishti AI
// "Keep in mind..." → stored → recalled forever
// ============================================

const supabase = require('../db/supabase');

// Phrases that trigger a memory save
const MEMORY_TRIGGERS = [
  /^keep in mind[:\s]+(.+)/i,
  /^remember[:\s]+(.+)/i,
  /^always remember[:\s]+(.+)/i,
  /^note[:\s]+(.+)/i,
  /^save this[:\s]+(.+)/i,
  /^don['']t forget[:\s]+(.+)/i,
  /^important[:\s]+(.+)/i,
  /^fyi[:\s]+(.+)/i,
];

/**
 * Checks if the user's message is a "keep in mind" type command.
 * Returns the memory string to save, or null if not a memory command.
 */
function extractMemory(question) {
  for (const pattern of MEMORY_TRIGGERS) {
    const match = question.trim().match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Saves a memory entry for a specific user.
 * Converts user_id from BIGINT to UUID format for the ai_memory table.
 */
async function saveMemory(userId, memory) {
  // The ai_memory table uses UUID for user_id
  // We convert BIGINT userId to UUID format: 00000000-0000-5000-8000-000000000001
  // The last 4 digits encode the user_id (1 becomes 0001 in hex)
  
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  if (isNaN(userIdNum)) {
    console.error('[AI MEMORY] Invalid userId:', userId);
    throw new Error('Invalid user ID');
  }
  
  // Convert user_id to UUID format
  // Format: 00000000-0000-5000-8000-000000000001 for user_id=1
  const userUUID = `00000000-0000-5000-8000-${userIdNum.toString(16).padStart(12, '0')}`;
  
  console.log('[AI MEMORY] Saving memory with user_id:', userUUID);
  
  const { error } = await supabase.from('ai_memory').insert({
    user_id: userUUID,
    memory,
  });
  if (error) {
    console.error('[AI MEMORY] Failed to save memory:', error.message);
    throw error;
  }
  console.log('[AI MEMORY] Saved:', memory.substring(0, 60));
}

/**
 * Retrieves all memories for a specific user.
 * Returns them as a formatted string ready for context injection.
 */
async function getUserMemories(userId) {
  // Convert user_id to UUID format
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  const userUUID = userIdNum ? `00000000-0000-5000-8000-${userIdNum.toString(16).padStart(12, '0')}` : null;
  
  if (!userUUID) {
    console.error('[AI MEMORY] Invalid userId for query:', userId);
    return '';
  }
  
  const { data, error } = await supabase
    .from('ai_memory')
    .select('memory, created_at')
    .eq('user_id', userUUID)
    .order('created_at', { ascending: false })
    .limit(30); // Keep last 30 memories

  if (error) {
    console.error('[AI MEMORY] Failed to fetch memories:', error.message);
    return '';
  }

  if (!data || data.length === 0) return '';

  const lines = data.map((m, i) => `${i + 1}. ${m.memory}`).join('\n');
  return `[USER PERSISTENT MEMORY — Always apply these when answering]\n${lines}`;
}

/**
 * Deletes all memories for a user (reset command).
 */
async function clearMemories(userId) {
  // Convert user_id to UUID format
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  const userUUID = userIdNum ? `00000000-0000-5000-8000-${userIdNum.toString(16).padStart(12, '0')}` : null;
  
  if (!userUUID) {
    console.error('[AI MEMORY] Invalid userId for clear:', userId);
    return;
  }
  
  const { error } = await supabase
    .from('ai_memory')
    .delete()
    .eq('user_id', userUUID);
  if (error) console.error('[AI MEMORY] Failed to clear memories:', error.message);
}

module.exports = { extractMemory, saveMemory, getUserMemories, clearMemories };
