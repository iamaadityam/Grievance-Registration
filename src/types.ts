export interface Grievance {
  id?: string;
  name: string;
  contact: string;
  description: string;
  department: "Garbage Report" | "Water Logging" | "Potholes";
  urgency: "Low" | "Medium" | "High";
  cleanLocation: string;
  summary: string;
  latitude: number;
  longitude: number;
  status: "Open" | "Resolved" | "Reopened";
  createdAt: any; // Firestore Timestamp or Date ISO string
  imageUrl?: string; // Optional captured or uploaded image
  sector?: string; // Sector subdivision (e.g. "East Zone", "West Zone", "Central Zone", "NDMC Area")
  assignedBody?: string; // Tagger (e.g. "MCD" or "NDMC")
  
  // New rich AI metadata fields corresponding to the new JSON output
  category?: string;
  severity?: string;
  urgencyScore?: number;
  affected_people?: string;
  suggested_department?: string;
  confidence?: number;
  keywords?: string[];
  detectedLanguage?: string;

  // Duplicate prevention / Traffic consolidation fields
  trafficCount?: number;
  reportersList?: Array<{
    name: string;
    contact: string;
    reportedAt: string;
    description: string;
  }>;
  isSuggestion?: boolean;
  isOfflineOnly?: boolean;
  isAnalyzed?: boolean;
  guardrailRelevanceScore?: number;
  guardrailFlaggedReason?: string;
  guardrailResolvedCategory?: string;
  guardrailExecutiveSummary?: string;
}

export type Department = "Garbage Report" | "Water Logging" | "Potholes";
export type Urgency = "Low" | "Medium" | "High";
