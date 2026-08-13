// ============================================
// Drishti Kavach — AI Actions Service
// Handles executing and rolling back autonomous AI decisions
// Training Mode, Audit Logging, Risk-Based Alerts
// ============================================

const supabase = require('../db/supabase');
const { sendAlert } = require('./alerts');

/**
 * Check if Training Mode is enabled
 */
const isTrainingMode = async () => {
  try {
    const { data } = await supabase
      .from('assistant_settings')
      .select('setting_value')
      .eq('setting_key', 'training_mode')
      .single();
    return data?.setting_value?.enabled === true;
  } catch {
    return false;
  }
};

/**
 * Log to audit_logs for SOC 2 compliance
 */
const logAudit = async ({ website_id, admin_user, action, target, details, ip_address }) => {
  try {
    await supabase.from('audit_logs').insert({
      website_id,
      admin_user: admin_user || 'AI_SYSTEM',
      action,
      target,
      details,
      ip_address: ip_address || '0.0.0.0'
    });
  } catch (err) {
    console.error('[AI AUDIT LOG] Failed:', err.message);
  }
};

/**
 * Execute an autonomous action decided by the AI
 * Respects Training Mode, Risk Levels, and Full Audit Trails
 * @param {Object} decision { website_id, event_id, ip, decision_type, reasoning, confidence_score, risk_level, model_used }
 */
