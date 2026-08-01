const axios = require('axios');
const cheerio = require('cheerio');

async function searchWeb(query) {
  try {
    const { data } = await axios.post('https://lite.duckduckgo.com/lite/', `q=${encodeURIComponent(query)}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const results = [];
    
    $('tr').each((i, el) => {
      const titleEl = $(el).find('.result-snippet');
      if (titleEl.length) {
        results.push(titleEl.text().trim());
      }
    });
    
    return results.slice(0, 3);
  } catch (err) {
    console.error('Error', err.message);
    return [];
  }
}

searchWeb('latest cybersecurity news today').then(console.log);
