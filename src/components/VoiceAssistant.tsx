import React, { useState, useEffect } from "react";
import {
  Volume2,
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

interface GuideStep {
  id: number;
  title: string;
  points: string[];
  en: string;
  hi: string;
  bn: string;
  kn: string;
  ta: string;
}

const STEP_TRANSLATIONS = {
  en: {
    guideLabel: "Voice Guide Bot",
    voiceGuideBtn: "Voice Guide",
    title1: "Welcome & Portal Overview",
    points1: [
      "File public complaints easily.",
      "MCD and NDMC resolving departments.",
      "AI automatically geocodes and dispatches."
    ],
    title2: "How to File a Grievance",
    points2: [
      "Enter your Name and 10-digit Phone.",
      "Use Voice Mic button to dictate.",
      "Upload or click a photo of the damage."
    ],
    title3: "Human Verification",
    points3: [
      "Solve the basic math puzzle.",
      "Keeps the portal clean from spam bots.",
      "Click 'File your Complaint' to submit."
    ],
    title4: "Live Status Tracking",
    points4: [
      "View complaints instantly on the right.",
      "Device-locked feed preserves your history.",
      "Status updates live to 'Resolved' on completion."
    ],
    title5: "MP Decision Planner",
    points5: [
      "For admin users & representatives.",
      "Objective prioritization using demand models.",
      "Compare proposals side-by-side using AI."
    ],
    step: "Step",
    pause: "Pause",
    speak: "Speak",
    resume: "Resume",
  },
  hi: {
    guideLabel: "वॉयस गाइड बॉট",
    voiceGuideBtn: "वॉयस गाइड",
    title1: "स्वागत और पोर्टल अवलोकन",
    points1: [
      "सार्वजनिक शिकायतें आसानी से दर्ज करें।",
      "एमसीडी और एनडीएमसी समाधान विभाग।",
      "एआई स्वचालित रूप से जियोकोड और प्रेषण करता है।"
    ],
    title2: "शिकायत कैसे दर्ज करें",
    points2: [
      "अपना नाम और 10 अंकों का फोन नंबर दर्ज करें।",
      "बोलने के लिए वॉयस माइक बटन का उपयोग करें।",
      "नुकसान की फोटो अपलोड करें या क्लिक करें।"
    ],
    title3: "मानव सत्यापन",
    points3: [
      "बुनियादी गणित पहेली को हल करें।",
      "पोर्टल को स्पैम बॉट्स से साफ रखता है।",
      "सबमिट करने के लिए 'अपनी शिकायत दर्ज करें' पर क्लिक करें।"
    ],
    title4: "लाइव स्थिति ट्रैकिंग",
    points4: [
      "दाईं ओर तुरंत शिकायतें देखें।",
      "डिवाइस-लॉक फीड आपके इतिहास को सुरक्षित रखती है।",
      "पूरा होने पर स्थिति 'समाधानित' में लाइव अपडेट होती है।"
    ],
    title5: "सांसद निर्णय योजनाकार",
    points5: [
      "व्यवस्थापक उपयोगकर्ताओं और प्रतिनिधियों के लिए।",
      "मांग मॉडल का उपयोग करके उद्देश्य प्राथमिकता।",
      "एआई का उपयोग करके प्रस्तावों की तुलना करें।"
    ],
    step: "चरण",
    pause: "रोकें",
    speak: "बोलें",
    resume: "जारी रखें",
  },
  bn: {
    guideLabel: "ভয়েস গাইড বট",
    voiceGuideBtn: "ভয়েস গাইড",
    title1: "স্বাগত এবং পোর্টাল ওভারভিউ",
    points1: [
      "সহজেই পাবলিক অভিযোগ দায়ের করুন।",
      "এমসিডি এবং এনডিএমসি সমাধান বিভাগ।",
      "এআই স্বয়ংক্রিয়ভাবে জিওকোড এবং প্রেরণ করে।"
    ],
    title2: "কীভাবে অভিযোগ দায়ের করবেন",
    points2: [
      "আপনার নাম এবং ১০ ডিজিটের ফোন লিখুন।",
      "বলতে ভয়েস মাইক বোতামটি ব্যবহার করুন।",
      "ক্ষতির ছবি আপলোড বা ক্লিক করুন।"
    ],
    title3: "নাগরিক যাচাইকরণ",
    points3: [
      "সাধারণ গণিত ধাঁধাটি সমাধান করুন।",
      "পোর্টালকে স্প্যাম বট থেকে মুক্ত রাখে।",
      "জমা দিতে 'অভিযোগ নথিভুক্ত করুন' ক্লিক করুন।"
    ],
    title4: "লাইভ স্ট্যাটাস ট্র্যাকিং",
    points4: [
      "ডান প্যানেলে তাৎক্ষণিকভাবে অভিযোগ দেখুন।",
      "ডিভাইস-লকড ফিড আপনার ইতিহাস রক্ষা করে।",
      "কাজ সম্পন্ন হলে স্ট্যাটাস 'মীমাংসিত' আপডেট হয়।"
    ],
    title5: "সাংসদ স্মার্ট প্ল্যানার",
    points5: [
      "প্রশাসক ব্যবহারকারী এবং প্রতিনিধিদের জন্য।",
      "চাহিদা মডেল ব্যবহার করে অগ্রাধিকার নির্ধারণ।",
      "এআই ব্যবহার করে প্রস্তাবগুলির তুলনা করুন।"
    ],
    step: "ধাপ",
    pause: "বিরতি",
    speak: "শুনুন",
    resume: "পুনরায় শুরু",
  },
  kn: {
    guideLabel: "ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ ಬಾಟ್",
    voiceGuideBtn: "ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ",
    title1: "ಸ್ವಾಗತ ಮತ್ತು ಪೋರ್ಟಲ್ ಅವಲೋಕನ",
    points1: [
      "ಸಾರ್ವಜನಿಕ ದೂರುಗಳನ್ನು ಸುಲಭವಾಗಿ ಸಲ್ಲಿಸಿ.",
      "ಎಂಸಿಡಿ ಮತ್ತು ಎನ್‌ಡಿಎಂಸಿ ಪರಿಹಾರ ಇಲಾಖೆಗಳು.",
      "ಎಐ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಜಿಯೋಕೋಡ್ ಮತ್ತು ರವಾನಿಸುತ್ತದೆ."
    ],
    title2: "ದೂರು ಸಲ್ಲಿಸುವುದು ಹೇಗೆ",
    points2: [
      "ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು 10 ಅಂಕಿಗಳ ಫೋನ್ ನಮೂದಿಸಿ.",
      "ಹೇಳಲು ಧ್ವನಿ ಮೈಕ್ ಬಟನ್ ಬಳಸಿ.",
      "ಹಾನಿಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಕ್ಲಿಕ್ ಮಾಡಿ."
    ],
    title3: "ನಾಗರಿಕ ಪರಿಶೀಲನೆ",
    points3: [
      "ಸರಳ ಗಣಿತದ ಒಗಟನ್ನು ಬಿಡಿಸಿ.",
      "ಪೋರ್ಟಲ್ ಅನ್ನು ಸ್ಪ್ಯಾಮ್ ಬಾಟ್‌ಗಳಿಂದ ಮುಕ್ತವಾಗಿಡುತ್ತದೆ.",
      "ಸಲ್ಲಿಸಲು 'ದೂರು ದಾಖಲಿಸಿ' ಕ್ಲಿಕ್ ಮಾಡಿ."
    ],
    title4: "ಲೈವ್ ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕಿಂಗ್",
    points4: [
      "ಬಲಭಾಗದಲ್ಲಿ ತಕ್ಷಣ ದೂರುಗಳನ್ನು ವೀಕ್ಷಿಸಿ.",
      "ಸಾಧನ-ಲಾಕ್ ಮಾಡಿದ ಫೀಡ್ ನಿಮ್ಮ ಇತಿಹಾಸವನ್ನು ಉಳಿಸುತ್ತದೆ.",
      "ಪೂರ್ಣಗೊಂಡ ನಂತರ ಸ್ಥಿತಿ 'ಪರಿಹರಿಸಲಾಗಿದೆ' ಎಂದು ನವೀಕರಿಸಲಾಗುತ್ತದೆ."
    ],
    title5: "ಸಂಸದ ಸ್ಮಾರ್ಟ್ ಪ್ಲಾನರ್",
    points5: [
      "ಅಡ್ಮಿನ್ ಬಳಕೆದಾರರು ಮತ್ತು ಪ್ರತಿನಿಧಿಗಳಿಗಾಗಿ.",
      "ಬೇಡಿಕೆ ಮಾದರಿಗಳನ್ನು ಬಳಸಿಕೊಂಡು ಆದ್ಯತೆ ನಿರ್ಧಾರ.",
      "ಎಐ ಬಳಸಿ ಪ್ರಸ್ತಾವನೆಗಳನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ."
    ],
    step: "ಹಂತ",
    pause: "ವಿರಾಮ",
    speak: "ಕೇಳಿ",
    resume: "ಮುಂದುವರೆಸಿ",
  },
  ta: {
    guideLabel: "குரல் வழிகாட்டி பாட்",
    voiceGuideBtn: "குரல் வழிகாட்டி",
    title1: "வரவேற்பு மற்றும் போர்டல் மேலோட்டம்",
    points1: [
      "பொது புகார்களை எளிதாக சமர்ப்பிக்கவும்.",
      "MCD மற்றும் NDMC தீர்க்கும் துறைகள்.",
      "AI தானாகவே புவிக்குறியீடு செய்து அனுப்பும்."
    ],
    title2: "புகாரை எவ்வாறு சமர்ப்பிப்பது",
    points2: [
      "உங்கள் பெயர் மற்றும் 10 இலக்க தொலைபேசியை உள்ளிடவும்.",
      "பேச குரல் மைக் பொத்தானைப் பயன்படுத்தவும்.",
      "சேதத்தின் புகைப்படத்தை பதிவேற்றவும் அல்லது எடுக்கவும்."
    ],
    title3: "குடிமகன் சரிபார்ப்பு",
    points3: [
      "எளிய கணித புதிருக்கு விடையளிக்கவும்.",
      "போர்டலை ஸ்பேம் பாட்களிலிருந்து பாதுகாக்கிறது.",
      "சமர்ப்பிக்க 'புகாரைப் பதிவு செய்க' என்பதை அழுத்தவும்."
    ],
    title4: "நேரடி நிலை கண்காணிப்பு",
    points4: [
      "வலதுபுறத்தில் புகார்களை உடனடியாகக் கண்காணிக்கவும்.",
      "சாதன-பூட்டப்பட்ட ஊட்டம் உங்கள் வரலாற்றைப் பாதுகாக்கும்.",
      "முடிந்ததும் நிலை 'தீர்க்கப்பட்டது' என நேரலையாக மாறும்."
    ],
    title5: "எம்பி ஸ்மார்ட் பிளானர்",
    points5: [
      "நிர்வாக பயனர்கள் & பிரதிநிதிகளுக்கு.",
      "தேவை மாதிரிகளைப் பயன்படுத்தி முன்னுரிமை கண்டறிதல்.",
      "AI ஐப் பயன்படுத்தி திட்டங்களை ஒப்பிடுக."
    ],
    step: "படி",
    pause: "நிறுத்து",
    speak: "பேசு",
    resume: "தொடரு",
  }
};

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: "Welcome & Portal Overview",
    points: [
      "File public complaints easily.",
      "MCD and NDMC resolving departments.",
      "AI automatically geocodes and dispatches."
    ],
    en: "Welcome to the Citizen Grievance Portal. You can easily file public complaints here. MCD and NDMC teams will resolve them.",
    hi: "नागरिक शिकायत निवारण पोर्टल में आपका स्वागत है। आप यहाँ अपनी शिकायतें आसानी से दर्ज कर सकते हैं। एमसीडी और एनडीएमसी टीमें इनका समाधान करेंगी।",
    bn: "নাগরিক অভিযোগ পোর্টালে আপনাকে স্বাগত জানাই। আপনি এখানে সহজেই জনস্বার্থের অভিযোগ নথিভুক্ত করতে পারেন। এমসিডি এবং এনডিএমসি টিম দ্রুত এগুলির সমাধান করবে।",
    kn: "ನಾಗರಿಕ ಅಹವಾಲು ಪೋರ್ಟಲ್‌ಗೆ ಸ್ವಾಗತ. ನೀವು ಇಲ್ಲಿ ಸಾರ್ವಜನಿಕ ದೂರುಗಳನ್ನು ಸುಲಭವಾಗಿ ಸಲ್ಲಿಸಬಹುದು. ಎಂಸಿಡಿ ಮತ್ತು ಎನ್‌ಡಿಎಂಸಿ ತಂಡಗಳು ಇವುಗಳನ್ನು ಪರಿಹರಿಸುತ್ತವೆ.",
    ta: "பொதுமக்கள் குறைதீர்க்கும் போர்ட்டலுக்கு உங்களை வரவேற்கிறோம். நீங்கள் இங்கே எளிதாகப் பொது புகார்களைப் பதிவு செய்யலாம். MCD மற்றும் NDMC குழுக்கள் இவற்றைத் தீர்க்கும்."
  },
  {
    id: 2,
    title: "How to File a Grievance",
    points: [
      "Enter your Name and 10-digit Phone.",
      "Use Voice Mic button to dictate.",
      "Upload or click a photo of the damage."
    ],
    en: "Step 1. Enter your Name and mobile number. Describe your issue, or tap Voice Mic to dictate. You can also attach a photo.",
    hi: "चरण १. अपना नाम और मोबाइल नंबर भरें। अपनी समस्या का विवरण दें, या बोलने के लिए वॉयस माइक पर टैप करें। आप फोटो भी संलग्न कर सकते हैं।",
    bn: "ধাপ এক. আপনার নাম এবং মোবাইল নম্বর লিখুন। আপনার সমস্যার বিবরণ দিন, বা সরাসরি বলতে ভয়েস মাইক বোতামটিতে আলতো চাপুন। আপনি ছবিও সংযুক্ত করতে পারেন।",
    kn: "ಹಂತ ಒಂದು. ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ. ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ, ಅಥವಾ ಮಾತನಾಡಲು ಧ್ವನಿ ಮೈಕ್ ಬಟನ್ ಬಳಸಿ. ನೀವು ಫೋಟೋ ಕೂಡ ಲಗತ್ತಿಸಬಹುದು.",
    ta: "படி ஒன்று. உங்கள் பெயர் மற்றும் மொபைல் எண்ணை உள்ளிடவும். உங்கள் பிரச்சனை குறித்து விவரிக்கவும், அல்லது பேச குரல் மைக் பொத்தானை அழுத்தவும். நீங்கள் புகைப்படத்தையும் இணைக்கலாம்."
  },
  {
    id: 3,
    title: "Human Verification",
    points: [
      "Solve the basic math puzzle.",
      "Keeps the portal clean from spam bots.",
      "Click 'File your Complaint' to submit."
    ],
    en: "Step 2. Solve the simple math puzzle at the bottom to verify you are a genuine citizen, then click File Your Complaint.",
    hi: "चरण २. आप एक वास्तविक नागरिक हैं यह सत्यापित करने के लिए नीचे दिए गए सरल गणित पहेली को हल करें, फिर अपनी शिकायत दर्ज करें पर क्लिक करें।",
    bn: "ধাপ দুই. আপনি একজন প্রকৃত নাগরিক তা যাচাই করতে নিচের সহজ গণিত ধাঁধাটি সমাধান করুন, তারপর অভিযোগ নথিভুক্ত করুন বোতামে ক্লিক করুন।",
    kn: "ಹಂತ ಎರಡು. ನೀವು ಒಬ್ಬ ನಿಜವಾದ ನಾಗರಿಕ ಎಂದು ಧೃಢೀಕರಿಸಲು ಕೆಳಗಿನ ಸರಳ ಗಣಿತದ ಒಗಟನ್ನು ಬಿಡಿಸಿ, ನಂತರ ದೂರು ದಾಖಲಿಸಿ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.",
    ta: "படி இரண்டு. நீங்கள் ஒரு உண்மையான குடிமகன் என்பதை சரிபார்க்க கீழே உள்ள எளிய கணித புதிருக்கு விடையளிக்கவும், பின்னர் புகாரைப் பதிவு செய்க என்பதை அழுத்தவும்."
  },
  {
    id: 4,
    title: "Live Status Tracking",
    points: [
      "View complaints instantly on the right.",
      "Device-locked feed preserves your history.",
      "Status updates live to 'Resolved' on completion."
    ],
    en: "Step 3. Once submitted, track your complaints on the right side panel. Statuses are updated live as teams complete repairs.",
    hi: "चरण ३. सबमिट करने के बाद, दाएं पैनल पर अपनी शिकायतों को ट्रैक करें। जैसे ही टीमें मरम्मत पूरी करेंगी, स्थिति लाइव अपडेट हो जाएगी।",
    bn: "ধাপ তিন. অভিযোগ জমা দেওয়ার পর, ডান প্যানেলে আপনার অভিযোগ ট্র্যাক করুন। আমাদের মেরামতের কাজ সম্পন্ন হওয়ার সাথে সাথে স্ট্যাটাস লাইভ আপডেট হয়ে যাবে।",
    kn: "ಹಂತ ಮೂರು. ದೂರನ್ನು ಸಲ್ಲಿಸಿದ ನಂತರ, ಬಲ ಪ್ಯಾನಲ್‌ನಲ್ಲಿ ನಿಮ್ಮ ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ. ನಮ್ಮ ದುರಸ್ತಿ ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಂತೆ ಸ್ಥಿತಿ ಲೈವ್ ಆಗಿ ನವೀಕರಿಸಲ್ಪಡುತ್ತದೆ.",
    ta: "படி மூன்று. புகாரை சமர்ப்பித்த பிறகு, வலது பேனலில் உங்கள் புகாரைக் கண்காணிக்கவும். எங்கள் பழுதுபார்க்கும் பணி முடிந்ததும் நிலை நேரலையாகப் புதுப்பிக்கப்படும்."
  },
  {
    id: 5,
    title: "MP Decision Planner",
    points: [
      "For admin users & representatives.",
      "Objective prioritization using demand models.",
      "Compare proposals side-by-side using AI."
    ],
    en: "Step 4. Administrators can use the Smart MP Planner to compare development proposals and budgets against real-time demand.",
    hi: "चरण ४. व्यवस्थापक वास्तविक समय की मांग के खिलाफ विकास प्रस्तावों और बजट की तुलना करने के लिए स्मार्ट एमपी प्लानर का उपयोग कर सकते हैं।",
    bn: "ধাপ চার. জনপ্রতিনিধিরা বাস্তব চিত্র এবং চাহিদার মডেল অনুসারে উন্নয়নের কাজ এবং বরাদ্দের তুলনা করতে সাংসদ স্মার্ট প্ল্যানার ব্যবহার করতে পারেন।",
    kn: "ಹಂತ ನಾಲ್ಕು. ನಮ್ಮ ಪ್ರಜಾಪ್ರತಿನಿಧಿಗಳು ನೈಜ ಬೇಡಿಕೆ ಮಾದರಿಗಳ ಆಧಾರದ ಮೇಲೆ ಅಭಿವೃದ್ಧಿ ಪ್ರಸ್ತಾವನೆಗಳು ಮತ್ತು ಬಜೆಟ್‌ಗಳನ್ನು ಹೋಲಿಸಲು ಸಂಸದ ಸ್ಮಾರ್ಟ್ ಪ್ಲಾನರ್ ಅನ್ನು ಬಳಸಬಹುದು.",
    ta: "படி நான்கு. மக்கள் பிரதிநிதிகள் நேரடித் தேவை மாதிரிகளின் அடிப்படையில் வளர்ச்சித் திட்டங்களையும் பட்ஜெட்களையும் ஒப்பிட எம்பி ஸ்மார்ட் பிளானரைப் பயன்படுத்தலாம்।"
  }
];

