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

// IndexedDB helpers for offline queuing of grievance submissions
const OFF_DB_NAME = "civicpulse-offline-db";
const OFF_DB_VERSION = 2;

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFF_DB_NAME, OFF_DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("offline-submissions")) {
        db.createObjectStore("offline-submissions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("offline-ai-requests")) {
        db.createObjectStore("offline-ai-requests", { keyPath: "id" });
      }
    };
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
}

function saveGrievanceToOfflineQueue(grievance: any): Promise<any> {
  return openOfflineDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("offline-submissions", "readwrite");
      const store = transaction.objectStore("offline-submissions");
      const request = store.put(grievance);
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event: any) => reject(event.target.error);
    });
  });
}

function getOfflineQueuedGrievances(): Promise<any[]> {
  return openOfflineDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("offline-submissions", "readonly");
      const store = transaction.objectStore("offline-submissions");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event: any) => reject(event.target.error);
    });
  });
}

function deleteOfflineQueuedGrievance(id: string): Promise<void> {
  return openOfflineDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("offline-submissions", "readwrite");
      const store = transaction.objectStore("offline-submissions");
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = (event: any) => reject(event.target.error);
    });
  });
}

const departmentIcons: Record<string, string> = {
  "Garbage Report": "🗑️",
  "Water Logging": "💧",
  "Potholes": "🕳️"
};

interface GrievanceFormProps {
  onSubmissionSuccess?: (id: string, fullData?: any) => void;
  lang?: "en" | "hi" | "bn" | "kn" | "ta";
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
    descPlaceholder: "Tell us what is wrong, e.g. 'Large pothole near Block C.' Gemini AI parses details.",
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
    descPlaceholder: "हमें बताएं कि क्या गलत है, जैसे: 'ब्लॉक सी के पास बड़ा गड्ढा है।' जेमिनी एआई विश्लेषण करता है।",
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
  },
  bn: {
    submitTitle: "নাগরিক অভিযোগ জমা দিন",
    submitSub: "আমাদের এআই ডিসপ্যাচ সমন্বয়কারী ব্যবহার করে আপনার প্রতিবেদনটি তাৎক্ষণিকভাবে জিওকোড এবং বরাদ্দ করা হয়।",
    fullName: "পুরো নাম",
    fullNamePlaceholder: "উদাঃ রাজেশ কুমার",
    contactNo: "যোগাযোগ নম্বর / হোয়াটসঅ্যাপ",
    contactPlaceholder: "উদাঃ 9876543210",
    descLabel: "অভিযোগ এবং ল্যান্ডমার্ক (চিহ্নিত স্থান) বিবরণ",
    descPlaceholder: "কী সমস্যা তা বলুন, যেমন: 'ব্লক সি-র কাছে বড় গর্ত আছে।' জেমিনি এআই বিশ্লেষণ করে।",
    voiceMic: "ভয়েস মাইক",
    stopAndTranscribe: "থামুন এবং লিখুন",
    gpsBtn: "জিপিএস দ্বারা অবস্থান সনাক্ত করুন",
    gpsDetecting: "নাক্ত করা হচ্ছে...",
    gpsActive: "জিপিএস সক্রিয়",
    gpsAttachPhoto: "ছবি সংযুক্ত করুন (ঐচ্ছিক)",
    gpsClearPhoto: "ছবি মুছুন",
    gpsSelectImage: "ছবি নির্বাচন করুন",
    gpsTakePhoto: "ছবি তুলুন",
    gpsPhotoSuccess: "✓ ছবি সফলভাবে লোড হয়েছে",
    gpsPhotoTip: "গর্ত, আবর্জনার স্তূপ ইত্যাদির ছবি আপলোড করুন বা তুলুন (সর্বোচ্চ ২.৫ এমবি)",
    humanVerify: "নাগরিক যাচাইকরণ",
    humanVerifyDesc: "আমাদের সিস্টেম সুরক্ষিত রাখতে, অনুগ্রহ করে এই সাধারণ গণিত ধাঁধাটি সমাধান করুন:",
    humanAnswerPlaceholder: "উত্তর",
    btnSubmit: "অভিযোগ নথিভুক্ত করুন",
    btnSubmitting: "এআই বিশ্লেষণ এবং প্রেরণ করছে...",
    successTitle: "অভিযোগ সফলভাবে নিবন্ধিত হয়েছে",
    successSub: "এআই একটি অগ্রাধিকার নির্ধারণ করেছে এবং এই টিকিটটি তাৎক্ষণিকভাবে প্রেরণ করেছে। নিচে আপনার ডকেট বিবরণ দেওয়া হল:",
    lblAssignedDept: "বরাদ্দকৃত বিভাগ",
    lblUrgency: "জরুরী স্তর",
    lblPrioritySuffix: "অগ্রাধিকার",
    lblExtractedLandmark: "চিহ্নিত স্থান (ল্যান্ডমার্ক)",
    lblSectorCivic: "সেক্টর ও নাগরিক বরাদ্দ",
    lblActionItem: "এআই কার্যনির্বাহী অ্যাকশন আইটেম",
    lblCategory: "এআই বিভাগ",
    lblLanguage: "অভিযোগের ভাষা",
    lblSuggestedBody: "প্রস্তাবিত সংস্থা",
    lblAffectedDemographic: "প্রভাবিত জনসংখ্যা",
    lblConfidence: "আত্মবিশ্বাস স্কোর",
    lblHearDocket: "ডকেট বিবরণ শুনুন",
    lblFileAnother: "অন্য অভিযোগ করুন",
    gpsNotEnabled: "কোনো জিপিএস পাওয়া যায়নি (ডিফল্ট নতুন দিল্লি ব্যবহার করা হচ্ছে)",
    gpsLiveWarning: "📍 লাইভ জিপিএস সক্রিয়:",
  },
  kn: {
    submitTitle: "ನಾಗರಿಕ ದೂರನ್ನು ಸಲ್ಲಿಸಿ",
    submitSub: "ನಮ್ಮ ಎಐ ರವಾನೆ ಸಂಯೋಜಕವನ್ನು ಬಳಸಿಕೊಂಡು ನಿಮ್ಮ ವರದಿಯನ್ನು ಜಿಯೋಕೋಡ್ ಮಾಡಲಾಗುತ್ತದೆ ಮತ್ತು ತಕ್ಷಣವೇ ನಿಯೋಜಿಸಲಾಗುತ್ತದೆ.",
    fullName: "ಪೂರ್ಣ ಹೆಸರು",
    fullNamePlaceholder: "ಉದಾ: ರಾಜೇಶ್ ಕುಮಾರ್",
    contactNo: "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ / ವಾಟ್ಸಾಪ್",
    contactPlaceholder: "ಉದಾ: 9876543210",
    descLabel: "ದೂರು ಮತ್ತು ಹೆಗ್ಗುರುತು ವಿವರ",
    descPlaceholder: "ಏನು ಸಮಸ್ಯೆ ಇದೆ ಎಂದು ತಿಳಿಸಿ, ಉದಾ: 'ಬ್ಲಾಕ್ ಸಿ ಹತ್ತಿರ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದೆ.' ಜೆಮಿನಿ ಎಐ ವಿಶ್ಲೇಷಿಸುತ್ತದೆ.",
    voiceMic: "ಧ್ವನಿ ಮೈಕ್ರೊಫೋನ್",
    stopAndTranscribe: "ನಿಲ್ಲಿಸಿ ಮತ್ತು ಲಿಪ್ಯಂತರ ಮಾಡಿ",
    gpsBtn: "ಜಿಪಿಎಸ್ ಮೂಲಕ ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಿ",
    gpsDetecting: "ಪತ್ತೆ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    gpsActive: "ಜಿಪಿಎಸ್ ಸಕ್ರಿಯ",
    gpsAttachPhoto: "ಫೋಟೋ ಲಗತ್ತಿಸಿ (ಐಚ್ಛಿಕ)",
    gpsClearPhoto: "ಚಿತ್ರವನ್ನು ತೆಗೆದುಹಾಕಿ",
    gpsSelectImage: "ಚಿತ್ರವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ",
    gpsTakePhoto: "ಕಾರ್ಡ್ ಫೋಟೋ ತೆಗೆಯಿರಿ",
    gpsPhotoSuccess: "✓ ಚಿತ್ರ ಯಶಸ್ವಿಯಾಗಿ ಲೋಡ್ ಆಗಿದೆ",
    gpsPhotoTip: "ಗುಂಡಿಗಳು, ಕಸದ ರಾಶಿ ಇತ್ಯಾದಿಗಳ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ತೆಗೆಯಿರಿ (ಗರಿಷ್ಠ 2.5MB)",
    humanVerify: "ನಾಗರಿಕ ಪರಿಶೀಲನೆ",
    humanVerifyDesc: "ನಮ್ಮ ವ್ಯವಸ್ಥೆಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿಡಲು, ದಯವಿಟ್ಟು ಈ ಸರಳ ಗಣಿತದ ಒಗಟನ್ನು ಬಿಡಿಸಿ:",
    humanAnswerPlaceholder: "ಉತ್ತರ",
    btnSubmit: "ದೂರು ದಾಖಲಿಸಿ",
    btnSubmitting: "ಎಐ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ರವಾನಿಸುತ್ತಿದೆ...",
    successTitle: "ದೂರು ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದೆ",
    successSub: "ಎಐ ಆದ್ಯತೆಯ ರೇಟಿಂಗ್ ಅನ್ನು ನಿಗದಿಪಡಿಸಿದೆ ಮತ್ತು ಈ ಟಿಕೆಟ್ ಅನ್ನು ತಕ್ಷಣವೇ ರವಾನಿಸಿದೆ. ನಿಮ್ಮ ಡಾಕೆಟ್ ವಿವರಗಳು ಕೆಳಗಿನಂತಿವೆ:",
    lblAssignedDept: "ನಿಯೋಜಿತ ಇಲಾಹೆ",
    lblUrgency: "ತುರ್ತು ಮಟ್ಟ",
    lblPrioritySuffix: "ಆದ್ಯತೆ",
    lblExtractedLandmark: "ತೆಗೆಯಲಾದ ಹೆಗ್ಗುರುತು",
    lblSectorCivic: "ವಲಯ ಮತ್ತು ನಾಗರಿಕ ನಿಯೋಜನೆ",
    lblActionItem: "ಎಐ ಕಾರ್ಯನಿರ್ವಾಹಕ ಕ್ರಿಯೆಯ ಐಟಂ",
    lblCategory: "ಎಐ ವರ್ಗ",
    lblLanguage: "ದೂರಿನ ಭಾಷೆ",
    lblSuggestedBody: "ಸೂಚಿಸಲಾದ ಸಂಸ್ಥೆ",
    lblAffectedDemographic: "ಬಾಧಿತ ಜನಸಂಖ್ಯಾಶಾಸ್ತ್ರ",
    lblConfidence: "ನಂಬಿಕೆಯ ಸ್ಕೋರ್",
    lblHearDocket: "ಡಾಕೆಟ್ ವಿವರ ಕೇಳಿ",
    lblFileAnother: "ಮತ್ತೊಂದು ದೂರು ದಾಖಲಿಸಿ",
    gpsNotEnabled: "ಯಾವುದೇ ಜಿಪಿಎಸ್ ಕಂಡುಬಂದಿಲ್ಲ (ಡೀಫಾಲ್ಟ್ ನವದೆಹಲಿ)",
    gpsLiveWarning: "📍 ಲೈವ್ ಜಿಪಿಎಸ್ ಸಕ್ರಿಯವಾಗಿದೆ:",
  },
  ta: {
    submitTitle: "குடிமகன் புகாரை சமர்ப்பிக்கவும்",
    submitSub: "எங்கள் AI அனுப்புதல் ஒருங்கிணைப்பாளரைப் பயன்படுத்தி உங்கள் அறிக்கை புவிக்குறியீடு செய்யப்பட்டு உடனடியாக ஒதுக்கப்படும்.",
    fullName: "முழு பெயர்",
    fullNamePlaceholder: "எ.கா. ராஜேஷ் குமார்",
    contactNo: "தொடர்பு எண் / வாட்ஸ்அப்",
    contactPlaceholder: "எ.கா. 9876543210",
    descLabel: "புகார் மற்றும் அடையாளச் சின்னம் (லேண்ட்மார்க்) விவரம்",
    descPlaceholder: "என்ன பிரச்சனை என்று கூறுங்கள், எ.கா. 'பிளாக் சி அருகே பெரிய பள்ளம் உள்ளது.' ஜெமினி AI பகுப்பாய்வு செய்யும்.",
    voiceMic: "குரல் மைக்",
    stopAndTranscribe: "நிறுத்தி எழுதுக",
    gpsBtn: "ஜிபிஎஸ் மூலம் இருப்பிடத்தைக் கண்டறி",
    gpsDetecting: "கண்டறியப்படுகிறது...",
    gpsActive: "ஜிபிஎஸ் செயலில் உள்ளது",
    gpsAttachPhoto: "புகைப்படத்தை இணைக்கவும் (விருப்பத்திற்குரியது)",
    gpsClearPhoto: "படத்தை அகற்று",
    gpsSelectImage: "படத்தைத் தேர்ந்தெடு",
    gpsTakePhoto: "புகைப்படம் எடு",
    gpsPhotoSuccess: "✓ படம் வெற்றிகரமாக ஏற்றப்பட்டது",
    gpsPhotoTip: "பள்ளங்கள், குப்பைக் குவியல்கள் போன்றவற்றுக்கான புகைப்படத்தை பதிவேற்றவும் அல்லது எடுக்கவும் (அதிகபட்சம் 2.5MB)",
    humanVerify: "குடிமகன் சரிபார்ப்பு",
    humanVerifyDesc: "எங்கள் அமைப்பைப் பாதுகாப்பாக வைக்க, இந்த எளிய கணித புதிருக்கு விடையளிக்கவும்:",
    humanAnswerPlaceholder: "பதில்",
    btnSubmit: "புகாரைப் பதிவு செய்க",
    btnSubmitting: "AI பகுப்பாய்வு செய்து அனுப்புகிறது...",
    successTitle: "புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது",
    successSub: "AI முன்னுரிமை மதிப்பீட்டை வழங்கி, இந்த டிக்கெட்டை உடனடியாக அனுப்பியுள்ளது. உங்கள் ஆவண விவரங்கள் கீழே கொடுக்கப்பட்டுள்ளன:",
    lblAssignedDept: "ஒதுக்கப்பட்ட துறை",
    lblUrgency: "அவசர நிலை",
    lblPrioritySuffix: "முன்னுரிமை",
    lblExtractedLandmark: "கண்டறியப்பட்ட அடையாளச் சின்னம்",
    lblSectorCivic: "செக்டார் மற்றும் குடிமை ஒதுக்கீடு",
    lblActionItem: "AI நிர்வாக நடவடிக்கை உருப்படி",
    lblCategory: "AI வகை",
    lblLanguage: "புகாரின் மொழி",
    lblSuggestedBody: "பரிந்துரைக்கப்பட்ட அமைப்பு",
    lblAffectedDemographic: "பாதிக்கப்பட்ட மக்கள் தொகை",
    lblConfidence: "நம்பிக்கை மதிப்பெண்",
    lblHearDocket: "விவரங்களைக் கேளுங்கள்",
    lblFileAnother: "மற்றொரு புகாரைப் பதிவு செய்",
    gpsNotEnabled: "ஜிபிஎஸ் கண்டறியப்படவில்லை (இயல்புநிலை புது தில்லி)",
    gpsLiveWarning: "📍 நேரடி ஜிபிஎஸ் செயல்படுகிறது:",
  }
};




