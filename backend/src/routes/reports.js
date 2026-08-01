// ============================================
// Drishti Kavach — Reports Routes
// ============================================

const express = require('express');
const supabase = require('../db/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateReport, generatePDFContent, getReports, getReportSummaries } = require('../services/aiReports');
const { getGuardianStats, getAttackers, getAttackerDetail, manualBlockIP } = require('../services/aiGuardian');

const router = express.Router();
router.use(requireAuth);

// GET /api/reports — List reports
router.get('/', async (req, res) => {
  try {
    const { website_id } = req.query;
    const { data } = await getReports(website_id || null, 50);
    res.json({ reports: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/reports/generate — Generate a comprehensive AI security report
router.post('/generate', requireRole('superadmin', 'admin', 'analyst'), async (req, res) => {
  try {
    const { website_id, period = '7d' } = req.body;
    const days = period === '30d' ? 30 : 7;

    const report = await generateReport(website_id, period);

    res.json({ 
      report, 
      period, 
      generated_at: new Date().toISOString(),
      message: 'Comprehensive AI security report generated successfully'
    });
  } catch (err) {
    console.error('[REPORTS GENERATE]', err.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/pdf — Get HTML for PDF generation
router.get('/pdf/:websiteId/:period', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { websiteId, period } = req.params;
    
    const report = await generateReport(websiteId, period);
    const html = generatePDFContent(report);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF content' });
  }
});

// GET /api/reports/summary/:websiteId/:days — Get summary statistics
router.get('/summary/:websiteId/:days', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { websiteId, days } = req.params;
    const summaries = await getReportSummaries(websiteId, parseInt(days));
    res.json({ summaries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch report summaries' });
  }
});

// GET /api/reports/guardian/stats — Get AI Guardian statistics
router.get('/guardian/stats', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { website_id } = req.query;
    const stats = await getGuardianStats(website_id || null);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guardian stats' });
  }
});

// GET /api/reports/attackers — Get all attackers
router.get('/attackers', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { website_id } = req.query;
    const attackers = await getAttackers(website_id || null);
    res.json({ attackers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attackers' });
  }
});

// GET /api/reports/attacker/:ip — Get attacker details
router.get('/attacker/:ip', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { ip } = req.params;
    const { website_id } = req.query;
    
    if (!website_id) {
      return res.status(400).json({ error: 'website_id is required' });
    }

    const attacker = await getAttackerDetail(ip, website_id);
    if (!attacker) {
      return res.status(404).json({ error: 'Attacker not found' });
    }

    res.json({ attacker });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attacker details' });
  }
});

// POST /api/reports/manual-block — Manual IP block by admin
router.post('/manual-block', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { ip, reason, website_id } = req.body;
    
    if (!ip || !website_id) {
      return res.status(400).json({ error: 'IP and website_id are required' });
    }

    const result = await manualBlockIP(website_id, ip, reason, req.user.id);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: result.message,
        blocked_by: req.user.username
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to block IP' });
  }
});

// GET /api/reports/download/:websiteId/:period — Download HTML for PDF
router.get('/download/:websiteId/:period', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const { websiteId, period } = req.params;
    
    const report = await generateReport(websiteId, period);
    const html = generatePDFContent(report);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="security-report-${websiteId}-${period}.html"`);
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate download' });
  }
});

module.exports = router;
