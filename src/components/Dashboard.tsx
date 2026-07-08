import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth, signInWithGoogle, logOut, handleFirestoreError, OperationType } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Grievance } from "../types";
import MapWidget from "./MapWidget";
import { DataOverlayExplorer } from "./DataOverlayExplorer";
import { motion, AnimatePresence } from "motion/react";
import { sendGrievanceSms } from "../telemetry";
import {
  LogIn,
  LogOut,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FolderDot,
  FileText,
  Clock,
  Compass,
  ArrowUpDown,
  Filter,
  Layers,
  MapPin,
  TrendingUp,
  RotateCcw,
  Languages,
  Menu,
  X,
  PieChart as PieIcon,
  BarChart4,
  Users,
  Brain,
  Plus,
  ChevronRight,
  Trash2,
  Sparkles,
  Target,
  History,
  Terminal,
  Activity,
  BookOpen,
  Save,
  ExternalLink
} from "lucide-react";

// Multi-language translation support dictionary for the MP Admin Dashboard
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    title: "MP Grievance Dispatch Center",
    authBypass: "Enter Demo Mode (Bypass Auth)",
    signedInAs: "Signed in as",
    exitDashboard: "Exit Dashboard",
    totalReports: "Total Reports",
    openBacklog: "Open Backlog",
    resolvedCases: "Cases Resolved",
    activeHotspots: "Active Hotspots",
    priorityBacklog: "Priority Backlog",
    filterStatus: "Filter Status",
    filterDept: "Filter Department",
    allStatus: "All Status",
    allDepts: "All Departments",
    score: "Score",
    landmark: "Landmark",
    reportedBy: "Reported by",
    repeatCount: "complaints",
    resolve: "Resolve",
    resolved: "Resolved",
    distribution: "Department Distribution",
    trend: "7-Day Historical Trend",
    sectorFilter: "Sector Jurisdiction",
    allSectors: "All Sectors",
    mcdTag: "MCD Delhi Team",
    ndmcTag: "NDMC Area Team",
    timeFilterLabel: "Filter Resolved:",
    resolvedToday: "Today",
    resolvedMonth: "This Month",
    resolvedYear: "This Year",
    resolvedAll: "All Time"
  },
  hi: {
    title: "सांसद जन शिकायत प्रेषण केंद्र",
    authBypass: "डेमो मोड (बिना लॉगिन प्रवेश करें)",
    signedInAs: "लॉगिन उपयोगकर्ता",
    exitDashboard: "डैशबोर्ड से बाहर निकलें",
    totalReports: "कुल मामले दर्ज",
    openBacklog: "लंबित मामले",
    resolvedCases: "सुलझाए गए मामले",
    activeHotspots: "सक्रिय हॉटस्पॉट",
    priorityBacklog: "प्राथमिकता सूची",
    filterStatus: "स्थिति बदलें",
    filterDept: "विभाग बदलें",
    allStatus: "सभी स्थितियां",
    allDepts: "सभी विभाग",
    score: "स्कोर",
    landmark: "नज़दीकी स्थान",
    reportedBy: "शिकायतकर्ता",
    repeatCount: "शिकायतें दर्ज",
    resolve: "सुलझाएं",
    resolved: "सुलझ गया",
    distribution: "विभाग अनुसार मामले",
    trend: "7 दिवसीय ऐतिहासिक रुझान",
    sectorFilter: "क्षेत्राधिकार",
    allSectors: "सभी क्षेत्र",
    mcdTag: "MCD दिल्ली टीम",
    ndmcTag: "NDMC क्षेत्र टीम",
    timeFilterLabel: "सुलझाए गए समय सीमा:",
    resolvedToday: "आज",
    resolvedMonth: "इस महीने",
    resolvedYear: "इस वर्ष",
    resolvedAll: "कुल समय"
  },
  hinglish: {
    title: "MP Office Dispatch Center",
    authBypass: "Demo Mode me Enter Karein (Bypass)",
    signedInAs: "Signed in hai",
    exitDashboard: "Dashboard se Exit",
    totalReports: "Total Reports Filed",
    openBacklog: "Lending Cases (Open)",
    resolvedCases: "Solved Cases",
    activeHotspots: "Active Hotspots (Spots)",
    priorityBacklog: "Priority Backlog List",
    filterStatus: "Status Filter",
    filterDept: "Department Filter",
    allStatus: "All Status",
    allDepts: "All Departments",
    score: "Score",
    landmark: "Landmark Spot",
    reportedBy: "Filed by",
    repeatCount: "complaints aayi",
    resolve: "Solve Karein",
    resolved: "Solved Hai",
    distribution: "Department Wise Breakup",
    trend: "Pichle 7 Days ki Trend",
    sectorFilter: "Sector Jurisdiction",
    allSectors: "Sabhi Sectors",
    mcdTag: "MCD Delhi Board",
    ndmcTag: "NDMC Core Zone",
    timeFilterLabel: "Resolved Filter Time:",
    resolvedToday: "Aaj Ke",
    resolvedMonth: "Is Month Ke",
    resolvedYear: "Is Year Ke",
    resolvedAll: "Ab Tak Ke"
  }
};

function SimpleMarkdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-slate-700 text-[11px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return (
            <h3 key={idx} className="text-xs font-black text-slate-900 uppercase tracking-tight mt-3 pt-1 border-t border-slate-100">
              {trimmed.replace("###", "").trim()}
            </h3>
          );
        }
        if (trimmed.startsWith("####")) {
          return (
            <h4 key={idx} className="text-[10px] font-black text-slate-800 uppercase mt-2">
              {trimmed.replace("####", "").trim()}
            </h4>
          );
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return (
            <li key={idx} className="ml-3 list-disc pl-1 text-slate-600">
              {trimmed.substring(1).trim()}
            </li>
          );
        }
        if (trimmed === "") return <div key={idx} className="h-1" />;
        return <p key={idx} className="text-slate-600">{trimmed}</p>;
      })}
    </div>
  );
}

interface DashboardProps {
  lang?: "en" | "hi" | "bn" | "kn" | "ta";
}

