// Automated End-to-End Verification of CivicPulse WhatsApp Integration

async function runTests() {
  const BASE_URL = "http://localhost:3000";
  console.log("=== STARTING WHATSAPP END-TO-END VERIFICATION ===");
  console.log(`Targeting local dev server at: ${BASE_URL}\n`);

  let webhookPassed = false;
  let mockPostPassed = false;

  // 1. Test Webhook Verification (GET /api/whatsapp/webhook)
  try {
    console.log("1. Testing GET /api/whatsapp/webhook (Meta handshake simulation)...");
    const challenge = "CHALLENGE_ACCEPTED_CIVIC_PULSE_123";
    const url = `${BASE_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=civic_pulse_token&hub.challenge=${challenge}`;
    
    const response = await fetch(url);
    const text = await response.text();

    if (response.status === 200 && text === challenge) {
      console.log("   ✅ Handshake Verification PASSED!");
      console.log(`      Received Challenge: "${text}"`);
      webhookPassed = true;
    } else {
      console.error(`   ❌ Handshake Verification FAILED. Status: ${response.status}, Body: "${text}"`);
    }
  } catch (err) {
    console.error("   ❌ Handshake Verification FAILED with network error:", err.message);
  }

  console.log("\n-------------------------------------------------------------\n");

  // 2. Test Grievance Ingestion Pipeline (POST /api/whatsapp/mock)
  try {
    console.log("2. Testing POST /api/whatsapp/mock with test grievance payload...");
    const payload = {
      phone: "+919876543210",
      message: "There is a huge pothole outside ABC School. Several accidents have occurred this week.",
      imageUrl: null,
      voiceTranscript: null
    };

    const response = await fetch(`${BASE_URL}/api/whatsapp/mock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.status === 200 && data.success) {
      console.log("   ✅ Mock Grievance Ingestion PASSED!");
      console.log("      [API Response Payload]:");
      console.log(JSON.stringify(data, null, 2));
      mockPostPassed = true;
    } else {
      console.error(`   ❌ Ingestion FAILED. Status: ${response.status}`);
      console.error("      [Error Payload]:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("   ❌ Ingestion FAILED with network error:", err.message);
  }

  console.log("\n=============================================================");
  if (webhookPassed && mockPostPassed) {
    console.log("🎉 SUCCESS: ALL AUTOMATED WHATSAPP TEST CASES PASSED!");
    process.exit(0);
  } else {
    console.log("⚠️ FAILURE: ONE OR MORE TEST CASES FAILED. PLEASE VERIFY SERVER LOGS.");
    process.exit(1);
  }
}

runTests();
