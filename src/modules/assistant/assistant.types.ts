export type AssistantConflict = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  dayNumber?: number;
};

export type ItineraryScore = {
  score: number;
  dimensions: {
    budgetEfficiency: number;
    weatherSuitability: number;
    scheduleRealism: number;
    travelConvenience: number;
    activityBalance: number;
    preferenceAlignment: number;
  };
  weakAreas: string[];
};
