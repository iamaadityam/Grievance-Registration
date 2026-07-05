import { useState, useEffect } from "react";
import GrievanceForm from "./components/GrievanceForm";
import Dashboard from "./components/Dashboard";
import VoiceAssistant from "./components/VoiceAssistant";
import SmsHub from "./components/SmsHub";
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
  Smartphone
} from "lucide-react";
import { Grievance } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"citizen" | "mp">("citizen");
  const [citizenSubTab, setCitizenSubTab] = useState<"submit" | "track">("submit");
  const [citizenLang, setCitizenLang] = useState<"en" | "hi">("en");
  const [user, setUser] = useState<User | null>(null);
  const [isSmsHubOpen, setIsSmsHubOpen] = useState(false);
  
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
    if (confirm("Are you sure you want to clear your local complaint browsing history? This will not delete the complaints from the main database.")) {
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
    <div className="h-screen w-full flex bg-slate-50 font-sans text-slate-900 overflow-hidden select-none">
      {/* 1. Left Command Navigation Sidebar (High Density Theme) */}
      <nav className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-950 flex-shrink-0 hidden md:flex">
        {/* Sidebar Header Brand */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-black text-sm">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter leading-tight uppercase">
                Constituency
              </h1>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block -mt-1">
                Command Center
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Links */}
        <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase px-3 mb-2">
            Portals & Access
          </div>

          <button
            onClick={() => setActiveTab("citizen")}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
              activeTab === "citizen"
                ? "bg-slate-800 text-white font-bold border border-slate-700/55"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "citizen" ? "bg-blue-400" : "bg-slate-600"}`} />
            <Users className="w-4 h-4 flex-shrink-0 text-blue-400" />
            <span className="text-xs">Citizen Portal</span>
          </button>

          <button
            onClick={() => setActiveTab("mp")}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
              activeTab === "mp"
                ? "bg-slate-800 text-white font-bold border border-slate-700/55"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "mp" ? "bg-emerald-400" : "bg-slate-600"}`} />
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="text-xs">MP Admin Area</span>
          </button>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-700">
              MP
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Hon. S. Sharma</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Office of the MP</div>
            </div>
          </div>
          {user && (
            <div className="pt-2 border-t border-slate-800/50 flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
        </div>
      </nav>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider hidden sm:inline-block">
              {activeTab === "citizen" 
                ? (citizenLang === "hi" ? "नागरिक शिकायत प्रणाली" : "Citizen Intake System") 
                : "Constituency Headquarters"
              }
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded uppercase tracking-tighter flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>{citizenLang === "hi" ? "फायरस्टोर से जुड़ा हुआ" : "Connected to Firestore"}</span>
              </span>
            </div>
          </div>

          {/* Quick tab switcher on mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setActiveTab("citizen")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === "citizen" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {citizenLang === "hi" ? "नागरिक" : "Citizen"}
            </button>
            <button
              onClick={() => setActiveTab("mp")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === "mp" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {citizenLang === "hi" ? "प्रशासक" : "Admin"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSmsHubOpen(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200/50 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title={citizenLang === "hi" ? "एसएमएस नोटिफिकेशन सेंटर खोलें" : "Open SMS notification center"}
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>{citizenLang === "hi" ? "एसएमएस सेंटर" : "SMS Center"}</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Secure Gateway v2.4</span>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace core */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === "citizen" && (
              <>
                <VoiceAssistant lang={citizenLang} setLang={setCitizenLang} />
                <div className="flex lg:hidden bg-slate-200/60 p-1 rounded-xl mb-4 max-w-sm mx-auto">
                  <button
                    onClick={() => setCitizenSubTab("submit")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      citizenSubTab === "submit"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {citizenLang === "hi" ? "नई शिकायत" : "New Grievance"}
                  </button>
                  <button
                    onClick={() => setCitizenSubTab("track")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      citizenSubTab === "track"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{citizenLang === "hi" ? "मेरी रिपोर्टें" : "My Reports"}</span>
                    {myComplaints.length > 0 && (
                      <span className="bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
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
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                          {citizenLang === "hi" ? "मेरी शिकायतें और स्थिति ट्रैकर" : "My Filed Reports & Status Tracker"}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {citizenLang === "hi" ? "आपके द्वारा दर्ज की गई शिकायतों की सुरक्षित स्थानीय सूची" : "Secure device-locked feed of complaints you filed"}
                        </p>
                      </div>
                      {myComplaints.length > 0 && (
                        <button
                          onClick={handleClearHistory}
                          title={citizenLang === "hi" ? "इतिहास साफ़ करें" : "Clear local tracking history"}
                          className="p-1 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {myComplaints.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                        <FolderDot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-500">
                          {citizenLang === "hi" ? "इस डिवाइस पर कोई शिकायत दर्ज नहीं है" : "No active reports logged on this device"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 px-6">
                          {citizenLang === "hi" 
                            ? "अपनी शिकायतों के समाधान को लाइव देखने के लिए बाईं ओर पहली शिकायत दर्ज करें!" 
                            : "File your first grievance on the left to track its real-time resolution status here!"
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {myComplaints.map((g) => {
                          const isResolved = g.status === "Resolved";
                          return (
                            <div
                              key={g.id}
                              className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                                  <span>{departmentIcons[g.department] || "📋"}</span>
                                  <span className="truncate">{g.cleanLocation}</span>
                                </span>
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                                    isResolved
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : "bg-amber-50 text-amber-700 border border-amber-100"
                                  }`}
                                >
                                  {isResolved ? (
                                    <>
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>{citizenLang === "hi" ? "समाधानित" : "Resolved"}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                      <span>{citizenLang === "hi" ? "सक्रिय" : "Open"}</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                "{g.description}"
                              </p>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[9px] text-slate-400">
                                <span>{citizenLang === "hi" ? "दर्ज किया गया" : "Filed"}: {new Date(g.createdAt).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1.5">
                                  {g.assignedBody && (
                                    <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-1 rounded">
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
            ) : (
              /* MP Administrative Dashboard Panel (Has its own inner high-density stats) */
              <Dashboard />
            )}
          </div>
        </div>

        {/* 3. Bottom Global Info Bar - Rendered for Admin only, hide for Citizen */}
        {activeTab === "mp" && (
          <div className="h-12 bg-white border-t border-slate-200 px-6 md:px-8 flex items-center gap-8 text-xs flex-shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Operational Database</span>
              <span className="text-xs font-black text-slate-900">Firestore Live</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Area Jurisdiction</span>
              <span className="text-xs font-black text-blue-600">DELHI DISTRICT GRID</span>
            </div>
            <div className="ml-auto text-[9px] text-slate-400 font-mono hidden sm:inline-block">
              Constituency Security Layer Active
            </div>
          </div>
        )}
      </main>

      <SmsHub isOpen={isSmsHubOpen} onClose={() => setIsSmsHubOpen(false)} lang={citizenLang} />
    </div>
  );
}
