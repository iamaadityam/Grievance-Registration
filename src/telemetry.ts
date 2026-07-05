/**
 * Utility to send telemetry events securely to the backend telemetry proxy.
 */
export async function sendTelemetryEvent(eventName: string, properties: Record<string, any> = {}) {
  try {
    const payload = {
      event: eventName,
      properties: {
        ...properties,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Server",
        screenResolution: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "N/A"
      },
      timestamp: new Date().toISOString()
    };

    const response = await fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`[Telemetry] Failed to send event ${eventName}. Response status: ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log(`[Telemetry] Event ${eventName} processed successfully:`, data);
    return true;
  } catch (error) {
    console.warn(`[Telemetry] Failed to send event ${eventName}:`, error);
    return false;
  }
}

/**
 * Triggers an SMS notification via the secure telemetry API endpoint.
 * This translates telemetry event dispatching into an actual notification action.
 */
export async function sendGrievanceSms(recipientPhone: string, message: string, extraData: Record<string, any> = {}) {
  try {
    const payload = {
      event: "sms_notification",
      properties: {
        to: recipientPhone,
        message: message,
        ...extraData,
        source: "Municipal-Governance-Portal"
      },
      timestamp: new Date().toISOString()
    };

    console.log(`[Telemetry SMS Service] Dispatching notification payload to /api/telemetry:`, payload);

    const response = await fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`[Telemetry SMS] Failed to dispatch SMS. Status: ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log(`[Telemetry SMS] Dispatched SMS status:`, result);
    return true;
  } catch (error) {
    console.error(`[Telemetry SMS] Exception sending SMS via telemetry proxy:`, error);
    return false;
  }
}

