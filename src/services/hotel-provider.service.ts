export type HotelMetadata = {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  nightlyRateEstimate: number;
  currency: string;
  officialWebsite?: string;
};

const deterministicRating = (name: string): number => {
  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Number((3.8 + (seed % 12) / 10).toFixed(1));
};

export const searchHotelMetadata = async (
  name: string,
  city: string,
  country?: string,
): Promise<HotelMetadata | null> => {
  if (!name.trim()) {
    return null;
  }

  return {
    name,
    address: [city, country].filter(Boolean).join(', '),
    rating: Math.min(deterministicRating(name), 5),
    reviewCount: 100 + name.length * 17,
    amenities: ['WiFi', 'Breakfast', 'Front desk'],
    nightlyRateEstimate: 120 + name.length * 8,
    currency: 'USD',
  };
};
