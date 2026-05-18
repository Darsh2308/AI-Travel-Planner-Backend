import { TripModel } from '../../database/models/trip.model';

interface MonthlySpending {
  month: string;  // e.g. "2025-01"
  label: string;  // e.g. "Jan"
  spent: number;
  budget: number;
}

interface SpendingCategory {
  name: string;
  value: number;
}

interface TravelFrequency {
  month: string;
  label: string;
  trips: number;
}

export interface AnalyticsSummary {
  totalTrips: number;
  totalSpent: number;
  avgPerTrip: number;
  uniqueCountries: number;
  monthlySpending: MonthlySpending[];
  spendingByCategory: SpendingCategory[];
  travelFrequency: TravelFrequency[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildRollingMonths(count: number): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1) + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { key, label: MONTH_LABELS[d.getMonth()] };
  });
}

export const getAnalytics = async (ownerId: string): Promise<AnalyticsSummary> => {
  const trips = await TripModel.find({ owner: ownerId }).lean();

  const totalTrips = trips.length;
  const totalSpent = trips.reduce((sum, t) => sum + (t.estimatedCost?.total ?? 0), 0);
  const avgPerTrip = totalTrips > 0 ? Math.round(totalSpent / totalTrips) : 0;

  const countries = new Set(trips.map((t) => t.destinationCountry).filter(Boolean));
  const uniqueCountries = countries.size;

  // Rolling 6-month buckets
  const months = buildRollingMonths(6);
  const monthlyMap = new Map<string, { spent: number; budget: number }>(
    months.map(({ key }) => [key, { spent: 0, budget: 0 }]),
  );

  for (const trip of trips) {
    const date = trip.createdAt as Date;
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap.has(key)) {
      const entry = monthlyMap.get(key)!;
      entry.spent += trip.estimatedCost?.total ?? 0;
      entry.budget += trip.allocatedBudgetAmount ?? 0;
    }
  }

  const monthlySpending: MonthlySpending[] = months.map(({ key, label }) => {
    const entry = monthlyMap.get(key) ?? { spent: 0, budget: 0 };
    return { month: key, label, spent: Math.round(entry.spent), budget: Math.round(entry.budget) };
  });

  // Spending by category — aggregate estimatedCost fields across all trips
  const categoryTotals = {
    Accommodation: 0,
    Activities: 0,
    Dining: 0,
    Transport: 0,
    Shopping: 0,
  };
  for (const trip of trips) {
    const c = trip.estimatedCost;
    if (!c) continue;
    categoryTotals.Accommodation += c.accommodation ?? 0;
    categoryTotals.Activities += c.activities ?? 0;
    categoryTotals.Dining += c.food ?? 0;
    categoryTotals.Transport += (c.flights ?? 0) + (c.localTransport ?? 0);
    categoryTotals.Shopping += c.contingency ?? 0;
  }
  const spendingByCategory: SpendingCategory[] = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter((d) => d.value > 0);

  // Travel frequency — rolling 6 months
  const freqMap = new Map<string, number>(months.map(({ key }) => [key, 0]));
  for (const trip of trips) {
    const date = trip.createdAt as Date;
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (freqMap.has(key)) freqMap.set(key, freqMap.get(key)! + 1);
  }
  const travelFrequency: TravelFrequency[] = months.map(({ key, label }) => ({
    month: key,
    label,
    trips: freqMap.get(key) ?? 0,
  }));

  return {
    totalTrips,
    totalSpent: Math.round(totalSpent),
    avgPerTrip,
    uniqueCountries,
    monthlySpending,
    spendingByCategory,
    travelFrequency,
  };
};
