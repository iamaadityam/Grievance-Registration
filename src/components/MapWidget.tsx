import { useState, useMemo, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import { Grievance } from "../types";
import { 
  MapPin, 
  Info, 
  Compass, 
  ShieldAlert, 
  Layers, 
  Map as MapIcon, 
  Globe, 
  CheckCircle, 
  Flame, 
  Radio, 
  TrendingUp, 
  BarChart3, 
  Filter, 
  ExternalLink,
  Target,
  AlertTriangle
} from "lucide-react";

interface MapWidgetProps {
  grievances: Grievance[];
  selectedGrievance: Grievance | null;
  onSelectGrievance: (g: Grievance) => void;
  selectedSector?: string; // Toggled by admin filter
  onSelectSector?: (sector: string) => void; // Filter handler
}

const API_KEY =
  (typeof process !== "undefined" ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : "") ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

// Google Maps Marker
function GrievanceMarker({
  grievance,
  isSelected,
  spatialMode,
  onClick,
}: {
  grievance: Grievance;
  isSelected: boolean;
  spatialMode: "pins" | "heat" | "buffer";
  onClick: () => void;
  key?: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(false);

  const getPinColor = (urgency: string) => {
    if (urgency === "High") return "#ef4444";
    if (urgency === "Medium") return "#f97316";
    return "#3b82f6";
  };

  const getPinGlyph = (dept: string) => {
    if (dept === "Water Logging") return "💧";
    if (dept === "Potholes") return "🕳️";
    return "🗑️";
  };

  const position = { lat: grievance.latitude, lng: grievance.longitude };

  // Heatmap View Mode
  if (spatialMode === "heat") {
    const isHigh = grievance.urgency === "High";
    const isMedium = grievance.urgency === "Medium";
    
    return (
      <AdvancedMarker position={position} onClick={onClick}>
        <div className="relative flex items-center justify-center cursor-pointer group">
          {/* Glowing Heat Ring */}
          <div 
            className={`absolute rounded-full animate-ping pointer-events-none ${
              isHigh ? "w-8 h-8 bg-red-500/30" : isMedium ? "w-6 h-6 bg-orange-500/25" : "w-4 h-4 bg-blue-500/20"
            }`}
            style={{ animationDuration: isHigh ? "1.5s" : "3s" }}
          />
          {/* Secondary Layer Heat Glow */}
          <div 
            className={`absolute rounded-full pointer-events-none transition-all group-hover:scale-150 ${
              isHigh ? "w-5 h-5 bg-red-500/40 blur-xs" : isMedium ? "w-4 h-4 bg-orange-500/35 blur-xs" : "w-3 h-3 bg-blue-500/30 blur-xs"
            }`}
          />
          {/* Central Core Heat Dot */}
          <div 
            className={`w-3 h-3 rounded-full border border-white shadow-sm transition-all group-hover:scale-125 ${
              isHigh ? "bg-red-600" : isMedium ? "bg-orange-500" : "bg-blue-500"
            }`}
          />
        </div>
      </AdvancedMarker>
    );
  }

  // Buffer Proximity Zone Mode
  if (spatialMode === "buffer") {
    const isHigh = grievance.urgency === "High";
    const isMedium = grievance.urgency === "Medium";
    
    return (
      <>
        {/* Real Marker Pin */}
        <AdvancedMarker
          ref={markerRef}
          position={position}
          onClick={() => {
            onClick();
            setInfoOpen(true);
          }}
        >
          <Pin
            background={getPinColor(grievance.urgency)}
            glyphColor="#fff"
            borderColor={isSelected ? "#ffffff" : "transparent"}
            scale={isSelected ? 1.3 : 1.0}
          >
            <span className="text-xs">{getPinGlyph(grievance.department)}</span>
          </Pin>
        </AdvancedMarker>

        {/* 500m Impact Buffer Overlay Circle */}
        <AdvancedMarker position={position} gmpClickable={false}>
          <div 
            className={`rounded-full border border-dashed pointer-events-none flex items-center justify-center ${
              isHigh 
                ? "w-[90px] h-[90px] -ml-[45px] -mt-[45px] border-red-500/50 bg-red-500/5 animate-pulse" 
                : isMedium 
                ? "w-[70px] h-[70px] -ml-[35px] -mt-[35px] border-orange-500/40 bg-orange-500/5" 
                : "w-[50px] h-[50px] -ml-[25px] -mt-[25px] border-blue-500/35 bg-blue-500/3"
            }`}
          />
        </AdvancedMarker>

        {(infoOpen || isSelected) && (
          <InfoWindow
            anchor={marker}
            onCloseClick={() => setInfoOpen(false)}
            headerDisabled={true}
          >
            <div className="p-2 max-w-xs text-slate-900 font-sans">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                    grievance.urgency === "High"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {grievance.urgency} Priority
                </span>
                <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
                  {grievance.department}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{grievance.cleanLocation}</h4>
              <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{grievance.summary}</p>
              <div className="mt-2 pt-1 border-t border-slate-100 text-[9px] text-slate-400 flex justify-between">
                <span>By: {grievance.name}</span>
                <span className={grievance.status === "Resolved" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  ● {grievance.status}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </>
    );
  }

  // Standard Pin Mode
  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => {
          onClick();
          setInfoOpen(true);
        }}
      >
        <Pin
          background={getPinColor(grievance.urgency)}
          glyphColor="#fff"
          borderColor={isSelected ? "#ffffff" : "transparent"}
          scale={isSelected ? 1.3 : 1.0}
        >
          <span className="text-xs">{getPinGlyph(grievance.department)}</span>
        </Pin>
      </AdvancedMarker>

      {(infoOpen || isSelected) && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoOpen(false)}
          headerDisabled={true}
        >
          <div className="p-2 max-w-xs text-slate-900 font-sans">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                  grievance.urgency === "High"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {grievance.urgency}
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
                {grievance.department}
              </span>
            </div>
            <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{grievance.cleanLocation}</h4>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{grievance.summary}</p>
            <div className="mt-2 pt-1 border-t border-slate-100 text-[9px] text-slate-400 flex justify-between">
              <span>By: {grievance.name}</span>
              <span className={grievance.status === "Resolved" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                ● {grievance.status}
              </span>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function MapWidget({
  grievances,
  selectedGrievance,
  onSelectGrievance,
  selectedSector = "All",
  onSelectSector,
}: MapWidgetProps) {
  // Dynamic API Key state fetched from backend securely
  const [apiKey, setApiKey] = useState<string>(API_KEY);
  const [selectedMapTab, setSelectedMapTab] = useState<"google" | "fallback">(
    (Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY") ? "google" : "fallback"
  );
  const [spatialMode, setSpatialMode] = useState<"pins" | "heat" | "buffer">("pins");
  const [filterOnlyOpen, setFilterOnlyOpen] = useState(true);

  const hasValidKeyDynamic = Boolean(apiKey) && apiKey !== "YOUR_API_KEY";

  useEffect(() => {
    fetch("/api/maps-key")
      .then((res) => res.json())
      .then((data) => {
        if (data.key && data.key !== "YOUR_API_KEY") {
          setApiKey(data.key);
          setSelectedMapTab("google");
        }
      })
      .catch((err) => console.error("Error fetching maps key:", err));
  }, []);

  // Default map position to New Delhi coordinates
  const defaultCenter = { lat: 28.6139, lng: 77.209 };

  // Filter grievances based on 'only open' toggle inside map
  const mapGrievances = useMemo(() => {
    return grievances.filter((g) => {
      if (filterOnlyOpen && g.status !== "Open") return false;
      return true;
    });
  }, [grievances, filterOnlyOpen]);

  const mapCenter = useMemo(() => {
    return selectedGrievance
      ? { lat: selectedGrievance.latitude, lng: selectedGrievance.longitude }
      : mapGrievances.length > 0
      ? { lat: mapGrievances[0].latitude, lng: mapGrievances[0].longitude }
      : defaultCenter;
  }, [selectedGrievance, mapGrievances]);

  // Spatial Census Zone Grid coordinates
  const sectors = [
    { id: "All", name: "Full Jurisdiction", d: "M 10 10 L 90 10 L 90 90 L 10 90 Z" },
    { id: "West Zone", name: "West Zone (MCD)", d: "M 10 10 L 45 10 L 45 90 L 10 90 Z" },
    { id: "East Zone", name: "East Zone (MCD)", d: "M 55 10 L 90 10 L 90 90 L 55 90 Z" },
    { id: "NDMC Area", name: "NDMC Core Zone", d: "M 35 30 L 65 30 L 65 60 L 35 60 Z" },
    { id: "Central Zone", name: "Central Zone (MCD)", d: "M 10 65 L 90 65 L 90 90 L 10 90 Z" }
  ];

  // Spatial Statistics analysis computed on current grievances feed
  const spatialStats = useMemo(() => {
    const counts: Record<string, { total: number; high: number; score: number }> = {
      "West Zone": { total: 0, high: 0, score: 0 },
      "East Zone": { total: 0, high: 0, score: 0 },
      "NDMC Area": { total: 0, high: 0, score: 0 },
      "Central Zone": { total: 0, high: 0, score: 0 },
    };

    mapGrievances.forEach((g) => {
      const zone = g.sector || "Central Zone";
      if (counts[zone]) {
        counts[zone].total += 1;
        if (g.urgency === "High") counts[zone].high += 1;
        counts[zone].score += g.urgency === "High" ? 3 : g.urgency === "Medium" ? 2 : 1;
      }
    });

    const list = Object.entries(counts).map(([zone, stat]) => {
      let riskLevel = "Stable";
      let colorClass = "text-emerald-500 bg-emerald-500/10";
      if (stat.score >= 10) {
        riskLevel = "Critical";
        colorClass = "text-red-600 bg-red-600/10 dark:text-red-400";
      } else if (stat.score >= 4) {
        riskLevel = "Moderate";
        colorClass = "text-amber-600 bg-amber-600/10 dark:text-amber-400";
      }

      return {
        zone,
        ...stat,
        riskLevel,
        colorClass
      };
    });

    return {
      list,
      highestRiskZone: list.reduce((prev, current) => (prev.score > current.score ? prev : current), list[0])?.zone || "Central Zone"
    };
  }, [mapGrievances]);

  const mapCoordinatesToSVG = (lat: number, lng: number) => {
    const minLat = 28.45;
    const maxLat = 28.75;
    const minLng = 77.02;
    const maxLng = 77.42;

    const x = 10 + ((lng - minLng) / (maxLng - minLng)) * 80;
    const y = 90 - ((lat - minLat) / (maxLat - minLat)) * 80;

    return {
      x: isNaN(x) ? 50 : Math.max(10, Math.min(90, x)),
      y: isNaN(y) ? 50 : Math.max(10, Math.min(90, y)),
    };
  };

  const handleSectorClick = (sectorId: string) => {
    if (onSelectSector) {
      onSelectSector(sectorId);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm flex flex-col h-full select-none">
      
      {/* 🚀 Top GIS Style Toolbar */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-3.5 border-b border-slate-950 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
                <span>GIS Spatial Analysis Engine</span>
              </span>
            </div>
            <h3 className="text-sm font-black tracking-tight uppercase mt-0.5 flex items-center gap-1.5">
              <span>Constituency Hotspot Mapper</span>
              <span className="text-[9px] bg-blue-600/30 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-normal uppercase">v2.0 Live</span>
            </h3>
          </div>

          {/* Map Technology Switcher */}
          <div className="flex bg-slate-800 border border-slate-700/60 p-0.5 rounded-lg text-[10px] font-extrabold uppercase">
            <button
              onClick={() => setSelectedMapTab("google")}
              className={`px-2.5 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                selectedMapTab === "google"
                  ? "bg-slate-900 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>
            <button
              onClick={() => setSelectedMapTab("fallback")}
              className={`px-2.5 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                selectedMapTab === "fallback"
                  ? "bg-slate-900 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>SVG Grid Fallback</span>
            </button>
          </div>
        </div>

        {/* 🛠️ Dynamic Spatial Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2.5">
          
          {/* Spatial Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-850 p-1 rounded-lg border border-slate-800/80">
            <span className="text-[8px] font-black text-slate-500 uppercase px-1">Mode</span>
            <button
              onClick={() => setSpatialMode("pins")}
              className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                spatialMode === "pins"
                  ? "bg-slate-700 text-white font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Standard Location Pins"
            >
              Pins
            </button>
            <button
              onClick={() => setSpatialMode("heat")}
              className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-0.5 ${
                spatialMode === "heat"
                  ? "bg-red-900 text-red-100 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Hotspot Density Heatmap"
            >
              <Flame className="w-3 h-3 text-red-500" />
              <span>Heatmap</span>
            </button>
            <button
              onClick={() => setSpatialMode("buffer")}
              className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-0.5 ${
                spatialMode === "buffer"
                  ? "bg-blue-900 text-blue-100 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Impact Buffer Zones"
            >
              <Radio className="w-3 h-3 text-blue-400" />
              <span>Proximity Buffer</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 font-bold bg-slate-800 border border-slate-700/60 px-2 py-1 rounded-lg">
              <input
                type="checkbox"
                checked={filterOnlyOpen}
                onChange={(e) => setFilterOnlyOpen(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer w-3.5 h-3.5"
              />
              <span>Only Pin Open {filterOnlyOpen ? "Active" : "All"}</span>
            </label>

            {/* Selector Quick Filters */}
            <div className="hidden sm:flex bg-slate-800 border border-slate-700/60 p-0.5 rounded-lg text-[9px] font-bold">
              {sectors.slice(0, 4).map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => handleSectorClick(sec.id)}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${
                    selectedSector === sec.id
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sec.id === "All" ? "All Zones" : sec.id.replace(" Zone", "")}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 📊 Main Map & Analysis Area Split Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden min-h-[450px]">
        
        {/* MAP CANVAS (8 Columns on Large Screens) */}
        <div className="xl:col-span-8 relative bg-slate-100 dark:bg-slate-950 flex flex-col h-full min-h-[350px]">
          {selectedMapTab === "google" ? (
            hasValidKeyDynamic ? (
              <div id="grievance-google-map" className="flex-1 relative w-full h-full min-h-[350px]">
                <APIProvider apiKey={apiKey} version="weekly">
                  <Map
                    center={mapCenter}
                    zoom={selectedGrievance ? 15 : 12}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                    style={{ width: "100%", height: "100%" }}
                    options={{
                      disableDefaultUI: false,
                      mapTypeControl: true,
                      streetViewControl: false,
                      fullscreenControl: true,
                    }}
                  >
                    {mapGrievances.map((g) => (
                      <GrievanceMarker
                        key={g.id}
                        grievance={g}
                        isSelected={selectedGrievance?.id === g.id}
                        spatialMode={spatialMode}
                        onClick={() => onSelectGrievance(g)}
                      />
                    ))}
                  </Map>
                </APIProvider>

                {/* Overlaid Floating Indicator for active filters */}
                <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md p-2 rounded-lg text-[9px] space-y-0.5 backdrop-blur-sm">
                  <div className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>GIS Spatial Layer</span>
                  </div>
                  <div className="text-slate-500 font-medium font-mono text-[8px]">
                    MODE: <span className="text-blue-600 dark:text-blue-400 font-bold uppercase">{spatialMode}</span> | FILTER: <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedSector === "All" ? "ALL SECTORS" : selectedSector.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Google Maps Setup Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 font-sans">
                <div className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-md space-y-4">
                  <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100">Google Maps Platform Key Required</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      To render the interactive GIS satellite vector view, please add your Google Maps API secret key.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3.5 rounded-xl text-left space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Instructions:</span>
                    <ol className="text-[10px] text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4 leading-normal font-semibold">
                      <li>
                        Get an API Key:{" "}
                        <a 
                          href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 font-bold underline inline-flex items-center gap-0.5"
                        >
                          Google Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </li>
                      <li>Open **Settings** (⚙️ gear icon, top-right of your screen)</li>
                      <li>Go to **Secrets** → enter <code>GOOGLE_MAPS_PLATFORM_KEY</code> as secret name</li>
                      <li>Paste your key as the value and save. The app will compile automatically!</li>
                    </ol>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <button
                      onClick={() => setSelectedMapTab("fallback")}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-all"
                    >
                      Bypass to Fallback SVG Grid Map
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Interactive SVG Constituency Grid Fallback Map */
            <div className="flex-1 relative flex items-center justify-center p-4 bg-white dark:bg-slate-950 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
              
              <svg className="w-full h-full max-h-[380px] aspect-square" viewBox="0 0 100 100" fill="none">
                {/* Sector Grid Zones */}
                {/* West Zone */}
                <path
                  d="M 5 5 L 45 5 L 45 95 L 5 95 Z"
                  className={`transition-all duration-200 stroke-slate-200 dark:stroke-slate-800 stroke-[0.4] cursor-pointer ${
                    selectedSector === "West Zone" ? "fill-blue-500/10 stroke-blue-500/50 stroke-1" : "fill-transparent hover:fill-slate-100/10"
                  }`}
                  onClick={() => handleSectorClick("West Zone")}
                />
                
                {/* East Zone */}
                <path
                  d="M 55 5 L 95 5 L 95 95 L 55 95 Z"
                  className={`transition-all duration-200 stroke-slate-200 dark:stroke-slate-800 stroke-[0.4] cursor-pointer ${
                    selectedSector === "East Zone" ? "fill-purple-500/10 stroke-purple-500/50 stroke-1" : "fill-transparent hover:fill-slate-100/10"
                  }`}
                  onClick={() => handleSectorClick("East Zone")}
                />

                {/* Central Zone Background */}
                <path
                  d="M 45 5 L 55 5 L 55 95 L 45 95 Z"
                  className={`transition-all duration-200 stroke-slate-150 dark:stroke-slate-850 stroke-[0.3] cursor-pointer ${
                    selectedSector === "Central Zone" ? "fill-amber-500/15 stroke-amber-500/50 stroke-1" : "fill-transparent hover:fill-slate-100/10"
                  }`}
                  onClick={() => handleSectorClick("Central Zone")}
                />

                {/* NDMC Core Area */}
                <rect
                  x="30"
                  y="25"
                  width="40"
                  height="40"
                  rx="4"
                  className={`transition-all duration-200 stroke-emerald-500/80 stroke-[0.4] cursor-pointer ${
                    selectedSector === "NDMC Area" ? "fill-emerald-500/15 stroke-emerald-500 stroke-1" : "fill-transparent hover:fill-slate-100/15"
                  }`}
                  onClick={() => handleSectorClick("NDMC Area")}
                />

                {/* Text Labels Overlay */}
                <text x="12" y="12" className="text-[2.5px] font-black fill-slate-400 uppercase tracking-widest pointer-events-none select-none opacity-80">West District (MCD)</text>
                <text x="66" y="12" className="text-[2.5px] font-black fill-slate-400 uppercase tracking-widest pointer-events-none select-none opacity-80">East District (MCD)</text>
                <text x="36" y="46" className="text-[3px] font-black fill-emerald-600 dark:text-emerald-400 uppercase tracking-wider pointer-events-none select-none">NDMC Central Area</text>
                <text x="40" y="85" className="text-[2.5px] font-black fill-amber-600 dark:text-amber-400 uppercase tracking-widest pointer-events-none select-none">Central District (MCD)</text>

                {/* Spatial Mode Render on Fallback SVG */}
                {mapGrievances.map((g) => {
                  const { x, y } = mapCoordinatesToSVG(g.latitude, g.longitude);
                  const isSelected = selectedGrievance?.id === g.id;
                  const color = g.urgency === "High" ? "#ef4444" : g.urgency === "Medium" ? "#f97316" : "#3b82f6";
                  const isHigh = g.urgency === "High";

                  // Spatial Overlays in SVG (Heat & Buffer maps)
                  return (
                    <g
                      key={g.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGrievance(g);
                      }}
                      className="cursor-pointer group transition-all"
                    >
                      {/* Heatmap overlay dots in SVG */}
                      {spatialMode === "heat" && (
                        <>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHigh ? 7 : 4}
                            fill={color}
                            fillOpacity="0.2"
                            className="animate-pulse"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r={2}
                            fill={color}
                            className="stroke-white stroke-[0.3]"
                          />
                        </>
                      )}

                      {/* Buffer impact zone overlays in SVG */}
                      {spatialMode === "buffer" && (
                        <>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHigh ? 12 : 8}
                            fill={color}
                            fillOpacity="0.04"
                            stroke={color}
                            strokeWidth="0.25"
                            strokeDasharray="1,1"
                            className="animate-pulse"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r={isSelected ? 2.5 : 1.8}
                            fill={color}
                            className="stroke-white stroke-[0.3]"
                          />
                        </>
                      )}

                      {/* Standard Pins/Dots in SVG */}
                      {spatialMode === "pins" && (
                        <>
                          <circle
                            cx={x}
                            cy={y}
                            r={isSelected ? 3.5 : 2.0}
                            fill={color}
                            fillOpacity="0.3"
                            className="animate-ping"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r={isSelected ? 2.2 : 1.5}
                            fill={color}
                            className="stroke-white stroke-[0.4] filter drop-shadow-sm group-hover:scale-125"
                          />
                          <text
                            x={x}
                            y={y - 3}
                            textAnchor="middle"
                            className="text-[2px] font-extrabold fill-slate-700 dark:fill-slate-300 bg-white"
                          >
                            {g.department === "Water Logging" ? "💧" : g.department === "Potholes" ? "🕳️" : "🗑️"}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Float Legend */}
              <div className="absolute bottom-3 left-3 bg-slate-900/95 text-white text-[9px] p-2 rounded-lg space-y-1.5 border border-slate-800">
                <span className="font-bold text-[8px] tracking-wider text-slate-400 block uppercase">Density Map Index</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span>High Priority Impact</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span>Medium Urgency</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Low Proximity</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 📊 GIS SPATIAL ANALYTICS PANEL (4 Columns on Large Screens) */}
        <div className="xl:col-span-4 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-850 p-4 bg-slate-50 dark:bg-slate-900 flex flex-col justify-between space-y-4">
          
          <div className="space-y-4">
            
            {/* Sector Risk Breakdown List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Sector Density Indices</span>
                </span>
                <span className="text-[8px] text-slate-400 font-mono font-bold">W = Urgency Weight</span>
              </div>

              <div className="space-y-1.5">
                {spatialStats.list.map((stat) => (
                  <div
                    key={stat.zone}
                    onClick={() => handleSectorClick(stat.zone)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedSector === stat.zone
                        ? "bg-white dark:bg-slate-850 border-blue-500/50 dark:border-blue-400/40 shadow-sm"
                        : "bg-white/40 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-850 border-slate-200/60 dark:border-slate-850"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[140px]">
                        {stat.zone}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono">
                        <span>Active: {stat.total}</span>
                        <span>•</span>
                        <span>Weight: {stat.score}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${stat.colorClass}`}>
                        {stat.riskLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Geo-Clustering Analysis Insights Card */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span>Spatial Synthesis Alert</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                <p>
                  Constituency spatial overlay highlights <strong className="text-blue-700 dark:text-blue-400 uppercase">{spatialStats.highestRiskZone}</strong> as the current primary cluster hotbed.
                </p>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                  ⚠️ Priority scores suggest prioritizing road repairs in high siltation/drainage overflow zones to prevent catastrophic failures.
                </div>
              </div>
            </div>

          </div>

          {/* Mapped Grievances Quick Carousel Slider */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Constituency Coordinates Slider</span>
            <div className="flex gap-2 overflow-x-auto pb-1.5 max-w-full">
              {mapGrievances.map((g) => {
                const isSelected = selectedGrievance?.id === g.id;
                const icon = g.department === "Water Logging" ? "💧" : g.department === "Potholes" ? "🕳️" : "🗑️";
                const urgencyColor = g.urgency === "High" ? "bg-red-500" : g.urgency === "Medium" ? "bg-orange-500" : "bg-blue-500";
                
                return (
                  <div
                    key={g.id}
                    onClick={() => onSelectGrievance(g)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl cursor-pointer transition-all border text-[10px] flex items-center gap-2 ${
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white font-bold dark:bg-white dark:border-white dark:text-slate-950"
                        : "bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${urgencyColor}`} />
                    <span>{icon}</span>
                    <span className="truncate max-w-[110px]">{g.cleanLocation}</span>
                  </div>
                );
              })}
              {mapGrievances.length === 0 && (
                <div className="text-slate-400 dark:text-slate-500 text-[10px] py-2 m-auto font-medium">
                  No active reports in filter range.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
