const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getFederatedSignatures } = require('../services/aiFederation');

const router = express.Router();

// Only superadmin or admin can view global threat map/signatures
router.use(requireAuth);
router.use(requireRole('superadmin', 'admin', 'analyst'));

// GET /api/federation/signatures
router.get('/signatures', async (req, res) => {
  try {
    const signatures = await getFederatedSignatures();
    res.json({ success: true, signatures });
  } catch (error) {
    console.error('[FEDERATION ROUTE ERROR]', error.message);
    res.status(500).json({ error: 'Failed to fetch federated signatures' });
  }
});

module.exports = router;