const SUGGESTION_TRANSLATIONS = {
  en: {
    submitTitle: "Submit Development Suggestion",
    submitSub: "Propose infrastructure upgrades, public parks, or community facilities directly to the MP planning board.",
    descLabel: "Describe Proposal & Public Impact Detail",
    descPlaceholder: "Describe your developmental proposal, e.g., 'An open-air gym and wellness pathway in Lajpat Nagar Block C empty plot for seniors and residents.' Gemini AI analyzes feasibility and integrates it directly into the MP planning dashboard.",
    btnSubmit: "Submit Proposal to MP",
    successTitle: "Development Suggestion Registered Successfully",
    successSub: "Our AI Planner has analyzed your developmental suggestion and integrated it directly into the MP planning dashboard. Details:"
  },
  hi: {
    submitTitle: "विकास का सुझाव साझा करें",
    submitSub: "बुनियादी ढांचे में सुधार, सार्वजनिक पार्क, या सामुदायिक सुविधाओं का प्रस्ताव सीधे सांसद योजना बोर्ड को भेजें।",
    descLabel: "प्रस्ताव और सार्वजनिक प्रभाव का विवरण",
    descPlaceholder: "अपने विकास प्रस्ताव का वर्णन करें, जैसे 'वरिष्ठ नागरिकों और निवासियों के लिए लाजपत नगर ब्लॉक सी खाली भूखंड में ओपन-एयर जिम और वेलनेस पाथवे स्थापित करें।' जेमिनी एआई व्यवहार्यता का विश्लेषण करता है और सीधे सांसद योजना डैशबोर्ड में शामिल करता है।",
    btnSubmit: "सांसद को प्रस्ताव भेजें",
    successTitle: "विकास का सुझाव सफलतापूर्वक दर्ज",
    successSub: "हमारे एआई योजनाकार ने आपके सुझाव का विश्लेषण किया है और इसे एमपी डैशबोर्ड में एकीकृत कर दिया है। विवरण:"
  },
  bn: {
    submitTitle: "উন্নয়নমূলক পরামর্শ জমা দিন",
    submitSub: "সরাসরি এমপি পরিকল্পনা বোর্ডের কাছে অবকাঠামো উন্নয়ন, পাবলিক পার্ক বা কমিউনিটি সুবিধার প্রস্তাব করুন।",
    descLabel: "প্রস্তাব এবং জনস্বার্থের বিবরণ",
    descPlaceholder: "আপনার উন্নয়নমূলক প্রস্তাবের বর্ণনা দিন, যেমন 'প্রবীণ নাগরিক এবং বাসিন্দাদের সুস্থতার জন্য লাজপত নগর ব্লক সি খালি প্লটে একটি ওপেন-এয়ার জিম এবং ফিটনেস পথ তৈরি করা হোক।' জেমিনি এআই এটি বিশ্লেষণ করে এমপি পরিকল্পনা ড্যাশবোর্ডে অন্তর্ভুক্ত করবে।",
    btnSubmit: "এমপির কাছে প্রস্তাব পাঠান",
    successTitle: "উন্নয়নমূলক পরামর্শ সফলভাবে নথিভুক্ত",
    successSub: "আমাদের এআই প্ল্যানার আপনার পরামর্শটি বিশ্লেষণ করেছে এবং এমপি পরিকল্পনা ড্যাশবোর্ডে সরাসরি যুক্ত করেছে। বিবরণ:"
  },
  kn: {
    submitTitle: "ಅಭಿವೃದ್ಧಿ ಸಲಹೆಯನ್ನು ಸಲ್ಲಿಸಿ",
    submitSub: "ಮೂಲಸೌಕರ್ಯ ಮೇಲ್ದರ್ಜೆಗೇರಿಸುವಿಕೆ, ಸಾರ್ವಜನಿಕ ಉದ್ಯಾನವನಗಳು ಅಥವಾ ಸಮುದಾಯ ಸೌಲಭ್ಯಗಳ ಪ್ರಸ್ತಾಪವನ್ನು ನೇರ ಸಂಸದರ ಯೋಜನೆ ಮಂಡಳಿಗೆ ಸಲ್ಲಿಸಿ.",
    descLabel: "ಪ್ರಸ್ತಾಪ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಪ್ರಭಾವದ ವಿವರಣೆ",
    descPlaceholder: "ನಿಮ್ಮ ಅಭಿವೃದ್ಧಿ ಪ್ರಸ್ತಾಪವನ್ನು ವಿವರಿಸಿ, ಉದಾಹರಣೆಗೆ 'ಹಿರಿಯ ನಾಗರಿಕರು ಮತ್ತು ನಿವಾಸಿಗಳಿಗಾಗಿ ಲಜಪತ್ ನಗರದ ಬ್ಲಾಕ್ ಸಿ ಖಾಲಿ ಜಾಗದಲ್ಲಿ ಬಯಲು ಜಿಮ್ ಮತ್ತು ವಾಕಿಂಗ್ ಟ್ರ್ಯಾಕ್ ನಿರ್ಮಿಸುವುದು.' ಜೆಮಿನಿ ಎಐ ಇದನ್ನು ವಿಶ್ಲೇಷಿಸಿ ನೇರವಾಗಿ ಸಂಸದರ ಯೋಜನೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸೇರಿಸುತ್ತದೆ.",
    btnSubmit: "ಸಂಸದರಿಗೆ ಪ್ರಸ್ತಾಪವನ್ನು ಸಲ್ಲಿಸಿ",
    successTitle: "ಅಭಿವೃದ್ಧಿ ಸಲಹೆ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ",
    successSub: "ನಮ್ಮ ಎಐ ಯೋಜಕರು ನಿಮ್ಮ ಸಲಹೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಿದ್ದಾರೆ ಮತ್ತು ನೇರವಾಗಿ ಸಂಸದರ ಯೋಜನೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸಂಯೋಜಿಸಿದ್ದಾರೆ. ವಿವರಗಳು:"
  },
  ta: {
    submitTitle: "வளர்ச்சி பரிந்துரையைச் சமர்ப்பிக்கவும்",
    submitSub: "கட்டமைப்பு மேம்பாடுகள், பொதுப் பூங்காக்கள் அல்லது சமூக வசதிகள் குறித்த திட்டங்களை நேரடியாக எம்பி திட்டமிடல் குழுவுக்குப் பரிந்துரைக்கவும்.",
    descLabel: "திட்டம் மற்றும் பொதுப் பயன் பற்றிய விவரம்",
    descPlaceholder: "உங்கள் வளர்ச்சிப் பரிந்துரையை விவரிக்கவும், எ.கா. 'முதியவர்கள் மற்றும் குடியிருப்பாளர்களின் நலனுக்காக லஜ்பத் நகர் பிளாக் சி காலியிடத்தில் உடற்பயிற்சி கூடம் மற்றும் நடைபாதை அமைத்தல்.' ஜெமினி AI இதைப் பகுப்பாய்வு செய்து எம்பி திட்டமிடல் குழுவில் ஒருங்கிணைக்கும்.",
    btnSubmit: "எம்பிக்கு திட்டத்தைப் பரிந்துரைக்கவும்",
    successTitle: "வளர்ச்சி பரிந்துரை வெற்றிகரமாக பதிவு செய்யப்பட்டது",
    successSub: "எங்கள் AI திட்டமிடுபவர் உங்கள் பரிந்துரையப் பகுப்பாய்வு செய்து எம்பி திட்டமிடல் குழுவில் நேரடியாக ஒருங்கிணைத்துள்ளார். விவரங்கள்:"
  }
};

