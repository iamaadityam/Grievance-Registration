export interface Grievance {
  id?: string;
  name: string;
  contact: string;
  description: string;
  department: Department;
  urgency: Urgency;
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

  // Accessibility & Verification fields
  sentiment?: "Frustrated" | "Neutral" | "Angry";
  recurringNeed?: string;
  otpVerified?: boolean;
}

export type Department = "Garbage Report" | "Water Logging" | "Potholes" | "Street Lights" | "Sewage Overflow" | "Electricity & Power" | "Public Safety" | "Other Civic Issue" | string;
export type Urgency = "Low" | "Medium" | "High";

