import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, 
  Users, 
  TrendingUp, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  CheckCircle, 
  Activity, 
  Sparkles, 
  Brain, 
  Clock, 
  Layers, 
  ArrowRight,
  Info,
  ChevronRight,
  Printer,
  Copy
} from "lucide-react";
import { Grievance } from "../types";
import { SECTOR_DATASETS, SectorDatasetProfile } from "../data/constituencyDatasets";

interface DataOverlayExplorerProps {
  grievances: Grievance[];
  selectedSector: string;
  onSelectSector: (sector: string) => void;
}

export const DataOverlayExplorer: React.FC<DataOverlayExplorerProps> = ({
  grievances,
  selectedSector,
  onSelectSector
}) => {
  // If the dashboard has "All" selected, default explorer to "Central Zone" but allow user to change
  const [localSector, setLocalSector] = useState<string>(
    selectedSector !== "All" ? selectedSector : "Central Zone"
  );

  const [activeTab, setActiveTab] = useState<"matrix" | "demographics" | "gaps" | "plans" | "public_datasets">("matrix");
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [draftedMandate, setDraftedMandate] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Synchronize local sector state if prop changes to a specific zone
  React.useEffect(() => {
    if (selectedSector !== "All") {
      setLocalSector(selectedSector);
    }
  }, [selectedSector]);

  const profile: SectorDatasetProfile = useMemo(() => {
    return SECTOR_DATASETS[localSector] || SECTOR_DATASETS["Central Zone"];
  }, [localSector]);

  // Compute live grievances statistics for this specific sector
  const sectorGrievances = useMemo(() => {
    return grievances.filter(g => g.sector === localSector);
  }, [grievances, localSector]);

  const grievanceStats = useMemo(() => {
    const total = sectorGrievances.length;
    const water = sectorGrievances.filter(g => g.department === "Water Logging").length;
    const road = sectorGrievances.filter(g => g.department === "Potholes").length;
    const waste = sectorGrievances.filter(g => g.department === "Garbage Report").length;
    const highUrgency = sectorGrievances.filter(g => g.urgency === "High").length;
    const resolved = sectorGrievances.filter(g => g.status === "Resolved").length;
    const active = total - resolved;

    return { total, water, road, waste, highUrgency, resolved, active };
  }, [sectorGrievances]);

  // Ground-Truth Cross-Dataset Validation Index Calculation
  const validationScore = useMemo(() => {
    let matches = 0;
    let weightCount = 0;

    // 1. Water Logging & Drainage siltation validation
    if (profile.infrastructureGaps.drainageSiltationIndex > 60) {
      weightCount++;
      if (grievanceStats.water > 0) matches += 1.0;
      else matches += 0.3; // low alignment
    } else {
      weightCount++;
      if (grievanceStats.water === 0) matches += 1.0;
      else matches += 0.5;
    }

    // 2. Road repairs & Road wear score validation
    const isHighWear = profile.infrastructureGaps.roadWearScore.toLowerCase().includes("severe") || 
                       profile.infrastructureGaps.roadWearScore.toLowerCase().includes("critical") ||
                       profile.infrastructureGaps.roadWearScore.toLowerCase().includes("high");
    weightCount++;
    if (isHighWear) {
      if (grievanceStats.road > 0) matches += 1.0;
      else matches += 0.4;
    } else {
      if (grievanceStats.road === 0) matches += 1.0;
      else matches += 0.6;
    }

    // 3. Sanitation indices & Waste backlog validation
    const hasWasteBacklog = parseFloat(profile.infrastructureGaps.solidWasteBacklog) > 5.0;
    weightCount++;
    if (hasWasteBacklog) {
      if (grievanceStats.waste > 0) matches += 1.0;
      else matches += 0.3;
    } else {
      if (grievanceStats.waste === 0) matches += 1.0;
      else matches += 0.7;
    }

    // Calculate a percentage
    if (weightCount === 0) return 100;
    return Math.round((matches / weightCount) * 100);
  }, [profile, grievanceStats]);

  // Generate localized AI Strategic Mandate Report
  const handleDraftSectorMandate = async () => {
    setIsDraftingAI(true);
    setDraftedMandate(null);

    // Build highly optimized cross-dataset report payload
    const dataReport = `
Geographic Sector Focus: ${profile.sectorName}
---
1. LIVE CITIZEN GRIEVANCE DEMANDS:
- Active Citizen Reports matching sector: ${grievanceStats.total} total cases.
- Potholes/Road Gaps cases: ${grievanceStats.road} reports
- Drainage/Water Logging cases: ${grievanceStats.water} reports
- Solid Waste/Garbage cases: ${grievanceStats.waste} reports
- Highly Urgent Safety Distress count: ${grievanceStats.highUrgency} cases

2. CENSUS DEMOGRAPHICS & PROFILE:
- Population Density: ${profile.demographics.populationDensity} citizens/sq.km
- Average Income bracket: ${profile.demographics.averageIncome}
- Demographic Sector Layout: ${profile.demographics.demographicSplit}
- Voter Demographics base: ${profile.demographics.voterCount}
- Active school-going youth ratio: ${profile.demographics.schoolGoingYouthPct}%

3. STRUCTURAL INFRASTRUCTURE GAPS:
- Drainage Siltation level: ${profile.infrastructureGaps.drainageSiltationIndex}% of conduits clogged
- Asphalt/Road Wear grading: ${profile.infrastructureGaps.roadWearScore}
- Streetlighting Dark Area deficit: ${profile.infrastructureGaps.streetlightingDeficit}%
- Daily uncollected garbage: ${profile.infrastructureGaps.solidWasteBacklog}
- Public park space availability: ${profile.infrastructureGaps.publicParksRatio}

4. PUBLIC MUNICIPAL DATASETS:
- Census Transit Distress Score: ${profile.publicDatasets.censusTransitDistressIndex}/100 commute stress
- Swachh Bharat Sanitation National rank: Rank ${profile.publicDatasets.swachhBharatSanitationRank}
- UDISE+ pupil density metric: ${profile.publicDatasets.udiseSchoolPupilRatio}
- PWD Waterlogging active ponding alerts: ${profile.publicDatasets.pwdWaterloggingAlertsCount} critical locations

5. LOCAL MP DEVELOPMENT PLANS (Delhi Master Plan 2041):
- Master Plan Directive earmark: ${profile.developmentPlans.masterPlanGoal}
- Secondary Agency Initiative: ${profile.developmentPlans.primaryAuthorityProject}
- Zone Zoning restrictions: ${profile.developmentPlans.zoningConstraint}
- Zone earmark funds: ${profile.developmentPlans.earmarkedBudget}
    `;

    try {
      const response = await fetch("/api/generate-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          complaintsSummary: dataReport
        })
      });

      const data = await response.json();
      if (data.report) {
        setDraftedMandate(data.report);
      } else {
        setDraftedMandate("Error drafting strategic MP development mandate. Please retry.");
      }
    } catch (err) {
      console.error(err);
      setDraftedMandate("Network communication error. Failed to query server urban planner.");
    } finally {
      setIsDraftingAI(false);
    }
  };

  const copyToClipboard = () => {
    if (!draftedMandate) return;
    navigator.clipboard.writeText(draftedMandate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="data-overlay-explorer-root" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden flex flex-col">
      {/* Header Panel */}
      <div className="bg-slate-50 dark:bg-slate-950 p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/20">
              Cross-Dataset Core Engine
            </span>
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 mt-1">
              Integrated Constituency Data Overlay & Gap Explorer
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Correlating live citizen grievances with census grids, municipal plans, and Swachh Bharat indicators
            </p>
          </div>
        </div>

        {/* Sector Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Sector:
          </span>
          <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-300/40 dark:border-slate-700/50">
            {Object.keys(SECTOR_DATASETS).map((sec) => (
              <button
                key={sec}
                onClick={() => {
                  setLocalSector(sec);
                  onSelectSector(sec); // Propagate sector choice upwards
                }}
                className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer whitespace-nowrap ${
                  localSector === sec
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold border border-slate-200/50 dark:border-slate-800"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {sec.replace(" Area", "")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ground Truth Correlation Bar & Stats Grid */}
      <div className="p-5 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-900/30 dark:via-slate-900 dark:to-slate-900/30 border-b border-slate-100 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Dynamic Citizen Validation Score */}
        <div className="md:col-span-5 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>Ground-Truth Correlation</span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Dataset Alignment Index
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
              Determines how closely active public grievance distributions validate physical infrastructure gap databases.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-indigo-50/50 dark:bg-indigo-950/25 px-4 py-3 rounded-xl border border-indigo-100/40 dark:border-indigo-900/25 min-w-[85px] text-center">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
              {validationScore}%
            </span>
            <span className="text-[8px] font-bold uppercase text-indigo-500 tracking-wider mt-0.5">
              {validationScore >= 80 ? "Strict Match" : validationScore >= 60 ? "Moderate Match" : "Weak Match"}
            </span>
          </div>
        </div>

        {/* Live Complaint Overlay Count */}
        <div className="md:col-span-7 grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Potholes (Roads)</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">{grievanceStats.road}</span>
              <span className="text-[9px] text-slate-400">cases</span>
            </div>
            <span className="text-[8px] text-slate-400 mt-1 block">Wear: {profile.infrastructureGaps.roadWearScore.split(" ")[0]}</span>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide">Water Logging</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">{grievanceStats.water}</span>
              <span className="text-[9px] text-slate-400">cases</span>
            </div>
            <span className="text-[8px] text-slate-400 mt-1 block">Siltation: {profile.infrastructureGaps.drainageSiltationIndex}%</span>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <span className="text-[9px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wide">Garbage Backlog</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">{grievanceStats.waste}</span>
              <span className="text-[9px] text-slate-400">cases</span>
            </div>
            <span className="text-[8px] text-slate-400 mt-1 block">Waste: {profile.infrastructureGaps.solidWasteBacklog.split(" ")[0]} T/d</span>
          </div>
        </div>
      </div>

      {/* Explorer Tabs navigation */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 px-4 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "matrix"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          📋 Synthesis Matrix
        </button>
        <button
          onClick={() => setActiveTab("demographics")}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "demographics"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          👥 Demographics
        </button>
        <button
          onClick={() => setActiveTab("gaps")}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "gaps"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          🚧 Infrastructure Gaps
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "plans"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          🗺️ Development Plans
        </button>
        <button
          onClick={() => setActiveTab("public_datasets")}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "public_datasets"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          📊 Public Datasets
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-5 flex-1 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* TAB: MATRIX */}
            {activeTab === "matrix" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Bento Demographics Block */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                      <Users className="w-3.5 h-3.5" />
                      <span>Social Profile</span>
                    </div>
                    <h5 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Demographic Grid</h5>
                    <p className="text-[10px] text-slate-500 leading-normal line-clamp-3">
                      {profile.demographics.demographicSplit}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800 mt-4 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Density:</span>
                    <strong className="text-slate-700 dark:text-slate-200 font-mono font-bold">
                      {profile.demographics.populationDensity.toLocaleString()} / km²
                    </strong>
                  </div>
                </div>

                {/* Bento Infrastructure Gap Block */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-red-500 dark:text-red-400 uppercase">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Critical Deficits</span>
                    </div>
                    <h5 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Infrastructure Gaps</h5>
                    <div className="text-[10px] text-slate-500 space-y-1.5 leading-normal">
                      <div className="flex justify-between">
                        <span>Drain Siltation:</span>
                        <span className="font-mono text-red-500 dark:text-red-400 font-bold">{profile.infrastructureGaps.drainageSiltationIndex}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Road Damage:</span>
                        <span className="font-mono text-amber-500 max-w-[80px] truncate text-right">{profile.infrastructureGaps.roadWearScore.split(" ")[0]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800 mt-4 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Lighting Deficit:</span>
                    <strong className="text-slate-700 dark:text-slate-200 font-mono font-bold">
                      {profile.infrastructureGaps.streetlightingDeficit}% unlit
                    </strong>
                  </div>
                </div>

                {/* Bento Local Development Plans Block */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Master Plan 2041</span>
                    </div>
                    <h5 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Development Directives</h5>
                    <p className="text-[10px] text-slate-500 leading-normal line-clamp-3">
                      {profile.developmentPlans.masterPlanGoal}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800 mt-4 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Earmarked Budget:</span>
                    <strong className="text-slate-700 dark:text-slate-200 font-mono font-bold">
                      {profile.developmentPlans.earmarkedBudget}
                    </strong>
                  </div>
                </div>

                {/* Bento Public Datasets Block */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase">
                      <Database className="w-3.5 h-3.5" />
                      <span>Official Indicators</span>
                    </div>
                    <h5 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Public Statistics</h5>
                    <div className="text-[10px] text-slate-500 space-y-1.5 leading-normal">
                      <div className="flex justify-between">
                        <span>Transit Distress:</span>
                        <span className="font-mono text-purple-500 font-bold">{profile.publicDatasets.censusTransitDistressIndex}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Swachh Bharat Rank:</span>
                        <span className="font-mono text-indigo-500 font-bold">#{profile.publicDatasets.swachhBharatSanitationRank}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800 mt-4 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">UDISE+ Pupil Density:</span>
                    <strong className="text-slate-700 dark:text-slate-200 font-mono font-bold">
                      {profile.publicDatasets.udiseSchoolPupilRatio}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DEMOGRAPHICS */}
            {activeTab === "demographics" && (
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                  👥 Local Census Demographic Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Population Density</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                      {profile.demographics.populationDensity.toLocaleString()} citizens/km²
                    </p>
                    <p className="text-[10px] text-slate-400">Highly packed municipal sprawl creates extreme pressure on storm runoffs.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Constituency Voter Base</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                      {profile.demographics.voterCount}
                    </p>
                    <p className="text-[10px] text-slate-400">Eligible registered voters active in parliamentary feedback mechanisms.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">School-Going Youth Ratio</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                      {profile.demographics.schoolGoingYouthPct}%
                    </p>
                    <p className="text-[10px] text-slate-400">High pupil ratio emphasizes the need for high school transit pothole safety.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Literacy Rate</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                      {profile.demographics.literacyRate}%
                    </p>
                    <p className="text-[10px] text-slate-400">Correlates with high mobile/WhatsApp tech grievance reporting rates.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Average Household Income</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                      {profile.demographics.averageIncome}
                    </p>
                    <p className="text-[10px] text-slate-400">Indicates local economic resilience and public transport dependency metrics.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Subdivision Typology</span>
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-normal line-clamp-3">
                      {profile.demographics.demographicSplit}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GAPS */}
            {activeTab === "gaps" && (
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                  🚧 Physical Infrastructure Gap Databases
                </h4>
                <div className="space-y-4">
                  {/* Drainage Siltation Bar */}
                  <div className="space-y-1.5 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-slate-700 dark:text-slate-200">Drainage Siltation / Clogging Index</strong>
                      <span className="font-mono font-bold text-red-500 dark:text-red-400">{profile.infrastructureGaps.drainageSiltationIndex}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          profile.infrastructureGaps.drainageSiltationIndex > 70 ? "bg-red-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${profile.infrastructureGaps.drainageSiltationIndex}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Represents percentage of conduit pipes clogged with silt, soil runoff, and municipal trash.
                    </p>
                  </div>

                  {/* Streetlighting Deficit Bar */}
                  <div className="space-y-1.5 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-slate-700 dark:text-slate-200">Peripheral Streetlighting Dark-Area Deficit</strong>
                      <span className="font-mono font-bold text-indigo-500 dark:text-indigo-400">{profile.infrastructureGaps.streetlightingDeficit}% unlit</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${profile.infrastructureGaps.streetlightingDeficit}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Percentage of secondary walkways, sub-lanes, and dark alleys lacking functional solar municipal lighting assets.
                    </p>
                  </div>

                  {/* Grid fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Road Wear & Asphalt Grading</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-1">
                        {profile.infrastructureGaps.roadWearScore}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Solid Waste Backlog</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-1">
                        {profile.infrastructureGaps.solidWasteBacklog}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Public Parks Space Density</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-1">
                        {profile.infrastructureGaps.publicParksRatio}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PLANS */}
            {activeTab === "plans" && (
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                  🗺️ Local MP Development Plans & Zoning Guidelines
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-2">
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider block">Delhi Master Plan 2041 Blueprint</span>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {profile.developmentPlans.masterPlanGoal}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-2">
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider block">Primary Authority Infrastructure Project</span>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {profile.developmentPlans.primaryAuthorityProject}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-2">
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider block">Zoning Constraints</span>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {profile.developmentPlans.zoningConstraint}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 space-y-2">
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider block">Earmarked Divisional Zone Budget</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                      {profile.developmentPlans.earmarkedBudget}
                    </p>
                    <p className="text-[10px] text-slate-400">Total zone funding pool allocated for capital municipal assets in FY26-27.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PUBLIC DATASETS */}
            {activeTab === "public_datasets" && (
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                  📊 Public Datasets & National Indicator Portals
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-lg space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Census Transit Distress Index</span>
                      <strong className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                        {profile.publicDatasets.censusTransitDistressIndex}/100
                      </strong>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-relaxed">
                      Census metric evaluating local travel pain and congestion index during rush hour windows.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-lg space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">UDISE+ Pupil density index</span>
                      <strong className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono font-bold">
                        {profile.publicDatasets.udiseSchoolPupilRatio}
                      </strong>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-relaxed">
                      Unified District Information System for Education tracker reflecting teacher-to-pupil ratios.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-lg space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">PWD Waterlogging active spots</span>
                      <strong className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono text-red-500">
                        {profile.publicDatasets.pwdWaterloggingAlertsCount} critical
                      </strong>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-relaxed">
                      Public Works Department alerts monitoring recurrent monsoon flooding and ponding junctions.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-lg space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Swachh Bharat Cleanliness rank</span>
                      <strong className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono text-indigo-500 font-bold">
                        Rank #{profile.publicDatasets.swachhBharatSanitationRank}
                      </strong>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-relaxed">
                      National Clean Urban ranking index. Lower ranks reflect outstanding municipal waste backlogs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* AI Joint Synthesis Action Section */}
      <div className="bg-slate-50 dark:bg-slate-950 p-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 max-w-xl">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg mt-0.5 border border-indigo-200/50 dark:border-indigo-900/30">
              <Brain className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                Cross-Dataset AI Strategic Planner
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                Let Gemini cross-analyze the selected {localSector} public databases, local development plans, and live citizen grievance backlogs to draft an official Parliamentary Strategic Development Mandate.
              </p>
            </div>
          </div>

          <button
            onClick={handleDraftSectorMandate}
            disabled={isDraftingAI}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase px-4 py-2.5 rounded-lg transition-all shadow flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap self-start md:self-center"
          >
            {isDraftingAI ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing Datasets...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Draft Localized Strategic Mandate</span>
              </>
            )}
          </button>
        </div>

        {/* Markdown output terminal if drafted */}
        {draftedMandate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex flex-col"
          >
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                  MP Strategic Resolution Draft - {localSector}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                  title="Copy Mandate"
                >
                  {copied ? (
                    <span className="text-[8px] font-mono text-emerald-400 font-bold">COPIED!</span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                  title="Print Mandate"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[350px] font-mono text-[10.5px] leading-relaxed select-text select-all whitespace-pre-wrap whitespace-normal scrollbar-thin scrollbar-thumb-slate-800">
              {/* Clean rendering container for markdown reports */}
              <div className="space-y-4 text-slate-200">
                {draftedMandate.split("\n\n").map((para, i) => {
                  if (para.trim().startsWith("###")) {
                    return <h3 key={i} className="text-xs font-black text-white border-b border-slate-800 pb-1 uppercase tracking-wide mt-3">{para.replace("###", "")}</h3>;
                  }
                  if (para.trim().startsWith("####")) {
                    return <h4 key={i} className="text-[11px] font-black text-indigo-400 uppercase mt-2">{para.replace("####", "")}</h4>;
                  }
                  if (para.trim().startsWith("-") || para.trim().startsWith("*")) {
                    return (
                      <ul key={i} className="list-disc list-inside pl-2 space-y-1 text-slate-300">
                        {para.split("\n").map((line, j) => (
                          <li key={j}>{line.replace(/^[-*]\s*/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i} className="leading-relaxed">{para}</p>;
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
