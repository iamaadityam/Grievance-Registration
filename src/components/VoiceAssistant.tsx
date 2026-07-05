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
    guideLabel: "वॉयस गाइड बॉट",
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
    hi: "नागरिक शिकायत निवारण पोर्टल में आपका स्वागत है। आप यहाँ अपनी शिकायतें आसानी से दर्ज कर सकते हैं। एमसीडी और एनडीएमसी टीमें इनका समाधान करेंगी।"
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
    hi: "चरण १. अपना नाम और मोबाइल नंबर भरें। अपनी समस्या का विवरण दें, या बोलने के लिए वॉयस माइक पर टैप करें। आप फोटो भी संलग्न कर सकते हैं।"
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
    hi: "चरण २. आप एक वास्तविक नागरिक हैं यह सत्यापित करने के लिए नीचे दिए गए सरल गणित पहेली को हल करें, फिर अपनी शिकायत दर्ज करें पर क्लिक करें।"
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
    hi: "चरण ३. सबमिट करने के बाद, दाएं पैनल पर अपनी शिकायतों को ट्रैक करें। जैसे ही टीमें मरम्मत पूरी करेंगी, स्थिति लाइव अपडेट हो जाएगी।"
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
    hi: "चरण ४. व्यवस्थापक वास्तविक समय की मांग के खिलाफ विकास प्रस्तावों और बजट की तुलना करने के लिए स्मार्ट एमपी प्लानर का उपयोग कर सकते हैं।"
  }
];

interface VoiceAssistantProps {
  lang: "en" | "hi";
  setLang: (lang: "en" | "hi") => void;
}

export default function VoiceAssistant({ lang, setLang }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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
    const speechText = lang === "hi" ? step.hi : step.en;
    
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
      console.error("Speech Synthesis Error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
      >
        <Volume2 className="w-4 h-4 animate-bounce" />
        <span className="text-[10px] font-black uppercase tracking-wider pr-1">
          {lang === "hi" ? STEP_TRANSLATIONS.hi.voiceGuideBtn : STEP_TRANSLATIONS.en.voiceGuideBtn}
        </span>
      </button>
    );
  }

  const activeStep = GUIDE_STEPS[currentStepIdx];
  const tTitle = (() => {
    if (lang === "hi") {
      if (activeStep.id === 1) return STEP_TRANSLATIONS.hi.title1;
      if (activeStep.id === 2) return STEP_TRANSLATIONS.hi.title2;
      if (activeStep.id === 3) return STEP_TRANSLATIONS.hi.title3;
      if (activeStep.id === 4) return STEP_TRANSLATIONS.hi.title4;
      if (activeStep.id === 5) return STEP_TRANSLATIONS.hi.title5;
    }
    return activeStep.title;
  })();

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-xl px-4 py-2.5 relative shadow-sm mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Side: Brand & Assistant Status */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center font-black shadow-inner flex-shrink-0 animate-pulse">
            <Volume2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                {lang === "hi" ? STEP_TRANSLATIONS.hi.guideLabel : STEP_TRANSLATIONS.en.guideLabel}
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 text-[8px] font-black uppercase px-1 py-0.2 rounded border border-indigo-500/30">
                ({currentStepIdx + 1}/{GUIDE_STEPS.length})
              </span>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-tight text-slate-200 mt-0.5">
              {tTitle}
            </h4>
          </div>
        </div>

        {/* Right Side: Lang Selector & Native Speech Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t border-slate-800/60 md:border-t-0 pt-2 md:pt-0">
          
          {/* Language Selector */}
          <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-md p-0.5">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-0.5 text-[8px] font-black rounded uppercase transition-all ${
                lang === "en" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`px-2 py-0.5 text-[8px] font-black rounded uppercase transition-all ${
                lang === "hi" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              हिंदी
            </button>
          </div>

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
                  <span>{lang === "hi" ? STEP_TRANSLATIONS.hi.pause : STEP_TRANSLATIONS.en.pause}</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-white" />
                  <span>
                    {isPaused 
                      ? (lang === "hi" ? STEP_TRANSLATIONS.hi.resume : STEP_TRANSLATIONS.en.resume)
                      : (lang === "hi" ? STEP_TRANSLATIONS.hi.speak : STEP_TRANSLATIONS.en.speak)}
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
            className="text-slate-400 hover:text-white p-1 ml-0.5"
            title="Minimize Guide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
