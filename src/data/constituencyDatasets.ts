export interface SectorDemographics {
  populationDensity: number; // people per sq km
  literacyRate: number; // percentage
  averageIncome: string;
  demographicSplit: string;
  voterCount: string;
  schoolGoingYouthPct: number;
}

export interface SectorInfrastructureGaps {
  drainageSiltationIndex: number; // percentage of drain clogged
  roadWearScore: string; // descriptive or numeric
  streetlightingDeficit: number; // percentage lacking adequate lighting
  solidWasteBacklog: string; // daily backlog volume
  publicParksRatio: string; // parks per sq km
}

export interface SectorDevelopmentPlans {
  masterPlanGoal: string;
  earmarkedBudget: string;
  primaryAuthorityProject: string;
  zoningConstraint: string;
}

export interface SectorPublicDatasets {
  censusTransitDistressIndex: number; // 0-100 score of commute difficulty
  udiseSchoolPupilRatio: string;
  pwdWaterloggingAlertsCount: number;
  swachhBharatSanitationRank: number; // Lower is better
}

export interface SectorDatasetProfile {
  sectorId: string;
  sectorName: string;
  demographics: SectorDemographics;
  infrastructureGaps: SectorInfrastructureGaps;
  developmentPlans: SectorDevelopmentPlans;
  publicDatasets: SectorPublicDatasets;
}

