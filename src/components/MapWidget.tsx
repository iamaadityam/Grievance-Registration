import { useState, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import { Grievance } from "../types";
import { MapPin, Info, Compass, ShieldAlert, Layers, Map as MapIcon, Globe, CheckCircle } from "lucide-react";

interface MapWidgetProps {
  grievances: Grievance[];
  selectedGrievance: Grievance | null;
  onSelectGrievance: (g: Grievance) => void;
  selectedSector?: string; // Toggled by admin filter
  onSelectSector?: (sector: string) => void; // Filter handler
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

// Google Maps Marker
function GrievanceMarker({
  grievance,
  isSelected,
  onClick,
}: {
  grievance: Grievance;
  isSelected: boolean;
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
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  grievance.urgency === "High"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {grievance.urgency}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                {grievance.department}
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{grievance.cleanLocation}</h4>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{grievance.summary}</p>
            <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
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
  // Default map position to New Delhi coordinates
  const defaultCenter = { lat: 28.6139, lng: 77.209 };

  const mapCenter = useMemo(() => {
    return selectedGrievance
      ? { lat: selectedGrievance.latitude, lng: selectedGrievance.longitude }
      : grievances.length > 0
      ? { lat: grievances[0].latitude, lng: grievances[0].longitude }
      : defaultCenter;
  }, [selectedGrievance, grievances]);

  // Delhi District Grid bounds for fallback SVG coordinate mapping
  // Min Lat: 28.52, Max Lat: 28.70
  // Min Lng: 77.10, Max Lng: 77.32
  const mapCoordinatesToSVG = (lat: number, lng: number) => {
    const minLat = 28.52;
    const maxLat = 28.70;
    const minLng = 77.10;
    const maxLng = 77.32;

    // Map long to X (10% to 90% boundary)
    const x = 10 + ((lng - minLng) / (maxLng - minLng)) * 80;
    // Map lat to Y (10% to 90% boundary, inverted since SVG starts top-left)
    const y = 90 - ((lat - minLat) / (maxLat - minLat)) * 80;

    return {
      x: isNaN(x) ? 50 : Math.max(10, Math.min(90, x)),
      y: isNaN(y) ? 50 : Math.max(10, Math.min(90, y)),
    };
  };

  // List of administrative sectors/jurisdictions
  const sectors = [
    { id: "All", name: "Full Jurisdiction", d: "M 10 10 L 90 10 L 90 90 L 10 90 Z", fill: "bg-slate-100" },
    { id: "West Zone", name: "West Zone (MCD)", d: "M 10 10 L 45 10 L 45 90 L 10 90 Z", fill: "fill-blue-500/5 hover:fill-blue-500/10" },
    { id: "East Zone", name: "East Zone (MCD)", d: "M 55 10 L 90 10 L 90 90 L 55 90 Z", fill: "fill-purple-500/5 hover:fill-purple-500/10" },
    { id: "NDMC Area", name: "NDMC Core Zone", d: "M 35 30 L 65 30 L 65 60 L 35 60 Z", fill: "fill-emerald-500/5 hover:fill-emerald-500/10" },
    { id: "Central Zone", name: "Central Zone (MCD)", d: "M 10 65 L 90 65 L 90 90 L 10 90 Z", fill: "fill-amber-500/5 hover:fill-amber-500/10" }
  ];

  const handleSectorClick = (sectorId: string) => {
    if (onSelectSector) {
      onSelectSector(sectorId);
    }
  };

  // Google Maps is loaded
  if (hasValidKey) {
    return (
      <div id="grievance-google-map" className="border border-slate-200 rounded-xl overflow-hidden h-full min-h-[500px] shadow-sm relative bg-slate-50">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            center={mapCenter}
            zoom={selectedGrievance ? 15 : 12}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            options={{
              disableDefaultUI: false,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
            {grievances.map((g) => (
              <GrievanceMarker
                key={g.id}
                grievance={g}
                isSelected={selectedGrievance?.id === g.id}
                onClick={() => onSelectGrievance(g)}
              />
            ))}
          </Map>
        </APIProvider>
      </div>
    );
  }

  // Gorgeous Fallback Interactive SVG Sector Map representation (Dummy Map with live hotspots!)
  return (
    <div className="border border-slate-200 bg-white rounded-xl overflow-hidden h-full min-h-[520px] flex flex-col shadow-sm select-none">
      
      {/* Map Header Panel */}
      <div className="bg-slate-900 text-white p-4 flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
              <MapIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Interactive Jurisdiction Map (Fallback)</span>
            </span>
          </div>
          <h3 className="text-sm font-black tracking-tight mt-1 uppercase">
            Constituency Grid Hotspot Tracker
          </h3>
        </div>

        {/* Sector Quick Buttons */}
        <div className="flex flex-wrap gap-1">
          {sectors.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleSectorClick(sec.id)}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer border ${
                selectedSector === sec.id
                  ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                  : "bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {sec.id === "All" ? "All Sectors" : sec.id}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Visual Panel */}
      <div className="flex-1 bg-slate-50 relative p-4 flex flex-col justify-between">
        
        {/* Interactive SVG Core */}
        <div className="flex-1 min-h-[300px] border border-slate-200/60 rounded-xl bg-white relative overflow-hidden flex items-center justify-center">
          
          {/* Subtle Grid Map Background */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <svg className="w-full h-full max-h-[380px] aspect-square" viewBox="0 0 100 100" fill="none">
            {/* Sector Polygons */}
            {/* West Zone */}
            <path
              d="M 5 5 L 45 5 L 45 95 L 5 95 Z"
              className={`transition-all duration-200 stroke-slate-200 stroke-[0.5] cursor-pointer ${
                selectedSector === "West Zone" ? "fill-blue-500/10 stroke-blue-500/50 stroke-1" : "fill-slate-50/20 hover:fill-slate-100/30"
              }`}
              onClick={() => handleSectorClick("West Zone")}
            />
            
            {/* East Zone */}
            <path
              d="M 55 5 L 95 5 L 95 95 L 55 95 Z"
              className={`transition-all duration-200 stroke-slate-200 stroke-[0.5] cursor-pointer ${
                selectedSector === "East Zone" ? "fill-purple-500/10 stroke-purple-500/50 stroke-1" : "fill-slate-50/20 hover:fill-slate-100/30"
              }`}
              onClick={() => handleSectorClick("East Zone")}
            />

            {/* Central Zone background / overlap */}
            <path
              d="M 45 5 L 55 5 L 55 95 L 45 95 Z"
              className={`transition-all duration-200 stroke-slate-150 stroke-[0.3] cursor-pointer ${
                selectedSector === "Central Zone" ? "fill-amber-500/15 stroke-amber-500/50 stroke-1" : "fill-slate-50/10 hover:fill-slate-100/20"
              }`}
              onClick={() => handleSectorClick("Central Zone")}
            />

            {/* NDMC Area (Center Overlay District) */}
            <rect
              x="30"
              y="25"
              width="40"
              height="40"
              rx="4"
              className={`transition-all duration-200 stroke-emerald-500 stroke-[0.5] cursor-pointer ${
                selectedSector === "NDMC Area" ? "fill-emerald-500/15 stroke-emerald-500 stroke-1" : "fill-emerald-50/20 hover:fill-emerald-100/30"
              }`}
              onClick={() => handleSectorClick("NDMC Area")}
            />

            {/* Sector Labels overlay */}
            <text x="18" y="15" className="text-[3px] font-black fill-slate-400 uppercase tracking-widest pointer-events-none">West Zone (MCD)</text>
            <text x="68" y="15" className="text-[3px] font-black fill-slate-400 uppercase tracking-widest pointer-events-none">East Zone (MCD)</text>
            <text x="36" y="46" className="text-[3.5px] font-black fill-emerald-600 uppercase tracking-widest pointer-events-none">NDMC Central District</text>
            <text x="40" y="85" className="text-[3px] font-black fill-amber-600 uppercase tracking-widest pointer-events-none">Central Zone (MCD)</text>

            {/* Interactive Pulse Hotspot Beacons */}
            {grievances.map((g) => {
              const { x, y } = mapCoordinatesToSVG(g.latitude, g.longitude);
              const isSelected = selectedGrievance?.id === g.id;
              
              // Color base matching urgency
              const color = g.urgency === "High" ? "#ef4444" : g.urgency === "Medium" ? "#f97316" : "#3b82f6";
              const dotColorClass = g.urgency === "High" ? "fill-red-500" : g.urgency === "Medium" ? "fill-orange-500" : "fill-blue-500";
              const isResolved = g.status === "Resolved";

              if (isResolved) return null; // Only plot open reports hotspots

              return (
                <g
                  key={g.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectGrievance(g);
                  }}
                  className="cursor-pointer group transition-all"
                >
                  {/* Outer pulsing ping loop */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 4.5 : 3.0}
                    fill={color}
                    fillOpacity="0.25"
                    className="animate-ping"
                    style={{ animationDuration: g.urgency === "High" ? "1.2s" : "2.5s" }}
                  />
                  
                  {/* Central Core Spot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 2.5 : 1.8}
                    fill={color}
                    className="stroke-white stroke-[0.4] filter drop-shadow-sm transition-all group-hover:scale-125"
                  />

                  {/* Tiny text identifier tag */}
                  <text
                    x={x}
                    y={y - 3.5}
                    textAnchor="middle"
                    className="text-[2.5px] font-black fill-slate-800 bg-white"
                  >
                    {g.department === "Water Logging" ? "💧" : g.department === "Potholes" ? "🕳️" : "🗑️"}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map info overlay detailing status */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white border border-slate-800 text-[10px] p-2.5 rounded-lg space-y-1 backdrop-blur-sm">
            <div className="font-bold flex items-center gap-1.5 uppercase text-[9px] text-blue-400 tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Map Key</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>🔴 High Priority Issue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>🟠 Medium Issue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>🔵 Low Priority</span>
            </div>
          </div>

          <div className="absolute top-3 right-3 bg-white/90 border border-slate-200 text-[9px] font-bold text-slate-500 px-2 py-1 rounded shadow-sm">
            Total Hotspots: {grievances.filter(g => g.status === "Open").length} open
          </div>
        </div>

        {/* Dynamic Horizontal Quick Slider linking mapped data */}
        <div className="mt-4 border-t border-slate-200/60 pt-3 flex gap-2 overflow-x-auto pb-1 max-w-full">
          <div className="flex-shrink-0 text-slate-400 font-bold text-[9px] uppercase tracking-wider flex items-center px-2.5 border-r border-slate-200">
            Grid Feed
          </div>
          {grievances.map((g) => {
            const isSelected = selectedGrievance?.id === g.id;
            const icon = g.department === "Water Logging" ? "💧" : g.department === "Potholes" ? "🕳️" : "🗑️";
            return (
              <div
                key={g.id}
                onClick={() => onSelectGrievance(g)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg cursor-pointer transition-all border text-[10px] ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white font-bold"
                    : g.status === "Resolved"
                    ? "bg-slate-100 border-slate-200 text-slate-400"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>{icon}</span>
                  <span className="truncate max-w-[85px]">{g.cleanLocation}</span>
                </div>
              </div>
            );
          })}
          {grievances.length === 0 && (
            <div className="text-slate-400 text-[10px] m-auto py-1">No reports match sector criteria.</div>
          )}
        </div>

      </div>
    </div>
  );
}
