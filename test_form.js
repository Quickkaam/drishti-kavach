const API_URL = 'http://localhost:3000';
const API_KEY = 'e8cc3c520ac491964ae44f7730860b1d8ae069dac422993dc8c3926a7af06892';

async function testFormSubmission() {
  console.log('Sending test form submission to the SDK...');
  
  try {
    const response = await fetch(`${API_URL}/api/sdk/form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        type: 'contact',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        services: 'Web Security',
        message: 'This is a test form submission to verify that the backend is working correctly after the RLS updates.',
        data: {
          test: true,
          source: 'CLI Test Script'
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Form submitted successfully.');
      console.log('Response:', result);
      console.log('\nYou can now check the Forms tab in your dashboard to see this submission.');
    } else {
      console.error('❌ Failed to submit form.');
      console.error('Status:', response.status);
      console.error('Error:', result);
    }
  } catch (err) {
    console.error('❌ Network error. Make sure your backend is running on port 3000!');
    console.error(err.message);
  }
}

testFormSubmission();
