// ============================================
// Drishti Kavach — ZIP Processor Service
// Parses HTML files in ZIP and injects tracking
// Uses cheerio (jQuery-like HTML parser)
// ============================================

const AdmZip = require('adm-zip');
const path   = require('path');
const cheerio = require('cheerio');

class ZipProcessor {
  /**
   * @param {string} websiteApiKey  - Plain-text API key for this website
   * @param {string|number} websiteId - Website ID
   */
  constructor(websiteApiKey, websiteId) {
    this.apiKey    = websiteApiKey;
    this.websiteId = websiteId;
    this.apiUrl    = process.env.API_URL || 'https://api.drishtikavach.in';
  }

  /**
   * Process a ZIP buffer: extract → inject → repackage
   * @param {Buffer} zipBuffer
   * @returns {{ success, filesProcessed, filesInjected, zipBuffer }}
   */
  async process(zipBuffer) {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    const htmlEntries = entries.filter(e =>
      !e.isDirectory && (e.entryName.endsWith('.html') || e.entryName.endsWith('.htm'))
    );

    const outputZip = new AdmZip();
    let filesInjected = 0;

    // Rebuild each entry: inject tracking into HTML, keep everything else unchanged
    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const isHtml = entry.entryName.endsWith('.html') || entry.entryName.endsWith('.htm');

      if (isHtml) {
        try {
          const originalContent = entry.getData().toString('utf8');
          const injected = this._injectTrackingCode(originalContent);
          outputZip.addFile(entry.entryName, Buffer.from(injected, 'utf8'));
          filesInjected++;
        } catch (htmlErr) {
          // If parsing fails, add original content unchanged
          outputZip.addFile(entry.entryName, entry.getData());
        }
      } else {
        outputZip.addFile(entry.entryName, entry.getData());
      }
    }

    return {
      success:        true,
      filesProcessed: htmlEntries.length,
      filesInjected,
      zipBuffer:      outputZip.toBuffer(),
    };
  }

  /**
   * Inject the Drishti Kavach tracking snippet into an HTML string
   * @param {string} html
   * @returns {string}
   */
  _injectTrackingCode(html) {
    const $ = cheerio.load(html, { decodeEntities: false });
    const trackingScript = this._buildTrackingScript();

    if ($('body').length) {
      $('body').append(trackingScript);
    } else if ($('head').length) {
      $('head').append(trackingScript);
    } else {
      // Bare HTML — append at the end
      return html + '\n' + trackingScript;
    }

    return $.html();
  }

  /**
   * Build the tracking script tag
   * @returns {string}
   */
  _buildTrackingScript() {
    return `
<!-- Drishti Kavach Tracking — दृष्टि कवच -->
<script>
(function() {
  var DK_API_KEY  = '${this.apiKey}';
  var DK_SITE_ID  = '${this.websiteId}';
  var DK_API_URL  = '${this.apiUrl}';

  // ── Session ID ──────────────────────────────
  var sessionId = (function() {
    var key = 'dk_sid';
    var sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(key, sid);
    }
    return sid;
  })();

  window.__dk = { sessionId: sessionId, apiKey: DK_API_KEY, siteId: DK_SITE_ID };

  // ── Core send function ──────────────────────
  function dkSend(eventType, data) {
    try {
      var payload = JSON.stringify({
        event_type: eventType,
        session_id: sessionId,
        website_id: DK_SITE_ID,
        data: data,
        timestamp: new Date().toISOString()
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          DK_API_URL + '/api/sdk/engagement',
          new Blob([payload], { type: 'application/json' })
        );
      } else {
        fetch(DK_API_URL + '/api/sdk/engagement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': DK_API_KEY },
          body: payload,
          keepalive: true
        }).catch(function(){});
      }
    } catch(e) {}
  }

  // ── Page View ───────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    dkSend('page_view', {
      url:      window.location.href,
      title:    document.title,
      referrer: document.referrer,
      screen:   window.screen.width + 'x' + window.screen.height
    });
  });

  // ── Time on Page ────────────────────────────
  var pageStart = Date.now();
  window.addEventListener('beforeunload', function() {
    var duration = Math.round((Date.now() - pageStart) / 1000);
    if (duration > 0) {
      dkSend('time_on_page', { url: window.location.href, duration: duration });
    }
  });

  // ── Scroll Depth ────────────────────────────
  var maxScroll = 0;
  var scrollThresholds = [25, 50, 75, 100];
  window.addEventListener('scroll', function() {
    var scrolled = Math.round(
      (window.scrollY + window.innerHeight) /
      Math.max(document.documentElement.scrollHeight, 1) * 100
    );
    if (scrolled > maxScroll) {
      var crossed = scrollThresholds.find(function(t) {
        return scrolled >= t && maxScroll < t;
      });
      if (crossed) {
        maxScroll = crossed;
        dkSend('scroll_depth', { url: window.location.href, depth: crossed });
      }
    }
  }, { passive: true });

  // ── Click Tracking ──────────────────────────
  document.addEventListener('click', function(e) {
    var el = e.target;
    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (['a', 'button', 'input', 'select'].includes(tag)) {
      dkSend('click', {
        url:     window.location.href,
        element: { tag: tag, id: el.id || null, class: el.className || null, text: (el.innerText || '').slice(0, 80) }
      });
    }
  }, { passive: true });

})();
</script>
<!-- End Drishti Kavach Tracking -->`.trim();
  }
}

module.exports = ZipProcessor;
