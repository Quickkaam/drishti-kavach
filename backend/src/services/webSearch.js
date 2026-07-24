// ============================================
// Drishti Kavach — Web Search Service
// Scrapes DuckDuckGo Lite — no API key needed
// ============================================

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Searches the internet via DuckDuckGo Lite and returns top results.
 * @param {string} query - The search query
 * @param {number} limit - Max number of results to return
 * @returns {Promise<Array<{title, snippet, url}>>}
 */
async function searchWeb(query, limit = 5) {
  try {
    const { data } = await axios.post(
      'https://lite.duckduckgo.com/lite/',
      `q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 8000,
      }
    );

    const $ = cheerio.load(data);
    const results = [];

    // DuckDuckGo Lite uses table rows for results
    $('table tr').each((i, el) => {
      if (results.length >= limit) return false;

      const titleEl = $(el).find('a.result-link');
      const snippetEl = $(el).find('.result-snippet');

      if (titleEl.length && snippetEl.length) {
        results.push({
          title: titleEl.text().trim(),
          snippet: snippetEl.text().trim(),
          url: titleEl.attr('href') || '',
        });
      }
    });

    // Fallback: try the .result-snippet only (titles sometimes on separate rows)
    if (results.length === 0) {
      $('tr').each((i, el) => {
        if (results.length >= limit) return false;
        const snippet = $(el).find('.result-snippet').text().trim();
        if (snippet.length > 30) {
          results.push({ title: '', snippet, url: '' });
        }
      });
    }

    return results;
  } catch (err) {
    console.error('[Web Search] Error:', err.message);
    return [];
  }
}

/**
 * Detects if the user question needs a web search.
 * Looks for intent signals like "latest", "news", "what is", "search", etc.
 */
function shouldSearchWeb(question) {
  const triggers = [
    'latest', 'recent', 'news', 'today', 'current', 'now',
    'search', 'find online', 'look up', 'what is', 'who is',
    'how does', 'when did', 'where is', 'price of', 'update on',
    'cve', 'vulnerability', 'exploit', 'hack', 'breach',
    'threat intel', 'threat intelligence', 'zero day', '0day',
  ];
  const q = question.toLowerCase();
  return triggers.some(t => q.includes(t));
}

module.exports = { searchWeb, shouldSearchWeb };