const executeAiAction = async (decision) => {
  const {
    website_id,
    event_id,
    ip,
    decision_type,
    reasoning,
    confidence_score,
    risk_level,
    model_used
  } = decision;

  // ── TRAINING MODE CHECK ─────────────────────────────────────
  const trainingMode = await isTrainingMode();
  if (trainingMode) {
    console.log(`[AI TRAINING MODE] Suggested: ${decision_type} on ${ip} (confidence: ${confidence_score}%) — NOT EXECUTING`);

    const { data: loggedDecision } = await supabase
      .from('ai_decisions')
      .insert({
        website_id, event_id, ip, decision_type, reasoning,
        confidence_score, risk_level,
        status: 'suggested',
        action_result: '[TRAINING MODE] Action suggested but not executed',
        model_used
      })
      .select('*')
      .single();

    await logAudit({
      website_id,
      action: `AI_TRAINING_SUGGEST_${decision_type.toUpperCase()}`,
      target: ip,
      details: { decision_type, reasoning, confidence_score, risk_level, training_mode: true },
      ip_address: ip
    });

    return loggedDecision;
  }

  // ── RISK-BASED EXECUTION ────────────────────────────────────
  let status = 'pending';
  let action_result = 'Action queued for human approval';

  if (risk_level === 'low' || risk_level === 'medium') {
    // Auto-execute for low and medium risk
    status = 'executed';
    try {
      if (decision_type === 'block_ip') {
        await supabase.from('ip_block_list').insert({
          website_id, ip,
          reason: `[AI AUTO-BLOCK] ${reasoning}`,
          blocked_by: 'Drishti AI',
          severity: 'high',
          is_active: true
        });
        action_result = `Successfully auto-blocked IP: ${ip}`;

      } else if (decision_type === 'quarantine_ip') {
        await supabase.from('ip_block_list').insert({
          website_id, ip,
          reason: `[AI QUARANTINE] ${reasoning}`,
          blocked_by: 'Drishti AI',
          severity: 'medium',
          is_active: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        action_result = `Successfully quarantined IP: ${ip} for 24h`;

      } else if (decision_type === 'ignore' || decision_type === 'monitor') {
        status = 'executed';
        action_result = `Event flagged as ${decision_type} — no action taken`;

      } else {
        status = 'failed';
        action_result = `Unknown decision_type: ${decision_type}`;
      }
    } catch (err) {
      status = 'failed';
      action_result = `Execution failed: ${err.message}`;
    }
  }
  // High risk stays as 'pending' for HITL

  // ── LOG THE DECISION ────────────────────────────────────────
  let loggedDecision = null;
  try {
    // Try insert with risk_level column
    const { data, error } = await supabase
      .from('ai_decisions')
      .insert({
        website_id, event_id, ip, decision_type, reasoning,
        confidence_score, risk_level, status, action_result, model_used
      })
      .select('*')
      .single();
    
    if (error) {
      // Fallback: column might not exist yet in live DB
      console.warn('[AI ACTION] Insert with risk_level failed, trying without:', error.message);
      const { data: fallbackData } = await supabase
        .from('ai_decisions')
        .insert({
          website_id, event_id, ip, decision_type, reasoning,
          confidence_score, status, action_result, model_used
        })
        .select('*')
        .single();
      loggedDecision = fallbackData;
    } else {
      loggedDecision = data;
    }
  } catch (insertErr) {
    console.error('[AI ACTION] Failed to log decision:', insertErr.message);
  }

  // ── AUDIT LOG (SOC 2 Compliance) ────────────────────────────
  await logAudit({
    website_id,
    action: `AI_${decision_type.toUpperCase()}`,
    target: ip,
    details: { decision_type, reasoning, confidence_score, risk_level, action_result, status, decision_id: loggedDecision?.id },
    ip_address: ip
  });

  // ── MEDIUM RISK: Auto-execute + Alert All Channels ──────────
  if (risk_level === 'medium') {
    console.log(`[AI ACTION ALERT] Medium Risk Action: ${action_result}. Rollback ID: ${loggedDecision?.id}`);
    await sendAlert({
      title: '🤖 [AI AUTO-ACTION] Medium Risk',
      message: `**Action:** ${decision_type}\n**Target IP:** ${ip}\n**Reasoning:** ${reasoning}\n**Confidence:** ${confidence_score}%\n**Status:** ${status}\n**Rollback ID:** ${loggedDecision?.id}\n\n_This action was auto-executed. Use POST /api/ai/rollback/${loggedDecision?.id} to revert._`,
      severity: 'medium',
      websiteId: website_id
    }).catch(err => console.error('[AI MEDIUM ALERT]', err.message));
  }

  // ── HIGH RISK: Queue for Human Approval (HITL) ──────────────
  if (risk_level === 'high') {
    console.log(`[AI HITL] High Risk Action queued: ${decision_type} on ${ip}. Approval ID: ${loggedDecision?.id}`);
    await sendAlert({
      title: '⏳ [AI HITL] High Risk Action Needs Approval',
      message: `**Proposed Action:** ${decision_type}\n**Target IP:** ${ip}\n**Reasoning:** ${reasoning}\n**Confidence:** ${confidence_score}%\n**Decision ID:** ${loggedDecision?.id}\n\n_This action requires human approval. Use POST /api/ai/approve/${loggedDecision?.id} to approve, or POST /api/ai/rollback/${loggedDecision?.id} to dismiss._`,
      severity: 'high',
      websiteId: website_id
    }).catch(err => console.error('[AI HITL ALERT]', err.message));
  }

  return loggedDecision;
};

/**
 * Approve a pending (HITL) AI decision and execute it
 * @param {Number} decision_id The ID of the ai_decisions record
 * @param {String} approver The email/username of the admin approving
 */
const approveAiAction = async (decision_id, approver) => {
  // 1. Fetch the decision
  const { data: decision, error } = await supabase
    .from('ai_decisions')
    .select('*')
    .eq('id', decision_id)
    .single();

  if (error || !decision) throw new Error('Decision not found');
  if (decision.status !== 'pending') throw new Error(`Cannot approve decision with status: ${decision.status}`);

  // 2. Execute the action
  let action_result = '';
  try {
    if (decision.decision_type === 'block_ip') {
      await supabase.from('ip_block_list').insert({
        website_id: decision.website_id,
        ip: decision.ip,
        reason: `[AI BLOCK - HUMAN APPROVED by ${approver}] ${decision.reasoning}`,
        blocked_by: approver,
        severity: 'high',
        is_active: true
      });
      action_result = `IP ${decision.ip} blocked (approved by ${approver})`;

    } else if (decision.decision_type === 'quarantine_ip') {
      await supabase.from('ip_block_list').insert({
        website_id: decision.website_id,
        ip: decision.ip,
        reason: `[AI QUARANTINE - HUMAN APPROVED by ${approver}] ${decision.reasoning}`,
        blocked_by: approver,
        severity: 'medium',
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      action_result = `IP ${decision.ip} quarantined for 24h (approved by ${approver})`;

    } else {
      throw new Error(`Cannot execute decision_type: ${decision.decision_type}`);
    }
  } catch (err) {
    // Mark as failed
    await supabase.from('ai_decisions')
      .update({ status: 'failed', action_result: `Approval execution failed: ${err.message}` })
      .eq('id', decision_id);
    throw err;
  }

  // 3. Update decision status
  const { data: updatedDecision } = await supabase
    .from('ai_decisions')
    .update({
      status: 'executed',
      action_result,
      reverted_by: approver // reusing field to track who approved
    })
    .eq('id', decision_id)
    .select('*')
    .single();

  // 4. Audit log
  await logAudit({
    website_id: decision.website_id,
    admin_user: approver,
    action: `AI_APPROVE_${decision.decision_type.toUpperCase()}`,
    target: decision.ip,
    details: { decision_id, decision_type: decision.decision_type, approved_by: approver, action_result }
  });

  return updatedDecision;
};

/**
 * Rollback a previously executed AI action
 * @param {Number} decision_id The ID of the ai_decisions record
 * @param {String} user_email The email of the admin reverting the action
 */
const rollbackAiAction = async (decision_id, user_email) => {
  // 1. Fetch the decision
  const { data: decision, error } = await supabase
    .from('ai_decisions')
    .select('*')
    .eq('id', decision_id)
    .single();

  if (error || !decision) throw new Error('Decision not found');
  if (decision.status !== 'executed') throw new Error(`Cannot rollback decision with status: ${decision.status}`);

  // 2. Perform the reverse action
  if (decision.decision_type === 'block_ip' || decision.decision_type === 'quarantine_ip') {
    await supabase.from('ip_block_list')
      .update({
        is_active: false,
        unblocked_at: new Date().toISOString(),
        unblocked_by: user_email,
        unblock_reason: 'Rolled back AI auto-block'
      })
      .eq('website_id', decision.website_id)
      .eq('ip', decision.ip)
      .eq('is_active', true);
  } else {
    throw new Error(`Rollback not implemented for decision_type: ${decision.decision_type}`);
  }

  // 3. Mark the decision as reverted
  const { data: updatedDecision } = await supabase
    .from('ai_decisions')
    .update({
      status: 'reverted',
      reverted_by: user_email,
      reverted_at: new Date().toISOString(),
      action_result: `${decision.action_result} | [REVERTED by ${user_email}]`
    })
    .eq('id', decision_id)
    .select('*')
    .single();

  // 4. Audit log
  await logAudit({
    website_id: decision.website_id,
    admin_user: user_email,
    action: 'AI_ROLLBACK',
    target: decision.ip,
    details: { decision_id, decision_type: decision.decision_type, reverted_by: user_email, original_action: decision.action_result },
    ip_address: decision.ip
  });

  return updatedDecision;
};

module.exports = {
  executeAiAction,
  approveAiAction,
  rollbackAiAction,
  isTrainingMode,
  logAudit
};