const FOCUS_AREAS = [
  {
    icon: "🌳",
    id: "parks",
    label: {
      en: "Public Parks",
      hi: "पब्लिक पार्क",
      bn: "পাবলিক পার্ক",
      kn: "ಸಾರ್ವಜನಿಕ ಉದ್ಯಾನ",
      ta: "பொதுப் பூங்கா"
    },
    template: {
      en: "Requesting establishing a modern citizen park with green plantations, native shade trees, and elder seating in the area around...",
      hi: "वरिष्ठ नागरिकों और बच्चों के स्वास्थ्य के लिए इस क्षेत्र में छायादार वृक्षों, बैठने की बेंचों और हरियाली से युक्त एक आधुनिक नागरिक पार्क स्थापित करने का प्रस्ताव...",
      bn: "এলাকায় সবুজ গাছপালা, বসার জায়গা এবং প্রবীণদের হাঁটার ট্র্যাক সহ একটি আধুনিক নাগরিক পার্ক গড়ে তোলার জন্য অনুরোধ...",
      kn: "ಹಿರಿಯ ನಾಗರಿಕರು ಮತ್ತು ಮಕ್ಕಳಿಗಾಗಿ ನೆರಳಿನ ಮರಗಳು, ಆಸನಗಳು ಮತ್ತು ಹಸಿರಿನಿಂದ ಕೂಡಿದ ಸಾರ್ವಜನಿಕ ಉದ್ಯಾನವನವನ್ನು ನಿರ್ಮಿಸಲು ಪ್ರಸ್ತಾಪ...",
      ta: "இப்பகுதியில் நிழல் தரும் மரங்கள், அமரும் வசதிகள் மற்றும் பசுமையுடன் கூடிய நவீன பொதுப் பூங்கா அமைக்க கோரிக்கை..."
    }
  },
  {
    icon: "💡",
    id: "solar",
    label: {
      en: "Solar Streetlights",
      hi: "सौर स्ट्रीटलाइट्स",
      bn: "সೌর স্ট্রিটলাইট",
      kn: "ಸೌರ ಬೀದಿ ದೀಪಗಳು",
      ta: "சூரிய ஒளி விளக்குகள்"
    },
    template: {
      en: "Requesting the installation of energy-efficient solar streetlights and safety lights along the poorly lit lanes near...",
      hi: "महिला सुरक्षा और रात में सुविधा के लिए अंधेरी गलियों और मुख्य मार्गों पर ऊर्जा-कुशल सौर स्ट्रीटलाइट्स और सुरक्षा लाइटें लगाने का अनुरोध...",
      bn: "রাতের নিরাপত্তা ও সুবিধার জন্য অন্ধকার রাস্তা ও লেনে শক্তি-সাশ্রয়ী সৌর স্ট্রিটলাইট এবং জরুরি আলো স্থাপনের অনুরোধ...",
      kn: "ರಾತ್ರಿಯ ಸುರಕ್ಷತೆಗಾಗಿ ಕತ್ತಲೆ ಇರುವ ರಸ್ತೆಗಳಲ್ಲಿ ಸೌರ ಬೀದಿ ದೀಪಗಳು ಮತ್ತು ಸುರಕ್ಷತಾ ದೀಪಗಳನ್ನು ಅಳವಡಿಸಲು ವಿನಂತಿ...",
      ta: "இரவு நேரப் பாதுகாப்பிற்காக இருண்ட தெருக்களில் சூரிய ஒளி மின்விளக்குகளை அமைக்கக் கோரிக்கை..."
    }
  },
  {
    icon: "🏫",
    id: "schools",
    label: {
      en: "School Upgrades",
      hi: "स्कूल उन्नयन",
      bn: "বিদ্যালয় আধুনিকীকরণ",
      kn: "ಶಾಲಾ ಮೇಲ್ದರ್ಜೆ",
      ta: "பள்ளி மேம்பாடு"
    },
    template: {
      en: "Proposing upgrading the local primary school with an e-learning digital center, smartboards, and clean safe drinking water facilities at...",
      hi: "स्थानीय प्राथमिक विद्यालय को ई-लर्निंग डिजिटल सेंटर, स्मार्टबोर्ड, और स्वच्छ सुरक्षित पेयजल सुविधाओं के साथ उन्नत (अपग्रेड) करने का प्रस्ताव...",
      bn: "স্থানীয় প্রাথমিক বিদ্যালয়ে ই-লার্নিং ডিজিটাল সেন্টার, স্মার্টবোর্ড এবং বিশুদ্ধ পানীয় জলের ব্যবস্থা সহ আধুনিকীকরণের প্রস্তাব...",
      kn: "ಸ್ಥಳೀಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆಯಲ್ಲಿ ಇ-ಲರ್ನಿಂಗ್ ಡಿಜಿಟಲ್ ಕೇಂದ್ರ, ಸ್ಮಾರ್ಟ್‌ಬೋರ್ಡ್ ಮತ್ತು ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಸೌಲಭ್ಯ ಕಲ್ಪಿಸಲು ಪ್ರಸ್ತಾಪ...",
      ta: "உள்ளூர் ஆரம்பப் பள்ளியில் மின்-கற்றல் வசதி, ஸ்மார்ட்போர்டு மற்றும் தூய குடிநீர் வசதிகளுடன் மேம்படுத்த முன்மொழிவு..."
    }
  },
  {
    icon: "🩺",
    id: "health",
    label: {
      en: "Health Center",
      hi: "स्वास्थ्य केंद्र",
      bn: "স্বাস্থ্য কেন্দ্র",
      kn: "ಆರೋಗ್ಯ ಕೇಂದ್ರ",
      ta: "சுகாதார நிலையம்"
    },
    template: {
      en: "Proposing a public Mohalla Health Clinic / primary dispensary to serve maternal wellness and senior medical checkups near...",
      hi: "महिलाओं, बच्चों और बुजुर्गों की नियमित चिकित्सा जांच और प्राथमिक उपचार के लिए एक स्थानीय मोहल्ला क्लिनिक / प्राथमिक स्वास्थ्य केंद्र स्थापित करने का प्रस्ताव...",
      bn: "গর্ভবতী মহিলাদের এবং প্রবীণদের চিকিৎসার সুবিধার্থে একটি স্থানীয় প্রাথমিক স্বাস্থ্য কেন্দ্র বা ডিসপেনসারি স্থাপনের প্রস্তাব...",
      kn: "ಗರ್ಭಿಣಿಯರು ಮತ್ತು ಹಿರಿಯ ನಾಗರಿಕರ ಅನುಕೂಲಕ್ಕಾಗಿ ಸ್ಥಳೀಯ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ ಅಥವಾ ಡಿಸ್ಪೆನ್ಸರಿ ಸ್ಥಾಪಿಸಲು ಪ್ರಸ್ತಾಪ...",
      ta: "மகப்பேறு நலம் மற்றும் முதியோர்களின் மருத்துவச் சிகிச்சைக்காக ஆரம்ப சுகாதார நிலையம் அமைக்க முன்மொழிவு..."
    }
  },
  {
    icon: "🛣",
    id: "pathways",
    label: {
      en: "Pedestrian Paths",
      hi: "पैदल मार्ग",
      bn: "পথচারী পথ",
      kn: "ಪಾದಚಾರಿ ಮಾರ್ಗ",
      ta: "நடைபாதை வசதி"
    },
    template: {
      en: "Proposing laying a smooth pedestrian walking track, sidewalk safety guards, and a bicycle lane on the main avenue near...",
      hi: "पैदल यात्रियों की सुरक्षा के लिए मुख्य मार्ग के किनारे फुटपाथ (पैदल मार्ग), सुरक्षा गार्ड और एक साइकिल लेन बनाने का प्रस्ताव...",
      bn: "পথচারীদের সুরক্ষার জন্য ফুটপাথ, সেফটি গার্ড এবং একটি সাইকেল লেন তৈরি করার প্রস্তাব...",
      kn: "ಪಾದಚಾರಿಗಳ ಸುರಕ್ಷತೆಗಾಗಿ ರಸ್ತೆಯ ಬದಿಯಲ್ಲಿ ಸುಗಮ ನಡಿಗೆ ಮಾರ್ಗ, ರಕ್ಷಣಾ ಬೇಲಿ ಮತ್ತು ಸೈಕಲ್ ಪಥ ನಿರ್ಮಿಸಲು ಪ್ರಸ್ತಾಪ...",
      ta: "பாதசாரிகளின் பாதுகாப்பிற்காக நடைபாதை மற்றும் மிதிவண்டிப் பாதை அமைக்க முன்மொழிவு..."
    }
  },
  {
    icon: "♻",
    id: "recycling",
    label: {
      en: "Recycling Hub",
      hi: "कचरा पुनर्चक्रण",
      bn: "বর্জ্য পুনর্ব্যবহার",
      kn: "ಮರುಬಳಕೆ ಕೇಂದ್ರ",
      ta: "மறுசுழற்சி மையம்"
    },
    template: {
      en: "Proposing setting up a dry-wet waste segregation center with a community composting machine to treat organic waste locally at...",
      hi: "स्थानीय स्तर पर जैविक कचरे के निपटान के लिए सूखे और गीले कचरे के पृथक्करण केंद्र के साथ एक सामुदायिक कम्पोस्टिंग मशीन स्थापित करने का प्रस्ताव...",
      bn: "স্থানীয়ভাবে জৈব বর্জ্য প্রক্রিয়াকরণের জন্য শুকনো ও ভেজা বর্জ্য পৃথকীকরণ কেন্দ্র এবং একটি কমিউনিটি কম্পোস্টিং মেশিন স্থাপনের প্রস্তাব...",
      kn: "ಸ್ಥಳೀಯವಾಗಿ ಹಸಿ ಮತ್ತು ಒಣ ಕಸ ಬೇರ್ಪಡಿಸುವ ಘಟಕ ಹಾಗೂ ರಸಗೊಬ್ಬರ ತಯಾರಿಕಾ ಯಂತ್ರ ಸ್ಥಾಪಿಸಲು ಪ್ರಸ್ತಾಪ...",
      ta: "உள்ளூரிலேயே குப்பைகளைத் தரம் பிரித்து, உரம் தயாரிக்கும் மறுசுழற்சி இயந்திரங்களை அமைக்க முன்மொழிவு..."
    }
  }
];

