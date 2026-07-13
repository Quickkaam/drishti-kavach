// ============================================
// Drishti Kavach — Multi-Tenant Middleware
// Ensures data isolation between client websites
// ============================================

const supabase = require('../db/supabase');

/**
 * Middleware to add website_id filtering to queries
 * This ensures users can only access data from their assigned websites
 */
function requireWebsiteAccess() {
  return async (req, res, next) => {
    try {
      // Skip for public routes
      if (req.path.startsWith('/api/sdk') || req.path.startsWith('/api/health')) {
        return next();
      }

      // Skip for admin users accessing admin routes
      if (req.user?.role === 'super_admin' || req.user?.role === 'admin') {
        // Admin can access all data unless website_id is specified
        if (req.query.website_id || req.body.website_id) {
          const websiteId = req.query.website_id || req.body.website_id;
          
          // Verify admin has access to this website
          const { data: website, error } = await supabase
            .from('websites')
            .select('id')
            .eq('id', websiteId)
            .single();
            
          if (error || !website) {
            return res.status(403).json({ 
              error: 'Access denied to specified website' 
            });
          }
          
          req.websiteId = websiteId;
        }
        return next();
      }

      // Regular users must have website assignments
      if (!req.user?.website_access) {
        return res.status(403).json({ 
          error: 'No website access assigned' 
        });
      }

      // Check if user is trying to access a specific website
      const requestedWebsiteId = req.query.website_id || req.body.website_id;
      
      if (requestedWebsiteId) {
        // Verify user has access to the requested website
        if (!req.user.website_access.includes(parseInt(requestedWebsiteId))) {
          return res.status(403).json({ 
            error: 'Access denied to specified website' 
          });
        }
        req.websiteId = requestedWebsiteId;
      } else {
        // If no website specified, use first website user has access to
        req.websiteId = req.user.website_access[0];
      }

      next();
    } catch (error) {
      console.error('Multi-tenant middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to filter query results by website_id
 * Automatically adds website_id filter to database queries
 */
function filterByWebsite() {
  return async (req, res, next) => {
    try {
      // Store original query methods
      const originalQuery = req.query;
      
      // Add website_id to query if not already present
      if (req.websiteId && !originalQuery.website_id) {
        req.query = {
          ...originalQuery,
          website_id: req.websiteId
        };
      }
      
      // Add response middleware to ensure website_id filter is applied
      const originalJson = res.json;
      res.json = function(data) {
        // Ensure data belongs to the correct website
        if (data && Array.isArray(data) && req.websiteId) {
          // Filter array data by website_id
          const filteredData = data.filter(item => 
            item.website_id === req.websiteId || 
            item.website_id == null // Allow null website_id for global data
          );
          return originalJson.call(this, filteredData);
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Website filter middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to validate website ownership for write operations
 */
function validateWebsiteOwnership() {
  return async (req, res, next) => {
    try {
      // Skip for read operations
      if (req.method === 'GET') {
        return next();
      }

      // Get website_id from request
      const websiteId = req.body.website_id || req.query.website_id || req.params.website_id;
      
      if (!websiteId) {
        return res.status(400).json({ 
          error: 'website_id is required for this operation' 
        });
      }

      // Verify website exists and user has access
      let hasAccess = false;
      
      if (req.user?.role === 'super_admin' || req.user?.role === 'admin') {
        // Admin can access all websites
        const { data: website } = await supabase
          .from('websites')
          .select('id')
          .eq('id', websiteId)
          .single();
        
        hasAccess = !!website;
      } else {
        // Regular users check website access
        hasAccess = req.user?.website_access?.includes(parseInt(websiteId));
      }

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied to specified website' 
        });
      }

      // Add website_id to request for downstream use
      req.websiteId = websiteId;
      next();
    } catch (error) {
      console.error('Website ownership validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to populate user's website access
 * This should be called after authentication
 */
async function populateWebsiteAccess(req, res, next) {
  try {
    if (!req.user) {
      return next();
    }

    // Get user's website access
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      // Admin has access to all websites
      const { data: websites } = await supabase
        .from('websites')
        .select('id');
      
      req.user.website_access = websites?.map(w => w.id) || [];
    } else {
      // Regular users get website access from user_websites table
      const { data: userWebsites } = await supabase
        .from('user_websites')
        .select('website_id')
        .eq('user_id', req.user.id);
      
      req.user.website_access = userWebsites?.map(uw => uw.website_id) || [];
    }

    next();
  } catch (error) {
    console.error('Website access population error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Helper function to add website_id to database operations
 */
function withWebsiteFilter(query, websiteId) {
  if (!websiteId) return query;
  
  return query.eq('website_id', websiteId);
}

/**
 * Helper function to validate website access for a specific operation
 */
async function hasWebsiteAccess(userId, websiteId, userRole) {
  try {
    if (userRole === 'super_admin' || userRole === 'admin') {
      // Admin has access to all websites
      const { data: website } = await supabase
        .from('websites')
        .select('id')
        .eq('id', websiteId)
        .single();
      
      return !!website;
    }
    
    // Regular users check user_websites table
    const { data: userWebsite } = await supabase
      .from('user_websites')
      .select('id')
      .eq('user_id', userId)
      .eq('website_id', websiteId)
      .single();
    
    return !!userWebsite;
  } catch (error) {
    console.error('Website access check error:', error);
    return false;
  }
}

module.exports = {
  requireWebsiteAccess,
  filterByWebsite,
  validateWebsiteOwnership,
  populateWebsiteAccess,
  withWebsiteFilter,
  hasWebsiteAccess,
};