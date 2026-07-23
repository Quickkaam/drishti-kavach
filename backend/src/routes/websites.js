// ============================================
// Drishti Kavach — Websites (Multi-Tenant) Routes
// ============================================

const express = require('express');
const crypto = require('crypto');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, websiteSchema } = require('../middleware/validate');
const encryption = require('../utils/encryption');

const router = express.Router();
router.use(requireAuth);

const generateApiKey = () => `dk_${crypto.randomBytes(24).toString('hex')}`;

// GET /api/websites
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('websites')
      .select('*, clients(company_name)')
      .order('created_at', { ascending: false });
    res.json({ websites: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch websites' });
  }
});

// POST /api/websites — Add new website
router.post('/', requireRole('admin'), validate(websiteSchema), async (req, res) => {
  try {
    const { name, domain, client_id, settings } = req.body;
    const apiKey = generateApiKey();
    const apiKeyEncrypted = encryption.encryptData(apiKey);
    const apiKeyHash = encryption.hashData(apiKey);

    const { data, error } = await supabase
      .from('websites')
      .insert({ name, domain, client_id, api_key_encrypted: apiKeyEncrypted, api_key_hash: apiKeyHash, settings })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      admin_user: req.user.username,
      action: 'website_added',
      target: domain,
      details: { name },
      ip_address: req.ip,
    });

    res.status(201).json({ website: data, api_key: apiKey });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Domain already registered' });
    res.status(500).json({ error: 'Failed to add website' });
  }
});

// GET /api/websites/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('websites')
      .select('*, clients(company_name, contact_email)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Website not found' });
    res.json({ website: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch website' });
  }
});

// PATCH /api/websites/:id
router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { name, status, settings } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (status) updates.status = status;
    if (settings) updates.settings = settings;

    const { data, error } = await supabase
      .from('websites')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ website: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update website' });
  }
});

// DELETE /api/websites/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await supabase.from('websites').update({ status: 'inactive' }).eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove website' });
  }
});

// POST /api/websites/:id/regenerate-key
router.post('/:id/regenerate-key', requireRole('admin'), async (req, res) => {
  try {
    const newKey = generateApiKey();
    const apiKeyEncrypted = encryption.encryptData(newKey);
    const apiKeyHash = encryption.hashData(newKey);
    
    await supabase.from('websites').update({ api_key_encrypted: apiKeyEncrypted, api_key_hash: apiKeyHash }).eq('id', req.params.id);

    await supabase.from('audit_logs').insert({
      website_id: req.params.id,
      admin_user: req.user.username,
      action: 'api_key_regenerated',
      target: req.params.id,
      ip_address: req.ip,
    });

    res.json({ api_key: newKey });
  } catch (err) {
    res.status(500).json({ error: 'Failed to regenerate key' });
  }
});

// GET /api/websites/:id/snippet — SDK snippet
router.get('/:id/snippet', async (req, res) => {
  try {
    const { data: website } = await supabase
      .from('websites')
      .select('api_key_encrypted, domain, name, settings')
      .eq('id', req.params.id)
      .single();

    if (!website) return res.status(404).json({ error: 'Website not found' });

    let decryptedKey = '';
    if (website.api_key_encrypted) {
      try {
        decryptedKey = encryption.decryptData(website.api_key_encrypted);
      } catch (err) {
        console.error('Failed to decrypt API key for snippet:', err);
      }
    }

    const apiUrl = process.env.API_URL || 'https://your-api.onrender.com';
    const settings = website.settings || {};
    const hasGA = !!settings.ga_id;
    const hasSEO = !!settings.seo;

    let snippet = `<!-- Drishti Kavach SDK — दृष्टि कवच -->
<script>
(function(){
  const DK = { apiKey: '${decryptedKey}', api: '${apiUrl}/api/sdk' };
  function send(type, data) {
    if(!navigator.sendBeacon) return;
    navigator.sendBeacon(DK.api + '/log',
      JSON.stringify({ event_type: type, page_url: location.href, event_data: data, referrer: document.referrer }));
  }
  // Track page view
  send('page_view', { title: document.title });
  
  // Expose manual report function
  window.__dk_report = (type, level, payload) => fetch(DK.api + '/security', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': DK.apiKey },
    body: JSON.stringify({ type, level, payload, url: location.href })
  });`;

    if (hasSEO) {
      const seo = settings.seo;
      snippet += `\n
  // SEO Injection
  function setMeta(name, content, isProp) {
    if(!content) return;
    const attr = isProp ? 'property' : 'name';
    let el = document.querySelector(\`meta[\${attr}="\${name}"]\`);
    if(!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }
  if('${seo.title || ''}') document.title = '${(seo.title || '').replace(/'/g, "\\'")}';
  setMeta('description', '${(seo.description || '').replace(/'/g, "\\'")}', false);
  setMeta('keywords', '${(seo.keywords || '').replace(/'/g, "\\'")}', false);
  setMeta('google-site-verification', '${(seo.google_verify || '').replace(/'/g, "\\'")}', false);
  setMeta('og:title', '${(seo.title || '').replace(/'/g, "\\'")}', true);
  setMeta('og:description', '${(seo.description || '').replace(/'/g, "\\'")}', true);`;
    }

    if (hasGA) {
      snippet += `\n
  // Google Analytics Integration
  const gaId = '${settings.ga_id}';
  const gs = document.createElement('script');
  gs.async = true;
  gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
  document.head.appendChild(gs);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', gaId);`;
    }

    snippet += `\n})();\n</script>`;

    res.json({ snippet });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate snippet' });
  }
});