export default function GrievanceForm({ onSubmissionSuccess, lang = "en" }: GrievanceFormProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [isSuggestion, setIsSuggestion] = useState(false);
  const [impactScale, setImpactScale] = useState<string>("100 - 1,000");

  const submissionTypeLabels = {
    en: {
      typeLabel: "Submission Type",
      grievance: "Grievance / Issue",
      suggestion: "Development Suggestion"
    },
    hi: {
      typeLabel: "प्रस्तुति का प्रकार",
      grievance: "शिकायत / समस्या",
      suggestion: "विकास का सुझाव"
    },
    bn: {
      typeLabel: "জমার ধরণ",
      grievance: "অভিযোগ / সমস্যা",
      suggestion: "উন্নয়নমূলক পরামর্শ"
    },
    kn: {
      typeLabel: "ಸಲ್ಲಿಕೆ ಪ್ರಕಾರ",
      grievance: "ದೂರು / ಸಮಸ್ಯೆ",
      suggestion: "ಅಭಿವೃದ್ಧಿ ಸಲಹೆ"
    },
    ta: {
      typeLabel: "சமர்ப்பிப்பு வகை",
      grievance: "புகார் / பிரச்சனை",
      suggestion: "வளர்ச்சி பரிந்துரை"
    }
  };
  
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

  // Offline queuing and sync state
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncingState] = useState<boolean>(false);
  const isSyncingRef = useRef<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const setIsSyncing = (val: boolean) => {
    isSyncingRef.current = val;
    setIsSyncingState(val);
  };

  // Sync function declared in component scope
  const syncOfflineSubmissions = async () => {
    if (isSyncingRef.current) return;
    setIsSyncing(true);
    try {
      const queued = await getOfflineQueuedGrievances();
      if (queued.length === 0) {
        setOfflineQueueCount(0);
        setIsSyncing(false);
        return;
      }
      
      console.log(`[Offline Sync] Found ${queued.length} pending offline grievances. Starting upload...`);
      
      for (const item of queued) {
        try {
          let finalGrievanceData = null;
          
          if (item.isAnalyzed === false) {
            console.log(`[Offline Sync] Item ${item.id} is un-analyzed. Triggering background AI analysis...`);
            
            // Extract image content if attached
            let imageData: string | undefined = undefined;
            let imageMimeType: string | undefined = undefined;
            if (item.imagePreview) {
              imageMimeType = item.imagePreview.substring(item.imagePreview.indexOf(":") + 1, item.imagePreview.indexOf(";"));
              imageData = item.imagePreview.split(",")[1];
            }

            const response = await fetch("/api/analyze-grievance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                description: item.description,
                userLatitude: item.gpsLocation ? item.gpsLocation.lat : undefined,
                userLongitude: item.gpsLocation ? item.gpsLocation.lng : undefined,
                imageData,
                imageMimeType,
                isSuggestion: item.isSuggestion
              })
            });

            if (!response.ok) {
              throw new Error("AI analysis on sync failed: " + response.statusText);
            }

            const aiAnalysis = await response.json();
            
            // Classify sector and assignedBody
            let sector = "Central Zone";
            let assignedBody = "MCD";
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

            let mappedDept: "Garbage Report" | "Water Logging" | "Potholes" = "Garbage Report";
            const categoryLower = (aiAnalysis.category || "").toLowerCase();
            const suggestedDeptLower = (aiAnalysis.suggested_department || "").toLowerCase();
            const descLower = item.description.toLowerCase();
            
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

            finalGrievanceData = {
              name: item.name,
              contact: item.contact,
              description: item.description,
              department: mappedDept,
              urgency: mappedUrgency,
              cleanLocation: aiAnalysis.cleanLocation || "Connaught Place, New Delhi",
              summary: aiAnalysis.summary || ("Citizen reported issue: " + item.description.substring(0, 60)),
              latitude: lat,
              longitude: lng,
              status: "Open",
              createdAt: item.createdAt || new Date().toISOString(),
              imageUrl: item.imagePreview || "",
              sector,
              assignedBody,
              isSuggestion: aiAnalysis.isSuggestion !== undefined ? aiAnalysis.isSuggestion : item.isSuggestion,
              impactScale: item.isSuggestion ? item.impactScale : null,
              category: aiAnalysis.category || "Solid Waste",
              severity: aiAnalysis.severity || "Medium",
              urgencyScore: aiAnalysis.urgency || 5,
              affected_people: aiAnalysis.affected_people || "Local residents",
              suggested_department: aiAnalysis.suggested_department || "MCD",
              confidence: aiAnalysis.confidence || 90,
              keywords: aiAnalysis.keywords || [],
              detectedLanguage: aiAnalysis.detectedLanguage || "English",
              imageVerificationStatus: aiAnalysis.imageVerificationStatus || (item.imagePreview ? "verified" : "not_attached"),
              imageVerificationMessage: aiAnalysis.imageVerificationMessage || (item.imagePreview ? "Photo uploaded" : "No photo attached"),
              guardrailRelevanceScore: aiAnalysis.guardrailRelevanceScore !== undefined ? aiAnalysis.guardrailRelevanceScore : 1.0,
              guardrailFlaggedReason: aiAnalysis.guardrailFlaggedReason || "NONE",
              guardrailResolvedCategory: aiAnalysis.guardrailResolvedCategory || "Garbage",
              guardrailExecutiveSummary: aiAnalysis.guardrailExecutiveSummary || item.description,
              trafficCount: 1,
              reportersList: [
                {
                  name: item.name,
                  contact: item.contact,
                  reportedAt: item.createdAt || new Date().toISOString(),
                  description: item.description,
                }
              ]
            };
          } else {
            // Already analyzed, just retrieve the firestore payload from the item
            const { id, isOfflineOnly, isAnalyzed, ...rest } = item;
            finalGrievanceData = rest;
          }

          // Check for active duplicates in Firestore to prevent Artificial Priority Inflation
          const grievancesRef = collection(db, "grievances");
          const q = query(grievancesRef, where("status", "==", "Open"));
          let querySnapshot = null;
          try {
            querySnapshot = await getDocs(q);
          } catch (err) {
            console.warn("[Offline Sync] Firestore duplicate check failed. Proceeding as fresh ticket:", err);
          }

          let matchedGrievanceId: string | null = null;
          let matchedGrievanceData: any = null;
          const nowTime = new Date(finalGrievanceData.createdAt || new Date().toISOString()).getTime();

          if (querySnapshot) {
            querySnapshot.forEach((docSnap) => {
              if (matchedGrievanceId) return;
              const data = docSnap.data();
              
              const isSameDept = data.department === finalGrievanceData.department;
              const createdTime = new Date(data.createdAt).getTime();
              const diffMins = Math.abs(nowTime - createdTime) / (1000 * 60);
              const isWithinTimeBuffer = diffMins <= 45;
              
              const dist = getDistanceInMeters(
                finalGrievanceData.latitude,
                finalGrievanceData.longitude,
                data.latitude || 0,
                data.longitude || 0
              );
              const isCloseArea = dist <= 350;
              
              if (isSameDept && isWithinTimeBuffer && isCloseArea) {
                matchedGrievanceId = docSnap.id;
                matchedGrievanceData = { id: docSnap.id, ...data };
              }
            });
          }

          if (matchedGrievanceId) {
            // Consolidate reporter under matched ticket (Anti-priority inflation)
            console.log(`[Offline Sync] Duplicate found for synced item ${item.id}. Consolidating under Firestore ID: ${matchedGrievanceId}`);
            const existingDocRef = doc(db, "grievances", matchedGrievanceId);
            const currentTraffic = matchedGrievanceData.trafficCount || 1;
            const currentReporters = matchedGrievanceData.reportersList || [];
            const currentAssociatedReports = matchedGrievanceData.associatedUserReports || [];
            
            const newReport = {
              name: item.name,
              contact: item.contact,
              reportedAt: item.createdAt || new Date().toISOString(),
              description: item.description,
            };

            const updatedReporters = [...currentReporters, newReport];
            const updatedAssociatedReports = [...currentAssociatedReports, newReport];

            await updateDoc(existingDocRef, {
              trafficCount: currentTraffic + 1,
              reportersList: updatedReporters,
              associatedUserReports: updatedAssociatedReports,
            });
            console.log(`[Offline Sync] Successfully consolidated offline report under existing ID: ${matchedGrievanceId}`);
          } else {
            // No duplicate, submit fresh to Firestore
            const docRef = await addDoc(collection(db, "grievances"), finalGrievanceData);
            console.log(`[Offline Sync] Successfully uploaded queued grievance. New ID: ${docRef.id}`);
          }
          
          // Remove from local queue
          await deleteOfflineQueuedGrievance(item.id);
        } catch (uploadErr) {
          console.error(`[Offline Sync] Failed to upload grievance with temp ID ${item.id}:`, uploadErr);
          break;
        }
      }
      
      const remaining = await getOfflineQueuedGrievances();
      setOfflineQueueCount(remaining.length);
    } catch (syncErr) {
      console.error("[Offline Sync] Error during synchronization:", syncErr);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load offline queue count on mount
  useEffect(() => {
    getOfflineQueuedGrievances()
      .then((queued) => {
        setOfflineQueueCount(queued.length);
        if (queued.length > 0 && navigator.onLine) {
          syncOfflineSubmissions();
        }
      })
      .catch((err) => console.error("Error reading offline queue on mount:", err));
  }, []);

  // Sync and connection state tracking when online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("[Network] Connection restored. Triggering offline queue sync...");
      syncOfflineSubmissions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("[Network] Connection lost.");
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Periodic background synchronization every 15 seconds if online and queue has items
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && offlineQueueCount > 0 && !isSyncingRef.current) {
        console.log("[Network Sync] Periodic sync check triggered for", offlineQueueCount, "queued items...");
        syncOfflineSubmissions();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [offlineQueueCount]);

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
                
                // Automatically detect the spoken language and update the En, Hindi, Hinglish option selection
                const detected = responseData.detectedLanguage;
                if (detected === "Hindi" || detected === "hi") {
                  setSpeechLang("hi-IN");
                } else if (detected === "Hinglish" || detected === "hinglish") {
                  setSpeechLang("en-IN-hinglish");
                } else if (detected === "English" || detected === "en") {
                  setSpeechLang("en-IN");
                }
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
    try {
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
    } catch (err) {
      console.warn("Speech synthesis read out blocked by browser or is unsupported:", err);
      setIsSpeaking(false);
    }
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

  const handleWhatsAppSubmit = () => {
    if (!name.trim() || !contact.trim() || !description.trim()) {
      setError(
        lang === "hi"
          ? "कृपया व्हाट्सएप के माध्यम से भेजने से पहले सभी आवश्यक क्षेत्रों को भरें।"
          : "Please fill out Name, Contact, and Description before sending via WhatsApp."
      );
      return;
    }

    // Name check
    const cleanName = name.trim();
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(cleanName)) {
      setError(
        lang === "hi"
          ? "पूरा नाम केवल वर्णमाला के अक्षरों का होना चाहिए।"
          : "Full Name must contain only alphabetical characters (letters and spaces)."
      );
      return;
    }

    // Contact check
    const cleanPhone = contact.trim();
    const isLeadingZero = cleanPhone.startsWith("0");
    const isValidPhone = isLeadingZero ? /^\d{11}$/.test(cleanPhone) : /^\d{10}$/.test(cleanPhone);
    if (!isValidPhone) {
      setError(
        isLeadingZero
          ? "Contact number with a leading zero must be exactly 11 digits."
          : "Contact number must be exactly 10 digits."
      );
      return;
    }

    // Construct the wa.me text
    const locationString = gpsLocation 
      ? `${gpsLocation.lat.toFixed(5)}, ${gpsLocation.lng.toFixed(5)} (${gpsStatus || "GPS Coordinated"})`
      : "Default New Delhi / Local landmark specified in description";

    const imageNote = imagePreview 
      ? "Yes (Please attach your captured photo/evidence in this chat)"
      : "No";

    const templateText = 
