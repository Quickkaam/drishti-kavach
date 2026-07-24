# Drishti Kavach — SDK Tracking Code

## Installation Instructions

To enable analytics tracking on your website (quickkaam.in), add the following JavaScript code to the `<head>` section of your website:

```html
<!-- Drishti Kavach Analytics Tracking -->
<script>
  (function() {
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
    window.removeEventListener('beforeunload', () => {});
    clearInterval(timeInterval);
  })();
</script>
<!-- End Drishti Kavach Analytics Tracking -->
```

## Setup Steps

1. **Get your website's API key:**
   - Log in to Drishti Kavach dashboard as superadmin
   - Go to Websites section
   - Find quickkaam.in website (ID: 1)
   - Copy the `api_key_hash` value from the website record

2. **Replace the placeholder:**
   - In the tracking code above, replace `'YOUR_WEBSITE_API_KEY'` with the actual `api_key_hash` value

3. **Add to your website:**
   - Add the entire `<script>` block to the `<head>` section of your website
   - Or use a tag manager like Google Tag Manager

4. **Test the installation:**
   - Open your website in a browser
   - Check the browser console for "[SDK Session]" and "[SDK Track]" logs
   - Wait a few seconds and check the Analytics dashboard

## What This Tracks

- **Sessions:** Each unique visit to your website
- **Page Views:** Each page loaded (with URL and title)
- **Time on Page:** How long users stay on each page
- **Referrer:** Where users came from
- **Session End:** When users leave your website

## Expected Results

After installation:
- `user_sessions` table: Will show all new sessions
- `page_views` table: Will show all page views with duration
- Analytics dashboard: Will show real-time visitor data

## Troubleshooting

If data isn't showing:

1. **Check browser console** for errors
2. **Verify API key** is correct
3. **Check network tab** to see if requests are being sent
4. **Verify website ID** matches your website in the database
5. **Check CORS** settings on the backend

## Notes

- Session IDs are stored in `sessionStorage` (expires when browser closes)
- For persistent sessions across browser restarts, use `localStorage` instead
- The tracking code runs asynchronously (doesn't block page load)
