import { Router, Request, Response } from "express";

interface WhatsAppMessageInput {
  phone: string;
  message: string | null;
  imageUrl: string | null;
  voiceTranscript: string | null;
}

export function createWhatsAppRouter({
  analyzeGrievanceContent,
  saveGrievanceToFirestore
}: {
  analyzeGrievanceContent: any;
  saveGrievanceToFirestore: any;
}) {
  const router = Router();

  // GET /api/whatsapp/webhook - Simulates Meta webhook verification
  router.get("/webhook", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Configurable token via env with a standard default fallback
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "civic_pulse_token";

    console.log(`[WhatsApp Simulated Webhook] Received verification request. Token: ${token}, Mode: ${mode}`);

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[WhatsApp Simulated Webhook] Verification successful!");
      return res.status(200).send(challenge);
    } else {
      console.warn("[WhatsApp Simulated Webhook] Verification failed! Mismatch in subscription details.");
      return res.status(403).send("Forbidden");
    }
  });

  // POST /api/whatsapp/mock - Simulates receiving a WhatsApp message
  router.post("/mock", async (req: Request, res: Response) => {
    const { phone, message, imageUrl, voiceTranscript } = req.body as WhatsAppMessageInput;

    console.log(`[WhatsApp Mock Endpoint] Received simulated message from ${phone}:`, {
      message,
      imageUrl: imageUrl ? `${imageUrl.substring(0, 30)}...` : null,
      voiceTranscript
    });

    if (!phone) {
      return res.status(400).json({ success: false, error: "Phone number is required." });
    }

    try {
      const result = await processWhatsAppMessage({
        phone,
        message,
        imageUrl,
        voiceTranscript,
        analyzeGrievanceContent,
        saveGrievanceToFirestore
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (err: any) {
      console.error("[WhatsApp Mock Endpoint Error]:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to process simulated WhatsApp message"
      });
    }
  });

  return router;
}

/**
 * Clean, decoupled processing pipeline helper.
 * This function is completely isolated from HTTP req/res details,
 * allowing it to be easily reused for real Meta webhook payloads later.
 */
export async function processWhatsAppMessage({
  phone,
  message,
  imageUrl,
  voiceTranscript,
  analyzeGrievanceContent,
  saveGrievanceToFirestore
}: {
  phone: string;
  message: string | null;
  imageUrl: string | null;
  voiceTranscript: string | null;
  analyzeGrievanceContent: any;
  saveGrievanceToFirestore: any;
}) {
  // Resolve description
  const description = (message || voiceTranscript || "").trim();
  if (!description) {
    throw new Error("Complaint description is empty. Please provide a message or voice transcript.");
  }

  // Resolve image data and mimeType if a base64 data URL is provided
  let imageData: string | undefined = undefined;
  let imageMimeType: string | undefined = undefined;
  let finalImageUrl: string | undefined = undefined;

  if (imageUrl) {
    if (imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        imageMimeType = match[1];
        imageData = match[2];
        finalImageUrl = imageUrl;
      }
    } else {
      finalImageUrl = imageUrl;
    }
  }

  // Analyze the complaint through the existing AI pipeline
  const analysis = await analyzeGrievanceContent({
    description,
    imageData,
    imageMimeType
  });

  // Handle non-genuine/vague complaints
  if (!analysis.isGenuine) {
    return {
      success: false,
      error: analysis.rejectionReason || "Complaint was determined to be non-genuine or too vague."
    };
  }

  // Save genuine grievance to Firestore with source: "whatsapp"
  const { id } = await saveGrievanceToFirestore({
    name: `WA: Citizen`,
    contact: phone,
    description,
    aiAnalysis: analysis,
    imageUrl: finalImageUrl,
    source: "whatsapp"
  });

  return {
    success: true,
    trackingId: id,
    category: analysis.category || "Solid Waste",
    priority: analysis.severity || "Medium",
    department: analysis.suggested_department || "MCD",
    summary: analysis.summary || description
  };
}
