export type ActivityMetadata = {
  rating: number;
  reviewCount: number;
  category: string;
  locationName: string;
};

export const enrichActivityMetadata = async (
  title: string,
  city?: string,
): Promise<ActivityMetadata | null> => {
  if (!title.trim()) {
    return null;
  }

  const seed = [...title].reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    rating: Number((3.7 + (seed % 13) / 10).toFixed(1)),
    reviewCount: 50 + title.length * 11,
    category: title.toLowerCase().includes('museum') ? 'museum' : 'attraction',
    locationName: city ? `${title}, ${city}` : title,
  };
};