interface VoiceAssistantProps {
  lang: "en" | "hi" | "bn" | "kn" | "ta";
  setLang: (lang: "en" | "hi" | "bn" | "kn" | "ta") => void;
}

export default function VoiceAssistant({ lang, setLang }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [barHeights, setBarHeights] = useState([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);

  // Audio wave visualizer effect
  useEffect(() => {
    let timer: any;
    if (isPlaying && !isPaused) {
      timer = setInterval(() => {
        setBarHeights((prev) => prev.map(() => Math.floor(Math.random() * 14) + 2));
      }, 90);
    } else {
      setBarHeights([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isPaused]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSpeechSupported(true);
      
      const updateVoices = () => {
        if (window.speechSynthesis) {
          setVoices(window.speechSynthesis.getVoices());
        }
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  // Stop/restart speaking when language or step changes
  useEffect(() => {
    if (speechSupported && isPlaying) {
      speakCurrentStep(true); // Restart with new settings
    }
  }, [currentStepIdx, lang]);

  const speakCurrentStep = (restart = false) => {
    if (!speechSupported) return;

    try {
      if (!window.speechSynthesis) {
        setSpeechSupported(false);
        return;
      }

      window.speechSynthesis.cancel();

      if (!restart && isPlaying && !isPaused) {
        // Pause
        window.speechSynthesis.pause();
        setIsPaused(true);
        return;
      }

      if (isPaused && !restart) {
        // Resume
        window.speechSynthesis.resume();
        setIsPaused(false);
        return;
      }

      // Play fresh
      const step = GUIDE_STEPS[currentStepIdx];
      let speechText = step.en;
      if (lang === "hi") speechText = step.hi;
      else if (lang === "bn") speechText = step.bn;
      else if (lang === "kn") speechText = step.kn;
      else if (lang === "ta") speechText = step.ta;
      
      const utterance = new SpeechSynthesisUtterance(speechText);
      
      // Determine the best voice
      const availableVoices = window.speechSynthesis.getVoices();
      let selectedVoice: SpeechSynthesisVoice | undefined;

      if (lang === "hi") {
        selectedVoice = availableVoices.find(
          (v) =>
            v.lang === "hi-IN" ||
            v.lang.toLowerCase().startsWith("hi") ||
            v.name.toLowerCase().includes("hindi")
        );
        utterance.lang = "hi-IN";
      } else if (lang === "bn") {
        selectedVoice = availableVoices.find(
          (v) =>
            v.lang === "bn-IN" ||
            v.lang.toLowerCase().startsWith("bn") ||
            v.name.toLowerCase().includes("bengali") ||
            v.name.toLowerCase().includes("bangla")
        );
        utterance.lang = "bn-IN";
      } else if (lang === "kn") {
        selectedVoice = availableVoices.find(
          (v) =>
            v.lang === "kn-IN" ||
            v.lang.toLowerCase().startsWith("kn") ||
            v.name.toLowerCase().includes("kannada")
        );
        utterance.lang = "kn-IN";
      } else if (lang === "ta") {
        selectedVoice = availableVoices.find(
          (v) =>
            v.lang === "ta-IN" ||
            v.lang.toLowerCase().startsWith("ta") ||
            v.name.toLowerCase().includes("tamil")
        );
        utterance.lang = "ta-IN";
      } else {
        selectedVoice = availableVoices.find(
          (v) => v.lang === "en-IN" || v.lang.toLowerCase().startsWith("en-in")
        );
        if (!selectedVoice) {
          selectedVoice = availableVoices.find((v) =>
            v.lang.toLowerCase().startsWith("en")
          );
        }
        utterance.lang = "en-IN";
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 0.92; // Slightly slower for crisp understanding

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utterance.onerror = (e) => {
        console.error("Speech Synthesis Error callback:", e);
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech Synthesis failed or is blocked by browser security policy:", err);
      setSpeechSupported(false);
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    try {
      if (speechSupported && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (err) {
      console.warn("Speech Synthesis cancel failed:", err);
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleNext = () => {
    if (currentStepIdx < GUIDE_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const activeTrans = STEP_TRANSLATIONS[lang] || STEP_TRANSLATIONS.en;

  if (isDismissed) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 md:bottom-6 right-6 z-50 group">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          title="Dismiss Voice Guide Assistant"
          className="absolute -top-1 -right-1 bg-slate-800 hover:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-full w-4.5 h-4.5 flex items-center justify-center cursor-pointer shadow-md z-50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={() => setIsOpen(true)}
          title={activeTrans.voiceGuideBtn}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white w-12 h-12 rounded-full shadow-[0_0_20px_rgba(47,128,237,0.5)] hover:shadow-[0_0_25px_rgba(47,128,237,0.7)] hover:scale-105 transition-all flex items-center justify-center cursor-pointer border border-blue-500/30"
        >
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
          <Volume2 className="w-5 h-5 text-white relative z-10 hover:rotate-12 transition-transform" />
        </button>
      </div>
    );
  }

  const activeStep = GUIDE_STEPS[currentStepIdx];
  const tTitle = (() => {
    if (activeStep.id === 1) return activeTrans.title1;
    if (activeStep.id === 2) return activeTrans.title2;
    if (activeStep.id === 3) return activeTrans.title3;
    if (activeStep.id === 4) return activeTrans.title4;
    if (activeStep.id === 5) return activeTrans.title5;
    return activeStep.title;
  })();



  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 rounded-xl px-4 py-2.5 relative shadow-sm mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Side: Brand & Assistant Status */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="relative">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black shadow-inner flex-shrink-0 transition-all duration-500 ${
              isPlaying && !isPaused ? "bg-emerald-600 text-white animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-blue-600 text-white"
            }`}>
              <Volume2 className="w-4 h-4 text-white" />
            </div>
            {isPlaying && !isPaused && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wider">
                {activeTrans.guideLabel}
              </span>
              <span className="bg-blue-500/25 text-blue-200 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-500/30">
                {currentStepIdx + 1} / {GUIDE_STEPS.length}
              </span>
              
              {/* Dynamic Speech Active Visualizer Badge */}
              <div className="flex items-center gap-1 ml-1.5 h-4">
                {barHeights.map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}px` }}
                    className={`w-[1.5px] rounded-full transition-all duration-100 ${
                      isPlaying && !isPaused ? "bg-emerald-400" : "bg-blue-400/40"
                    }`}
                  />
                ))}
              </div>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-tight text-slate-100 mt-0.5">
              {tTitle}
            </h4>
          </div>
        </div>

        {/* Right Side: Native Speech Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t border-slate-800/60 md:border-t-0 pt-2 md:pt-0">
          
          {/* Action Player buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded transition-all cursor-pointer"
              title="Previous Step"
            >
              <ChevronLeft className="w-3 h-3 text-white" />
            </button>

            {/* Play/Pause toggle */}
            <button
              onClick={() => speakCurrentStep()}
              className={`px-2 py-1 rounded font-black text-[9px] uppercase flex items-center gap-1 cursor-pointer transition-all ${
                isPlaying && !isPaused
                  ? "bg-amber-600 hover:bg-amber-500 text-white animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
              title={isPlaying && !isPaused ? "Pause Assistant Voice" : "Play Assistant Voice"}
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-2.5 h-2.5 fill-white" />
                  <span>{activeTrans.pause}</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-white" />
                  <span>
                    {isPaused 
                      ? activeTrans.resume
                      : activeTrans.speak}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleStop}
              disabled={!isPlaying && !isPaused}
              className="p-1 bg-slate-800 hover:bg-red-900 disabled:opacity-40 rounded transition-all cursor-pointer text-white"
              title="Stop Speech"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIdx === GUIDE_STEPS.length - 1}
              className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded transition-all cursor-pointer"
              title="Next Step"
            >
              <ChevronRight className="w-3 h-3 text-white" />
            </button>
          </div>

          <button
            onClick={() => {
              handleStop();
              setIsOpen(false);
            }}
            className="text-slate-400 hover:text-white p-1 ml-0.5 cursor-pointer"
            title="Minimize Guide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>



    </div>
  );
}
