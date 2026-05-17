export const ACTIVITY_CATEGORIES = [
  'sightseeing',
  'museum',
  'food',
  'outdoor',
  'shopping',
  'transport',
  'entertainment',
  'wellness',
  'other',
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];
