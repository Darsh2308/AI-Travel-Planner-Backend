const BOOKING_REQUIRED_KEYWORDS = [
  'eiffel tower',
  'louvre',
  'disneyland',
  'museum',
  'palace',
  'tower',
  'cruise',
  'show',
  'ticket',
];

export const classifyActivityBookingRequirement = (activityTitle: string): boolean => {
  const normalized = activityTitle.toLowerCase();
  return BOOKING_REQUIRED_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const generateActivityBookingLinks = (
  activityTitle: string,
  city?: string,
) => {
  if (!classifyActivityBookingRequirement(activityTitle)) {
    return [];
  }

  const query = encodeURIComponent([activityTitle, city].filter(Boolean).join(' '));

  return [
    {
      providerName: 'Official/Search',
      providerType: 'official_ticket_search',
      bookingUrl: `https://www.google.com/search?q=${query}+official+tickets`,
      priceEstimate: 0,
      currency: 'USD',
      availabilityStatus: 'search_required',
    },
    {
      providerName: 'GetYourGuide',
      providerType: 'activity_booking',
      bookingUrl: `https://www.getyourguide.com/s/?q=${query}`,
      priceEstimate: 0,
      currency: 'USD',
      availabilityStatus: 'search_required',
    },
    {
      providerName: 'Viator',
      providerType: 'activity_booking',
      bookingUrl: `https://www.viator.com/searchResults/all?text=${query}`,
      priceEstimate: 0,
      currency: 'USD',
      availabilityStatus: 'search_required',
    },
  ];
};