export const SECTOR_DATASETS: Record<string, SectorDatasetProfile> = {
  "Central Zone": {
    sectorId: "Central Zone",
    sectorName: "Central Zone Sector",
    demographics: {
      populationDensity: 24500,
      literacyRate: 88.2,
      averageIncome: "₹3.2 Lakhs/annum",
      demographicSplit: "Densely packed high-volume transit corridors, major commercial markets (Lajpat Nagar/Okhla), mixed low-income colonies and dense public-sector staff quarters.",
      voterCount: "4.8 Lakhs",
      schoolGoingYouthPct: 22.4
    },
    infrastructureGaps: {
      drainageSiltationIndex: 72,
      roadWearScore: "7.8/10 (Severe deformation on service roads)",
      streetlightingDeficit: 28,
      solidWasteBacklog: "14.5 Tons/day outstanding",
      publicParksRatio: "0.4 per sq.km (Extremely sparse)"
    },
    developmentPlans: {
      masterPlanGoal: "Delhi Master Plan 2041: Redevelopment of commercial zones with pedestrian-friendly pathways and storm-drain separation lines.",
      earmarkedBudget: "₹18.4 Crore (FY26-27)",
      primaryAuthorityProject: "MCD Core Commercial Drainage De-clogging and Solar Streetlight Canopy grid installation.",
      zoningConstraint: "Mixed-use commercial and residential. Heavy restrictions on overhead wiring and new landfill sites."
    },
    publicDatasets: {
      censusTransitDistressIndex: 78,
      udiseSchoolPupilRatio: "42:1 (Overcrowded classes)",
      pwdWaterloggingAlertsCount: 18,
      swachhBharatSanitationRank: 164
    }
  },
  "West Zone": {
    sectorId: "West Zone",
    sectorName: "West Zone Sector",
    demographics: {
      populationDensity: 19800,
      literacyRate: 84.5,
      averageIncome: "₹2.6 Lakhs/annum",
      demographicSplit: "Residential suburb sprawl, school districts (Dwarka/Janakpuri), high volume of school-going youth, large population of retirees and commuter workers.",
      voterCount: "5.2 Lakhs",
      schoolGoingYouthPct: 29.8
    },
    infrastructureGaps: {
      drainageSiltationIndex: 48,
      roadWearScore: "5.2/10 (Moderate asphalt potholes in interior sectors)",
      streetlightingDeficit: 42,
      solidWasteBacklog: "9.2 Tons/day outstanding",
      publicParksRatio: "1.2 per sq.km (Moderate community parks)"
    },
    developmentPlans: {
      masterPlanGoal: "Delhi Master Plan 2041: Suburban school-district transit safety corridor, creation of decentralized bio-methanation compost grids.",
      earmarkedBudget: "₹14.2 Crore (FY26-27)",
      primaryAuthorityProject: "PWD West Delhi Pothole Remediation Campaign and High School Transit Pedestrian safety program.",
      zoningConstraint: "Primarily residential. Strict school-zone buffer speed regulations and zoning limits on heavy commercial trucks."
    },
    publicDatasets: {
      censusTransitDistressIndex: 64,
      udiseSchoolPupilRatio: "35:1 (Moderate class sizes)",
      pwdWaterloggingAlertsCount: 8,
      swachhBharatSanitationRank: 112
    }
  },
  "East Zone": {
    sectorId: "East Zone",
    sectorName: "East Zone Sector",
    demographics: {
      populationDensity: 28200,
      literacyRate: 81.1,
      averageIncome: "₹2.1 Lakhs/annum",
      demographicSplit: "Dense low-and-mid-income residential pockets (Mayur Vihar/Patparganj), high density of home-based small enterprises, significant daily-wage commuter pool.",
      voterCount: "6.1 Lakhs",
      schoolGoingYouthPct: 26.5
    },
    infrastructureGaps: {
      drainageSiltationIndex: 84,
      roadWearScore: "8.4/10 (Critical asphalt degradation and unpaved service segments)",
      streetlightingDeficit: 35,
      solidWasteBacklog: "22.0 Tons/day outstanding (Primary landfill overflow risk)",
      publicParksRatio: "0.2 per sq.km (Severe deficit)"
    },
    developmentPlans: {
      masterPlanGoal: "Delhi Master Plan 2041: High-density sanitation upgrades, storm sewer capacity expansion, retrofitting of public schools.",
      earmarkedBudget: "₹22.5 Crore (FY26-27)",
      primaryAuthorityProject: "MCD East Delhi Drainage Masterplan and Co-Ed School Modernization initiatives.",
      zoningConstraint: "Industrial borders and high-density residential. Minimal vacant public land available for new park assets."
    },
    publicDatasets: {
      censusTransitDistressIndex: 86,
      udiseSchoolPupilRatio: "45:1 (Severe teacher-pupil deficit)",
      pwdWaterloggingAlertsCount: 26,
      swachhBharatSanitationRank: 245
    }
  },
  "NDMC Area": {
    sectorId: "NDMC Area",
    sectorName: "NDMC Sector",
    demographics: {
      populationDensity: 9400,
      literacyRate: 94.8,
      averageIncome: "₹5.8 Lakhs/annum",
      demographicSplit: "Institutional, diplomatic enclave and high-density central office networks (Connaught Place/Chanakyapuri), highly organized service workforce.",
      voterCount: "1.5 Lakhs",
      schoolGoingYouthPct: 15.2
    },
    infrastructureGaps: {
      drainageSiltationIndex: 25,
      roadWearScore: "2.1/10 (Excellent roads with isolated junction defects)",
      streetlightingDeficit: 8,
      solidWasteBacklog: "1.8 Tons/day outstanding",
      publicParksRatio: "3.8 per sq.km (Lush, well-developed green cover)"
    },
    developmentPlans: {
      masterPlanGoal: "NDMC Smart City Guidelines: 100% smart-sensor grid lighting, green building envelopes, and underground utility conduits.",
      earmarkedBudget: "₹35.0 Crore (FY26-27)",
      primaryAuthorityProject: "NDMC Smart Solar Light Grids and Centralized Automated Waste Segregation Centers.",
      zoningConstraint: "Strict heritage conservation codes. Severe restrictions on building height, commercial banners, and tree cutting."
    },
    publicDatasets: {
      censusTransitDistressIndex: 32,
      udiseSchoolPupilRatio: "24:1 (Highly balanced classes)",
      pwdWaterloggingAlertsCount: 3,
      swachhBharatSanitationRank: 12
    }
  }
};
