const https = require('https');

const options = {
  hostname: 'drishti-kavach-backend.onrender.com',
  port: 443,
  path: '/api/log',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://quickkaam.in'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
  });
});

req.on('error', (e) => console.log('Error:', e.message));
req.end();
