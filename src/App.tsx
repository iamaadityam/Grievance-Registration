import { useState, useEffect } from "react";
import GrievanceForm from "./components/GrievanceForm";
import Dashboard from "./components/Dashboard";
import VoiceAssistant from "./components/VoiceAssistant";
import WhatsAppSimulator from "./components/WhatsAppSimulator";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  Landmark,
  Users,
  ShieldAlert,
  Sparkles,
  Database,
  UserCheck,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderDot,
  FileText,
  Search,
  Eye,
  Trash2,
  Smartphone,
  Sun,
  Moon
} from "lucide-react";
import { Grievance } from "./types";

const APP_TRANSLATIONS = {
  en: {
    citizen: "Citizen",
    admin: "Admin",
    toggleTheme: "Toggle Dark/Light Theme",
    newGrievance: "New Grievance",
    myReports: "My Reports",
    historyTitle: "My Filed Reports & Status Tracker",
    historySub: "Secure device-locked feed of complaints you filed",
    clearHistory: "Clear local tracking history",
    noReportsTitle: "No active reports logged on this device",
    noReportsDesc: "File your first grievance on the left to track its real-time resolution status here!",
    resolved: "Resolved",
    open: "Open",
    filed: "Filed",
    citizenPortal: "Citizen Portal",
    mpAdmin: "MP Admin",
    intakeSystem: "Citizen Intake System",
    connectedFirestore: "Connected to Firestore",
    confirmClear: "Are you sure you want to clear your local complaint browsing history? This will not delete the complaints from the main database.",
    whatsAppSim: "WhatsApp Simulator",
    whatsAppAssistant: "WhatsApp Assistant",
    managementDashboard: "Management Dashboard",
    mpAdminArea: "MP Admin Area",
    portalsAndAccess: "Portals & Access",
    officeOfMP: "Office of the MP",
    selectLanguage: "Select Portal Language"
  },
  hi: {
    citizen: "नागरिक",
    admin: "प्रशासक",
    toggleTheme: "डार्क/लाइट थीम बदलें",
    newGrievance: "नई शिकायत",
    myReports: "मेरी रिपोर्टें",
    historyTitle: "मेरी शिकायतें और स्थिति ट्रैकर",
    historySub: "आपके द्वारा दर्ज की गई शिकायतों की सुरक्षित स्थानीय सूची",
    clearHistory: "इतिहास साफ़ करें",
    noReportsTitle: "इस डिवाइस पर कोई शिकायत दर्ज नहीं है",
    noReportsDesc: "अपनी शिकायतों के समाधान को लाइव देखने के लिए बाईं ओर पहली शिकायत दर्ज करें!",
    resolved: "समाधानित",
    open: "सक्रिय",
    filed: "दर्ज किया गया",
    citizenPortal: "नागरिक पोर्टल",
    mpAdmin: "प्रशासक पोर्टल",
    intakeSystem: "नागरिक शिकायत प्रणाली",
    connectedFirestore: "फायरस्टोर से जुड़ा हुआ",
    confirmClear: "क्या आप वाकई अपना स्थानीय शिकायत इतिहास साफ़ करना चाहते हैं? इससे मुख्य डेटाबेस से शिकायतें नहीं हटेंगी।",
    whatsAppSim: "व्हाट्सएप सिम्युलेटर",
    whatsAppAssistant: "व्हाट्सएप सहायक",
    managementDashboard: "प्रबंधन डैशबोर्ड",
    mpAdminArea: "सांसद प्रशासनिक क्षेत्र",
    portalsAndAccess: "पोर्टल और पहुंच",
    officeOfMP: "सांसद कार्यालय",
    selectLanguage: "भाषा का चयन करें"
  },
  bn: {
    citizen: "নাগরিক",
    admin: "প্রশাসক",
    toggleTheme: "ডার্ক/লাইট থিম পরিবর্তন করুন",
    newGrievance: "নতুন অভিযোগ",
    myReports: "আমার রিপোর্ট",
    historyTitle: "আমার দায়ের করা অভিযোগ ও স্থিতি ট্র্যাকার",
    historySub: "আপনার দায়ের করা অভিযোগের সুরক্ষিত স্থানীয় তালিকা",
    clearHistory: "ইতিহাস মুছুন",
    noReportsTitle: "এই ডিভাইসে কোনো অভিযোগ নথিভুক্ত নেই",
    noReportsDesc: "এখানে রিয়েল-টাইমে সমাধান ট্র্যাক করতে বাম দিকে আপনার প্রথম অভিযোগটি দায়ের করুন!",
    resolved: "মীমাংসিত",
    open: "সক্রিয়",
    filed: "দায়ের করা হয়েছে",
    citizenPortal: "নাগরিক পোর্টাল",
    mpAdmin: "এমপি প্রশাসক",
    intakeSystem: "নাগরিক অভিযোগ গ্রহণ ব্যবস্থা",
    connectedFirestore: "ফায়ারস্টোরের সাথে সংযুক্ত",
    confirmClear: "আপনি কি নিশ্চিত যে আপনার স্থানীয় অভিযোগের ইতিহাস মুছে ফেলতে চান? এটি মূল ডাটাবেস থেকে অভিযোগ মুছবে না।",
    whatsAppSim: "হোয়াটসঅ্যাপ সিমুলেটর",
    whatsAppAssistant: "হোয়াটসঅ্যাপ সহকারী",
    managementDashboard: "ব্যবস্থাপনা ড্যাশবোর্ড",
    mpAdminArea: "এমপি প্রশাসনিক এলাকা",
    portalsAndAccess: "পোর্টাল এবং অ্যাক্সেস",
    officeOfMP: "এমপি কার্যালয়",
    selectLanguage: "ভাষা নির্বাচন করুন"
  },
  kn: {
    citizen: "ನಾಗರಿಕ",
    admin: "ಆಡಳಿತಾಧಿಕಾರಿ",
    toggleTheme: "ಡಾರ್ಕ್/ಲೈಟ್ ಥೀಮ್ ಬದಲಾಯಿಸಿ",
    newGrievance: "ಹೊಸ ಅಹವಾಲು",
    myReports: "ನನ್ನ ವರದಿಗಳು",
    historyTitle: "ನನ್ನ ಅಹವಾಲುಗಳು ಮತ್ತು ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕರ್",
    historySub: "ನೀವು ಸಲ್ಲಿಸಿದ ದೂರುಗಳ ಸುರಕ್ಷಿತ ಸ್ಥಳೀಯ ಇತಿಹಾಸ",
    clearHistory: "ಇತಿಹಾಸವನ್ನು ತೆರವುಗೊಳಿಸಿ",
    noReportsTitle: "ಈ ಸಾಧನದಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ದೂರುಗಳು ದಾಖಲಾಗಿಲ್ಲ",
    noReportsDesc: "ಇಲ್ಲಿ ನೈಜ-ಸಮಯದ ಪರಿಹಾರ ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಎಡಭಾಗದಲ್ಲಿ ನಿಮ್ಮ ಮೊದಲ ದೂರನ್ನು ಸಲ್ಲಿಸಿ!",
    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    open: "ಸಕ್ರಿಯ",
    filed: "ಸಲ್ಲಿಸಲಾಗಿದೆ",
    citizenPortal: "ನಾಗರಿಕ ಪೋರ್ಟಲ್",
    mpAdmin: "ಎಂಪಿ ಅಡ್ಮಿನ್",
    intakeSystem: "ನಾಗರಿಕ ಅಹವಾಲು ಸ್ವೀಕಾರ ವ್ಯವಸ್ಥೆ",
    connectedFirestore: "ಫೈರ್‌ಸ್ಟೋರ್‌ಗೆ ಸಂಪರ್ಕಿಸಲಾಗಿದೆ",
    confirmClear: "ನಿಮ್ಮ ಸ್ಥಳೀಯ ಇತಿಹಾಸವನ್ನು ತೆರವುಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಇದು ಮುಖ್ಯ ಡೇಟಾಬೇಸ್‌ನಿಂದ ದೂರುಗಳನ್ನು ಅಳಿಸುವುದಿಲ್ಲ.",
    whatsAppSim: "ವಾಟ್ಸಾಪ್ ಸಿಮ್ಯುಲೇಟರ್",
    whatsAppAssistant: "ವಾಟ್ಸಾಪ್ ಸಹಾಯಕ",
    managementDashboard: "ನಿರ್ವಹಣಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    mpAdminArea: "ಎಂಪಿ ಆಡಳಿತ ಪ್ರದೇಶ",
    portalsAndAccess: "ಪೋರ್ಟಲ್‌ಗಳು ಮತ್ತು ಪ್ರವೇಶ",
    officeOfMP: "ಸಂಸದರ ಕಚೇರಿ",
    selectLanguage: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ"
  },
  ta: {
    citizen: "குடிமகன்",
    admin: "நிர்வாகி",
    toggleTheme: "இருண்ட/ஒளி தீமிற்கு மாற்றவும்",
    newGrievance: "புதிய புகார்",
    myReports: "எனது அறிக்கைகள்",
    historyTitle: "எனது புகார்கள் மற்றும் நிலை கண்காணிப்பு",
    historySub: "நீங்கள் சமர்ப்பித்த புகார்களின் பாதுகாக்கப்பட்ட உள்ளூர் பட்டியல்",
    clearHistory: "வரலாற்றை நீக்கு",
    noReportsTitle: "இந்த சாதனத்தில் புகார்கள் எதுவும் பதிவு செய்யப்படவில்லை",
    noReportsDesc: "உங்கள் புகாரின் நேரடி தீர்வு நிலையை இங்கே கண்காணிக்க இடதுபுறத்தில் முதல் புகாரைச் சமர்ப்பிக்கவும்!",
    resolved: "தீர்க்கப்பட்டது",
    open: "செயலில் உள்ளது",
    filed: "சமர்ப்பிக்கப்பட்டது",
    citizenPortal: "குடிமகன் போர்டல்",
    mpAdmin: "எம்பி நிர்வாகம்",
    intakeSystem: "குடிமக்கள் குறைதீர்க்கும் அமைப்பு",
    connectedFirestore: "Firestore உடன் இணைக்கப்பட்டுள்ளது",
    confirmClear: "உங்கள் உள்ளூர் புகார்களின் வரலாற்றை நீக்க விரும்புகிறீர்களா? இது முதன்மை தரவுத்தளத்தில் இருந்து புகார்களை நீக்காது.",
    whatsAppSim: "வாட்ஸ்அப் சிமுலேட்டர்",
    whatsAppAssistant: "வாட்ஸ்அப் உதவியாளர்",
    managementDashboard: "மேலாண்மை டாஷ்போர்டு",
    mpAdminArea: "எம்பி நிர்வாக பகுதி",
    portalsAndAccess: "போர்டல்கள் மற்றும் அணுகல்",
    officeOfMP: "நாடாளுமன்ற உறுப்பினர் அலுவலகம்",
    selectLanguage: "மொழியைத் தேர்ந்தெடுக்கவும்"
  }
};