// GET /api/websites/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const websiteId = req.params.id;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: events },
      { count: threats },
      { count: blocked },
    ] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('website_id', websiteId).gte('timestamp', since24h),
      supabase.from('security_events').select('id', { count: 'exact', head: true }).eq('website_id', websiteId).gte('created_at', since24h),
      supabase.from('ip_block_list').select('id', { count: 'exact', head: true }).eq('website_id', websiteId).eq('is_active', true),
    ]);

    res.json({ events_24h: events, threats_24h: threats, blocked_ips: blocked });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── POST /api/websites/:id/upload ────────────────────────────
// AI-powered ZIP upload: inject tracking code → return modified ZIP
router.post('/:id/upload', requireRole('admin'), async (req, res) => {
  try {
    const websiteId = req.params.id;

    // Fetch website and its API key
    const { data: website, error } = await supabase
      .from('websites')
      .select('id, name, api_key_encrypted, domain')
      .eq('id', websiteId)
      .single();

    if (error || !website) return res.status(404).json({ error: 'Website not found' });
    if (!website.api_key_encrypted) return res.status(400).json({ error: 'Website has no API key. Regenerate key first.' });

    let decryptedKey = '';
    try {
      decryptedKey = encryption.decryptData(website.api_key_encrypted);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to decrypt API key' });
    }

    // Expect base64-encoded ZIP in body
    const { zipBase64 } = req.body;
    if (!zipBase64) return res.status(400).json({ error: 'Missing zipBase64 in request body' });

    const zipBuffer = Buffer.from(zipBase64, 'base64');
    if (zipBuffer.length === 0) return res.status(400).json({ error: 'Empty ZIP file' });
    if (zipBuffer.length > 52428800) return res.status(413).json({ error: 'ZIP file too large (max 50MB)' });

    // Process ZIP
    const ZipProcessor = require('../services/zipProcessor');
    const processor = new ZipProcessor(decryptedKey, websiteId);
    const result = await processor.process(zipBuffer);

    // Log integration
    await supabase.from('integration_logs').insert({
      website_id:        websiteId,
      method:            'zip_upload',
      files_processed:   result.filesProcessed,
      tracking_injected: result.filesInjected > 0,
      status:            'success',
      details:           { filesProcessed: result.filesProcessed, filesInjected: result.filesInjected },
    });

    // Audit log
    await supabase.from('audit_logs').insert({
      website_id:  websiteId,
      admin_user:  req.user.username,
      action:      'zip_upload',
      target:      website.domain,
      details:     { filesProcessed: result.filesProcessed, filesInjected: result.filesInjected },
      ip_address:  req.ip,
    });

    res.json({
      success:        true,
      filesProcessed: result.filesProcessed,
      filesInjected:  result.filesInjected,
      zipBase64:      result.zipBuffer.toString('base64'),
    });
  } catch (err) {
    console.error('[ZIP UPLOAD]', err.message);

    await supabase.from('integration_logs').insert({
      website_id:    parseInt(req.params.id),
      method:        'zip_upload',
      status:        'error',
      error_message: err.message,
    }).catch(() => {});

    res.status(500).json({ error: 'ZIP processing failed: ' + err.message });
  }
});

module.exports = router;

