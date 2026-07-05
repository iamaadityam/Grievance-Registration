import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { sendTelemetryEvent, sendGrievanceSms } from "../telemetry";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  MapPin,
  Check,
  Camera,
  Mic,
  MicOff,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Languages,
  Clock,
  Video,
  RefreshCw,
  ShieldCheck,
  Users
} from "lucide-react";

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface GrievanceFormProps {
  onSubmissionSuccess?: (id: string, fullData?: any) => void;
  lang?: "en" | "hi";
}

const FORM_TRANSLATIONS = {
  en: {
    submitTitle: "Submit Citizen Grievance",
    submitSub: "Your report is geocoded and assigned instantly using our AI dispatch coordinator.",
    fullName: "Full Name",
    fullNamePlaceholder: "e.g. Rajesh Kumar",
    contactNo: "Contact Number / WhatsApp",
    contactPlaceholder: "e.g. 9876543210",
    descLabel: "Describe Grievance & Landmark Detail",
    descPlaceholder: "Tell us what is wrong, e.g. 'Large pothole developed near the block C milk booth after yesterday's rain. Water is stagnant.' Gemini AI automatically parses departments & landmarks.",
    voiceMic: "Voice Mic",
    stopAndTranscribe: "Stop & Transcribe",
    gpsBtn: "Detect Location via GPS",
    gpsDetecting: "Detecting...",
    gpsActive: "GPS Active",
    gpsAttachPhoto: "Attach Photograph (Optional)",
    gpsClearPhoto: "Clear Image",
    gpsSelectImage: "Select Image",
    gpsTakePhoto: "Take Photo",
    gpsPhotoSuccess: "✓ Photo loaded successfully",
    gpsPhotoTip: "Upload or take photo of potholes, garbage dumps, etc (max 2.5MB)",
    humanVerify: "Citizen Verification",
    humanVerifyDesc: "To keep our system clean and safe, please solve this simple arithmetic puzzle:",
    humanAnswerPlaceholder: "Answer",
    btnSubmit: "File your Complaint",
    btnSubmitting: "AI is parsing & routing...",
    successTitle: "Grievance Registered Successfully",
    successSub: "AI has assigned a priority rating and dispatched this ticket instantly. Below are your docket details:",
    lblAssignedDept: "Assigned Department",
    lblUrgency: "Urgency Level",
    lblPrioritySuffix: "Priority",
    lblExtractedLandmark: "Extracted Landmark",
    lblSectorCivic: "Sector & Civic Assignment",
    lblActionItem: "AI Executive Action Item",
    lblCategory: "AI Category",
    lblLanguage: "Grievance Language",
    lblSuggestedBody: "Suggested Body",
    lblAffectedDemographic: "Affected Demographic",
    lblConfidence: "Confidence Score",
    lblHearDocket: "Hear Docket",
    lblFileAnother: "File Another",
    gpsNotEnabled: "No GPS detected (using default New Delhi)",
    gpsLiveWarning: "📍 Live GPS Enabled:",
  },
  hi: {
    submitTitle: "नागरिक शिकायत दर्ज करें",
    submitSub: "आपकी रिपोर्ट को हमारे एआई डिस्पैच समन्वयक का उपयोग करके तुरंत जियोकोड और आवंटित किया जाता है।",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "जैसे: राजेश कुमार",
    contactNo: "संपर्क नंबर / व्हाट्सएप",
    contactPlaceholder: "जैसे: 9876543210",
    descLabel: "शिकायत और मील का पत्थर (लैंडमार्क) विवरण",
    descPlaceholder: "हमें बताएं कि क्या गलत है, जैसे 'कल की बारिश के बाद ब्लॉक सी मिल्क बूथ के पास बड़ा गड्ढा हो गया है। पानी जमा है।' जेमिनी एआई स्वचालित रूप से विभागों और स्थलों का विश्लेषण करता है।",
    voiceMic: "वॉयस माइक",
    stopAndTranscribe: "रोकें और अनुवाद",
    gpsBtn: "जीपीएस द्वारा स्थान पता करें",
    gpsDetecting: "पता लगाया जा रहा है...",
    gpsActive: "जीपीएस सक्रिय",
    gpsAttachPhoto: "फोटो संलग्न करें (वैकल्पिक)",
    gpsClearPhoto: "फोटो साफ करें",
    gpsSelectImage: "फोटो चुनें",
    gpsTakePhoto: "फोटो लें",
    gpsPhotoSuccess: "✓ फोटो सफलतापूर्वक लोड की गई",
    gpsPhotoTip: "गड्ढों, कचरे के ढेर आदि की तस्वीर अपलोड करें या लें (अधिकतम 2.5MB)",
    humanVerify: "नागरिक सत्यापन",
    humanVerifyDesc: "हमारे सिस्टम को सुरक्षित रखने के लिए, कृपया इस सरल गणित पहेली को हल करें:",
    humanAnswerPlaceholder: "उत्तर",
    btnSubmit: "शिकायत दर्ज करें",
    btnSubmitting: "एआई विश्लेषण और रूटिंग कर रहा है...",
    successTitle: "शिकायत सफलतापूर्वक दर्ज की गई",
    successSub: "एआई ने प्राथमिकता रेटिंग दी है और इस टिकट को तुरंत भेज दिया है। नीचे आपके डॉकेट विवरण हैं:",
    lblAssignedDept: "आवंटित विभाग",
    lblUrgency: "जल्दी का स्तर (त्वरित)",
    lblPrioritySuffix: "प्राथमिकता",
    lblExtractedLandmark: "निकाला गया स्थल (लैंडमार्क)",
    lblSectorCivic: "सेक्टर और नागरिक आवंटन",
    lblActionItem: "एआई कार्यकारी कार्य आइटम",
    lblCategory: "एआई श्रेणी",
    lblLanguage: "शिकायत की भाषा",
    lblSuggestedBody: "सुझाया गया निकाय",
    lblAffectedDemographic: "प्रभावित आबादी",
    lblConfidence: "विश्वास स्कोर",
    lblHearDocket: "डॉकेट विवरण सुनें",
    lblFileAnother: "दूसरी शिकायत दर्ज करें",
    gpsNotEnabled: "कोई जीपीएस नहीं मिला (दिल्ली एनसीआर डिफॉल्ट)",
    gpsLiveWarning: "📍 सक्रिय लाइव जीपीएस स्थान:",
  }
};

