// ============================================
// Drishti Kavach — Input Validation Middleware
// ============================================

const { z } = require('zod');

// Generic zod schema validator
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

// ─── Schemas ──────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  turnstile_token: z.string().optional(),
});

const blockIpSchema = z.object({
  ip: z.string().ip(),
  reason: z.string().min(3).max(255),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  expires_at: z.string().datetime().optional(),
});

const websiteSchema = z.object({
  name: z.string().min(2).max(255),
  domain: z.string().url(),
  client_id: z.number().optional(),
  settings: z.object({}).passthrough().optional(),
});

const incidentSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  event_ids: z.array(z.number()).optional(),
});

const sdkEventSchema = z.object({
  event_type: z.string().max(50),
  page_url: z.string().max(500).optional(),
  event_data: z.object({}).passthrough().optional(),
  session_id: z.string().uuid().optional(),
  referrer: z.string().max(500).optional(),
});

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'analyst', 'viewer', 'client']).optional(),
});

module.exports = {
  validate,
  loginSchema,
  blockIpSchema,
  websiteSchema,
  incidentSchema,
  sdkEventSchema,
  createUserSchema,
  aiChatSchema,
};
