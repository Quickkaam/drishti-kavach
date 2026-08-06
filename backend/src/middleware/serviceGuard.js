// ============================================
// Drishti Sentinel — Service Guard Middleware
// Checks if a service is enabled for the website
// ============================================

const supabase = require('../db/supabase');

/**
 * Check if a service is enabled for a website
 */
async function checkService(websiteId, serviceId) {
  try {
    const { data, error } = await supabase
      .from('client_services')
      .select('enabled')
      .eq('website_id', websiteId)
      .eq('service_id', serviceId)
      .single();

    if (error) {
      console.log('[SERVICE GUARD] Error checking service:', error.message);
      return false;
    }

    return data?.enabled || false;
  } catch (err) {
    console.log('[SERVICE GUARD] Exception:', err.message);
    return false;
  }
}

/**
 * Middleware to check if a service is enabled
 * Usage: requireService('service_id')
 */
function requireService(serviceId) {
  return async (req, res, next) => {
    const websiteId = req.user?.website_id || req.body?.website_id || req.query?.website_id;
    
    if (!websiteId) {
      return res.status(400).json({ 
        error: 'Website ID required', 
        message: 'Please provide website_id in request body or query' 
      });
    }

    const isEnabled = await checkService(websiteId, serviceId);
    
    if (!isEnabled) {
      return res.status(403).json({ 
        error: 'Service Not Enabled',
        message: `Service "${serviceId}" is not enabled for this website. Upgrade your plan to access this feature.`,
        service_id: serviceId,
        website_id: websiteId
      });
    }

    next();
  };
}

/**
 * Check multiple services and allow if any one is enabled
 */
function requireAnyService(serviceIds) {
  return async (req, res, next) => {
    const websiteId = req.user?.website_id || req.body?.website_id || req.query?.website_id;
    
    if (!websiteId) {
      return res.status(400).json({ 
        error: 'Website ID required', 
        message: 'Please provide website_id in request body or query' 
      });
    }

    const enabledServices = [];
    for (const serviceId of serviceIds) {
      const isEnabled = await checkService(websiteId, serviceId);
      if (isEnabled) {
        enabledServices.push(serviceId);
      }
    }

    if (enabledServices.length === 0) {
      return res.status(403).json({ 
        error: 'Service Not Enabled',
        message: `None of the required services are enabled for this website. Upgrade your plan to access these features.`,
        required_services: serviceIds,
        website_id: websiteId
      });
    }

    req.enabledServices = enabledServices;
    next();
  };
}

/**
 * Get all enabled services for a website
 */
async function getEnabledServices(websiteId) {
  try {
    const { data, error } = await supabase
      .from('client_services')
      .select('service_id, enabled')
      .eq('website_id', websiteId)
      .eq('enabled', true);

    if (error) {
      console.log('[SERVICE GUARD] Error fetching enabled services:', error.message);
      return [];
    }

    return (data || []).map(row => row.service_id);
  } catch (err) {
    console.log('[SERVICE GUARD] Exception:', err.message);
    return [];
  }
}

module.exports = {
  requireService,
  requireAnyService,
  checkService,
  getEnabledServices
};
