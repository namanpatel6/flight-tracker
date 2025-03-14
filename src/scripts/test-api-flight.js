const fetch = require('node-fetch');

async function testApiTrackedFlight() {
  try {
    console.log('Testing tracked flight creation through API...');
    
    // Create a test flight
    const response = await fetch('http://localhost:3000/api/tracked-flights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This won't work without authentication cookies
        // This is just for testing the API directly
      },
      body: JSON.stringify({
        flightNumber: 'TEST456',
        date: new Date().toISOString().split('T')[0],
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error response:', data);
      console.log('Note: This test will fail without authentication. Please use the UI to test with authentication.');
      return;
    }
    
    console.log('Successfully created tracked flight through API:', data);
  } catch (error) {
    console.error('Error testing API tracked flight creation:', error);
  }
}

// Run the test
testApiTrackedFlight().catch(console.error); 