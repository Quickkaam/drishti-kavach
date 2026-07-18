// ============================================
// Drishti Kavach — MITRE ATT&CK Routes
// दृष्टि कवच — Threat Framework Mapping
// ============================================

const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAuth } = require('../middleware/auth');

// Ordered MITRE ATT&CK tactic chain
const TACTIC_ORDER = [
  'Reconnaissance',
  'Resource Development',
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
];

// Helper: get website ID based on user role
function getWebsiteId(req) {
  const qId = req.query.website_id || req.body?.website_id;
  if (req.user.role === 'superadmin' && qId) return parseInt(qId);
  return req.user.website_id;
}

// ─── GET /api/mitre/matrix ────────────────────────────────────
router.get('/matrix', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req);

    // Fetch ALL master techniques (to show the full grid)
    const { data: allTechniques } = await supabase
      .from('mitre_techniques')
      .select('*')
      .order('tactic');

    // Fetch this website's detections
    const { data: mappings } = await supabase
      .from('website_mitre_mappings')
      .select('technique_id, count, last_seen, is_resolved')
      .eq('website_id', websiteId);

    // Build a lookup for detections
    const detectionMap = {};
    (mappings || []).forEach(m => {
      detectionMap[m.technique_id] = m;
    });

    // Build matrix grouped by tactic
    const matrix = {};
    TACTIC_ORDER.forEach(t => { matrix[t] = []; });

    (allTechniques || []).forEach(tech => {
      const detection = detectionMap[tech.technique_id];
      const tactic = tech.tactic || 'Unknown';
      if (!matrix[tactic]) matrix[tactic] = [];

      matrix[tactic].push({
        technique_id: tech.technique_id,
        name:         tech.technique_name,
        tactic:       tech.tactic,
        severity:     tech.severity,
        description:  tech.description,
        remediation:  tech.remediation,
        mitre_url:    tech.mitre_url,
        // Detection data (null if not detected)
        detected:     !!detection,
        count:        detection?.count || 0,
        last_seen:    detection?.last_seen || null,
        is_resolved:  detection?.is_resolved || false,
      });
    });

    // Summary stats
    const totalDetected  = Object.values(detectionMap).length;
    const totalResolved  = Object.values(detectionMap).filter(m => m.is_resolved).length;
    const criticalCount  = (allTechniques || [])
      .filter(t => t.severity === 'critical' && detectionMap[t.technique_id])
      .length;

    res.json({
      matrix,
      tactics:       TACTIC_ORDER,
      stats: {
        total_techniques: allTechniques?.length || 0,
        total_detected:   totalDetected,
        total_resolved:   totalResolved,
        critical_active:  criticalCount,
      },
    });
  } catch (err) {
    console.error('[MITRE MATRIX]', err.message);
    res.status(500).json({ error: 'Failed to fetch MITRE matrix' });
  }
});

// ─── GET /api/mitre/techniques ────────────────────────────────
router.get('/techniques', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req);
    const { severity, tactic, detected } = req.query;

    let query = supabase
      .from('mitre_techniques')
      .select(`
        *,
        website_mitre_mappings!left(
          count,
          last_seen,
          is_resolved,
          detected_at
        )
      `)
      .eq('website_mitre_mappings.website_id', websiteId);

    if (severity) query = query.eq('severity', severity);
    if (tactic)   query = query.eq('tactic', tactic);

    const { data: techniques } = await query;

    let result = (techniques || []).map(t => ({
      ...t,
      detection: t.website_mitre_mappings?.[0] || null,
      detected:  !!(t.website_mitre_mappings?.[0]),
    }));

    if (detected === 'true')  result = result.filter(t => t.detected);
    if (detected === 'false') result = result.filter(t => !t.detected);

    res.json(result);
  } catch (err) {
    console.error('[MITRE TECHNIQUES]', err.message);
    res.status(500).json({ error: 'Failed to fetch MITRE techniques' });
  }
});

// ─── GET /api/mitre/technique/:id ─────────────────────────────
router.get('/technique/:id', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req);

    const { data: technique } = await supabase
      .from('mitre_techniques')
      .select('*')
      .eq('technique_id', req.params.id)
      .single();

    if (!technique) return res.status(404).json({ error: 'Technique not found' });

    // Get detection for this website
    const { data: mapping } = await supabase
      .from('website_mitre_mappings')
      .select('*')
      .eq('website_id', websiteId)
      .eq('technique_id', req.params.id)
      .single();

    res.json({ ...technique, detection: mapping || null });
  } catch (err) {
    console.error('[MITRE TECHNIQUE DETAIL]', err.message);
    res.status(500).json({ error: 'Failed to fetch technique details' });
  }
});

// ─── GET /api/mitre/tactics ───────────────────────────────────
router.get('/tactics', requireAuth, async (req, res) => {
  res.json(TACTIC_ORDER);
});

// ─── POST /api/mitre/mark-resolved/:techniqueId ───────────────
router.post('/mark-resolved/:techniqueId', requireAuth, async (req, res) => {
  try {
    const websiteId = getWebsiteId(req);

    await supabase
      .from('website_mitre_mappings')
      .update({
        is_resolved:  true,
        resolved_at:  new Date().toISOString(),
        resolved_by:  req.user.username,
      })
      .eq('technique_id', req.params.techniqueId)
      .eq('website_id', websiteId);

    // Audit log
    await supabase.from('audit_logs').insert({
      admin_user: req.user.username,
      action:     'mitre_technique_resolved',
      target:     req.params.techniqueId,
      details:    { website_id: websiteId },
      ip_address: req.ip,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[MITRE RESOLVE]', err.message);
    res.status(500).json({ error: 'Failed to mark technique as resolved' });
  }
});

// ─── POST /api/mitre/detect ───────────────────────────────────
// Called internally by security service when a MITRE technique is detected
router.post('/detect', requireAuth, async (req, res) => {
  try {
    const { website_id, technique_id } = req.body;
    if (!website_id || !technique_id) return res.status(400).json({ error: 'Missing required fields' });

    // Upsert: increment count if exists, insert if new
    const { data: existing } = await supabase
      .from('website_mitre_mappings')
      .select('id, count')
      .eq('website_id', website_id)
      .eq('technique_id', technique_id)
      .single();

    if (existing) {
      await supabase
        .from('website_mitre_mappings')
        .update({ count: existing.count + 1, last_seen: new Date().toISOString(), is_resolved: false })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('website_mitre_mappings')
        .insert({ website_id, technique_id, count: 1, is_resolved: false });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[MITRE DETECT]', err.message);
    res.status(500).json({ error: 'Failed to record MITRE detection' });
  }
});

module.exports = router;
