// ============================================
// Drishti Kavach — SDK Tracking Code
// ============================================
// Copy this code and paste it in the <head> section of your website
// This enables session tracking, page views, and engagement metrics

import React, { useEffect } from 'react';

function TrackingCode() {
  useEffect(() => {
    // SDK Configuration
    const SDK_CONFIG = {
      apiKey: 'YOUR_WEBSITE_API_KEY', // Replace with your website's encrypted API key hash
      apiUrl: 'https://drishti-kavach-backend.onrender.com/api',
      websiteId: 1, // Replace with your website ID
    };

    // Generate session ID
    let sessionId = sessionStorage.getItem('dk_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('dk_session_id', sessionId);
    }

    // Track page view
    function trackPageView() {
      const eventData = {
        event_type: 'page_view',
        session_id: sessionId,
        data: {
          url: window.location.pathname + window.location.search,
          title: document.title,
          referrer: document.referrer || null,
        },
      };

      fetch(`${SDK_CONFIG.apiUrl}/sdk/engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SDK_CONFIG.apiKey,
        },
        body: JSON.stringify(eventData),
      }).catch(err => console.error('[SDK Track]', err));
    }

    // Track session start
    function trackSessionStart() {
      const eventData = {
        event_type: 'session_start',
        session_id: sessionId,
        data: {
          url: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
        },
      };

      fetch(`${SDK_CONFIG.apiUrl}/sdk/engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SDK_CONFIG.apiKey,
        },
        body: JSON.stringify(eventData),
      }).catch(err => console.error('[SDK Session]', err));
    }

    // Track time on page (every 30 seconds)
    let currentTimeOnPage = 0;
    const timeInterval = setInterval(() => {
      currentTimeOnPage += 30;
      const eventData = {
        event_type: 'time_on_page',
        session_id: sessionId,
        data: {
          url: window.location.pathname + window.location.search,
          duration: currentTimeOnPage,
        },
      };

      fetch(`${SDK_CONFIG.apiUrl}/sdk/engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SDK_CONFIG.apiKey,
        },
        body: JSON.stringify(eventData),
      }).catch(err => console.error('[SDK Time]', err));
    }, 30000);

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      const eventData = {
        event_type: 'session_end',
        session_id: sessionId,
        data: {},
      };

      fetch(`${SDK_CONFIG.apiUrl}/sdk/engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SDK_CONFIG.apiKey,
        },
        body: JSON.stringify(eventData),
        keepalive: true,
      }).catch(err => console.error('[SDK End]', err));
    });

    // Initialize tracking
    trackSessionStart();
    trackPageView();

    // Cleanup
    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  return null;
}

export default TrackingCode;
