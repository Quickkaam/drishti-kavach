// ============================================
// Drishti Kavach — Breach & CVE Intelligence
// HaveIBeenPwned (no key) + NVD CVE (no key)
// + CIRCL CVE Search (no key) + OSV (no key)
// ============================================

const axios = require('axios');

const HEADERS = { 'User-Agent': 'DrishtiKavach-SOC/1.0' };

// ─── HaveIBeenPwned ──────────────────────────────────────────────────
// Check if an email/domain has appeared in known breaches
// FREE — no API key required
async function checkBreaches(email) {
  try {
    // HIBP requires a User-Agent; rate limit: 1 req/1.5s
    const domain = email.includes('@') ? email.split('@')[1] : email;
    const res = await axios.get(
      `https://haveibeenpwned.com/api/v3/breacheddomain/${domain}`,
      {
        headers: { ...HEADERS, 'hibp-api-key': process.env.HIBP_API_KEY || '' },
        timeout: 6000,
      }
    );
    return { breached: true, breaches: res.data };
  } catch (err) {
    if (err.response?.status === 404) return { breached: false, breaches: [] };
    return { breached: null, error: err.message };
  }
}

// ─── NVD (NIST) CVE Database ─────────────────────────────────────────
// Search for CVEs by keyword — FREE, no key needed
async function searchCVEs(keyword, { limit = 10, severity } = {}) {
  try {
    const params = {
      keywordSearch: keyword,
      resultsPerPage: limit,
    };
    if (severity) params.cvssV3Severity = severity.toUpperCase();

    const res = await axios.get('https://services.nvd.nist.gov/rest/json/cves/2.0', {
      params,
      headers: HEADERS,
      timeout: 10000,
    });

    const vulns = (res.data.vulnerabilities || []).map((v) => {
      const cve = v.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0];
      return {
        id: cve.id,
        description: cve.descriptions?.find(d => d.lang === 'en')?.value || '',
        severity: metrics?.cvssData?.baseSeverity || 'UNKNOWN',
        score: metrics?.cvssData?.baseScore || null,
        published: cve.published,
        modified: cve.lastModified,
        references: (cve.references || []).slice(0, 3).map(r => r.url),
      };
    });

    return { total: res.data.totalResults, cves: vulns };
  } catch (err) {
    return { total: 0, cves: [], error: err.message };
  }
}

// ─── CIRCL CVE Search ────────────────────────────────────────────────
// Get details for a specific CVE ID — FREE, no key needed
async function getCVEDetails(cveId) {
  try {
    const res = await axios.get(
      `https://cve.circl.lu/api/cve/${cveId}`,
      { headers: HEADERS, timeout: 6000 }
    );
    return res.data;
  } catch {
    return null;
  }
}

// ─── OSV (Open Source Vulnerability) ─────────────────────────────────
// Query vulnerabilities for a specific package — FREE, no key needed
async function queryOSV(packageName, ecosystem = 'npm') {
  try {
    const res = await axios.post(
      'https://api.osv.dev/v1/query',
      { package: { name: packageName, ecosystem } },
      { headers: { ...HEADERS, 'Content-Type': 'application/json' }, timeout: 6000 }
    );
    return res.data.vulns || [];
  } catch {
    return [];
  }
}

// ─── GitHub Advisory DB ───────────────────────────────────────────────
// Search GitHub Security Advisories — FREE, no key needed
async function searchGitHubAdvisories(keyword) {
  try {
    const res = await axios.get(
      `https://api.github.com/advisories?query=${encodeURIComponent(keyword)}&per_page=10`,
      { headers: { ...HEADERS, Accept: 'application/vnd.github+json' }, timeout: 6000 }
    );
    return (res.data || []).map(a => ({
      id: a.ghsa_id,
      summary: a.summary,
      severity: a.severity,
      cve: a.cve_id,
      url: a.html_url,
      published: a.published_at,
    }));
  } catch {
    return [];
  }
}

module.exports = { checkBreaches, searchCVEs, getCVEDetails, queryOSV, searchGitHubAdvisories };
