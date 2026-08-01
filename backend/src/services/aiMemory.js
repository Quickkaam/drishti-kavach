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
 */
async function saveMemory(userId, memory) {
  // Ensure userId is a number
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  if (isNaN(userIdNum)) {
    console.error('[AI MEMORY] Invalid userId:', userId);
    throw new Error('Invalid user ID');
  }
  
  const { error } = await supabase.from('ai_memory').insert({
    user_id: userIdNum,
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
  const { data, error } = await supabase
    .from('ai_memory')
    .select('memory, created_at')
    .eq('user_id', userId)
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
  const { error } = await supabase
    .from('ai_memory')
    .delete()
    .eq('user_id', userId);
  if (error) console.error('[AI MEMORY] Failed to clear memories:', error.message);
}

module.exports = { extractMemory, saveMemory, getUserMemories, clearMemories };
