// ============================================
// Drishti Kavach — Reports API Routes
// ============================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../db/supabase');
const { requireAuth } = require('../middleware/auth');
const { generateReport, getReportData, exportReportAsText } = require('../services/aiReports');

const router = express.Router();

// GET /api/reports/status - Get AI report generation status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('domain', 'quickkaam.in')
      .single();

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const report = await getReportData(website.id, '30d');
    res.json({ status: 'ready', report: report.preview });
  } catch (err) {
    console.error('[REPORTS STATUS]', err.message);
    res.status(500).json({ error: 'Failed to get report status' });
  }
});

// GET /api/reports/generate - Generate new report
router.get('/generate', requireAuth, async (req, res) => {
  try {
    const { period = '30d', website_id: websiteIdQuery } = req.query;
    const periodValid = ['7d', '30d'].includes(period) ? period : '30d';

    // Get website_id from query or use default
    let websiteId = websiteIdQuery;
    if (!websiteId) {
      const { data: website } = await supabase
        .from('websites')
        .select('id')
        .eq('domain', 'quickkaam.in')
        .single();
      websiteId = website?.id;
    }

    if (!websiteId) {
      return res.status(400).json({ error: 'Website ID required' });
    }

    const report = await generateReport(websiteId, periodValid);
    res.json({ report, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[REPORTS GENERATE]', err.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/preview - Get report preview data
router.get('/preview', requireAuth, async (req, res) => {
  try {
    const { period = '30d', website_id: websiteIdQuery } = req.query;
    const periodValid = ['7d', '30d'].includes(period) ? period : '30d';

    // Get website_id from query or use default
    let websiteId = websiteIdQuery;
    if (!websiteId) {
      const { data: website } = await supabase
        .from('websites')
        .select('id')
        .eq('domain', 'quickkaam.in')
        .single();
      websiteId = website?.id;
    }

    if (!websiteId) {
      return res.status(400).json({ error: 'Website ID required' });
    }

    const report = await getReportData(websiteId, periodValid);
    res.json({ preview: report.preview });
  } catch (err) {
    console.error('[REPORTS PREVIEW]', err.message);
    res.status(500).json({ error: 'Failed to get report preview' });
  }
});

// GET /api/reports/download - Download report as text (for PDF generation)
router.get('/download', requireAuth, async (req, res) => {
  try {
    const { period = '30d', website_id: websiteIdQuery } = req.query;
    const periodValid = ['7d', '30d'].includes(period) ? period : '30d';

    // Get website_id from query or use default
    let websiteId = websiteIdQuery;
    if (!websiteId) {
      const { data: website } = await supabase
        .from('websites')
        .select('id')
        .eq('domain', 'quickkaam.in')
        .single();
      websiteId = website?.id;
    }

    if (!websiteId) {
      return res.status(400).json({ error: 'Website ID required' });
    }

    const textReport = await exportReportAsText(websiteId, periodValid);
    const timestamp = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="security-report-${timestamp}-${periodValid}.txt"`);
    res.send(textReport);
  } catch (err) {
    console.error('[REPORTS DOWNLOAD]', err.message);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

// GET /api/reports/full - Get complete report data
router.get('/full', requireAuth, async (req, res) => {
  try {
    const { period = '30d', website_id: websiteIdQuery } = req.query;
    const periodValid = ['7d', '30d'].includes(period) ? period : '30d';

    // Get website_id from query or use default
    let websiteId = websiteIdQuery;
    if (!websiteId) {
      const { data: website } = await supabase
        .from('websites')
        .select('id')
        .eq('domain', 'quickkaam.in')
        .single();
      websiteId = website?.id;
    }

    if (!websiteId) {
      return res.status(400).json({ error: 'Website ID required' });
    }

    const report = await generateReport(websiteId, periodValid);
    res.json({ report, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[REPORTS FULL]', err.message);
    res.status(500).json({ error: 'Failed to get full report' });
  }
});

module.exports = router;