export default function GrievanceForm({ onSubmissionSuccess, lang = "en" }: GrievanceFormProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  
  // Image states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera/Take Photo states & refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Could not access camera. Please check browser permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImagePreview(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Speech states
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"en-IN" | "hi-IN" | "en-IN-hinglish">("en-IN");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Synthesis/TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // GPS Location tracker states
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("");
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const detectGpsLocation = () => {
    setIsGpsLoading(true);
    setGpsStatus(lang === "hi" ? "जीपीएस स्थिति का पता लगाया जा रहा है..." : "Detecting GPS location...");
    if (!navigator.geolocation) {
      setGpsStatus(lang === "hi" ? "इस ब्राउज़र द्वारा जियोलोकेशन समर्थित नहीं है।" : "Geolocation is not supported by this browser.");
      setIsGpsLoading(false);
      sendTelemetryEvent("gps_location_failed", { reason: "not_supported" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLocation({ lat: latitude, lng: longitude });
        setGpsStatus(
          lang === "hi"
            ? `सक्रिय जीपीएस: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : `GPS Active: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        );
        setIsGpsLoading(false);
        sendTelemetryEvent("gps_location_detected", { latitude, longitude });
      },
      (error) => {
        console.warn("GPS detection status (handled gracefully):", error.message || error);
        let errorMsg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access denied. Please allow location permissions in your browser.";
        }
        setGpsStatus(lang === "hi" ? `त्रुटि: ${errorMsg}` : `Error: ${errorMsg}`);
        setIsGpsLoading(false);
        sendTelemetryEvent("gps_location_failed", {
          errorCode: error.code,
          errorMessage: error.message,
          errorMsg
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAllowLocationPrompt = () => {
    setShowLocationPrompt(false);
    sendTelemetryEvent("location_prompt_accepted");
    detectGpsLocation();
  };

  const handleDismissLocationPrompt = () => {
    setShowLocationPrompt(false);
    sessionStorage.setItem("location_prompt_dismissed", "true");
    sendTelemetryEvent("location_prompt_dismissed");
  };

  // Bot verification challenge
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 8) + 2); // 2 to 9
    setCaptchaNum2(Math.floor(Math.random() * 8) + 2); // 2 to 9
    setCaptchaAnswer("");
  };

  useEffect(() => {
    generateCaptcha();
    sendTelemetryEvent("portal_page_view", { lang });

    const wasDismissed = sessionStorage.getItem("location_prompt_dismissed");
    if (wasDismissed) {
      // If user dismissed explanation before, try to silently query permission status
      if (typeof navigator !== "undefined" && navigator.permissions) {
        navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
          if (result.state === "granted") {
            detectGpsLocation();
          }
        }).catch(() => {});
      }
      return;
    }

    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        if (result.state === "granted") {
          detectGpsLocation();
          setShowLocationPrompt(false);
        } else if (result.state === "denied") {
          setShowLocationPrompt(false);
        } else {
          // state is 'prompt'
          setShowLocationPrompt(true);
        }
      }).catch((e) => {
        console.warn("Permissions API not fully supported, showing prompt:", e);
        setShowLocationPrompt(true);
      });
    } else {
      setShowLocationPrompt(true);
    }
  }, []);

  // Check audio recording and MediaRecorder support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
      setSpeechSupported(hasSupport);
    }
  }, []);

  // Voice recording start/stop with Gemini transcriber
  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Release the microphone tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        if (audioBlob.size === 0) {
          console.warn("Audio blob is empty");
          return;
        }

        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64data = reader.result as string;
              const rawBase64 = base64data.split(",")[1];

              const response = await fetch("/api/transcribe-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  audioData: rawBase64,
                  mimeType: mediaRecorder.mimeType || "audio/webm",
                  language: speechLang === "hi-IN" ? "Hindi" : speechLang === "en-IN-hinglish" ? "Hinglish" : "English"
                }),
              });

              let responseData: any = null;
              try {
                responseData = await response.json();
              } catch (e) {
                // Ignore parsing errors
              }

              if (!response.ok) {
                const errMsg = responseData?.error || "Server failed to transcribe audio.";
                throw new Error(errMsg);
              }

              if (responseData && responseData.text && responseData.text.trim()) {
                setDescription((prev) => (prev ? prev + " " + responseData.text.trim() : responseData.text.trim()));
              } else if (responseData && responseData.warning) {
                setError(responseData.warning);
              } else {
                setError("No voice speech was detected. Please try again or type manually.");
              }
            } catch (err: any) {
              console.error("Inner transcription error:", err);
              setError("Failed to transcribe audio: " + err.message);
            } finally {
              setIsTranscribing(false);
            }
          };
        } catch (err: any) {
          console.error("FileReader reading error:", err);
          setError("Failed to process recorded audio data: " + err.message);
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(250);
      setIsListening(true);
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError("Microphone access is denied or not supported. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Text-To-Speech (TTS) read out docket
  const speakDocket = (text: string, force = false) => {
    if (!window.speechSynthesis) return;
    if (!force && !ttsEnabled) return;
    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    // Auto-detect Hindi language for Indian context
    if (speechLang === "hi-IN" || text.includes("प्राथमिकता")) {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-IN";
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        setError("Image size must be less than 2.5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackVal: T): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          console.warn(`Firestore write timed out after ${timeoutMs}ms, proceeding offline`);
          resolve(fallbackVal);
        }, timeoutMs);
        
        promise
          .then((result) => {
            clearTimeout(timer);
            resolve(result);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
    }

    if (!name.trim() || !contact.trim() || !description.trim()) {
      setError("Please fill out all fields before submitting.");
      return;
    }

    // Name must be alphabetical and spaces only
    const cleanName = name.trim();
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(cleanName)) {
      setError("Full Name must contain only alphabetical characters (letters and spaces).");
      return;
    }

    // Contact number must be exactly 10 digits, or 11 digits if there's a leading zero
    const cleanPhone = contact.trim();
    const isLeadingZero = cleanPhone.startsWith("0");
    const isValidPhone = isLeadingZero ? /^\d{11}$/.test(cleanPhone) : /^\d{10}$/.test(cleanPhone);
    if (!isValidPhone) {
      setError(
        isLeadingZero
          ? "Contact number with a leading zero must be exactly 11 digits (e.g. 09876543210)."
          : "Contact number must be exactly 10 digits (e.g. 9876543210)."
      );
      return;
    }

    // Bot verification check
    const parsedAns = parseInt(captchaAnswer.trim(), 10);
    if (isNaN(parsedAns) || parsedAns !== (captchaNum1 + captchaNum2)) {
      setError("Citizen verification failed. Please solve the simple math puzzle to verify you are not a bot.");
      generateCaptcha();
      return;
    }

    if (isListening) {
      stopRecording();
    }

    setError(null);
    setIsAnalyzing(true);
    setSuccessData(null);

    try {
      // Extract image content if attached
      let imageData: string | undefined = undefined;
      let imageMimeType: string | undefined = undefined;
      if (imagePreview) {
        imageMimeType = imagePreview.substring(imagePreview.indexOf(":") + 1, imagePreview.indexOf(";"));
        imageData = imagePreview.split(",")[1];
      }

      // 1. Send description to the server for Gemini processing
      const response = await fetch("/api/analyze-grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description,
          userLatitude: gpsLocation ? gpsLocation.lat : undefined,
          userLongitude: gpsLocation ? gpsLocation.lng : undefined,
          imageData,
          imageMimeType
        }),
      });

      if (!response.ok) {
        throw new Error("Gemini AI analysis failed. Please try again.");
      }

      const aiAnalysis = await response.json();

      // Check if report is fake/rejected by Gemini
      if (aiAnalysis.isGenuine === false) {
        throw new Error(aiAnalysis.rejectionReason || "Please register a genuine complaint.");
      }

      // Automatically determine sector subdivision & civic body based on coordinates
      // Latitude: ~28.6, Longitude: ~77.2 (Delhi coordinate ranges)
      let sector = "Central Zone";
      let assignedBody = "MCD";

      // Classify sector based on coordinates range
      const lat = aiAnalysis.latitude || 28.61;
      const lng = aiAnalysis.longitude || 77.23;

      if (lat > 28.62 && lng < 77.22) {
        sector = "West Zone";
        assignedBody = "MCD - West District Team";
      } else if (lat < 28.60 && lng > 77.24) {
        sector = "East Zone";
        assignedBody = "MCD - East District Team";
      } else if (lat >= 28.605 && lat <= 28.618 && lng >= 77.21 && lng <= 77.235) {
        sector = "NDMC Area";
        assignedBody = "NDMC - New Delhi Municipal Council";
      } else {
        sector = "Central Zone";
        assignedBody = "MCD - Central District Team";
      }

      // Map the user-requested rich JSON fields to our core typed enum fields for backward-compatibility
      const categoryLower = (aiAnalysis.category || "").toLowerCase();
      const suggestedDeptLower = (aiAnalysis.suggested_department || "").toLowerCase();
      const descLower = description.toLowerCase();
      
      let mappedDept: "Garbage Report" | "Water Logging" | "Potholes" = "Garbage Report";
      if (
         categoryLower.includes("water") || 
         categoryLower.includes("drain") || 
         categoryLower.includes("flood") ||
         suggestedDeptLower.includes("jal") || 
         suggestedDeptLower.includes("water") ||
         descLower.includes("water") || 
         descLower.includes("flood") || 
         descLower.includes("clog")
      ) {
        mappedDept = "Water Logging";
      } else if (
         categoryLower.includes("road") || 
         categoryLower.includes("pothole") || 
         categoryLower.includes("street") || 
         categoryLower.includes("infrastructure") ||
         suggestedDeptLower.includes("pwd") || 
         suggestedDeptLower.includes("road") ||
         descLower.includes("road") || 
         descLower.includes("hole") || 
         descLower.includes("pothole")
      ) {
        mappedDept = "Potholes";
      } else {
        mappedDept = "Garbage Report";
      }

      let mappedUrgency: "Low" | "Medium" | "High" = "Medium";
      const severityLower = (aiAnalysis.severity || "").toLowerCase();
      if (
        severityLower.includes("high") || 
        severityLower.includes("crit") || 
        (aiAnalysis.urgency && aiAnalysis.urgency >= 7)
      ) {
        mappedUrgency = "High";
      } else if (
        severityLower.includes("low") || 
        (aiAnalysis.urgency && aiAnalysis.urgency <= 3)
      ) {
        mappedUrgency = "Low";
      }

      // 2. Build full grievance document and save to Firestore
      const grievanceData = {
        name,
        contact,
        description,
        department: mappedDept,
        urgency: mappedUrgency,
        cleanLocation: aiAnalysis.cleanLocation || "Connaught Place, New Delhi",
        summary: aiAnalysis.summary || ("Citizen reported issue: " + description.substring(0, 60)),
        latitude: lat,
        longitude: lng,
        status: "Open",
        createdAt: new Date().toISOString(),
        imageUrl: imagePreview || "", // Optional captured image
        sector,
        assignedBody,

        // Save brand-new formatted JSON fields requested by user
        category: aiAnalysis.category || "Solid Waste",
        severity: aiAnalysis.severity || "Medium",
        urgencyScore: aiAnalysis.urgency || 5,
        affected_people: aiAnalysis.affected_people || "Local residents",
        suggested_department: aiAnalysis.suggested_department || "MCD",
        confidence: aiAnalysis.confidence || 90,
        keywords: aiAnalysis.keywords || [],
        detectedLanguage: aiAnalysis.detectedLanguage || "English",
        imageVerificationStatus: aiAnalysis.imageVerificationStatus || (imagePreview ? "verified" : "not_attached"),
        imageVerificationMessage: aiAnalysis.imageVerificationMessage || (imagePreview ? "Photo uploaded" : "No photo attached"),
        
        // Save Content Validation & Relevance Guardrail fields
        guardrailRelevanceScore: aiAnalysis.guardrailRelevanceScore !== undefined ? aiAnalysis.guardrailRelevanceScore : 1.0,
        guardrailFlaggedReason: aiAnalysis.guardrailFlaggedReason || "NONE",
        guardrailResolvedCategory: aiAnalysis.guardrailResolvedCategory || "Garbage",
        guardrailExecutiveSummary: aiAnalysis.guardrailExecutiveSummary || description,
      };

      // 3. Duplicate Prevention Check (Anti-Clutter Traffic Consolidation Guardrail)
      const grievancesRef = collection(db, "grievances");
      const q = query(grievancesRef, where("status", "==", "Open"));
      
      let querySnapshot = null;
      try {
        querySnapshot = await runWithTimeout(getDocs(q), 1500, null);
      } catch (err) {
        console.warn("Firestore duplicate check failed or client is offline. Proceeding as fresh ticket:", err);
      }
      
      let matchedGrievanceId: string | null = null;
      let matchedGrievanceData: any = null;
      const nowTime = new Date().getTime();
      
      if (querySnapshot) {
        querySnapshot.forEach((docSnap) => {
          if (matchedGrievanceId) return; // Exit loop if match already found
          const data = docSnap.data();
          
          // Match condition: Same department + within 45 mins buffer + within 350 meters
          const isSameDept = data.department === mappedDept;
          const createdTime = new Date(data.createdAt).getTime();
          const diffMins = Math.abs(nowTime - createdTime) / (1000 * 60);
          const isWithinTimeBuffer = diffMins <= 45;
          
          const dist = getDistanceInMeters(lat, lng, data.latitude || 0, data.longitude || 0);
          const isCloseArea = dist <= 350;
          
          if (isSameDept && isWithinTimeBuffer && isCloseArea) {
            matchedGrievanceId = docSnap.id;
            matchedGrievanceData = { id: docSnap.id, ...data };
          }
        });
      }

      if (matchedGrievanceId) {
        // Consolidate report under existing matched ticket!
        const existingDocRef = doc(db, "grievances", matchedGrievanceId);
        const currentTraffic = matchedGrievanceData.trafficCount || 1;
        const currentReporters = matchedGrievanceData.reportersList || [];
        
        const updatedReporters = [
          ...currentReporters,
          {
            name,
            contact,
            reportedAt: new Date().toISOString(),
            description: description,
          }
        ];
        
        try {
          await runWithTimeout(
            updateDoc(existingDocRef, {
              trafficCount: currentTraffic + 1,
              reportersList: updatedReporters,
            }),
            1500,
            undefined
          );
        } catch (err) {
          console.warn("Firestore updateDoc matched grievance failed or offline, proceeding locally:", err);
        }

        const consolidatedObj = {
          id: matchedGrievanceId,
          ...matchedGrievanceData,
          trafficCount: currentTraffic + 1,
          reportersList: updatedReporters,
          isConsolidatedDuplicate: true,
          originalReporterName: matchedGrievanceData.name,
          originalCreatedAt: matchedGrievanceData.createdAt,
        };

        // Show receipt with duplicate matched flag
        setSuccessData(consolidatedObj);

        // Send telemetry event
        sendTelemetryEvent("grievance_submitted", {
          type: "duplicate_consolidated",
          id: matchedGrievanceId,
          department: matchedGrievanceData.department,
          urgency: matchedGrievanceData.urgency
        });

        // Send SMS Notification via Telemetry API
        const duplicateSmsMsg = lang === "hi"
          ? `नमस्ते ${name}, ${matchedGrievanceData.category || "शिकायत"} पर आपका वोट दर्ज हो गया है। आईडी: ${matchedGrievanceId}। कुल समर्थन संख्या: ${currentTraffic + 1}। - MP सेवा केंद्र`
          : `Dear ${name}, your support has been registered for the active grievance regarding ${matchedGrievanceData.category || "Issue"}. ID: ${matchedGrievanceId}. Support count: ${currentTraffic + 1}. - MP Service Center`;

        sendGrievanceSms(contact, duplicateSmsMsg, {
          grievanceId: matchedGrievanceId,
          type: "duplicate_consolidated",
          category: matchedGrievanceData.category,
          name
        });

        // Reset form fields
        setName("");
        setContact("");
        setDescription("");
        setImagePreview(null);
        generateCaptcha();

        if (onSubmissionSuccess) {
          onSubmissionSuccess(matchedGrievanceId, consolidatedObj);
        }
      } else {
        // Safe to create a fresh independent grievance
        const finalGrievanceData = {
          ...grievanceData,
          trafficCount: 1,
          reportersList: [
            {
              name,
              contact,
              reportedAt: new Date().toISOString(),
              description: description,
            }
          ]
        };

        let finalDocId = "offline-" + Math.random().toString(36).substring(2, 9);
        let isSavedOfflineOnly = false;
        try {
          const docRef = await runWithTimeout(
            addDoc(collection(db, "grievances"), finalGrievanceData),
            1500,
            null
          );
          if (docRef && docRef.id) {
            finalDocId = docRef.id;
          } else {
            isSavedOfflineOnly = true;
          }
        } catch (err) {
          console.warn("Firestore addDoc fresh grievance failed or offline, proceeding locally:", err);
          isSavedOfflineOnly = true;
        }

        const successObj = { 
          id: finalDocId, 
          ...finalGrievanceData, 
          isOfflineOnly: isSavedOfflineOnly 
        };

        // Show standard receipt to the citizen
        setSuccessData(successObj);

        // Send telemetry event
        sendTelemetryEvent("grievance_submitted", {
          type: "new_grievance",
          id: finalDocId,
          department: finalGrievanceData.department,
          urgency: finalGrievanceData.urgency,
          isOfflineOnly: isSavedOfflineOnly
        });

        // Send SMS Notification via Telemetry API
        const freshSmsMsg = lang === "hi"
          ? `नमस्ते ${name}, आपकी शिकायत (${finalGrievanceData.category || "सामान्य"}) दर्ज हो गई है। आईडी: ${finalDocId}। विभाग: ${finalGrievanceData.suggested_department || "MCD"}। - MP सेवा केंद्र`
          : `Dear ${name}, your grievance regarding ${finalGrievanceData.category || "General"} has been registered. ID: ${finalDocId}. Assigned: ${finalGrievanceData.suggested_department || "MCD"}. - MP Service Center`;

        sendGrievanceSms(contact, freshSmsMsg, {
          grievanceId: finalDocId,
          type: "new_grievance",
          category: finalGrievanceData.category,
          name
        });

        // Reset form fields
        setName("");
        setContact("");
        setDescription("");
        setImagePreview(null);
        generateCaptcha();

        if (onSubmissionSuccess) {
          onSubmissionSuccess(finalDocId, successObj);
        }
      }
    } catch (err: any) {
      console.error("Grievance Form submission error:", err);
      let errorMsg = "Something went wrong. Please check your connection.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          errorMsg = `Firestore Security Denied: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
        }
      } catch (_) {
        errorMsg = err.message || errorMsg;
      }
      setError(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const departmentIcons: Record<string, string> = {
    "Water Logging": "💧",
    "Potholes": "🕳️",
    "Garbage Report": "🗑️"
  };

  return (
    <>
      <AnimatePresence>
        {showLocationPrompt && (
          <motion.div
            key="location-permission-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              {/* Decorative accent background gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

              <div className="mx-auto w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
                <MapPin className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {lang === "hi" 
                    ? "📍 शिकायत का सही स्थान चिह्नित करें" 
                    : "📍 Locate Your Grievance Accurately"}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {lang === "hi"
                    ? "सटीक स्थान साझा करने से हमारे डिस्पैच और प्रशासनिक दल समस्या (जैसे गढ्ढे, जलभराव या कचरा) को तुरंत मैप पर देखकर त्वरित समाधान कर पाते हैं। कृपया सटीक जीपीएस अधिकार प्रदान करें।"
                    : "Allowing precise location helps our MP dispatch and administrative teams pinpoint the exact pothole, water logging, or garbage heap on the municipal command map for faster resolution."}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAllowLocationPrompt}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase py-3 rounded-xl transition-all cursor-pointer shadow-md tracking-wider flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>{lang === "hi" ? "सटीक स्थान साझा करें" : "Share Precise Location"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissLocationPrompt}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs uppercase py-3 rounded-xl transition-all cursor-pointer"
                >
                  {lang === "hi" ? "मैन्युअल रूप से विवरण दर्ज करें" : "Enter Landmark Manually"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 md:p-6">
      <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
            {lang === "hi" ? FORM_TRANSLATIONS.hi.submitTitle : FORM_TRANSLATIONS.en.submitTitle}
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            {lang === "hi" ? FORM_TRANSLATIONS.hi.submitSub : FORM_TRANSLATIONS.en.submitSub}
          </p>
        </div>
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          title={ttsEnabled ? "TTS Voice Guide On" : "TTS Voice Guide Off"}
          className={`p-2 rounded-lg border transition-all cursor-pointer ${
            ttsEnabled
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-slate-50 text-slate-400 border-slate-200"
          }`}
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!successData ? (
          <motion.form
            key="grievance-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex gap-2 items-center">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="citizen-name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {lang === "hi" ? FORM_TRANSLATIONS.hi.fullName : FORM_TRANSLATIONS.en.fullName}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="citizen-name"
                    type="text"
                    required
                    placeholder={lang === "hi" ? FORM_TRANSLATIONS.hi.fullNamePlaceholder : FORM_TRANSLATIONS.en.fullNamePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\s]/g, ""))}
                    disabled={isAnalyzing}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 text-slate-900 text-xs rounded-lg focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="citizen-contact" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {lang === "hi" ? FORM_TRANSLATIONS.hi.contactNo : FORM_TRANSLATIONS.en.contactNo}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="citizen-contact"
                    type="tel"
                    required
                    maxLength={contact.startsWith("0") ? 11 : 10}
                    placeholder={lang === "hi" ? FORM_TRANSLATIONS.hi.contactPlaceholder : FORM_TRANSLATIONS.en.contactPlaceholder}
                    value={contact}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const limit = val.startsWith("0") ? 11 : 10;
                      setContact(val.slice(0, limit));
                    }}
                    disabled={isAnalyzing}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 text-slate-900 text-xs rounded-lg focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* GPS Location Tracker Widget */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <MapPin className={`w-3.5 h-3.5 ${gpsLocation ? 'text-emerald-500 animate-bounce' : 'text-slate-400'}`} />
                  <span>{lang === "hi" ? "जीपीएस स्थान ट्रैकर (वैकल्पिक)" : "GPS Location Tracker (Optional)"}</span>
                </div>
                {gpsLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      setGpsLocation(null);
                      setGpsStatus("");
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{lang === "hi" ? "साफ़ करें" : "Clear"}</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={detectGpsLocation}
                  disabled={isGpsLoading}
                  className={`border font-bold text-[10px] uppercase px-3.5 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${
                    gpsLocation
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  {isGpsLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  ) : (
                    <MapPin className={`w-3.5 h-3.5 ${gpsLocation ? 'text-emerald-600' : 'text-slate-400'}`} />
                  )}
                  <span>{isGpsLoading ? FORM_TRANSLATIONS[lang].gpsDetecting : FORM_TRANSLATIONS[lang].gpsBtn}</span>
                </button>

                <span className="text-[10px] text-slate-400">
                  {gpsStatus || (lang === "hi" ? FORM_TRANSLATIONS.hi.gpsNotEnabled : FORM_TRANSLATIONS.en.gpsNotEnabled)}
                </span>
              </div>
            </div>

            {/* Description textarea with Voice Dictation Overlay */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-1.5">
                <label htmlFor="grievance-desc" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {lang === "hi" ? FORM_TRANSLATIONS.hi.descLabel : FORM_TRANSLATIONS.en.descLabel}
                </label>
                
                {/* Voice Input Options with Gemini Transcribing */}
                {speechSupported && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Language selector */}
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-md p-0.5">
                      <button
                        type="button"
                        onClick={() => setSpeechLang("en-IN")}
                        className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase transition-all cursor-pointer ${
                          speechLang === "en-IN" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="English voice input"
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeechLang("hi-IN")}
                        className={`px-1.5 py-0.5 text-[8px] font-black rounded transition-all cursor-pointer ${
                          speechLang === "hi-IN" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Hindi voice input"
                      >
                        हिं
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeechLang("en-IN-hinglish")}
                        className={`px-1.5 py-0.5 text-[8px] font-black rounded transition-all cursor-pointer ${
                          speechLang === "en-IN-hinglish" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Hinglish voice input"
                      >
                        Hin-Eng
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={isTranscribing}
                      className={`p-1.5 rounded-md flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 ${
                        isListening
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                      title={isListening ? "Stop voice recording and transcribe" : "Record voice input using Gemini AI"}
                    >
                      {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
                      <span className="text-[9px] font-bold">
                        {isListening ? FORM_TRANSLATIONS[lang].stopAndTranscribe : FORM_TRANSLATIONS[lang].voiceMic}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <textarea
                  id="grievance-desc"
                  required
                  rows={4}
                  placeholder={lang === "hi" ? FORM_TRANSLATIONS.hi.descPlaceholder : FORM_TRANSLATIONS.en.descPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isAnalyzing || isTranscribing}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 text-slate-900 text-xs rounded-lg focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400 resize-none disabled:opacity-60 leading-relaxed"
                />
                
                {isListening && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-1 bg-red-50 border border-red-100 text-red-600 px-2.5 py-1 rounded-md text-[10px] font-bold animate-pulse">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                    <span>{lang === "hi" ? `रिकॉर्डिंग शुरू: ${speechLang === "hi-IN" ? "हिंदी" : speechLang === "en-IN-hinglish" ? "हिंग्लिश" : "अंग्रेजी"}...` : `Recording in ${speechLang === "hi-IN" ? "Hindi" : speechLang === "en-IN-hinglish" ? "Hinglish" : "English"}...`}</span>
                  </div>
                )}

                {isTranscribing && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1 rounded-md text-[10px] font-bold">
                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>{lang === "hi" ? "एआई आवाज का अनुवाद कर रहा है..." : "AI transcribing voice..."}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Image Input Field */}
            <div id="photo-attachment-container" className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.gpsAttachPhoto : FORM_TRANSLATIONS.en.gpsAttachPhoto}</span>
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.gpsClearPhoto : FORM_TRANSLATIONS.en.gpsClearPhoto}</span>
                  </button>
                )}
              </div>

              {/* Live Webcam Stream Frame */}
              {isCameraActive && (
                <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-black aspect-video max-w-sm mx-auto shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded shadow-md flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{lang === "hi" ? "कैप्चर करें" : "Capture"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded shadow-md flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{lang === "hi" ? "रद्द करें" : "Cancel"}</span>
                    </button>
                  </div>
                </div>
              )}

              {cameraError && (
                <p className="text-[10px] font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-100">
                  {cameraError}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) stopCamera();
                    fileInputRef.current?.click();
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase px-3.5 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.gpsSelectImage : FORM_TRANSLATIONS.en.gpsSelectImage}</span>
                </button>

                {!isCameraActive && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase px-3.5 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5 text-white" />
                    <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.gpsTakePhoto : FORM_TRANSLATIONS.en.gpsTakePhoto}</span>
                  </button>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <span className="text-[10px] text-slate-400">
                  {imagePreview 
                    ? (lang === "hi" ? FORM_TRANSLATIONS.hi.gpsPhotoSuccess : FORM_TRANSLATIONS.en.gpsPhotoSuccess) 
                    : (lang === "hi" ? FORM_TRANSLATIONS.hi.gpsPhotoTip : FORM_TRANSLATIONS.en.gpsPhotoTip)
                  }
                </span>
              </div>

              {/* Thumbnail Preview rendering */}
              {imagePreview && !isCameraActive && (
                <div className="mt-3 relative w-32 h-20 rounded-md overflow-hidden border border-slate-300 shadow-sm">
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full p-1 hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Modern, elegant Human verification (Bot-proof) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                  <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.humanVerify : FORM_TRANSLATIONS.en.humanVerify}</span>
                </span>
                <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                  {lang === "hi" ? "सुरक्षित लॉक" : "Bot-Proof Lock"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {lang === "hi" ? FORM_TRANSLATIONS.hi.humanVerifyDesc : FORM_TRANSLATIONS.en.humanVerifyDesc}
              </p>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-slate-700 select-none">
                  {captchaNum1} + {captchaNum2} =
                </div>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder={lang === "hi" ? FORM_TRANSLATIONS.hi.humanAnswerPlaceholder : FORM_TRANSLATIONS.en.humanAnswerPlaceholder}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-slate-950 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded transition-all cursor-pointer"
                  title="Generate new question"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CTA Button: File your Complaint */}
            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold py-3 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs uppercase tracking-wider animate-pulse">
                    {lang === "hi" ? FORM_TRANSLATIONS.hi.btnSubmitting : FORM_TRANSLATIONS.en.btnSubmitting}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-xs uppercase tracking-wider">
                    {lang === "hi" ? FORM_TRANSLATIONS.hi.btnSubmit : FORM_TRANSLATIONS.en.btnSubmit}
                  </span>
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="grievance-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-emerald-200 bg-emerald-50/10 p-5 rounded-xl flex flex-col items-center text-center"
          >
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3">
              <Check className="w-6 h-6" strokeWidth={3} />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase">
              {lang === "hi" ? FORM_TRANSLATIONS.hi.successTitle : FORM_TRANSLATIONS.en.successTitle}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md">
              {lang === "hi" ? FORM_TRANSLATIONS.hi.successSub : FORM_TRANSLATIONS.en.successSub}
            </p>

            {successData.isConsolidatedDuplicate && (
              <div className="w-full mt-4 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-left text-xs space-y-1.5 shadow-sm">
                <div className="flex items-center gap-1.5 font-extrabold text-[10px] uppercase tracking-wider text-blue-900">
                  <Users className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>{lang === "hi" ? "समेकित शिकायत (एंटी-क्लेटर)" : "Traffic Consolidated (Anti-Clutter Guardrail)"}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
                  {lang === "hi" 
                    ? `हमने पिछले 45 मिनट में आपके तत्काल क्षेत्र में ${successData.originalReporterName || "दूसरे नागरिक"} द्वारा इसी समस्या की रिपोर्ट का पता लगाया है। डेटाबेस को साफ़ रखने के लिए, आपकी शिकायत को मौजूदा टिकट के साथ जोड़ दिया गया है!`
                    : `We detected an active report for this same issue in your immediate area reported in the last 45 minutes by ${successData.originalReporterName || "another Citizen"}. To keep the database clean, your submission has been grouped with the existing ticket!`
                  }
                </p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-100 flex-wrap text-[10px] text-slate-500 font-semibold">
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                     {lang === "hi" ? "शिकायतें समेकित" : "Traffic Count"}: {successData.trafficCount || 2}x
                  </span>
                  <span>•</span>
                  <span>{lang === "hi" ? "पहली रिपोर्ट" : "First logged"}: {new Date(successData.originalCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}

            {/* AI Docket Receipt Card */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left my-4 font-sans space-y-3.5">
              <div className="flex justify-between items-start pb-2.5 border-b border-slate-200">
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    {lang === "hi" ? FORM_TRANSLATIONS.hi.lblAssignedDept : FORM_TRANSLATIONS.en.lblAssignedDept}
                  </div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <span>{departmentIcons[successData.department] || "📋"}</span>
                    <span>{successData.department}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    {lang === "hi" ? FORM_TRANSLATIONS.hi.lblUrgency : FORM_TRANSLATIONS.en.lblUrgency}
                  </div>
                  <span
                    className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded mt-1 uppercase ${
                      successData.urgency === "High"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : successData.urgency === "Medium"
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {lang === "hi"
                      ? `${successData.urgency === "High" ? "उच्च" : successData.urgency === "Medium" ? "मध्यम" : "निम्न"} ${FORM_TRANSLATIONS.hi.lblPrioritySuffix}`
                      : `${successData.urgency} ${FORM_TRANSLATIONS.en.lblPrioritySuffix}`
                    }
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2.5 border-b border-slate-200">
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.lblExtractedLandmark : FORM_TRANSLATIONS.en.lblExtractedLandmark}</span>
                  </div>
                  <div className="text-xs text-slate-800 font-bold mt-0.5">{successData.cleanLocation}</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                    GPS: {successData.latitude.toFixed(5)}, {successData.longitude.toFixed(5)}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.lblSectorCivic : FORM_TRANSLATIONS.en.lblSectorCivic}</span>
                  </div>
                  <div className="text-xs text-slate-800 font-bold mt-0.5">{successData.sector || "Central Zone"}</div>
                  <span className="inline-block mt-1 text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                    Tagged: {successData.assignedBody || "MCD"}
                  </span>
                </div>
              </div>

              {successData.imageUrl && (
                <div className="space-y-1.5">
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    {lang === "hi" ? "संलग्न साक्ष्य" : "Attached Evidence"}
                  </div>
                  <div className="flex items-start gap-3 flex-wrap">
                    <img
                      src={successData.imageUrl}
                      alt="Grievance evidence photo"
                      className="w-24 h-16 object-cover rounded-md border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-[200px]">
                      {successData.imageVerificationStatus === "mismatch" ? (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-2 rounded-lg text-[10px] space-y-1">
                          <div className="font-extrabold uppercase tracking-wider text-red-900 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                            <span>{lang === "hi" ? "अपुष्ट चित्र / बेमेल साक्ष्य" : "Visual Mismatch / Unverified Image"}</span>
                          </div>
                          <p className="text-slate-600 leading-normal font-medium">
                            {lang === "hi"
                              ? `चेतावनी: आपकी फोटो हमारे जेमिनी एआई क्रॉस-मोडल अलाइनमेंट शील्ड द्वारा सत्यापित नहीं हो सकी। फोटो आपकी लिखित शिकायत की श्रेणी से मेल नहीं खाती है। फिर भी, आपकी शिकायत को '${successData.isConsolidatedDuplicate ? "समेकित" : "अपुष्ट चित्र"}' के रूप में दर्ज कर लिया गया है।`
                              : `Warning: Photo verification failed cross-modal alignment checks. Visuals do not justify or substantiate the textual category/claims. Your report is successfully recorded as 'unverified image'.`}
                          </p>
                          {successData.imageVerificationMessage && (
                            <div className="text-slate-500 italic mt-0.5 border-t border-red-100 pt-1">
                              AI: {successData.imageVerificationMessage}
                            </div>
                          )}
                        </div>
                      ) : successData.imageVerificationStatus === "verified" ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-lg text-[10px] space-y-1">
                          <div className="font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{lang === "hi" ? "चित्र सत्यापित" : "Visual Alignment Verified"}</span>
                          </div>
                          <p className="text-slate-600 leading-normal font-medium">
                            {lang === "hi"
                              ? "सफलता: आपकी फोटो लिखित श्रेणी और दावों के साथ पूरी तरह से मेल खाती है।"
                              : "Success: Your attached photo is verified and substantiates the textual category/claims."}
                          </p>
                          {successData.imageVerificationMessage && (
                            <div className="text-slate-500 italic mt-0.5 border-t border-emerald-100 pt-1">
                              AI: {successData.imageVerificationMessage}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium italic">
                          {lang === "hi" ? "फोटो सत्यापित नहीं (कोई साक्ष्य प्रदान नहीं किया गया)" : "No visual verification performed."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  {lang === "hi" ? FORM_TRANSLATIONS.hi.lblActionItem : FORM_TRANSLATIONS.en.lblActionItem}
                </div>
                <p className="text-[11px] text-slate-600 italic mt-0.5 leading-relaxed bg-slate-100/50 p-2.5 rounded border border-slate-200/40">
                  "{successData.summary}"
                </p>
              </div>

              {successData.category && (
                <div className="pt-2.5 border-t border-slate-200 grid grid-cols-2 gap-3 text-[11px] bg-slate-100/30 p-2 rounded-lg">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? FORM_TRANSLATIONS.hi.lblCategory : FORM_TRANSLATIONS.en.lblCategory}
                    </span>
                    <span className="font-semibold text-slate-800">{successData.category}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? FORM_TRANSLATIONS.hi.lblLanguage : FORM_TRANSLATIONS.en.lblLanguage}
                    </span>
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">{successData.detectedLanguage || "English"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? FORM_TRANSLATIONS.hi.lblSuggestedBody : FORM_TRANSLATIONS.en.lblSuggestedBody}
                    </span>
                    <span className="font-semibold text-slate-800">{successData.suggested_department}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? FORM_TRANSLATIONS.hi.lblAffectedDemographic : FORM_TRANSLATIONS.en.lblAffectedDemographic}
                    </span>
                    <span className="text-slate-600">{successData.affected_people}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? "विश्वास स्कोर" : "Confidence Score"}
                    </span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {successData.confidence}% {lang === "hi" ? "विश्वास" : "Confidence"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? "त्वरित प्राथमिकता" : "Urgency Priority"}
                    </span>
                    <span className="font-bold text-amber-700 font-mono">
                      {lang === "hi" ? `अंक: ${successData.urgencyScore || 5}/10` : `Score: ${successData.urgencyScore || 5}/10`}
                    </span>
                  </div>
                  {successData.keywords && successData.keywords.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        {lang === "hi" ? "कीवर्ड" : "Keywords"}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {successData.keywords.map((kw: string) => (
                          <span key={kw} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-mono">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full justify-center">
              {window.speechSynthesis && (
                <button
                  type="button"
                  onClick={() => {
                    const txt = lang === "hi" 
                      ? `शिकायत दर्ज हो गई है। विभाग ${successData.department} है। तात्कालिकता ${successData.urgency === "High" ? "उच्च" : "सामान्य"} है। स्थान ${successData.cleanLocation} है।`
                      : `Docket verified. Department is ${successData.department}. Urgency is ${successData.urgency}. Target landmark is ${successData.cleanLocation}.`;
                    speakDocket(txt, true);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.lblHearDocket : FORM_TRANSLATIONS.en.lblHearDocket}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-sm cursor-pointer text-center"
              >
                {lang === "hi" ? FORM_TRANSLATIONS.hi.lblFileAnother : FORM_TRANSLATIONS.en.lblFileAnother}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
