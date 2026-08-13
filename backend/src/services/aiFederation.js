// ============================================
// Drishti Kavach — Federated Intelligence Engine
// Handles cross-website threat sharing
// ============================================

const supabase = require('../db/supabase');

/**
 * Check if a website has a specific service enabled
 */
async function hasService(websiteId, serviceId) {
  const { data } = await supabase
    .from('client_services')
    .select('enabled')
    .eq('website_id', websiteId)
    .eq('service_id', serviceId)
    .single();
    
  return data ? data.enabled : false;
}

/**
 * Propagate a detected threat across all federated websites
 * @param {Object} threat - { ip, attack_type, payload, reasoning, confidence_score }
 * @param {Number} sourceWebsiteId - ID of the website where threat originated
 */
async function propagateThreat(threat, sourceWebsiteId) {
  try {
    console.log(`[FEDERATION] 🌐 Initiating threat propagation for IP: ${threat.ip}`);

    // 1. Store signature in federated_signatures table
    const { data: signature, error: sigError } = await supabase
      .from('federated_signatures')
      .insert({
        source_website_id: sourceWebsiteId,
        ip: threat.ip,
        attack_type: threat.attack_type || 'unknown',
        payload: threat.payload || null,
        confidence_score: threat.confidence_score || 100,
        reasoning: threat.reasoning
      })
      .select()
      .single();

    if (sigError) throw sigError;

    // 2. Get all active websites
    const { data: websites, error: webError } = await supabase
      .from('websites')
      .select('id, name')
      .eq('status', 'active');

    if (webError) throw webError;

    // 3. Propagate to other websites
    let propagatedCount = 0;
    
    for (const website of websites) {
      if (website.id === sourceWebsiteId) continue; // Skip source

      // Check if this website has federation enabled
      const isFederated = await hasService(website.id, 'federation');
      if (!isFederated) {
        console.log(`[FEDERATION] ⏭️ Skipping website ${website.id} (Federation not enabled)`);
        continue;
      }

      // Check if IP is already blocked for this website
      const { data: existingBlock } = await supabase
        .from('ip_block_list')
        .select('id')
        .eq('website_id', website.id)
        .eq('ip', threat.ip)
        .eq('is_active', true)
        .limit(1);

      if (existingBlock && existingBlock.length > 0) continue; // Already blocked

      // Pre-emptively block
      await supabase.from('ip_block_list').insert({
        website_id: website.id,
        ip: threat.ip,
        reason: `[FEDERATED] Global Threat Detected (Source: Website ${sourceWebsiteId}) - ${threat.reasoning}`,
        blocked_by: 'AI_FEDERATION',
        severity: 'high'
      });
      
      propagatedCount++;
    }

    console.log(`[FEDERATION] ✅ Successfully propagated threat to ${propagatedCount} websites.`);
    return { success: true, propagated_count: propagatedCount };

  } catch (error) {
    console.error('[FEDERATION ERROR]', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all active federated signatures
 */
async function getFederatedSignatures() {
  const { data, error } = await supabase
    .from('federated_signatures')
    .select('*, websites(name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) throw error;
  return data;
}

module.exports = {
  propagateThreat,
  getFederatedSignatures
};