`*CIVICPULSE AI COMPLAINT REPORT*
----------------------------------------
*Citizen Name:* ${cleanName}
*Contact Number:* ${cleanPhone}
*Location / Landmark:* ${locationString}
*Issue Description:* ${description.trim()}
*Evidence Image Attached:* ${imageNote}
----------------------------------------
_Report compiled by CivicPulse AI Citizen Hub_`;

    // Encode message
    const encodedText = encodeURIComponent(templateText);
    
    // Default helpline number (can be customized)
    const helplineNumber = "919999999999";
    const waUrl = `https://wa.me/${helplineNumber}?text=${encodedText}`;

    // Telemetry event log
    sendTelemetryEvent("whatsapp_template_launched", {
      name: cleanName,
      contact: cleanPhone,
      hasGps: !!gpsLocation,
      hasImage: !!imagePreview,
      descriptionLength: description.length
    });

    // Open link in new tab - behaves exactly like Flutter's url_launcher!
    window.open(waUrl, "_blank");
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

      let aiAnalysis = null;
      let isSavedOfflineOnly = false;

      // 1. Send description to the server for Gemini processing with a 35-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      try {
        if (!navigator.onLine) {
          throw new Error("offline");
        }

        const response = await fetch("/api/analyze-grievance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            description,
            userLatitude: gpsLocation ? gpsLocation.lat : undefined,
            userLongitude: gpsLocation ? gpsLocation.lng : undefined,
            imageData,
            imageMimeType,
            isSuggestion
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error("Gemini AI analysis failed. Please try again.");
        }

        aiAnalysis = await response.json();

        // Check if report is fake/rejected by Gemini
        if (aiAnalysis.isGenuine === false) {
          throw new Error(aiAnalysis.rejectionReason || "Please register a genuine complaint.");
        }
      } catch (apiErr: any) {
        clearTimeout(timeoutId);
        if (
          apiErr.message === "offline" || 
          apiErr.name === "TypeError" || 
          apiErr.message?.includes("fetch") || 
          apiErr.name === "AbortError"
        ) {
          console.warn("API call failed due to network/offline. Saving un-analyzed submission to offline queue:", apiErr);
          
          const finalDocId = "offline-" + Math.random().toString(36).substring(2, 9);
          const legacyDept = isSuggestion ? "Development" : (description.toLowerCase().includes("water") ? "Water Logging" : description.toLowerCase().includes("pothole") ? "Potholes" : "Garbage Report");

          const offlineRawItem = {
            id: finalDocId,
            name,
            contact,
            description,
            gpsLocation,
            imagePreview,
            isSuggestion,
            impactScale: isSuggestion ? impactScale : null,
            createdAt: new Date().toISOString(),
            isOfflineOnly: true,
            isAnalyzed: false,
            
            // Fallback properties for map and UI rendering until synced
            department: legacyDept,
            urgency: "Medium",
            cleanLocation: gpsLocation ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}` : "Delhi NCR (Offline Pending)",
            summary: "Offline Pending: " + description.substring(0, 60),
            latitude: gpsLocation ? gpsLocation.lat : 28.6139,
            longitude: gpsLocation ? gpsLocation.lng : 77.2090,
            sector: "Offline Pending",
            assignedBody: "Offline Queue"
          };

          // Save raw item to IndexedDB offline queue
          await saveGrievanceToOfflineQueue(offlineRawItem);
          
          // Update queue counts in state
          const queued = await getOfflineQueuedGrievances();
          setOfflineQueueCount(queued.length);

          // Show receipt screen to user
          setSuccessData(offlineRawItem);

          // Reset form fields
          setName("");
          setContact("");
          setDescription("");
          setImagePreview(null);
          generateCaptcha();

          if (onSubmissionSuccess) {
            onSubmissionSuccess(finalDocId, offlineRawItem);
          }

          setIsAnalyzing(false);
          return;
        } else {
          // Re-throw genuine rejections or validator exceptions
          throw apiErr;
        }
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
        isSuggestion: aiAnalysis.isSuggestion !== undefined ? aiAnalysis.isSuggestion : isSuggestion,
        impactScale: isSuggestion ? impactScale : null,

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
        querySnapshot = await runWithTimeout(getDocs(q), 4000, null);
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
        const currentAssociatedReports = matchedGrievanceData.associatedUserReports || [];
        
        const newReport = {
          name,
          contact,
          reportedAt: new Date().toISOString(),
          description: description,
        };

        const updatedReporters = [
          ...currentReporters,
          newReport
        ];

        const updatedAssociatedReports = [
          ...currentAssociatedReports,
          newReport
        ];
        
        try {
          await runWithTimeout(
            updateDoc(existingDocRef, {
              trafficCount: currentTraffic + 1,
              reportersList: updatedReporters,
              associatedUserReports: updatedAssociatedReports,
            }),
            5000,
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
          associatedUserReports: updatedAssociatedReports,
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
          ],
          associatedUserReports: [
            {
              name,
              contact,
              reportedAt: new Date().toISOString(),
              description: description,
            }
          ]
        };

        let finalDocId = "offline-" + Math.random().toString(36).substring(2, 9);
        try {
          const docRef = await runWithTimeout(
            addDoc(collection(db, "grievances"), finalGrievanceData),
            8000,
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
          isOfflineOnly: isSavedOfflineOnly,
          isAnalyzed: true
        };

        // Show standard receipt to the citizen
        setSuccessData(successObj);

        // Save to IndexedDB offline queue if offline
        if (isSavedOfflineOnly) {
          saveGrievanceToOfflineQueue(successObj)
            .then(() => {
              getOfflineQueuedGrievances().then((queued) => setOfflineQueueCount(queued.length));
              console.log("Successfully queued grievance locally in IndexedDB offline store!");
            })
            .catch((e) => console.error("Failed to write offline grievance to IndexedDB:", e));
        }

        // Send telemetry event
        sendTelemetryEvent("citizen_grievance_submitted", {
          id: finalDocId,
          isOfflineOnly: isSavedOfflineOnly,
          department: finalGrievanceData.department,
          urgency: finalGrievanceData.urgency
        });

        // Send SMS Notification via Telemetry API
        const freshSmsMsg = lang === "hi"
          ? `नमस्ते ${name}, आपकी शिकायत दर्ज कर ली गई है। विभाग: ${finalGrievanceData.category || "सामान्य"}। आईडी: ${finalDocId}। - MP सेवा केंद्र`
          : `Dear ${name}, your grievance has been filed successfully. Department: ${finalGrievanceData.category || "General"}. ID: ${finalDocId}. - MP Service Center`;

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
      console.error("Error submitting grievance:", err);
      let errorMsg = "Submission failed.";
      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        errorMsg = "The server is taking longer than expected to respond. Your complaint may still have been received; please check the MP Admin area shortly or try submitting again.";
      } else {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            errorMsg = `Firestore Security Denied: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
          }
        } catch (_) {
          errorMsg = err.message || errorMsg;
        }
      }
      alert(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        {!isOnline && offlineQueueCount > 0 && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-400">
            <span className="font-semibold flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {lang === "hi"
                ? `सक्रिय ऑफ़लाइन कतार: ${offlineQueueCount} शिकायतें अपलोड के लिए लंबित हैं`
                : `Active offline queue: ${offlineQueueCount} pending submissions`}
            </span>
            {!isSyncing && isOnline && (
              <button
                type="button"
                onClick={syncOfflineSubmissions}
                className="text-amber-700 dark:text-amber-300 font-black uppercase tracking-wider underline cursor-pointer hover:scale-105 transition-transform"
              >
                Sync Now
              </button>
            )}
          </div>
        )}

      <div className="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-4">
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          title={ttsEnabled ? "TTS Voice Guide On" : "TTS Voice Guide Off"}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 mt-0.5 ${
            ttsEnabled
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800"
          }`}
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
            {(FORM_TRANSLATIONS[lang as keyof typeof FORM_TRANSLATIONS] || FORM_TRANSLATIONS.en).submitTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {(FORM_TRANSLATIONS[lang as keyof typeof FORM_TRANSLATIONS] || FORM_TRANSLATIONS.en).submitSub}
          </p>
        </div>
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
                <label htmlFor="citizen-name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {lang === "hi" ? FORM_TRANSLATIONS.hi.fullName : FORM_TRANSLATIONS.en.fullName}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="citizen-name"
                    type="text"
                    required
                    placeholder={lang === "hi" ? FORM_TRANSLATIONS.hi.fullNamePlaceholder : FORM_TRANSLATIONS.en.fullNamePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\s]/g, ""))}
                    disabled={isAnalyzing}
                    className="w-full pl-11 pr-4 h-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 text-sm rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="citizen-contact" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {lang === "hi" ? FORM_TRANSLATIONS.hi.contactNo : FORM_TRANSLATIONS.en.contactNo}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
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
                    className="w-full pl-11 pr-4 h-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 text-sm rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* GPS Location Tracker Widget */}
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-3.5 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <MapPin className={`w-4 h-4 ${gpsLocation ? 'text-emerald-500 animate-bounce' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{lang === "hi" ? "जीपीएस स्थान ट्रैकर (वैकल्पिक)" : "GPS Location Tracker (Optional)"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={detectGpsLocation}
                  disabled={isGpsLoading}
                  className={`h-12 px-4 border font-bold text-xs uppercase rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${
                    gpsLocation
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {isGpsLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  ) : (
                    <MapPin className={`w-3.5 h-3.5 ${gpsLocation ? 'text-emerald-600' : 'text-slate-400'}`} />
                  )}
                  <span>{isGpsLoading ? FORM_TRANSLATIONS[lang].gpsDetecting : FORM_TRANSLATIONS[lang].gpsBtn}</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {gpsStatus || (lang === "hi" ? FORM_TRANSLATIONS.hi.gpsNotEnabled : FORM_TRANSLATIONS.en.gpsNotEnabled)}
                  </span>
                  {gpsLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        setGpsLocation(null);
                        setGpsStatus("");
                      }}
                      className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === "hi" ? "साफ़ करें" : "Clear"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description textarea with Voice Dictation Overlay */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                <label htmlFor="grievance-desc" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {(FORM_TRANSLATIONS[lang as keyof typeof FORM_TRANSLATIONS] || FORM_TRANSLATIONS.en).descLabel}
                </label>
                
                {/* Voice Input Options with Gemini Transcribing */}
                {speechSupported && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Language selector */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() => setSpeechLang("en-IN")}
                        className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer ${
                          speechLang === "en-IN" ? "bg-slate-800 dark:bg-slate-900 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                        title="English voice input"
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeechLang("hi-IN")}
                        className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          speechLang === "hi-IN" ? "bg-slate-800 dark:bg-slate-900 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                        title="Hindi voice input"
                      >
                        हिं
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeechLang("en-IN-hinglish")}
                        className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          speechLang === "en-IN-hinglish" ? "bg-slate-800 dark:bg-slate-900 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
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
                      className={`h-12 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                        isListening
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200"
                      }`}
                      title={isListening ? "Stop voice recording and transcribe" : "Record voice input using Gemini AI"}
                    >
                      {isListening ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                      <span className="text-xs font-semibold">
                        {isListening ? (FORM_TRANSLATIONS[lang as keyof typeof FORM_TRANSLATIONS] || FORM_TRANSLATIONS.en).stopAndTranscribe : (FORM_TRANSLATIONS[lang as keyof typeof FORM_TRANSLATIONS] || FORM_TRANSLATIONS.en).voiceMic}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <textarea
                  id="grievance-desc"
                  required
                  rows={5}
                  placeholder={(FORM_TRANSLATIONS[lang as keyof typeof FORM_TRANSLATIONS] || FORM_TRANSLATIONS.en).descPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isAnalyzing || isTranscribing}
                  className="w-full min-h-[130px] px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 text-sm rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 resize-none disabled:opacity-60 leading-relaxed no-scrollbar font-medium"
                />
                
                {isListening && (
                  <div className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
                    <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                    <span>{lang === "hi" ? `रिकॉर्डिंग शुरू: ${speechLang === "hi-IN" ? "हिंदी" : speechLang === "en-IN-hinglish" ? "हिंग्लिश" : "अंग्रेजी"}...` : `Recording in ${speechLang === "hi-IN" ? "Hindi" : speechLang === "en-IN-hinglish" ? "Hinglish" : "English"}...`}</span>
                  </div>
                )}

                {isTranscribing && (
                  <div className="absolute right-3.5 bottom-3.5 flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>{lang === "hi" ? "एआई आवाज का अनुवाद कर रहा है..." : "AI transcribing voice..."}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Image Input Field */}
            <div id="photo-attachment-container" className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-3.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.gpsAttachPhoto : FORM_TRANSLATIONS.en.gpsAttachPhoto}</span>
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{lang === "hi" ? "कैप्चर करें" : "Capture"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span>{lang === "hi" ? "रद्द करें" : "Cancel"}</span>
                    </button>
                  </div>
                </div>
              )}

              {cameraError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-100 dark:border-red-900/60">
                  {cameraError}
                </p>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCameraActive) stopCamera();
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 h-12 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Camera className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.gpsSelectImage : FORM_TRANSLATIONS.en.gpsSelectImage}</span>
                  </button>

                  {!isCameraActive && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 h-12 px-4 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Video className="w-4 h-4 text-white dark:text-slate-900" />
                      <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.gpsTakePhoto : FORM_TRANSLATIONS.en.gpsTakePhoto}</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {imagePreview 
                    ? (lang === "hi" ? FORM_TRANSLATIONS.hi.gpsPhotoSuccess : FORM_TRANSLATIONS.en.gpsPhotoSuccess) 
                    : (lang === "hi" ? FORM_TRANSLATIONS.hi.gpsPhotoTip : FORM_TRANSLATIONS.en.gpsPhotoTip)
                  }
                </span>
              </div>

              {/* Thumbnail Preview rendering */}
              {imagePreview && !isCameraActive && (
                <div className="mt-3 relative w-32 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-sm">
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full p-1.5 hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Modern, elegant Human verification (Bot-proof) */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.humanVerify : FORM_TRANSLATIONS.en.humanVerify}</span>
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === "hi" ? "सुरक्षित लॉक" : "Captcha"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                {lang === "hi" ? FORM_TRANSLATIONS.hi.humanVerifyDesc : FORM_TRANSLATIONS.en.humanVerifyDesc}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Mathematical Equation Display Stamp */}
                  <div className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 select-none flex items-center justify-center sm:justify-start gap-2 shadow-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{captchaNum1}</span>
                    <span className="text-slate-400 font-bold text-xs">+</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{captchaNum2}</span>
                    <span className="text-slate-400 font-bold text-xs">=</span>
                  </div>
                  
                  {/* Refresh CAPTCHA Button for mobile */}
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="sm:hidden w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95 group flex-shrink-0"
                    title="Generate new question"
                  >
                    <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180 text-slate-400 group-hover:text-blue-600" />
                  </button>
                </div>
                
                {/* Interactive Answer Input */}
                <div className="relative flex-1 w-full">
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder={lang === "hi" ? FORM_TRANSLATIONS.hi.humanAnswerPlaceholder : FORM_TRANSLATIONS.en.humanAnswerPlaceholder}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-4 h-12 text-sm text-slate-900 dark:text-white placeholder-slate-400 font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                    required
                  />
                </div>
                
                {/* Refresh CAPTCHA Button for tablet/desktop */}
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="hidden sm:flex w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all items-center justify-center cursor-pointer shadow-sm active:scale-95 group flex-shrink-0"
                  title="Generate new question"
                >
                  <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180 text-slate-400 group-hover:text-blue-600" />
                </button>
              </div>
            </div>

            {/* CTA Button: File your Complaint */}
            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-800 text-white font-semibold rounded-xl shadow-none hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm uppercase tracking-wider animate-pulse font-semibold">
                    {lang === "hi" ? FORM_TRANSLATIONS.hi.btnSubmitting : FORM_TRANSLATIONS.en.btnSubmitting}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 text-amber-300 fill-amber-300" />
                  <span className="text-xs uppercase tracking-widest font-semibold">
                    {(FORM_TRANSLATIONS[lang as keyof typeof FORM_TRANSLATIONS] || FORM_TRANSLATIONS.en).btnSubmit}
                  </span>
                </>
              )}
            </button>

            {/* WhatsApp Direct Integration Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3.5 transition-colors">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800/60"></div>
                <span className="flex-shrink mx-4 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest font-semibold">
                  {lang === "hi" ? "या व्हाट्सएप के माध्यम से भेजें" : "Or Send via WhatsApp"}
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800/60"></div>
              </div>
              
              <button
                type="button"
                onClick={handleWhatsAppSubmit}
                className="w-full h-12 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold rounded-xl shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.707 1.459h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="text-xs uppercase tracking-wider font-extrabold">
                  {lang === "hi" ? "व्हाट्सएप द्वारा भेजें" : "Launch WhatsApp Template"}
                </span>
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="grievance-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10 dark:bg-emerald-950/20 p-5 rounded-xl flex flex-col items-center text-center"
          >
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full mb-3">
              <Check className="w-6 h-6" strokeWidth={3} />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase">
              {successData.isSuggestion
                ? (SUGGESTION_TRANSLATIONS[lang as keyof typeof SUGGESTION_TRANSLATIONS] || SUGGESTION_TRANSLATIONS.en).successTitle
                : (FORM_TRANSLATIONS[lang as keyof typeof FORM_TRANSLATIONS] || FORM_TRANSLATIONS.en).successTitle}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              {successData.isSuggestion
                ? (SUGGESTION_TRANSLATIONS[lang as keyof typeof SUGGESTION_TRANSLATIONS] || SUGGESTION_TRANSLATIONS.en).successSub
                : (FORM_TRANSLATIONS[lang as keyof typeof FORM_TRANSLATIONS] || FORM_TRANSLATIONS.en).successSub}
            </p>

            {successData.isConsolidatedDuplicate && (
              <div className="w-full mt-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-left text-xs space-y-1.5 shadow-sm">
                <div className="flex items-center gap-1.5 font-extrabold text-[10px] uppercase tracking-wider text-blue-900 dark:text-blue-400">
                  <Users className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>{lang === "hi" ? "समेकित शिकायत (एंटी-क्लेटर)" : "Traffic Consolidated (Anti-Clutter Guardrail)"}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed font-medium">
                  {lang === "hi" 
                    ? `हमने पिछले 45 मिनट में आपके तत्काल क्षेत्र में ${successData.originalReporterName || "दूसरे नागरिक"} द्वारा इसी समस्या की रिपोर्ट का पता लगाया है। डेटाबेस को साफ़ रखने के लिए, आपकी शिकायत को मौजूदा टिकट के साथ जोड़ दिया गया है!`
                    : `We detected an active report for this same issue in your immediate area reported in the last 45 minutes by ${successData.originalReporterName || "another Citizen"}. To keep the database clean, your submission has been grouped with the existing ticket!`
                  }
                </p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/40 flex-wrap text-[10px] text-slate-500 font-semibold">
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                     {lang === "hi" ? "शिकायतें समेकित" : "Traffic Count"}: {successData.trafficCount || 2}x
                  </span>
                  <span>•</span>
                  <span>{lang === "hi" ? "पहली रिपोर्ट" : "First logged"}: {new Date(successData.originalCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}

            {successData.isOfflineOnly && (
              <div className="w-full mt-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 p-4 rounded-xl text-left text-xs space-y-1.5 shadow-sm">
                <div className="flex items-center gap-1.5 font-extrabold text-[10px] uppercase tracking-wider text-amber-900 dark:text-amber-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>{lang === "hi" ? "ऑफ़लाइन कतारबद्ध (सुरक्षित)" : "Offline Queued (Secure)"}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed font-medium">
                  {lang === "hi" 
                    ? "इंटरनेट कनेक्शन की अनुपलब्धता के कारण आपकी शिकायत स्थानीय डिवाइस पर सुरक्षित रूप से कतारबद्ध कर ली गई है। जैसे ही आपका नेटवर्क बहाल होगा, यह स्वतः सांसद प्रेषण केंद्र पर अपलोड हो जाएगी!"
                    : "No internet connection detected. Your grievance report has been securely queued on your local device. It will automatically upload to the MP Dispatch Center once a connection is established!"
                  }
                </p>
              </div>
            )}

            {/* AI Docket Receipt Card */}
            <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-left my-4 font-sans space-y-3.5">
              <div className="flex justify-between items-start pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    {lang === "hi" ? FORM_TRANSLATIONS.hi.lblAssignedDept : FORM_TRANSLATIONS.en.lblAssignedDept}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
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
                        ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60"
                        : successData.urgency === "Medium"
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60"
                        : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60"
                    }`}
                  >
                    {lang === "hi"
                      ? `${successData.urgency === "High" ? "उच्च" : successData.urgency === "Medium" ? "मध्यम" : "निम्न"} ${FORM_TRANSLATIONS.hi.lblPrioritySuffix}`
                      : `${successData.urgency} ${FORM_TRANSLATIONS.en.lblPrioritySuffix}`
                    }
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.lblExtractedLandmark : FORM_TRANSLATIONS.en.lblExtractedLandmark}</span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-100 font-bold mt-0.5">{successData.cleanLocation}</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                    GPS: {successData.latitude.toFixed(5)}, {successData.longitude.toFixed(5)}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.lblSectorCivic : FORM_TRANSLATIONS.en.lblSectorCivic}</span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-100 font-bold mt-0.5">{successData.sector || "Central Zone"}</div>
                  <span className="inline-block mt-1 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 px-1.5 py-0.5 rounded">
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
                      className="w-24 h-16 object-cover rounded-md border border-slate-200 dark:border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-[200px]">
                      {successData.imageVerificationStatus === "mismatch" ? (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 p-2 rounded-lg text-[10px] space-y-1">
                          <div className="font-extrabold uppercase tracking-wider text-red-900 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                            <span>{lang === "hi" ? "अपुष्ट चित्र / बेमेल साक्ष्य" : "Visual Mismatch / Unverified Image"}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-normal font-medium">
                            {lang === "hi"
                              ? `चेतावनी: आपकी फोटो हमारे जेमिनी एआई क्रॉस-मोडल अलाइनमेंट शील्ड द्वारा सत्यापित नहीं हो सकी। फोटो आपकी लिखित शिकायत की श्रेणी से मेल नहीं खाती है। फिर भी, आपकी शिकायत को '${successData.isConsolidatedDuplicate ? "समेकित" : "अपुष्ट चित्र"}' के रूप में दर्ज कर लिया गया है।`
                              : `Warning: Photo verification failed cross-modal alignment checks. Visuals do not justify or substantiate the textual category/claims. Your report is successfully recorded as 'unverified image'.`}
                          </p>
                          {successData.imageVerificationMessage && (
                            <div className="text-slate-500 dark:text-slate-400 italic mt-0.5 border-t border-red-100 dark:border-red-950 pt-1">
                              AI: {successData.imageVerificationMessage}
                            </div>
                          )}
                        </div>
                      ) : successData.imageVerificationStatus === "verified" ? (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 p-2 rounded-lg text-[10px] space-y-1">
                          <div className="font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{lang === "hi" ? "चित्र सत्यापित" : "Visual Alignment Verified"}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-normal font-medium">
                            {lang === "hi"
                              ? "सफलता: आपकी फोटो लिखित श्रेणी और दावों के साथ पूरी तरह से मेल खाती है।"
                              : "Success: Your attached photo is verified and substantiates the textual category/claims."}
                          </p>
                          {successData.imageVerificationMessage && (
                            <div className="text-slate-500 dark:text-slate-400 italic mt-0.5 border-t border-emerald-100 dark:border-emerald-950 pt-1">
                              AI: {successData.imageVerificationMessage}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">
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
                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic mt-0.5 leading-relaxed bg-slate-100/50 dark:bg-slate-950/40 p-2.5 rounded border border-slate-200/40 dark:border-slate-800/60">
                  "{successData.summary}"
                </p>
              </div>

              {successData.category && (
                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-[11px] bg-slate-100/30 dark:bg-slate-900/40 p-2 rounded-lg">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? FORM_TRANSLATIONS.hi.lblCategory : FORM_TRANSLATIONS.en.lblCategory}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{successData.category}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? FORM_TRANSLATIONS.hi.lblLanguage : FORM_TRANSLATIONS.en.lblLanguage}
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded text-[10px]">{successData.detectedLanguage || "English"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? FORM_TRANSLATIONS.hi.lblSuggestedBody : FORM_TRANSLATIONS.en.lblSuggestedBody}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{successData.suggested_department}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? FORM_TRANSLATIONS.hi.lblAffectedDemographic : FORM_TRANSLATIONS.en.lblAffectedDemographic}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{successData.affected_people}</span>
                  </div>
                  {successData.impactScale && (
                    <div className="col-span-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        {lang === "hi" ? "अनुमानित सार्वजनिक प्रभाव" : "Estimated Public Impact"}
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded text-[10px]">
                        {successData.impactScale} {lang === "hi" ? "लोग (लाभार्थी)" : "people (beneficiaries)"}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? "विश्वास स्कोर" : "Confidence Score"}
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {successData.confidence}% {lang === "hi" ? "विश्वास" : "Confidence"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                      {lang === "hi" ? "त्वरित प्राथमिकता" : "Urgency Priority"}
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
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
                          <span key={kw} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-mono">
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
                  className="flex-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-4 py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800"
                >
                  <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>{lang === "hi" ? FORM_TRANSLATIONS.hi.lblHearDocket : FORM_TRANSLATIONS.en.lblHearDocket}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                className="flex-1 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-sm cursor-pointer text-center"
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
