// ============================================
// Drishti Sentinel — Admin Service Provisioning Routes
// Super Admin: Manage client services
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getEnabledServices, checkService } = require('../middleware/serviceGuard');

const router = express.Router();

// GET /api/sentinel/clients — List all clients with their enabled services
router.get('/clients', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    // Get all clients (websites) with their enabled services
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('id, name, domain, settings')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (websitesError) {
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }

    // For each website, get enabled services
    const clients = await Promise.all(websites.map(async (website) => {
      const enabledServices = await getEnabledServices(website.id);
      return {
        ...website,
        enabled_services: enabledServices
      };
    }));

    res.json({ clients });
  } catch (err) {
    console.error('[SENTINEL CLIENTS]', err.message);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/sentinel/catalog — Get all services in catalog
router.get('/catalog', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { data: services, error } = await supabase
      .from('service_catalog')
      .select('*')
      .order('category', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch service catalog' });
    }

    // Group by category
    const grouped = {};
    services.forEach(service => {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push(service);
    });

    res.json({ services: grouped });
  } catch (err) {
    console.error('[SENTINEL CATALOG]', err.message);
    res.status(500).json({ error: 'Failed to fetch service catalog' });
  }
});

// POST /api/sentinel/toggle — Toggle service for a client
router.post('/toggle', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { website_id, service_id, enabled } = req.body;

    if (!website_id || !service_id || enabled === undefined) {
      return res.status(400).json({ error: 'website_id, service_id, and enabled are required' });
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('client_services')
      .select('id')
      .eq('website_id', website_id)
      .eq('service_id', service_id)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('client_services')
        .update({
          enabled,
          enabled_by: enabled ? req.user.username : null,
          enabled_at: enabled ? new Date().toISOString() : null,
          disabled_by: enabled ? null : req.user.username,
          disabled_at: enabled ? null : new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        return res.status(500).json({ error: 'Failed to update service' });
      }
    } else {
      // Insert new record
      const { error } = await supabase.insert('client_services', {
        website_id,
        service_id,
        enabled,
        enabled_by: enabled ? req.user.username : null,
        enabled_at: enabled ? new Date().toISOString() : null,
        disabled_by: enabled ? null : req.user.username,
        disabled_at: enabled ? null : new Date().toISOString()
      });

      if (error) {
        return res.status(500).json({ error: 'Failed to create service record' });
      }
    }

    // Log to audit log
    const { error: auditError } = await supabase.from('audit_logs').insert({
      admin_user: req.user.username,
      action: enabled ? 'SERVICE_ENABLED' : 'SERVICE_DISABLED',
      target: `website_id:${website_id}, service_id:${service_id}`,
      details: { service_id, enabled, changed_by: req.user.username }
    });

    if (auditError) {
      console.log('[SENTINEL AUDIT]', auditError.message);
    }

    res.json({ 
      success: true, 
      message: `Service ${service_id} ${enabled ? 'enabled' : 'disabled'}`,
      website_id,
      service_id,
      enabled
    });
  } catch (err) {
    console.error('[SENTINEL TOGGLE]', err.message);
    res.status(500).json({ error: 'Failed to toggle service' });
  }
});

// POST /api/sentinel/apply-tier — Apply starter/pro/enterprise tier
router.post('/apply-tier', requireRole('superadmin'), async (req, res) => {
  try {
    const { website_id, tier } = req.body;

    if (!website_id || !tier) {
      return res.status(400).json({ error: 'website_id and tier are required' });
    }

    const allowedTiers = ['starter', 'pro', 'enterprise'];
    if (!allowedTiers.includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be starter, pro, or enterprise' });
    }

    // Service defaults for each tier
    const tierDefaults = {
      starter: ['core_monitoring', 'ddos_protection', 'ai_assistant'],
      pro: ['core_monitoring', 'ddos_protection', 'ai_assistant', 'voice_assistant', 'vulnerability_scanner'],
      enterprise: ['core_monitoring', 'ddos_protection', 'ai_assistant', 'voice_assistant', 'dark_web_monitoring', 'attack_surface', 'compliance_pack', 'soar_runbooks', 'api_access']
    };

    const servicesToEnable = tierDefaults[tier];

    // First, disable all services
    await supabase
      .from('client_services')
      .update({ enabled: false, disabled_by: req.user.username, disabled_at: new Date().toISOString() })
      .eq('website_id', website_id);

    // Then enable tier-specific services
    const insertData = servicesToEnable.map(service_id => ({
      website_id,
      service_id,
      enabled: true,
      enabled_by: req.user.username,
      enabled_at: new Date().toISOString()
    }));

    await supabase.insert('client_services', insertData);

    // Log to audit log
    await supabase.from('audit_logs').insert({
      admin_user: req.user.username,
      action: 'TIER_APPLIED',
      target: `website_id:${website_id}, tier:${tier}`,
      details: { tier, services_enabled: servicesToEnable }
    });

    res.json({ 
      success: true, 
      message: `Tier ${tier} applied to website ${website_id}`,
      website_id,
      tier,
      services_enabled: servicesToEnable
    });
  } catch (err) {
    console.error('[SENTINEL APPLY-TIER]', err.message);
    res.status(500).json({ error: 'Failed to apply tier' });
  }
});

// GET /api/sentinel/client-services/:websiteId — Get services for a specific client
router.get('/client-services/:websiteId', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { websiteId } = req.params;

    const { data: services, error } = await supabase
      .from('client_services')
      .select(`
        service_id,
        enabled,
        enabled_by,
        enabled_at,
        disabled_by,
        disabled_at,
        updated_at,
        service_catalog!inner (service_id, display_name, description, category)
      `)
      .eq('website_id', websiteId)
      .order('service_catalog.category', { ascending: true })
      .order('service_catalog.display_name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch client services' });
    }

    res.json({ 
      website_id: websiteId,
      services: services.map(s => ({
        service_id: s.service_id,
        display_name: s.service_catalog?.display_name || s.service_id,
        description: s.service_catalog?.description || '',
        category: s.service_catalog?.category || '',
        enabled: s.enabled,
        enabled_by: s.enabled_by,
        enabled_at: s.enabled_at,
        disabled_by: s.disabled_by,
        disabled_at: s.disabled_at
      }))
    });
  } catch (err) {
    console.error('[SENTINEL CLIENT-SERVICES]', err.message);
    res.status(500).json({ error: 'Failed to fetch client services' });
  }
});

module.exports = router;
