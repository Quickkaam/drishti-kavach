const https = require('https');

const apiKey = 'e8cc3c520ac491964ae44f7730860b1d8ae069dac422993dc8c3926a7af06892';
const payload = {
  event_type: 'page_view',
  session_id: 'test-session-123',
  website_id: 1,
  api_key: apiKey,
  data: { url: 'https://quickkaam.in/test' },
  timestamp: new Date().toISOString(),
};

const options = {
  hostname: 'drishti-kavach-backend.onrender.com',
  port: 443,
  path: '/api/sdk/engagement',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'Origin': 'https://quickkaam.in'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('Body:', data);
  });
});

req.on('error', (e) => console.log('Error:', e.message));
req.write(JSON.stringify(payload));
req.end();