// Custom high-fidelity inline SVG component for CivicPulse AI logo (representing 64x64px requirement with retina vector scale)
function CivicPulseLogo() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <circle cx="250" cy="250" r="235" fill="white" />
      
      {/* Outer Blue Arc framing the people and pulse */}
      <path 
        d="M 120 280 C 100 150, 220 80, 360 120 C 370 125, 360 135, 350 135 C 240 100, 140 160, 145 285 C 150 400, 270 450, 420 350 C 430 340, 435 350, 425 360 C 290 470, 140 410, 120 280 Z" 
        fill="url(#headerBlueGradient)" 
      />
      
      {/* Emerald Green Supporting Hand at the Bottom */}
      <path
        d="M 230 350 C 280 340, 340 310, 410 250 C 420 240, 430 255, 415 265 C 330 330, 280 380, 190 320 C 180 310, 200 300, 210 310 C 220 320, 225 340, 230 350 Z"
        fill="#10b981"
      />
      
      {/* Stylized Citizens Group (Orange, Blue, Green) */}
      {/* Citizen Left (Orange) */}
      <circle cx="150" cy="225" r="14" fill="#f59e0b" />
      <path d="M 136 270 C 136 245, 164 245, 164 270 Z" fill="#f59e0b" />
      
      {/* Citizen Center (Blue) */}
      <circle cx="185" cy="195" r="18" fill="#1e40af" />
      <path d="M 167 255 C 167 220, 203 220, 203 255 Z" fill="#1e40af" />
      
      {/* Citizen Right (Green) */}
      <circle cx="220" cy="220" r="14" fill="#10b981" />
      <path d="M 206 265 C 206 240, 234 240, 234 265 Z" fill="#10b981" />

      {/* Heartbeat Pulse Connecting Citizens to Governance */}
      <path 
        d="M 228 220 L 250 220 L 260 160 L 272 260 L 282 185 L 292 220 L 335 220" 
        stroke="#1d4ed8" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Parliament Building Dome (Navy) */}
      <g transform="translate(320, 175) scale(0.65)">
        {/* Foundation steps */}
        <rect x="10" y="80" width="180" height="15" rx="4" fill="#0f172a" />
        <rect x="20" y="70" width="160" height="10" fill="#0f172a" />
        
        {/* Column gallery */}
        <rect x="30" y="45" width="140" height="25" fill="#0f172a" />
        {/* White spacing to represent individual columns */}
        <rect x="40" y="48" width="5" height="19" fill="white" />
        <rect x="55" y="48" width="5" height="19" fill="white" />
        <rect x="70" y="48" width="5" height="19" fill="white" />
        <rect x="85" y="48" width="5" height="19" fill="white" />
        <rect x="100" y="48" width="5" height="19" fill="white" />
        <rect x="115" y="48" width="5" height="19" fill="white" />
        <rect x="130" y="48" width="5" height="19" fill="white" />
        <rect x="145" y="48" width="5" height="19" fill="white" />
        <rect x="160" y="48" width="5" height="19" fill="white" />
        
        {/* Main Dome */}
        <path d="M 30 45 C 30 -5, 170 -5, 170 45 Z" fill="#0f172a" />
        {/* Dome structural details */}
        <path d="M 100 0 L 100 45" stroke="white" strokeWidth="4" />
        <path d="M 70 5 C 80 20, 80 35, 75 45" stroke="white" strokeWidth="3" fill="none" />
        <path d="M 130 5 C 120 20, 120 35, 125 45" stroke="white" strokeWidth="3" fill="none" />
        
        {/* Spire with Flag */}
        <line x1="100" y1="0" x2="100" y2="-18" stroke="#0f172a" strokeWidth="5" />
        <path d="M 100 -18 L 122 -13 L 100 -8 Z" fill="#0f172a" />
      </g>

      <defs>
        <linearGradient id="headerBlueGradient" x1="120" y1="120" x2="420" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"citizen" | "mp" | "whatsapp">("citizen");
  const [citizenSubTab, setCitizenSubTab] = useState<"submit" | "track">("submit");
  const [citizenLang, setCitizenLang] = useState<"en" | "hi" | "bn" | "kn" | "ta">("en");
  const [user, setUser] = useState<User | null>(null);
  
  // Theme state for accessibility
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem("app_theme");
      return (stored as "light" | "dark") || "light";
    } catch {
      return "light";
    }
  });

  // Apply theme to the root element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("app_theme", nextTheme);
    } catch (e) {
      console.error(e);
    }
  };
  
  // Real-time grievances cache for both portals
  const [allGrievances, setAllGrievances] = useState<Grievance[]>([]);

  // Local storage logged complaint tracker for citizens
  const [myComplaintIds, setMyComplaintIds] = useState<string[]>([]);
  const [localFullComplaints, setLocalFullComplaints] = useState<Grievance[]>([]);

  // Load user logged complaints from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("citizen_logged_complaints");
      if (stored) {
        setMyComplaintIds(JSON.parse(stored));
      }
      const storedFull = localStorage.getItem("citizen_logged_full_complaints");
      if (storedFull) {
        setLocalFullComplaints(JSON.parse(storedFull));
      }
    } catch (e) {
      console.error("Error reading localStorage tracker:", e);
    }
  }, []);

  // Listen to Firestore Auth & Grievances collection
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const grievancesCol = collection(db, "grievances");
    const unsubscribeGrievances = onSnapshot(grievancesCol, (snapshot) => {
      const data: Grievance[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Grievance);
      });
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllGrievances(data);
    }, (error) => {
      console.error("Error listening to grievances:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeGrievances();
    };
  }, []);

  // Callback when citizen files a complaint successfully
  const handleGrievanceSubmitted = (newId: string, fullData?: any) => {
    try {
      const updatedIds = [...myComplaintIds, newId];
      setMyComplaintIds(updatedIds);
      localStorage.setItem("citizen_logged_complaints", JSON.stringify(updatedIds));

      if (fullData) {
        const updatedLocalFull = [...localFullComplaints.filter(g => g.id !== newId), { id: newId, ...fullData }];
        setLocalFullComplaints(updatedLocalFull);
        localStorage.setItem("citizen_logged_full_complaints", JSON.stringify(updatedLocalFull));
      }
    } catch (e) {
      console.error("Error writing localStorage tracker:", e);
    }
  };

  // Filter complaints logged by the current device, combining online real-time ones with local offline copies
  const myComplaints = (() => {
    const onlineComplaints = allGrievances.filter((g) => g.id && myComplaintIds.includes(g.id));
    const onlineIds = new Set(onlineComplaints.map(g => g.id));
    const offlineComplaints = localFullComplaints.filter((g) => g.id && myComplaintIds.includes(g.id) && !onlineIds.has(g.id));
    
    const combined = [...onlineComplaints, ...offlineComplaints];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
  })();

  // Clear device complaint history
  const handleClearHistory = () => {
    if (confirm(APP_TRANSLATIONS[citizenLang].confirmClear)) {
      setMyComplaintIds([]);
      setLocalFullComplaints([]);
      localStorage.removeItem("citizen_logged_complaints");
      localStorage.removeItem("citizen_logged_full_complaints");
    }
  };

  // Helper icons
  const departmentIcons: Record<string, string> = {
    "Water Logging": "💧",
    "Potholes": "🕳️",
    "Garbage Report": "🗑️"
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden select-none transition-colors">
      {/* 1. Left Command Navigation Sidebar (Premium Unified Theme) */}
      <nav className="w-64 bg-slate-950 text-white flex flex-col h-full border-r border-slate-900 flex-shrink-0 hidden md:flex select-none">
        {/* Sidebar Header Brand with elegant, clean display */}
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-sm shadow-md border border-blue-500/20 relative">
              <Landmark className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-blue-400/10 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
                <span>CivicPulse</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                Public Service Engine
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Links with generous negative space and precise hierarchy */}
        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[9px] font-bold tracking-widest text-slate-500 uppercase px-3.5 mb-3 select-none">
            {APP_TRANSLATIONS[citizenLang].portalsAndAccess}
          </div>

          <button
            onClick={() => setActiveTab("citizen")}
            className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3.5 cursor-pointer transition-all transition-card ${
              activeTab === "citizen"
                ? "bg-slate-900 text-white font-bold border border-slate-800/80 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                : "text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === "citizen" ? "bg-blue-500 scale-125" : "bg-slate-700"}`} />
            <Users className={`w-4 h-4 flex-shrink-0 transition-colors ${activeTab === "citizen" ? "text-blue-400" : "text-slate-400"}`} />
            <span className="text-xs tracking-wide">{APP_TRANSLATIONS[citizenLang].citizenPortal}</span>
          </button>

          <button
            onClick={() => setActiveTab("mp")}
            className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3.5 cursor-pointer transition-all transition-card ${
              activeTab === "mp"
                ? "bg-slate-900 text-white font-bold border border-slate-800/80 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                : "text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === "mp" ? "bg-emerald-500 scale-125" : "bg-slate-700"}`} />
            <ShieldAlert className={`w-4 h-4 flex-shrink-0 transition-colors ${activeTab === "mp" ? "text-emerald-400" : "text-slate-400"}`} />
            <span className="text-xs tracking-wide">{APP_TRANSLATIONS[citizenLang].mpAdminArea}</span>
          </button>

          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3.5 cursor-pointer transition-all transition-card ${
              activeTab === "whatsapp"
                ? "bg-slate-900 text-white font-bold border border-slate-800/80 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                : "text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === "whatsapp" ? "bg-green-500 scale-125" : "bg-slate-700"}`} />
            <Smartphone className={`w-4 h-4 flex-shrink-0 transition-colors ${activeTab === "whatsapp" ? "text-green-400" : "text-slate-400"}`} />
            <span className="text-xs tracking-wide">{APP_TRANSLATIONS[citizenLang].whatsAppSim}</span>
          </button>
        </div>

        {/* Sidebar Footer Info - highly refined and minimal */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 space-y-2.5">
          <div className="flex items-center gap-3 p-1.5 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-800">
              MP
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">Hon. S. Sharma</div>
              <div className="text-[9px] text-slate-500 uppercase font-semibold tracking-widest">{APP_TRANSLATIONS[citizenLang].officeOfMP}</div>
            </div>
          </div>
          {user && (
            <div className="pt-2.5 border-t border-slate-900 flex items-center gap-2 text-[9px] text-slate-400 font-mono px-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
        </div>
      </nav>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
        {/* Top Header Bar */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 md:px-8 flex-shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            {/* 64x64 px Logo Image Container */}
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
              <CivicPulseLogo />
            </div>
            
            {/* App Name & Active View Tracker */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  CivicPulse <span className="text-blue-600 dark:text-blue-400">AI</span>
                </span>
                <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-[9px] font-bold text-blue-600 dark:text-blue-400 rounded-md border border-blue-100/60 dark:border-blue-900/30">
                  Gov-Tech
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 leading-none">
                {activeTab === "citizen" 
                  ? APP_TRANSLATIONS[citizenLang].citizenPortal
                  : activeTab === "whatsapp"
                  ? APP_TRANSLATIONS[citizenLang].whatsAppAssistant
                  : APP_TRANSLATIONS[citizenLang].managementDashboard
                }
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button (Accessibility Feature) - 44x44px target area */}
            <button
              onClick={toggleTheme}
              className={`w-11 h-11 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                theme === "dark"
                  ? "bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700/80 shadow-sm"
                  : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm"
              }`}
              aria-label="Toggle dark and light theme mode"
              title={APP_TRANSLATIONS[citizenLang].toggleTheme}
            >
              {theme === "dark" ? (
                <Moon className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
              ) : (
                <Sun className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Workspace core - pb-18 on mobile prevents bottom tab bar overlap */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 pb-18 md:p-6 lg:p-8 md:pb-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            {activeTab === "citizen" && (
              <>
                {/* Beautiful Language Selector Card (scrolls with the rest of the page) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between flex-wrap gap-4 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {APP_TRANSLATIONS[citizenLang].selectLanguage}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200/85 dark:border-slate-800 p-1 rounded-xl shadow-inner">
                    <button
                      onClick={() => setCitizenLang("en")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all cursor-pointer ${
                        citizenLang === "en" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setCitizenLang("hi")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all cursor-pointer ${
                        citizenLang === "hi" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      हिंदी
                    </button>
                    <button
                      onClick={() => setCitizenLang("bn")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all cursor-pointer ${
                        citizenLang === "bn" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      বাংলা
                    </button>
                    <button
                      onClick={() => setCitizenLang("kn")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all cursor-pointer ${
                        citizenLang === "kn" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      ಕನ್ನಡ
                    </button>
                    <button
                      onClick={() => setCitizenLang("ta")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all cursor-pointer ${
                        citizenLang === "ta" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      தமிழ்
                    </button>
                  </div>
                </div>

                <VoiceAssistant lang={citizenLang} setLang={setCitizenLang} />
                {/* Subtabs switcher - sized to 44px touch target height */}
                <div className="flex lg:hidden bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl mb-4 max-w-sm mx-auto">
                  <button
                    onClick={() => setCitizenSubTab("submit")}
                    className={`flex-1 h-11 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                      citizenSubTab === "submit"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {APP_TRANSLATIONS[citizenLang].newGrievance}
                  </button>
                  <button
                    onClick={() => setCitizenSubTab("track")}
                    className={`flex-1 h-11 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      citizenSubTab === "track"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{APP_TRANSLATIONS[citizenLang].myReports}</span>
                    {myComplaints.length > 0 && (
                      <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {myComplaints.length}
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}

            {activeTab === "citizen" ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Citizen Complaint Form */}
                <div className={`lg:col-span-6 xl:col-span-7 space-y-6 ${citizenSubTab === "submit" ? "block" : "hidden lg:block"}`}>
                  <GrievanceForm onSubmissionSuccess={handleGrievanceSubmitted} lang={citizenLang} />
                </div>

                {/* Right side: MY LOGGED REPORTS tracker unit */}
                <div className={`lg:col-span-6 xl:col-span-5 space-y-6 ${citizenSubTab === "track" ? "block" : "hidden lg:block"}`}>

                  {/* Citizen's Logged Reports & Live Tracker unit */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/85">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                          {APP_TRANSLATIONS[citizenLang].historyTitle}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {APP_TRANSLATIONS[citizenLang].historySub}
                        </p>
                      </div>
                      {myComplaints.length > 0 && (
                        <button
                          onClick={handleClearHistory}
                          title={APP_TRANSLATIONS[citizenLang].clearHistory}
                          className="p-1 text-slate-400 hover:text-red-500 transition-all cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px]"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>

                    {myComplaints.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        <FolderDot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {APP_TRANSLATIONS[citizenLang].noReportsTitle}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 px-6">
                          {APP_TRANSLATIONS[citizenLang].noReportsDesc}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {myComplaints.map((g) => {
                          const isResolved = g.status === "Resolved";
                          return (
                            <div
                              key={g.id}
                              className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 transition-all space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                                  <span>{departmentIcons[g.department] || "📋"}</span>
                                  <span className="truncate">{g.cleanLocation}</span>
                                </span>
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                                    isResolved
                                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
                                      : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40"
                                  }`}
                                >
                                  {isResolved ? (
                                    <>
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>{APP_TRANSLATIONS[citizenLang].resolved}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                      <span>{APP_TRANSLATIONS[citizenLang].open}</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-300 line-clamp-2 leading-relaxed font-sans">
                                "{g.description}"
                              </p>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[9px] text-slate-400">
                                <span>{APP_TRANSLATIONS[citizenLang].filed}: {new Date(g.createdAt).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1.5">
                                  {g.assignedBody && (
                                    <span className="text-[8px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1 rounded">
                                      {g.assignedBody.split(" ")[0]}
                                    </span>
                                  )}
                                  <span className="font-mono">#G-{g.id?.substring(0, 4).toUpperCase()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ) : activeTab === "whatsapp" ? (
              <WhatsAppSimulator />
            ) : (
              /* MP Administrative Dashboard Panel (Has its own inner high-density stats) */
              <Dashboard lang={citizenLang} />
            )}
          </div>
        </div>

        {/* 3. Bottom Global Info Bar Removed For Architectural Honesty */}
      </main>

      {/* Mobile-first Sticky Bottom Tab Bar (Apple HIG Touch Guidelines & Thumb Zone Ergonomics) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 flex items-center justify-around z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab("citizen")}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
            activeTab === "citizen" ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          aria-label="Switch to Citizen Portal"
        >
          <Users className={`w-4.5 h-4.5 ${activeTab === "citizen" ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {APP_TRANSLATIONS[citizenLang].citizenPortal}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
            activeTab === "whatsapp" ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          aria-label="Switch to WhatsApp Simulator"
        >
          <Smartphone className={`w-4.5 h-4.5 ${activeTab === "whatsapp" ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {APP_TRANSLATIONS[citizenLang].whatsAppSim}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("mp")}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
            activeTab === "mp" ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          aria-label="Switch to Admin Area"
        >
          <ShieldAlert className={`w-4.5 h-4.5 ${activeTab === "mp" ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {APP_TRANSLATIONS[citizenLang].mpAdmin}
          </span>
        </button>
      </div>
    </div>
  );
}