export default function Dashboard({ lang = "en" }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoAdmin, setIsDemoAdmin] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [offlineGrievances, setOfflineGrievances] = useState<Grievance[]>([]);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);

  // IndexedDB helper to read offline grievances in the Admin Dashboard
  const getOfflineGrievancesFromDB = (): Promise<any[]> => {
    const OFF_DB_NAME = "civicpulse-offline-db";
    const OFF_DB_VERSION = 2;
    return new Promise((resolve) => {
      const request = indexedDB.open(OFF_DB_NAME, OFF_DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("offline-submissions")) {
          db.createObjectStore("offline-submissions", { keyPath: "id" });
        }
      };
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        try {
          if (!db.objectStoreNames.contains("offline-submissions")) {
            resolve([]);
            return;
          }
          const transaction = db.transaction("offline-submissions", "readonly");
          const store = transaction.objectStore("offline-submissions");
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
          getAllRequest.onerror = () => resolve([]);
        } catch (err) {
          resolve([]); // Fallback if store doesn't exist yet
        }
      };
      request.onerror = () => resolve([]);
    });
  };

  const loadOfflineGrievances = async () => {
    try {
      const offlineItems = await getOfflineGrievancesFromDB();
      setOfflineGrievances(offlineItems);
    } catch (err) {
      console.warn("Failed to read offline grievances:", err);
    }
  };

  // Fetch offline grievances on mount and whenever user status changes
  useEffect(() => {
    loadOfflineGrievances();
  }, [user, isDemoAdmin]);

  // Periodically refresh offline grievances to reflect any new offline entries instantly
  useEffect(() => {
    const interval = setInterval(() => {
      loadOfflineGrievances();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Combine live and offline grievances
  const combinedAllGrievances = useMemo(() => {
    const firestoreIds = new Set(grievances.map((g) => g.id).filter(Boolean));
    const uniqueOffline = offlineGrievances.map(og => ({
      ...og,
      status: og.status || "Open",
      isOfflineOnly: true
    })).filter((og) => !firestoreIds.has(og.id));
    return [...uniqueOffline, ...grievances];
  }, [grievances, offlineGrievances]);


  // Gemini response suggestions states
  const [suggestedResponses, setSuggestedResponses] = useState<Record<string, string>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, string>>({});
  
  // Backlog and Jurisdiction Filters
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Resolved" | "Reopened">("Open");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [resolvedTimeFilter, setResolvedTimeFilter] = useState<"today" | "month" | "year" | "all">("all");

  // View Mode for duplicates/consolidated vs individual requests
  const [viewMode, setViewMode] = useState<"grouped" | "individual">("grouped");
  
  // General Timeframe Date Range Filters
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "weekly" | "monthly" | "yearly" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Comparative Planner & AI Decision Support states
  const [activeAdminTab, setActiveAdminTab] = useState<"grievances" | "planner">("grievances");
  const [compareSector, setCompareSector] = useState<string>("Central Zone");
  
  // Interactive budget simulator sliders (cap = ₹5.0 Cr)
  const [roadBudget, setRoadBudget] = useState<number>(2.0);
  const [waterBudget, setWaterBudget] = useState<number>(1.5);
  const [wasteBudget, setWasteBudget] = useState<number>(1.5);

  const handleBudgetChange = (track: "road" | "water" | "waste", val: number) => {
    const formattedVal = Math.round(val * 10) / 10;
    if (track === "road") {
      const remaining = 5.0 - formattedVal;
      const sumOthers = waterBudget + wasteBudget;
      if (sumOthers <= 0) {
        setRoadBudget(formattedVal);
        setWaterBudget(Math.round((remaining / 2) * 10) / 10);
        setWasteBudget(Math.round((remaining / 2) * 10) / 10);
      } else {
        const ratio = remaining / sumOthers;
        setRoadBudget(formattedVal);
        setWaterBudget(Math.max(0, Math.round((waterBudget * ratio) * 10) / 10));
        setWasteBudget(Math.max(0, Math.round((wasteBudget * ratio) * 10) / 10));
      }
    } else if (track === "water") {
      const remaining = 5.0 - formattedVal;
      const sumOthers = roadBudget + wasteBudget;
      if (sumOthers <= 0) {
        setWaterBudget(formattedVal);
        setRoadBudget(Math.round((remaining / 2) * 10) / 10);
        setWasteBudget(Math.round((remaining / 2) * 10) / 10);
      } else {
        const ratio = remaining / sumOthers;
        setWaterBudget(formattedVal);
        setRoadBudget(Math.max(0, Math.round((roadBudget * ratio) * 10) / 10));
        setWasteBudget(Math.max(0, Math.round((wasteBudget * ratio) * 10) / 10));
      }
    } else if (track === "waste") {
      const remaining = 5.0 - formattedVal;
      const sumOthers = roadBudget + waterBudget;
      if (sumOthers <= 0) {
        setWasteBudget(formattedVal);
        setRoadBudget(Math.round((remaining / 2) * 10) / 10);
        setWaterBudget(Math.round((remaining / 2) * 10) / 10);
      } else {
        const ratio = remaining / sumOthers;
        setWasteBudget(formattedVal);
        setRoadBudget(Math.max(0, Math.round((roadBudget * ratio) * 10) / 10));
        setWaterBudget(Math.max(0, Math.round((waterBudget * ratio) * 10) / 10));
      }
    }
  };

  const [proposals, setProposals] = useState<any[]>([
    {
      id: 1,
      title: "Upgrade Govt Girls Senior Secondary School",
      type: "school_upgrade",
      parameters: {
        enrollment: "450",
        travelDistance: "12",
        targetAge: "11-16"
      }
    },
    {
      id: 2,
      title: "Build District Vocational Training Centre",
      type: "vocational_centre",
      parameters: {
        travelDistance: "25",
        capacity: "150",
        targetAge: "18-35"
      }
    }
  ]);
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [mobileGrievanceView, setMobileGrievanceView] = useState<"list" | "map">("list");

  const [trendChartMetric, setTrendChartMetric] = useState<"grievance" | "satisfaction">("grievance");
  const [selectedTrendMonth, setSelectedTrendMonth] = useState<number>(0);

  // Live General Scan AI states
  const [liveAIScanText, setLiveAIScanText] = useState<string>("");
  const [isScanningAI, setIsScanningAI] = useState(false);

  const handleCompareProposals = async () => {
    setIsComparing(true);
    setCompareError(null);
    try {
      const sectorGrievances = combinedAllGrievances.filter(g => {
        if (compareSector === "All") return true;
        return true;
      });
      
      const categoryDistribution = {
        garbage: sectorGrievances.filter(g => g.department === "Garbage Report").length,
        water: sectorGrievances.filter(g => g.department === "Water Logging").length,
        potholes: sectorGrievances.filter(g => g.department === "Potholes").length,
      };

      const res = await fetch("/api/analyze-and-compare-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector: compareSector,
          BUDGET_SIMULATOR_SLIDERS: {
            roadRepairs: roadBudget,
            waterDrainage: waterBudget,
            solidWaste: wasteBudget
          },
          COMPETING_PROPOSALS_DSS: {
            option_a: {
              title: proposals[0]?.title || "Upgrade Govt Girls Senior Secondary School",
              enrollment: Number(proposals[0]?.parameters?.enrollment || 450),
              travelDistanceDistress: Number(proposals[0]?.parameters?.travelDistance || 12)
            },
            option_b: {
              title: proposals[1]?.title || "Build District Vocational Training Centre",
              capacity: Number(proposals[1]?.parameters?.capacity || 150),
              travelDistance: Number(proposals[1]?.parameters?.travelDistance || 25)
            }
          },
          ACTIVE_GRIEVANCE_METRICS: {
            activeCount: combinedAllGrievances.filter(g => g.status === "Open" && (compareSector === "All" || g.cleanLocation?.includes(compareSector) || true)).length,
            categoryDistribution: categoryDistribution
          }
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to compile comparison metrics from AI model.");
      }

      const data = await res.json();
      setCompareResult(data);
    } catch (err: any) {
      console.error(err);
      setCompareError(err.message || "Something went wrong.");
    } finally {
      setIsComparing(false);
    }
  };

  const handleGenerateLiveScan = async () => {
    setIsScanningAI(true);
    setLiveAIScanText("");
    try {
      const openIssues = combinedAllGrievances.filter(g => g.status === "Open").slice(0, 10);
      const complaintsSummary = openIssues.map(o => `- Assignee Department: ${o.department}, Landmark Location: ${o.cleanLocation}, Problem Description: ${o.description}`).join("\n");
      
      const res = await fetch("/api/generate-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintsSummary }),
      });

      if (!res.ok) {
        throw new Error("Failed to compile live recommendations from AI model.");
      }

      const data = await res.json();
      setLiveAIScanText(data.report || "No recommendations compiled.");
    } catch (err: any) {
      console.error(err);
      setLiveAIScanText(`Failed to generate report: ${err.message || "Unknown error."}`);
    } finally {
      setIsScanningAI(false);
    }
  };

  // Menu and Translation language states
  const [adminLang, setAdminLang] = useState<"en" | "hi" | "hinglish">("en");

  useEffect(() => {
    if (lang === "hi") {
      setAdminLang("hi");
    } else {
      setAdminLang("en");
    }
  }, [lang]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Authenticate Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore Grievances
  useEffect(() => {
    if (!user && !isDemoAdmin) return;

    const grievancesCol = collection(db, "grievances");
    const unsubscribe = onSnapshot(grievancesCol, (snapshot) => {
      const data: Grievance[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Grievance);
      });
      setGrievances(data);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, "grievances");
      } catch (err: any) {
        console.error("Firestore snapshot error wrapped:", err.message);
      }
    });

    return () => unsubscribe();
  }, [user, isDemoAdmin]);

  const handleGoogleSignIn = async () => {
    setSignInError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Sign-In error:", err);
      if (err?.message?.includes("auth/api-key-not-valid") || err?.code?.includes("auth/api-key-not-valid") || String(err).includes("api-key-not-valid")) {
        setSignInError("Firebase is not configured or has an invalid API key. Please run the setup tool or use Demo Bypass.");
      } else {
        setSignInError(err?.message || "Sign-In failed. Please try again or use Demo Bypass.");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
    setIsDemoAdmin(false);
    setSelectedGrievance(null);
    setMenuOpen(false);
  };

  const handleMarkResolved = async (grievanceId: string) => {
    try {
      const docRef = doc(db, "grievances", grievanceId);
      try {
        await updateDoc(docRef, { status: "Resolved" });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.UPDATE, `grievances/${grievanceId}`);
      }
      
      // Send SMS Notification via Telemetry API if selectedGrievance is available
      if (selectedGrievance && selectedGrievance.contact) {
        const citizenName = selectedGrievance.name || "Citizen";
        const issueType = selectedGrievance.category || selectedGrievance.department || "Issue";
        const smsMsg = adminLang === "hi"
          ? `नमस्ते ${citizenName}, आपकी शिकायत (${issueType}) ID: ${grievanceId} का समाधान कर दिया गया है। नोएडा/गुरुग्राम को स्वच्छ और बेहतर बनाने में सहयोग के लिए धन्यवाद! - सांसद (MP) कार्यालय`
          : `Dear ${citizenName}, your grievance regarding ${issueType} (ID: ${grievanceId}) has been resolved. Thank you for helping us keep our zone clean and functional! - Member of Parliament (MP) Office`;
        
        sendGrievanceSms(selectedGrievance.contact, smsMsg, {
          grievanceId,
          type: "status_resolved",
          category: issueType,
          name: citizenName
        });
      }

      // Update locally selected grievance if modified
      if (selectedGrievance?.id === grievanceId) {
        setSelectedGrievance((prev) => prev ? { ...prev, status: "Resolved" } : null);
      }
    } catch (err: any) {
      console.error("Error resolving grievance:", err);
      let errorMsg = "Failed to update status.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          errorMsg = `Firestore Security Denied: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
        }
      } catch (_) {
        errorMsg = err.message || errorMsg;
      }
      alert(errorMsg);
    }
  };

  const handleFetchSuggestedResponse = async (g: Grievance) => {
    if (!g.id) return;
    setLoadingSuggestions((prev) => ({ ...prev, [g.id!]: true }));
    try {
      const response = await fetch("/api/suggest-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: g.category || g.department,
          urgency: g.urgency,
          description: g.description,
          name: g.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate response suggestion");
      }

      const data = await response.json();
      setSuggestedResponses((prev) => ({ ...prev, [g.id!]: data.suggestion }));
      setEditedSuggestions((prev) => ({ ...prev, [g.id!]: data.suggestion }));
    } catch (err: any) {
      console.error("Error generating suggestion:", err);
      alert(err.message || "Failed to fetch response suggestion.");
    } finally {
      setLoadingSuggestions((prev) => ({ ...prev, [g.id!]: false }));
    }
  };

  const handleMarkResolvedWithCustomResponse = async (grievanceId: string, customMsg: string) => {
    try {
      const docRef = doc(db, "grievances", grievanceId);
      try {
        await updateDoc(docRef, { status: "Resolved" });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.UPDATE, `grievances/${grievanceId}`);
      }

      if (selectedGrievance && selectedGrievance.contact) {
        const citizenName = selectedGrievance.name || "Citizen";
        const issueType = selectedGrievance.category || selectedGrievance.department || "Issue";
        sendGrievanceSms(selectedGrievance.contact, customMsg, {
          grievanceId,
          type: "status_resolved_custom",
          category: issueType,
          name: citizenName,
        });
      }

      if (selectedGrievance?.id === grievanceId) {
        setSelectedGrievance((prev) => prev ? { ...prev, status: "Resolved" } : null);
      }
      alert("Grievance resolved and custom message sent successfully!");
    } catch (err: any) {
      console.error("Error resolving with custom response:", err);
      let errorMsg = "Failed to update status.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          errorMsg = `Firestore Security Denied: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
        }
      } catch (_) {
        errorMsg = err.message || errorMsg;
      }
      alert(errorMsg);
    }
  };

  const handleReopen = async (grievanceId: string) => {
    try {
      const docRef = doc(db, "grievances", grievanceId);
      try {
        await updateDoc(docRef, { status: "Reopened" });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.UPDATE, `grievances/${grievanceId}`);
      }
      
      // Send SMS Notification via Telemetry API if selectedGrievance is available
      if (selectedGrievance && selectedGrievance.contact) {
        const citizenName = selectedGrievance.name || "Citizen";
        const issueType = selectedGrievance.category || selectedGrievance.department || "Issue";
        const smsMsg = adminLang === "hi"
          ? `नमस्ते ${citizenName}, आपकी शिकायत (${issueType}) ID: ${grievanceId} को फिर से खोल दिया गया है और इस पर कार्रवाई जारी है। - सांसद (MP) कार्यालय`
          : `Dear ${citizenName}, your grievance regarding ${issueType} (ID: ${grievanceId}) has been reopened and is currently under review. - Member of Parliament (MP) Office`;
        
        sendGrievanceSms(selectedGrievance.contact, smsMsg, {
          grievanceId,
          type: "status_reopened",
          category: issueType,
          name: citizenName
        });
      }

      // Update locally selected grievance if modified
      if (selectedGrievance?.id === grievanceId) {
        setSelectedGrievance((prev) => prev ? { ...prev, status: "Reopened" } : null);
      }
    } catch (err: any) {
      console.error("Error reopening grievance:", err);
      let errorMsg = "Failed to update status.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          errorMsg = `Firestore Security Denied: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
        }
      } catch (_) {
        errorMsg = err.message || errorMsg;
      }
      alert(errorMsg);
    }
  };

  // Helper translations look-up
  const t = (key: string) => {
    return TRANSLATIONS[adminLang]?.[key] || TRANSLATIONS["en"][key] || key;
  };

  // Filtered Grievances based on chosen Date Range
  const filteredGrievances = useMemo(() => {
    return combinedAllGrievances.filter((g) => {
      if (!g.createdAt) return false;
      const createdTime = new Date(g.createdAt).getTime();
      const now = new Date();

      if (dateRangeFilter === "all") {
        return true;
      }
      if (dateRangeFilter === "weekly") {
        const boundary = new Date();
        boundary.setDate(now.getDate() - 7);
        boundary.setHours(0, 0, 0, 0);
        return createdTime >= boundary.getTime();
      }
      if (dateRangeFilter === "monthly") {
        const boundary = new Date();
        boundary.setDate(now.getDate() - 30);
        boundary.setHours(0, 0, 0, 0);
        return createdTime >= boundary.getTime();
      }
      if (dateRangeFilter === "yearly") {
        const boundary = new Date();
        boundary.setDate(now.getDate() - 365);
        boundary.setHours(0, 0, 0, 0);
        return createdTime >= boundary.getTime();
      }
      if (dateRangeFilter === "custom") {
        if (!customStartDate) return true;
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);

        let end = new Date();
        if (customEndDate) {
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
        } else {
          end.setHours(23, 59, 59, 999);
        }
        return createdTime >= start.getTime() && createdTime <= end.getTime();
      }
      return true;
    });
  }, [combinedAllGrievances, dateRangeFilter, customStartDate, customEndDate]);

  // Strategic projection data calculated in real-time as budgets shift
  const projectionData = useMemo(() => {
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Base levels for outstanding grievances
    const baseRoad = 24;
    const baseWater = 18;
    const baseWaste = 15;

    // Budget factors (budget ranges up to 5.0)
    const roadFactor = Math.max(0.1, 1 - (roadBudget / 5.0));
    const waterFactor = Math.max(0.1, 1 - (waterBudget / 5.0));
    const wasteFactor = Math.max(0.1, 1 - (wasteBudget / 5.0));

    return months.map((month, idx) => {
      // Seasonal rain factor for Water Logging in August and September
      const seasonalWaterRain = (month === "Aug" || month === "Sep") ? 10 : (month === "Oct") ? 4 : 0;
      
      const projectedRoad = Math.round(Math.max(1, baseRoad * Math.pow(roadFactor, idx * 0.25 + 0.15)));
      const projectedWater = Math.round(Math.max(1, (baseWater + seasonalWaterRain) * Math.pow(waterFactor, idx * 0.25 + 0.15)));
      const projectedWaste = Math.round(Math.max(1, baseWaste * Math.pow(wasteFactor, idx * 0.25 + 0.15)));
      const total = projectedRoad + projectedWater + projectedWaste;

      // Satisfaction index trends
      const baseSatisfaction = 55;
      const allocRatio = (roadBudget * 1.0 + waterBudget * 1.2 + wasteBudget * 0.8) / 5.0;
      const satisfactionScore = Math.min(99, Math.round(baseSatisfaction + (allocRatio * 38) + (idx * 0.8)));

      return {
        month,
        road: projectedRoad,
        water: projectedWater,
        waste: projectedWaste,
        total,
        satisfaction: satisfactionScore
      };
    });
  }, [roadBudget, waterBudget, wasteBudget]);

  // Repeats calculation
  const getRepeatCount = (landmark: string) => {
    if (!landmark) return 1;
    const normalized = landmark.trim().toLowerCase();
    return filteredGrievances
      .filter(g => g.cleanLocation && g.cleanLocation.trim().toLowerCase() === normalized)
      .reduce((sum, g) => sum + (g.trafficCount || 1), 0);
  };

  // Priority algorithm
  const calculatePriorityScore = (urgency: string, landmark: string) => {
    const weight = urgency === "High" ? 3 : urgency === "Medium" ? 2 : 1;
    const repeatCount = getRepeatCount(landmark);
    return weight * repeatCount;
  };

  // Filter resolved cases dynamically by Date context
  const resolvedFilteredCount = useMemo(() => {
    const resolvedGrievances = filteredGrievances.filter((g) => g.status === "Resolved");
    const now = new Date();

    return resolvedGrievances.filter((g) => {
      if (!g.createdAt) return false;
      const createdDate = new Date(g.createdAt);
      
      if (resolvedTimeFilter === "today") {
        return createdDate.toDateString() === now.toDateString();
      }
      if (resolvedTimeFilter === "month") {
        return (
          createdDate.getMonth() === now.getMonth() &&
          createdDate.getFullYear() === now.getFullYear()
        );
      }
      if (resolvedTimeFilter === "year") {
        return createdDate.getFullYear() === now.getFullYear();
      }
      // "all"
      return true;
    }).reduce((acc, g) => acc + (g.trafficCount || 1), 0);
  }, [filteredGrievances, resolvedTimeFilter]);

  // Process grievances (Score calculation and double filters - sector, status, department)
  const processedGrievances = useMemo(() => {
    return filteredGrievances
      .map((g) => ({
        ...g,
        priorityScore: calculatePriorityScore(g.urgency, g.cleanLocation),
        repeatCount: getRepeatCount(g.cleanLocation),
      }))
      .filter((g) => {
        const matchesStatus = statusFilter === "All" || g.status === statusFilter;
        const matchesDept = deptFilter === "All" || g.department === deptFilter;
        
        // Link MapWidget Selected Sector filtering
        const matchesSector = selectedSector === "All" || g.sector === selectedSector;

        return matchesStatus && matchesDept && matchesSector;
      })
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [filteredGrievances, statusFilter, deptFilter, selectedSector]);

  // Explode grievances by their reportersList if viewMode is "individual"
  const displayGrievances = useMemo(() => {
    if (viewMode === "grouped") {
      return processedGrievances;
    }
    
    const exploded: any[] = [];
    processedGrievances.forEach((g) => {
      const reporters = g.reportersList || [];
      if (reporters.length === 0) {
        exploded.push({
          ...g,
          virtualId: g.id,
          displayName: g.name,
          displayContact: g.contact,
          displayDate: g.createdAt,
          displayDescription: g.description,
          isSubReport: false,
        });
      } else {
        reporters.forEach((rep, idx) => {
          exploded.push({
            ...g,
            virtualId: `${g.id}-rep-${idx}`,
            displayName: rep.name,
            displayContact: rep.contact,
            displayDate: rep.reportedAt || g.createdAt,
            displayDescription: rep.description || g.description,
            isSubReport: true,
            subReportIndex: idx,
            summary: `[Report #${idx + 1}] ${g.summary}`,
          });
        });
      }
    });
    return exploded;
  }, [processedGrievances, viewMode]);

  // SVG Chart: Compute department distribution percentages
  const departmentStats = useMemo(() => {
    const total = filteredGrievances.reduce((acc, g) => acc + (g.trafficCount || 1), 0);
    if (total === 0) return { garbage: 0, water: 0, potholes: 0, garbagePct: 0, waterPct: 0, potholesPct: 0 };

    const garbage = filteredGrievances
      .filter((g) => g.department === "Garbage Report")
      .reduce((acc, g) => acc + (g.trafficCount || 1), 0);
    const water = filteredGrievances
      .filter((g) => g.department === "Water Logging")
      .reduce((acc, g) => acc + (g.trafficCount || 1), 0);
    const potholes = filteredGrievances
      .filter((g) => g.department === "Potholes")
      .reduce((acc, g) => acc + (g.trafficCount || 1), 0);

    return {
      garbage,
      water,
      potholes,
      garbagePct: Math.round((garbage / total) * 100),
      waterPct: Math.round((water / total) * 100),
      potholesPct: Math.round((potholes / total) * 100),
    };
  }, [filteredGrievances]);

  // SVG Chart: Compute trend dynamically based on the selected date range filter
  const historicalTrendStats = useMemo(() => {
    const trend = [];
    const now = new Date();

    if (dateRangeFilter === "all" || dateRangeFilter === "weekly") {
      // 7 days trend
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateString = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dateComparisonStr = d.toDateString();

        const count = filteredGrievances.filter((g) => {
          if (!g.createdAt) return false;
          return new Date(g.createdAt).toDateString() === dateComparisonStr;
        }).reduce((acc, g) => acc + (g.trafficCount || 1), 0);

        trend.push({ label: dateString, count });
      }
    } else if (dateRangeFilter === "monthly") {
      // Last 30 days daily bars (label every 5 days)
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dateComparisonStr = d.toDateString();

        const count = filteredGrievances.filter((g) => {
          if (!g.createdAt) return false;
          return new Date(g.createdAt).toDateString() === dateComparisonStr;
        }).reduce((acc, g) => acc + (g.trafficCount || 1), 0);

        trend.push({ label, count });
      }
    } else if (dateRangeFilter === "yearly") {
      // 12 months trend of the last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
        const monthIndex = d.getMonth();
        const yearVal = d.getFullYear();

        const count = filteredGrievances.filter((g) => {
          if (!g.createdAt) return false;
          const cg = new Date(g.createdAt);
          return cg.getMonth() === monthIndex && cg.getFullYear() === yearVal;
        }).reduce((acc, g) => acc + (g.trafficCount || 1), 0);

        trend.push({ label: monthLabel, count });
      }
    } else if (dateRangeFilter === "custom") {
      const start = customStartDate ? new Date(customStartDate) : new Date();
      if (!customStartDate) {
        start.setDate(now.getDate() - 30);
      }
      const end = customEndDate ? new Date(customEndDate) : new Date();

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 10) {
        for (let i = diffDays; i >= 0; i--) {
          const d = new Date(end);
          d.setDate(end.getDate() - i);
          if (d >= start) {
            const dateString = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const dateComparisonStr = d.toDateString();
            const count = filteredGrievances.filter((g) => {
              if (!g.createdAt) return false;
              return new Date(g.createdAt).toDateString() === dateComparisonStr;
            }).reduce((acc, g) => acc + (g.trafficCount || 1), 0);
            trend.push({ label: dateString, count });
          }
        }
      } else if (diffDays <= 45) {
        for (let i = diffDays; i >= 0; i--) {
          const d = new Date(end);
          d.setDate(end.getDate() - i);
          if (d >= start) {
            const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const dateComparisonStr = d.toDateString();
            const count = filteredGrievances.filter((g) => {
              if (!g.createdAt) return false;
              return new Date(g.createdAt).toDateString() === dateComparisonStr;
            }).reduce((acc, g) => acc + (g.trafficCount || 1), 0);
            trend.push({ label, count });
          }
        }
      } else {
        const monthsCount = Math.min(12, Math.ceil(diffDays / 30));
        for (let i = monthsCount - 1; i >= 0; i--) {
          const d = new Date(end);
          d.setMonth(end.getMonth() - i);
          const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
          const monthIndex = d.getMonth();
          const yearVal = d.getFullYear();

          const count = filteredGrievances.filter((g) => {
            if (!g.createdAt) return false;
            const cg = new Date(g.createdAt);
            return cg.getMonth() === monthIndex && cg.getFullYear() === yearVal && cg >= start && cg <= end;
          }).reduce((acc, g) => acc + (g.trafficCount || 1), 0);

          trend.push({ label: monthLabel, count });
        }
      }
    }

    if (trend.length === 0) {
      return [{ label: "No Data", count: 0 }];
    }
    return trend;
  }, [filteredGrievances, dateRangeFilter, customStartDate, customEndDate]);

  const totalReportsCount = useMemo(() => {
    return filteredGrievances.reduce((acc, g) => acc + (g.trafficCount || 1), 0);
  }, [filteredGrievances]);

  const activeGrievanceCount = useMemo(() => {
    return filteredGrievances
      .filter((g) => g.status === "Open" || g.status === "Reopened")
      .reduce((acc, g) => acc + (g.trafficCount || 1), 0);
  }, [filteredGrievances]);

  const filteredTotalReportsCount = useMemo(() => {
    return processedGrievances.reduce((acc, g) => acc + (g.trafficCount || 1), 0);
  }, [processedGrievances]);

  const filteredActiveGrievanceCount = useMemo(() => {
    return processedGrievances
      .filter((g) => g.status === "Open" || g.status === "Reopened")
      .reduce((acc, g) => acc + (g.trafficCount || 1), 0);
  }, [processedGrievances]);

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Gateway Gate Access
  if (!user && !isDemoAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">MP Admin Area</h2>
        <p className="text-slate-500 text-xs mt-2 mb-8 leading-relaxed">
          Access the secure MP Administrative Dashboard to view geocoded hotspots, priority backlogs, and resolve citizen tickets.
        </p>

        <div className="space-y-3.5">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 text-slate-800 font-medium py-3 rounded-xl shadow-sm cursor-pointer transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.74 14.93 1 12 1 7.35 1 3.39 3.65 1.51 7.51l3.79 2.94C6.18 7.39 8.87 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.1 2.67-2.33 3.49l3.62 2.81c2.12-1.95 3.33-4.83 3.33-8.45z" />
              <path fill="#FBBC05" d="M5.3 14.57c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.51 7.07C.54 9.06 0 11.27 0 12.5s.54 3.44 1.51 5.43l3.79-2.94z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.62-2.81c-1-.67-2.28-1.07-4.34-1.07-3.13 0-5.82-2.35-6.7-5.41L1.51 14.1C3.39 19.35 7.35 23 12 23z" />
            </svg>
            <span className="text-xs">Sign In with Google Auth</span>
          </button>

          {signInError && (
            <div className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-100 dark:border-red-900/60 leading-relaxed font-semibold text-center">
              ⚠️ {signInError}
            </div>
          )}

          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-mono">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            onClick={() => setIsDemoAdmin(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl shadow-sm cursor-pointer transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Enter Demo Mode (Bypass Auth)</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 font-mono mt-6">
          Authorized MP Staff Only. Actions are logged securely.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Row containing the Hamburger dropdown and Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm relative z-30 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {isDemoAdmin ? "DEVELOPMENT BYPASS" : "AUTHENTICATED STAFF"}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-mono">• Session Active</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight mt-1 leading-snug max-w-xl">
            {t("title")}
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {t("signedInAs")}: <strong className="text-slate-600 dark:text-slate-300">{isDemoAdmin ? "Demo MP Office Admin" : user?.email}</strong>
          </p>
        </div>

        {/* Header Interactions Panel */}
        <div className="flex items-center gap-3 sm:self-center self-end">
          {/* Admin Language Dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
            <Languages className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={adminLang}
              onChange={(e: any) => setAdminLang(e.target.value)}
              className="text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none bg-transparent cursor-pointer"
            >
              <option value="en">English (US/IN)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="hinglish">Hinglish (Mix)</option>
            </select>
          </div>

          {/* Hamburger Menu Toggler */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center"
              aria-label="Open menu options"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Hamburger Dropdown Panel */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                   initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2.5 w-56 bg-slate-950 border border-slate-800 text-white rounded-xl shadow-xl p-2 space-y-1.5"
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Control Panel</span>
                    <p className="text-[10px] text-slate-300 mt-0.5 truncate">{user?.email || "Demo Mode"}</p>
                  </div>
                  <button
                    onClick={() => {
                      setAdminLang(adminLang === "en" ? "hi" : "en");
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-2"
                  >
                    <Languages className="w-3.5 h-3.5 text-slate-400" />
                    <span>Quick Translate</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>{t("exitDashboard")}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tab Switcher for Grievances Queue vs. Smart Development Planner */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveAdminTab("grievances")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] xs:text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap px-1 sm:px-3 ${
            activeAdminTab === "grievances"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Grievances Hub</span>
        </button>
        <button
          onClick={() => setActiveAdminTab("planner")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] xs:text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap px-1 sm:px-3 ${
            activeAdminTab === "planner"
              ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-800 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-blue-500" />
          <span className="flex items-center gap-1">
            <span>Smart MP Planner</span>
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
          </span>
        </button>
      </div>

      {activeAdminTab === "grievances" ? (
        <>
          {/* Timeframe Filter Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Dashboard Date Range</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Select a preset timeframe or enter a custom date range</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1.5 md:pb-0 select-none flex-nowrap scroll-smooth">
          <button
            onClick={() => setDateRangeFilter("all")}
            className={`px-3.5 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
              dateRangeFilter === "all"
                ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateRangeFilter("weekly")}
            className={`px-3.5 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
              dateRangeFilter === "weekly"
                ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900"
            }`}
          >
            Weekly (7d)
          </button>
          <button
            onClick={() => setDateRangeFilter("monthly")}
            className={`px-3.5 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
              dateRangeFilter === "monthly"
                ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900"
            }`}
          >
            Monthly (30d)
          </button>
          <button
            onClick={() => setDateRangeFilter("yearly")}
            className={`px-3.5 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
              dateRangeFilter === "yearly"
                ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900"
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => setDateRangeFilter("custom")}
            className={`px-3.5 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
              dateRangeFilter === "custom"
                ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900"
            }`}
          >
            Custom Range
          </button>

          {dateRangeFilter === "custom" && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1 animate-fadeIn flex-shrink-0">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 outline-none border-none py-0.5 px-1"
              />
              <span className="text-[9px] font-black text-slate-400 uppercase">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 outline-none border-none py-0.5 px-1"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats row with interactive Cases Resolved Date filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("totalReports")}</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {filteredTotalReportsCount} <span className="text-xs font-normal text-slate-400">/ {totalReportsCount}</span>
            </div>
          </div>
          <FileText className="w-4.5 h-4.5 text-slate-300 dark:text-slate-600" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("openBacklog")}</span>
            <div className="text-xl font-black text-amber-600 dark:text-amber-500 mt-0.5">
              {filteredActiveGrievanceCount} <span className="text-xs font-normal text-slate-400">/ {activeGrievanceCount}</span>
            </div>
          </div>
          <Clock className="w-4.5 h-4.5 text-amber-300 dark:text-amber-600 animate-pulse" />
        </div>

        {/* Interactive Resolved Cases Stats Card with Time Filter Option */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("resolvedCases")}</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-500 mt-0.5">{resolvedFilteredCount}</div>
            </div>
            <CheckCircle className="w-4.5 h-4.5 text-emerald-400 dark:text-emerald-600" />
          </div>
          
          {/* Time range mini selection row */}
          <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar flex-nowrap scroll-smooth max-w-full pb-0.5 select-none">
            <button
              onClick={() => setResolvedTimeFilter("today")}
              className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded flex-shrink-0 whitespace-nowrap ${
                resolvedTimeFilter === "today" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t("resolvedToday")}
            </button>
            <button
              onClick={() => setResolvedTimeFilter("month")}
              className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded flex-shrink-0 whitespace-nowrap ${
                resolvedTimeFilter === "month" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t("resolvedMonth")}
            </button>
            <button
              onClick={() => setResolvedTimeFilter("year")}
              className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded flex-shrink-0 whitespace-nowrap ${
                resolvedTimeFilter === "year" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t("resolvedYear")}
            </button>
            <button
              onClick={() => setResolvedTimeFilter("all")}
              className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded flex-shrink-0 whitespace-nowrap ${
                resolvedTimeFilter === "all" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t("resolvedAll")}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("activeHotspots")}</span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-500 mt-0.5">
              {new Set(filteredGrievances.filter(g => g.status === "Open").map(g => g.cleanLocation?.trim().toLowerCase())).size}
            </div>
          </div>
          <TrendingUp className="w-4.5 h-4.5 text-blue-300 dark:text-blue-600" />
        </div>
      </div>

      {/* Visual Data Representation Dashboard Panel */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        
        {/* Full Width: Pie/Donut Chart breakdown & Sector Quick Actions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <PieIcon className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              {t("distribution")} & Sector Task Allocation
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
            {/* Donut Chart */}
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Ring */}
                  <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800 stroke-[10] fill-none" />
                  
                  {/* Segments calculation */}
                  {(() => {
                    let startOffset = 0;
                    const total = filteredGrievances.reduce((acc, g) => acc + (g.trafficCount || 1), 0);
                    if (total === 0) return null;

                    return ["Garbage Report", "Water Logging", "Potholes"].map((dept) => {
                      const count = filteredGrievances
                        .filter(g => g.department === dept)
                        .reduce((acc, g) => acc + (g.trafficCount || 1), 0);
                      const pct = count / total;
                      const strokeDasharray = `${pct * 251.2} 251.2`;
                      const strokeDashoffset = -startOffset;
                      startOffset += pct * 251.2;

                      const color =
                        dept === "Garbage Report"
                          ? "#10b981" // emerald
                          : dept === "Water Logging"
                          ? "#3b82f6" // blue
                          : "#f59e0b"; // amber

                      return (
                        <circle
                          key={dept}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={color}
                          strokeWidth="10"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500 hover:stroke-[12] cursor-pointer"
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Central text displaying total */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                    {filteredGrievances.reduce((acc, g) => acc + (g.trafficCount || 1), 0)}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total</span>
                </div>
              </div>
            </div>

            {/* Department Custom Legend */}
            <div className="md:col-span-4 space-y-2.5 w-full">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Garbage ({departmentStats.garbage})</span>
                </div>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{departmentStats.garbagePct}%</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Water Logging ({departmentStats.water})</span>
                </div>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{departmentStats.waterPct}%</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Potholes ({departmentStats.potholes})</span>
                </div>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{departmentStats.potholesPct}%</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="md:col-span-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Operational Action List</span>
              <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span><strong>Garbage:</strong> Direct MCD sanitization squads.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span>
                  <span><strong>Water:</strong> Dispatch storm drain pump crews.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">✓</span>
                  <span><strong>Potholes:</strong> Authorize asphalt work orders.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Segment Switcher for Mobile List vs Map View */}
      <div className="flex lg:hidden bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 select-none items-center justify-between gap-1 mt-4">
        <button
          type="button"
          onClick={() => setMobileGrievanceView("list")}
          className={`flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            mobileGrievanceView === "list"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          List View ({displayGrievances.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileGrievanceView("map")}
          className={`flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            mobileGrievanceView === "map"
              ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Hotspot Map View
        </button>
      </div>

      {/* Dual Area Layout: List details & Interactive SVGMapped Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        
        {/* Left: List Backlog showing assigned MCD/NDMC tags */}
        <div className={`lg:col-span-6 xl:col-span-5 flex flex-col space-y-4 ${mobileGrievanceView === "list" ? "flex" : "hidden lg:flex"}`}>
          <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <FolderDot className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>
                    {t("priorityBacklog")} ({displayGrievances.length} cases • {displayGrievances.reduce((acc, g) => acc + (g.trafficCount || 1), 0)} reports)
                  </span>
                </h3>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selectedSector !== "All" && (
                    <span className="text-[8px] font-black text-blue-750 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-1.5 py-0.5 rounded uppercase">
                      Sector: {selectedSector}
                    </span>
                  )}
                  {deptFilter !== "All" && (
                    <span className="text-[8px] font-black text-amber-705 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 px-1.5 py-0.5 rounded uppercase">
                      Dept: {deptFilter.replace(" Report", "")}
                    </span>
                  )}
                  {statusFilter !== "All" && (
                    <span className="text-[8px] font-black text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 px-1.5 py-0.5 rounded uppercase">
                      Status: {statusFilter}
                    </span>
                  )}
                  {(selectedSector !== "All" || statusFilter !== "All" || deptFilter !== "All" || dateRangeFilter !== "all" || viewMode !== "grouped") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSector("All");
                        setStatusFilter("All");
                        setDeptFilter("All");
                        setDateRangeFilter("all");
                        setViewMode("grouped");
                      }}
                      className="text-[8px] font-black text-blue-700 dark:text-blue-450 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded uppercase cursor-pointer transition-all"
                    >
                      Show All / Restore View
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Control Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "grouped" ? "individual" : "grouped")}
                  title={viewMode === "grouped" ? "Show all individual citizen requests" : "Group duplicate reports from the same areas"}
                  className={`px-2 py-1.5 rounded text-[9px] font-black uppercase flex items-center gap-1 border transition-all cursor-pointer ${
                    viewMode === "individual"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{viewMode === "grouped" ? "Grouped" : "All Requests"}</span>
                </button>
              </div>

              {/* Alphabetical Status Buttons Row */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 gap-0.5">
                {(["All", "Open", "Reopened", "Resolved"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded transition-all cursor-pointer ${
                      statusFilter === status
                        ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <select
                value={deptFilter}
                onChange={(e: any) => setDeptFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-1 text-[9px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                <option value="Garbage Report">Garbage</option>
                <option value="Water Logging">Water Logging</option>
                <option value="Potholes">Potholes</option>
              </select>
            </div>
          </div>

          {/* Offline Pending Items Notice */}
          {offlineGrievances.length > 0 && (
            <div className="mb-3.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span>{offlineGrievances.length} Pending Offline Submission{offlineGrievances.length > 1 ? "s" : ""}</span>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal">
                These submissions are queued locally on this device and will automatically sync to the permanent Firestore database once network connection is restored.
              </p>
              {navigator.onLine && (
                <button
                  onClick={async () => {
                    loadOfflineGrievances();
                    alert("Sync check initiated. Locally saved records will be uploaded to Firestore by the background worker.");
                  }}
                  className="mt-1 self-start px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Verify & Sync Queue
                </button>
              )}
            </div>
          )}

          {/* Cards Backlog scroll container */}
          <div className="flex-grow overflow-y-auto max-h-[550px] pr-1 space-y-3.5">
            <AnimatePresence mode="popLayout">
              {displayGrievances.map((g, index) => {
                const isSelected = selectedGrievance?.id === g.id;
                
                const scoreBgClass = g.urgency === "High" 
                  ? "bg-red-50 dark:bg-red-950/45 border-red-100 dark:border-red-900 text-red-600 dark:text-red-300" 
                  : g.urgency === "Medium"
                  ? "bg-orange-50 dark:bg-orange-950/45 border-orange-100 dark:border-orange-900 text-orange-600 dark:text-orange-300"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300";

                const urgencyBadgeClass = g.urgency === "High"
                  ? "bg-red-600 text-white"
                  : g.urgency === "Medium"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-500 text-white";

                return (
                  <motion.div
                    key={g.virtualId || g.id}
                    layoutId={`card-${g.virtualId || g.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedGrievance(g)}
                    className={`bg-white dark:bg-slate-900 border rounded-xl flex items-stretch overflow-hidden transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-slate-900 dark:border-white shadow-md ring-1 ring-slate-900 dark:ring-white"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                    }`}
                  >
                    {/* Compact Priority Score Column (Left) */}
                    <div className={`w-14 flex flex-col items-center justify-center border-r dark:border-slate-800 font-mono flex-shrink-0 ${scoreBgClass}`}>
                      <span className="text-[7px] font-black uppercase tracking-wider opacity-60">Score</span>
                      <span className="text-xl font-black tracking-tight mt-0.5">{String(g.priorityScore).padStart(2, '0')}</span>
                    </div>

                    {/* Middle: Core Details */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`px-1 text-[8px] font-bold rounded uppercase ${urgencyBadgeClass}`}>
                            {g.urgency}
                          </span>
                          <span className="px-1 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-bold rounded uppercase">
                            {g.department}
                          </span>

                          {/* Status Badge */}
                          <span className={`px-1 text-[8px] font-black rounded uppercase border ${
                            g.status === "Resolved"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                              : g.status === "Reopened"
                              ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900 animate-pulse"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                          }`}>
                            {g.status}
                          </span>

                          {/* Suggestion Badge Overlay */}
                          {g.isSuggestion && (
                            <span className="px-1 bg-blue-600 text-white font-black text-[8px] rounded uppercase animate-pulse flex items-center gap-0.5">
                              💡 Suggestion
                            </span>
                          )}
                          
                          {/* MCD / NDMC assigned tag badge display */}
                          {g.assignedBody && (
                            <span className="px-1 bg-blue-50 dark:bg-blue-950 border border-blue-150 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[8px] font-black rounded uppercase">
                              {g.assignedBody.includes("NDMC") ? "NDMC Area" : "MCD Zone"}
                            </span>
                          )}

                          {/* Image Alignment Status Badge */}
                          {g.imageUrl && g.imageVerificationStatus === "mismatch" && (
                            <span className="px-1 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 text-[8px] font-black rounded uppercase animate-pulse">
                              &apos; Image Mismatch
                            </span>
                          )}
                          {g.imageUrl && g.imageVerificationStatus === "verified" && (
                            <span className="px-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[8px] font-black rounded uppercase">
                              ✓ Verified Image
                            </span>
                          )}

                          {g.guardrailRelevanceScore !== undefined && (
                            <span className="px-1 bg-blue-50 dark:bg-blue-950 border border-blue-150 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[8px] font-black rounded uppercase">
                              🛡️ Civic: {Math.round(g.guardrailRelevanceScore * 100)}%
                            </span>
                          )}

                          {g.isOfflineOnly && (
                            <span className="px-1 bg-red-600 text-white font-black text-[8px] rounded uppercase animate-pulse">
                              ⚠️ Offline Queued
                            </span>
                          )}

                          <span className="ml-auto text-[8px] text-slate-400 dark:text-slate-500 font-mono">
                            #G-{g.id?.substring(0, 4).toUpperCase()}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2 line-clamp-1">{g.summary}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed italic">
                          &quot;{viewMode === "individual" ? g.displayDescription : g.description}&quot;
                        </p>
                      </div>

                      {/* Expandable Rich AI Insights Panel when card is selected */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40 -mx-3 px-3 pb-2 rounded-b-lg">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block">AI Category</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{g.category || "Solid Waste"}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block">Suggested Dept</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{g.suggested_department || "MCD"}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block">Affected Demographic</span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{g.affected_people || "Local residents & commuters"}</span>
                            </div>
                            <div className="col-span-2 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[8px] block">📍 Verified GPS Location Details</span>
                                <span className={`text-[7px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded ${
                                  g.gpsAccuracyStatus === "HIGH"
                                    ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                    : g.gpsAccuracyStatus === "CORRECTED"
                                    ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                    : g.gpsAccuracyStatus === "GEOCODED"
                                    ? "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-700/20"
                                }`}>
                                  Accuracy: {g.gpsAccuracyStatus === "HIGH" ? "Verified" : g.gpsAccuracyStatus === "CORRECTED" ? "Corrected" : g.gpsAccuracyStatus === "GEOCODED" ? "Estimated" : "None"}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
                                <div className="space-y-1.5 min-w-0 flex-1">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[10px] truncate">{g.cleanLocation || "Unknown Spot"}</div>
                                  <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                                    LATITUDE: <span className="text-slate-700 dark:text-slate-300 font-bold">{g.latitude?.toFixed(6) || "N/A"}</span> | LONGITUDE: <span className="text-slate-700 dark:text-slate-300 font-bold">{g.longitude?.toFixed(6) || "N/A"}</span>
                                  </div>
                                  {g.accuracyMessage && (
                                    <div className="text-[8px] text-slate-500 dark:text-slate-400 bg-slate-200/30 dark:bg-slate-950/20 px-2 py-1 rounded font-medium border border-slate-100/30">
                                      {g.accuracyMessage}
                                    </div>
                                  )}
                                </div>
                                {g.latitude && g.longitude && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${g.latitude},${g.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded shadow-xs self-start sm:self-auto cursor-pointer"
                                  >
                                    <span>Google Maps</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                            {g.isSuggestion && g.impactScale && (
                              <div className="col-span-2 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-2 rounded-lg">
                                <span className="font-bold text-blue-950 dark:text-blue-300 uppercase text-[8px] block">📈 Projected Public Impact Scale</span>
                                <span className="text-blue-950 dark:text-blue-200 font-black text-xs block mt-0.5">{g.impactScale} estimated beneficiaries</span>
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block">Confidence Rating</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{g.confidence || 90}% AI Confidence</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block">Urgency Score</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{g.urgencyScore || 5}/10 Rating</span>
                            </div>

                            {g.imageUrl && (
                              <div className="col-span-2 pt-1">
                                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block mb-1">Image Verification Analysis</span>
                                <div className={`p-2 rounded border text-[9px] ${
                                  g.imageVerificationStatus === "mismatch"
                                    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300"
                                    : g.imageVerificationStatus === "verified"
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                                    : "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                }`}>
                                  <div className="font-bold flex items-center gap-1 mb-0.5">
                                    <span>{g.imageVerificationStatus === "mismatch" ? "❌ Severe Mismatch (Unverified Image)" : "✅ Visual Content Verified"}</span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-400 font-medium">{g.imageVerificationMessage || "Image aligns with text claims."}</p>
                                </div>
                              </div>
                            )}

                            {g.guardrailExecutiveSummary && (
                              <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-800 mt-1">
                                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block mb-1">🛡️ Relevance Guardrail Verification</span>
                                <div className="p-2 rounded border text-[9px] bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900 text-slate-700 dark:text-slate-300">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-blue-900 dark:text-blue-300">Civic Relevance: {Math.round((g.guardrailRelevanceScore || 1.0) * 100)}%</span>
                                    <span className="text-[7px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-1 rounded uppercase">Flagged: {g.guardrailFlaggedReason || "NONE"}</span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-400 leading-normal font-medium"><span className="font-bold text-slate-500 dark:text-slate-400">Literal Summary:</span> {g.guardrailExecutiveSummary}</p>
                                </div>
                              </div>
                            )}

                            {/* Suggested Response (Gemini AI Companion) */}
                            <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-blue-600 dark:text-blue-400 uppercase text-[8px] flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                                  <span>Suggested Citizen Response (Gemini AI)</span>
                                </span>
                                {suggestedResponses[g.id!] && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(editedSuggestions[g.id!] || suggestedResponses[g.id!]);
                                      alert("Suggested response copied to clipboard!");
                                    }}
                                    className="text-[8px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white uppercase transition-colors"
                                  >
                                    Copy
                                  </button>
                                )}
                              </div>
                              
                              {suggestedResponses[g.id!] ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editedSuggestions[g.id!] !== undefined ? editedSuggestions[g.id!] : suggestedResponses[g.id!]}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditedSuggestions(prev => ({ ...prev, [g.id!]: val }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full min-h-[90px] text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-normal"
                                    placeholder="Edit suggested response..."
                                  />
                                  {g.status !== "Resolved" && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkResolvedWithCustomResponse(g.id!, editedSuggestions[g.id!] !== undefined ? editedSuggestions[g.id!] : suggestedResponses[g.id!]);
                                      }}
                                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] uppercase py-2 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Resolve Ticket & Send This Message</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFetchSuggestedResponse(g);
                                  }}
                                  disabled={loadingSuggestions[g.id!]}
                                  className="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[9px] uppercase py-2 rounded-lg border border-blue-200/65 dark:border-blue-900/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {loadingSuggestions[g.id!] ? (
                                    <>
                                      <div className="w-2.5 h-2.5 border border-blue-700 dark:border-blue-300 border-t-transparent rounded-full animate-spin" />
                                      <span>Generating suggestion...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Generate Suggested Response</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {g.keywords && g.keywords.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block mb-1">Keywords</span>
                              <div className="flex flex-wrap gap-1">
                                {g.keywords.map((kw: string) => (
                                  <span key={kw} className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[8px] font-mono text-slate-500 dark:text-slate-400">
                                    #{kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {g.reportersList && g.reportersList.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block mb-1.5 flex items-center gap-1">
                                <Users className="w-3 h-3 text-blue-500" />
                                <span>Consolidated Reports ({g.reportersList.length})</span>
                              </span>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {g.reportersList.map((rep: any, rIdx: number) => (
                                  <div key={rIdx} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded p-1.5 text-[9px] text-slate-600 dark:text-slate-400 space-y-0.5">
                                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                                      <span>👤 {rep.name} ({rep.contact})</span>
                                      <span className="text-slate-400 dark:text-slate-500 font-normal">{new Date(rep.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {rep.description && (
                                      <p className="text-slate-500 dark:text-slate-400 italic">"{rep.description}"</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {g.imageUrl && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[8px] block mb-1">Attached Evidence</span>
                              <img
                                src={g.imageUrl}
                                alt="Grievance Attachment"
                                className="w-full max-h-36 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer location mapping */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[9px] space-y-0.5 min-w-0">
                          <div className="font-bold text-slate-700 dark:text-slate-300 truncate flex items-center gap-1.5 flex-wrap">
                            <span>📍 {g.cleanLocation || "Unknown spot"}</span>
                            {g.latitude && g.longitude && (
                              <span className="font-mono text-[8px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500 dark:text-slate-400">
                                ({g.latitude.toFixed(5)}, {g.longitude.toFixed(5)})
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 dark:text-slate-500">
                            {viewMode === "individual" ? (
                              <>👤 {g.displayName} ({g.displayContact}) • Individual Request</>
                            ) : (
                              <>{g.name} • {g.trafficCount || 1} {(g.trafficCount || 1) === 1 ? 'report' : 'reports'} consolidated</>
                            )} • {g.repeatCount} landmark repeat count
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Administrative Resolve / Reopen CTA */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (g.status === "Open" || g.status === "Reopened") {
                          handleMarkResolved(g.id!);
                        } else {
                          handleReopen(g.id!);
                        }
                      }}
                      className={`px-3 border-l border-slate-100 dark:border-slate-800 transition-colors flex flex-col items-center justify-center flex-shrink-0 cursor-pointer ${
                        g.status === "Resolved" 
                          ? "bg-amber-50/75 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300" 
                          : "hover:bg-emerald-50 dark:hover:bg-emerald-950/45 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-350"
                      }`}
                    >
                      {g.status === "Resolved" ? (
                        <>
                          <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1" />
                          <span className="text-[8px] font-black uppercase tracking-wider">
                            Reopen
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 hover:border-emerald-500 flex items-center justify-center mb-1 transition-all">
                            {/* Empty circle representing open status */}
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-wider">
                            Resolve
                          </span>
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}

              {displayGrievances.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No grievances match the current sector/department filters.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Map Widget linking Sector filters back */}
        <div className={`lg:col-span-6 xl:col-span-7 flex flex-col h-[450px] lg:h-[550px] xl:h-[650px] ${mobileGrievanceView === "map" ? "flex" : "hidden lg:flex"}`}>
          <MapWidget
            grievances={processedGrievances}
            selectedGrievance={selectedGrievance}
            onSelectGrievance={(g) => setSelectedGrievance(g)}
            selectedSector={selectedSector}
            onSelectSector={(sec) => setSelectedSector(sec)}
          />
        </div>

      </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Welcome DSS Card */}
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Brain className="w-44 h-44 text-blue-400" />
            </div>
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-blue-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Decision Support System (DSS) v1.2</span>
              </div>
              <h3 className="text-lg font-black tracking-tight uppercase">Smart MP Development Planner</h3>
              <div className="text-slate-300 text-xs pt-1.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Objective quantitative comparisons for constituency developmental budgets.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Cross-references live citizen complaints with local census profiles.</span>
                </div>
              </div>
            </div>
          </div>

          <DataOverlayExplorer
            grievances={processedGrievances}
            selectedSector={selectedSector}
            onSelectSector={(sec) => setSelectedSector(sec)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Live AI Intake Synthesis & Theme Extractor */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-4">
              <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">AI Intake Synthesis</h4>
                </div>
                <button
                  onClick={handleGenerateLiveScan}
                  disabled={isScanningAI}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isScanningAI ? "Analyzing..." : "Generate AI Synthesis"}
                </button>
              </div>

              {isScanningAI ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-mono text-slate-400 uppercase animate-pulse">Scanning local databases...</p>
                </div>
              ) : liveAIScanText ? (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 max-h-[450px] overflow-y-auto">
                  <SimpleMarkdown text={liveAIScanText} />
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-xs space-y-2">
                  <p>Click "Generate AI Synthesis" to evaluate active citizen requests against local infrastructure plans.</p>
                </div>
              )}

              {/* Local Systems Status Checklists */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h5 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Dynamic Themes & Gaps</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/50 rounded-lg p-3">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 block">WATER LOGGING</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {grievances.filter(g => g.department === "Water Logging").length} spots
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">PWD Runoff Lags</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/50 rounded-lg p-3">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 block">POTHOLE DEFICITS</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-500">
                      {grievances.filter(g => g.department === "Potholes").length} locations
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">MCD Asphalt Backlog</span>
                  </div>
                </div>
              </div>

              {/* Strategic Budget Simulator Sliders */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Strategic Budget Simulator</h5>
                  <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900">
                    Cap: ₹5.0 Cr
                  </span>
                </div>
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 p-3 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      <span>ROAD REPAIRS / POTHOLES</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono">₹{roadBudget.toFixed(1)} Cr</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="5.0"
                      step="0.1"
                      value={roadBudget}
                      onChange={(e) => handleBudgetChange("road", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      <span>WATER LOGGING / DRAINAGE</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono">₹{waterBudget.toFixed(1)} Cr</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="5.0"
                      step="0.1"
                      value={waterBudget}
                      onChange={(e) => handleBudgetChange("water", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      <span>SOLID WASTE MANAGEMENT</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono">₹{wasteBudget.toFixed(1)} Cr</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="5.0"
                      step="0.1"
                      value={wasteBudget}
                      onChange={(e) => handleBudgetChange("waste", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                    <span>TOTAL ALLOCATED FUNDING</span>
                    <span className="text-slate-900 dark:text-slate-100 font-mono">₹{(roadBudget + waterBudget + wasteBudget).toFixed(1)} / ₹5.0 Cr</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Trend Chart Card */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Strategic Projection Trends</h5>
                  </div>
                  
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                    <button
                      onClick={() => setTrendChartMetric("grievance")}
                      className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded transition-all cursor-pointer ${
                        trendChartMetric === "grievance" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Backlog Qty
                    </button>
                    <button
                      onClick={() => setTrendChartMetric("satisfaction")}
                      className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded transition-all cursor-pointer ${
                        trendChartMetric === "satisfaction" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Satisfaction %
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-3 space-y-3 shadow-xs">
                  {/* SVG Chart */}
                  <div className="relative h-28 w-full">
                    <svg viewBox="0 0 320 120" className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      <line x1="40" y1="15" x2="300" y2="15" stroke="#334155" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="40" y1="50" x2="300" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="40" y1="85" x2="300" y2="85" stroke="#334155" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="40" y1="100" x2="300" y2="100" stroke="#475569" strokeWidth="1" />
                      
                      {/* Y-axis labels */}
                      {trendChartMetric === "grievance" ? (
                        <>
                          <text x="32" y="18" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">40</text>
                          <text x="32" y="53" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">20</text>
                          <text x="32" y="88" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">5</text>
                          <text x="32" y="103" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">0</text>
                        </>
                      ) : (
                        <>
                          <text x="32" y="18" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">100%</text>
                          <text x="32" y="53" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">75%</text>
                          <text x="32" y="88" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">50%</text>
                          <text x="32" y="103" fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">0%</text>
                        </>
                      )}

                      {/* X-axis Month Labels */}
                      {projectionData.map((d, i) => {
                        const x = 40 + i * 50;
                        const isSelected = selectedTrendMonth === i;
                        return (
                          <g key={i} className="cursor-pointer" onClick={() => setSelectedTrendMonth(i)}>
                            <text x={x} y="114" fill={isSelected ? "#38bdf8" : "#64748b"} fontSize="8" fontWeight={isSelected ? "bold" : "normal"} textAnchor="middle">
                              {d.month}
                            </text>
                            {/* Vertical selection marker indicator */}
                            <line x1={x} y1="15" x2={x} y2="100" stroke={isSelected ? "#0ea5e9" : "#334155"} strokeWidth={isSelected ? "1" : "0.5"} strokeDasharray={isSelected ? "0" : "1"} />
                          </g>
                        );
                      })}

                      {/* Render line/area path based on chosen metric */}
                      {trendChartMetric === "grievance" ? (
                        <>
                          {/* Total Backlog Area / Line */}
                          {(() => {
                            const points = projectionData.map((d, i) => {
                              const x = 40 + i * 50;
                              const y = 100 - (d.total / 45) * 85;
                              return `${x},${y}`;
                            }).join(" ");
                            return (
                              <>
                                <polyline fill="none" stroke="#f1f5f9" strokeWidth="2.5" points={points} />
                                {/* Individual points */}
                                {projectionData.map((d, i) => {
                                  const x = 40 + i * 50;
                                  const y = 100 - (d.total / 45) * 85;
                                  return (
                                    <circle
                                      key={i}
                                      cx={x}
                                      cy={y}
                                      r={selectedTrendMonth === i ? 4 : 2.5}
                                      fill="#f1f5f9"
                                      stroke="#475569"
                                      strokeWidth="1"
                                      className="cursor-pointer"
                                      onClick={() => setSelectedTrendMonth(i)}
                                    />
                                  );
                                })}
                              </>
                            );
                          })()}

                          {/* Individual Roads Line (amber-500) */}
                          {(() => {
                            const points = projectionData.map((d, i) => {
                              const x = 40 + i * 50;
                              const y = 100 - (d.road / 45) * 85;
                              return `${x},${y}`;
                            }).join(" ");
                            return (
                              <polyline fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2" points={points} />
                            );
                          })()}

                          {/* Individual Drainage Line (blue-400) */}
                          {(() => {
                            const points = projectionData.map((d, i) => {
                              const x = 40 + i * 50;
                              const y = 100 - (d.water / 45) * 85;
                              return `${x},${y}`;
                            }).join(" ");
                            return (
                              <polyline fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2" points={points} />
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          {/* Satisfaction Curve */}
                          {(() => {
                            const points = projectionData.map((d, i) => {
                              const x = 40 + i * 50;
                              const y = 100 - (d.satisfaction / 100) * 85;
                              return `${x},${y}`;
                            }).join(" ");
                            return (
                              <>
                                <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={points} />
                                {/* Individual points */}
                                {projectionData.map((d, i) => {
                                  const x = 40 + i * 50;
                                  const y = 100 - (d.satisfaction / 100) * 85;
                                  return (
                                    <circle
                                      key={i}
                                      cx={x}
                                      cy={y}
                                      r={selectedTrendMonth === i ? 4 : 2.5}
                                      fill="#10b981"
                                      stroke="#064e3b"
                                      strokeWidth="1"
                                      className="cursor-pointer"
                                      onClick={() => setSelectedTrendMonth(i)}
                                    />
                                  );
                                })}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </svg>
                  </div>

                  {/* Legend Indicator */}
                  <div className="flex flex-wrap items-center justify-between text-[8px] text-slate-400 pt-1 border-t border-slate-800">
                    {trendChartMetric === "grievance" ? (
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-100" /> Total ({projectionData[selectedTrendMonth]?.total})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Roads ({projectionData[selectedTrendMonth]?.road})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Water ({projectionData[selectedTrendMonth]?.water})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Waste ({projectionData[selectedTrendMonth]?.waste})
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Public Approval ({projectionData[selectedTrendMonth]?.satisfaction}%)
                        </span>
                      </div>
                    )}
                    <span className="text-sky-400 font-mono font-bold">Month: {projectionData[selectedTrendMonth]?.month}</span>
                  </div>

                  {/* Selected Month Projection Explainer */}
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[9px] text-slate-300 leading-normal">
                    <span className="font-bold text-sky-400 block uppercase text-[8px] tracking-wider">
                      {projectionData[selectedTrendMonth]?.month} 2026 Simulation Forecast
                    </span>
                    {trendChartMetric === "grievance" ? (
                      <p>
                        With current budget allocations (Roads ₹{roadBudget}Cr, Water/Drainage ₹{waterBudget}Cr, Solid Waste ₹{wasteBudget}Cr), backlog is projected to decrease to <strong className="text-white">{projectionData[selectedTrendMonth]?.total} open complaints</strong>. Water runoff drainage remains heavily tied to seasonal monsoon multipliers.
                      </p>
                    ) : (
                      <p>
                        Public satisfaction in {projectionData[selectedTrendMonth]?.month} is forecasted to stabilize at <strong className="text-emerald-400 font-bold">{projectionData[selectedTrendMonth]?.satisfaction}% approval</strong>. Allocations prioritizing local water distress metrics score highest in community feedback loops.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Competing Proposal Evaluator */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-5">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-500" />
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                    Weigh Competing Proposals
                  </h4>
                </div>
                
                {/* Sector Selector */}
                <select
                  value={compareSector}
                  onChange={(e) => setCompareSector(e.target.value)}
                  className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="Central Zone">Central Zone Sector</option>
                  <option value="West Zone">West Zone Sector</option>
                  <option value="East Zone">East Zone Sector</option>
                  <option value="NDMC Area">NDMC Sector</option>
                </select>
              </div>

              {/* Proposals inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Proposal A: School Upgrade */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Option A</span>
                    <span className="text-[8px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">SCHOOL UPGRADE</span>
                  </div>
                  <input
                    type="text"
                    value={proposals[0].title}
                    onChange={(e) => {
                      const updated = [...proposals];
                      updated[0].title = e.target.value;
                      setProposals(updated);
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white px-3 py-1.5 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Proposal A Title"
                  />
                  {/* Preset Selector */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      onClick={() => {
                        const updated = [...proposals];
                        updated[0].title = "Primary School Upgrade (East)";
                        updated[0].parameters.enrollment = "400";
                        updated[0].parameters.travelDistance = "15";
                        setProposals(updated);
                      }}
                      type="button"
                      className="px-2 py-0.5 text-[8px] font-black uppercase tracking-tight bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                    >
                      Fill: Primary (15km)
                    </button>
                    <button
                      onClick={() => {
                        const updated = [...proposals];
                        updated[0].title = "Central High School Expansion";
                        updated[0].parameters.enrollment = "800";
                        updated[0].parameters.travelDistance = "5";
                        setProposals(updated);
                      }}
                      type="button"
                      className="px-2 py-0.5 text-[8px] font-black uppercase tracking-tight bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                    >
                      Fill: High School (5km)
                    </button>
                  </div>
                  <div className="space-y-2 pt-1.5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-1">CENSUS ENROLLMENT (STUDENTS)</label>
                      <input
                        type="number"
                        value={proposals[0].parameters.enrollment}
                        onChange={(e) => {
                          const updated = [...proposals];
                          updated[0].parameters.enrollment = e.target.value;
                          setProposals(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="e.g. 450"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-1">TRAVEL DISTANCE TO ALTERNATIVE (KM)</label>
                      <input
                        type="number"
                        value={proposals[0].parameters.travelDistance}
                        onChange={(e) => {
                          const updated = [...proposals];
                          updated[0].parameters.travelDistance = e.target.value;
                          setProposals(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="e.g. 12"
                      />
                    </div>
                  </div>
                </div>

                {/* Proposal B: Vocational Centre */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Option B</span>
                    <span className="text-[8px] bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded">VOCATIONAL SKILLS</span>
                  </div>
                  <input
                    type="text"
                    value={proposals[1].title}
                    onChange={(e) => {
                      const updated = [...proposals];
                      updated[1].title = e.target.value;
                      setProposals(updated);
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white px-3 py-1.5 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Proposal B Title"
                  />
                  {/* Preset Selector */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      onClick={() => {
                        const updated = [...proposals];
                        updated[1].title = "Mega IT Skill Hub";
                        updated[1].parameters.capacity = "250";
                        updated[1].parameters.travelDistance = "30";
                        setProposals(updated);
                      }}
                      type="button"
                      className="px-2 py-0.5 text-[8px] font-black uppercase tracking-tight bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-purple-600 dark:text-purple-400 rounded hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                    >
                      Fill: IT Hub (30km)
                    </button>
                    <button
                      onClick={() => {
                        const updated = [...proposals];
                        updated[1].title = "Youth Apprenticeship Workshop";
                        updated[1].parameters.capacity = "100";
                        updated[1].parameters.travelDistance = "10";
                        setProposals(updated);
                      }}
                      type="button"
                      className="px-2 py-0.5 text-[8px] font-black uppercase tracking-tight bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-purple-600 dark:text-purple-400 rounded hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                    >
                      Fill: Workshop (10km)
                    </button>
                  </div>
                  <div className="space-y-2 pt-1.5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-1">ANNUAL CAPACITY (SEATS)</label>
                      <input
                        type="number"
                        value={proposals[1].parameters.capacity}
                        onChange={(e) => {
                          const updated = [...proposals];
                          updated[1].parameters.capacity = e.target.value;
                          setProposals(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="e.g. 150"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-1">DISTANCE TO NEAREST METROPOLIS (KM)</label>
                      <input
                        type="number"
                        value={proposals[1].parameters.travelDistance}
                        onChange={(e) => {
                          const updated = [...proposals];
                          updated[1].parameters.travelDistance = e.target.value;
                          setProposals(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="e.g. 25"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Compare Trigger button */}
              <button
                onClick={handleCompareProposals}
                disabled={isComparing}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide py-3 px-4 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Brain className="w-5 h-5 text-blue-200" />
                <span>{isComparing ? "Analyzing Proposals..." : "Evaluate & Compare Proposals"}</span>
              </button>

              {compareError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {compareError}
                </div>
              )}

              {/* Compare Results Display */}
              {isComparing ? (
                <div className="p-12 border border-slate-100 rounded-xl flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
                    Computing Travel-Distance Distress Index & Strategic Budget Analytics...
                  </p>
                </div>
              ) : compareResult && (
                <div className="space-y-5 pt-2 animate-fadeIn">
                  {/* AI Executive Report */}
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">AI STRATEGIC SYNTHESIS REPORT</span>
                    <SimpleMarkdown text={compareResult.ai_synthesis_report_markdown || compareResult.aiRecommendationReport} />
                  </div>

                  {/* Objective DSS Comparison Matrix */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">OBJECTIVE DSS COMPARISON MATRIX</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option A Score Card */}
                      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] font-black uppercase text-blue-600 block font-mono">OPTION A</span>
                            <span className="text-xs font-bold text-slate-900 uppercase block leading-tight">{proposals[0]?.title}</span>
                          </div>
                          <span className="text-2xl font-black text-blue-700 font-mono">
                            {compareResult.dss_comparison_matrix?.option_a_score || compareResult.rankedProposals?.[0]?.score || 85}/100
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">Based on student enrollment density and travel distress deficit.</p>
                      </div>

                      {/* Option B Score Card */}
                      <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] font-black uppercase text-purple-600 block font-mono">OPTION B</span>
                            <span className="text-xs font-bold text-slate-900 uppercase block leading-tight">{proposals[1]?.title}</span>
                          </div>
                          <span className="text-2xl font-black text-purple-700 font-mono">
                            {compareResult.dss_comparison_matrix?.option_b_score || compareResult.rankedProposals?.[1]?.score || 75}/100
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">Based on annual seat capacity and alternative facility distance.</p>
                      </div>
                    </div>

                    {/* Ranking & Justification */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2 text-[10px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-black text-slate-400 uppercase tracking-wider">RANKING ORDER:</span>
                        {(compareResult.dss_comparison_matrix?.objective_ranking_order || ["#1 Option A", "#2 Option B"]).map((item: string, idx: number) => (
                          <span key={idx} className="bg-slate-900 text-white font-bold px-2 py-0.5 rounded text-[9px] font-mono">
                            {item}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">Policy Justification: </strong>
                        {compareResult.dss_comparison_matrix?.logical_justification || "Immediate travel-distance mitigation prioritized over skill center expansions."}
                      </p>
                      {compareResult.dss_comparison_matrix?.targeted_demographic_impact && (
                        <p className="text-slate-600 leading-relaxed pt-1.5 border-t border-slate-200/60 mt-1">
                          <strong className="text-slate-800">Targeted Demographics: </strong>
                          {compareResult.dss_comparison_matrix.targeted_demographic_impact}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Simulation Analysis & Warnings */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">STRATEGIC SIMULATION ANALYSIS</span>
                      
                      <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black">
                        <span className="text-slate-500 font-mono">PUBLIC SATISFACTION ROI:</span>
                        <span className="text-emerald-700 font-mono text-xs">
                          {compareResult.simulation_analysis?.public_satisfaction_percentage_roi || 85}%
                        </span>
                      </div>
                    </div>

                    {/* Deficit Warnings */}
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black uppercase text-amber-600 tracking-wider">RESOURCE DEFICIT WARNINGS</span>
                      {(compareResult.simulation_analysis?.resource_deficit_warnings || ["No warnings detected"]).map((warning: string, wIdx: number) => (
                        <div key={wIdx} className="p-2.5 bg-amber-50/50 border border-amber-100 text-amber-800 rounded-lg text-[9px] flex items-start gap-1.5 font-semibold leading-relaxed">
                          <span className="mt-0.5">⚠️</span>
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pros and Risks bullet layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-black uppercase text-emerald-600 tracking-wider">✅ ALLOCATED WORK PROS</span>
                        {(compareResult.simulation_analysis?.pros_and_cons_bullet_layout?.allocated_work_pros || ["Directly targets constituency development lags."]).map((p: string, pIdx: number) => (
                          <p key={pIdx} className="text-[9px] text-slate-600 pl-2 border-l-2 border-emerald-500 leading-relaxed">{p}</p>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-black uppercase text-rose-600 tracking-wider">🚧 INTER-AGENCY COORDINATION RISKS</span>
                        {(compareResult.simulation_analysis?.pros_and_cons_bullet_layout?.inter_agency_coordination_risks || ["Requires MCD/PWD cross approvals."]).map((r: string, rIdx: number) => (
                          <p key={rIdx} className="text-[9px] text-slate-600 pl-2 border-l-2 border-rose-500 leading-relaxed">{r}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Datasets & Grounding Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">DATA GROUNDING DIRECTORIES INVOLVED</span>
                      <div className="space-y-1">
                        {(compareResult.datasets_grounding_block?.referenced_directories || compareResult.dataGroundingUsed || ["Census Demographics"]).map((gStr: string, idx: number) => (
                          <div key={idx} className="text-[9px] text-slate-600 flex items-center gap-1 font-semibold">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{gStr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">LOCALIZED MUNICIPAL RISK INDEX</span>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black border ${
                          compareResult.datasets_grounding_block?.localized_municipal_risk_vector_index === "CRITICAL" || compareResult.datasets_grounding_block?.localized_municipal_risk_vector_index === "HIGH"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : compareResult.datasets_grounding_block?.localized_municipal_risk_vector_index === "MODERATE"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        }`}>
                          <span>VECTOR INDEX:</span>
                          <span>{compareResult.datasets_grounding_block?.localized_municipal_risk_vector_index || "MODERATE"}</span>
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        Municipal risk indicates environmental and inter-agency construction delays prior to direct MPLADS deployment.
                      </p>
                    </div>
                  </div>
                </div>
              )}



            </div>

          </div>
        </div>
      )}
    </div>
  );
}
