/**
 * Simple script to test the email notification endpoint
 * 
 * Usage: node test-email-endpoint.js
 * 
 * Requires the CRON_API_KEY environment variable to be set
 */

const apiKey = process.env.CRON_API_KEY;
if (!apiKey) {
  console.error("Error: CRON_API_KEY environment variable not set");
  console.log("Please set the CRON_API_KEY environment variable and try again");
  process.exit(1);
}

async function testSimpleEmail() {
  try {
    console.log("Testing simple email notification...");
    const response = await fetch(
      "http://localhost:3000/api/test-email?mode=simple&email=test@example.com",
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey
        }
      }
    );
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error testing simple email:", error);
    return null;
  }
}

async function testAA777() {
  try {
    console.log("\nTesting AA777 flight email workflow...");
    const response = await fetch(
      "http://localhost:3000/api/test-email?mode=aa777&email=test@example.com",
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey
        }
      }
    );
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error testing AA777 workflow:", error);
    return null;
  }
}

// Run the tests
async function runTests() {
  await testSimpleEmail();
  await testAA777();
  console.log("\nTests completed!");
}

runTests(); 