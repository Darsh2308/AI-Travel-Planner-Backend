export type BookingLinkInput = {
  name: string;
  city?: string;
  country?: string;
  checkIn?: Date;
  checkOut?: Date;
};

const searchUrl = (baseUrl: string, query: string): string => {
  return `${baseUrl}${encodeURIComponent(query)}`;
};

export const generateHotelBookingLinks = (input: BookingLinkInput) => {
  const query = [input.name, input.city, input.country].filter(Boolean).join(' ');

  return [
    {
      providerName: 'Booking.com',
      providerType: 'hotel_booking',
      bookingUrl: searchUrl('https://www.booking.com/searchresults.html?ss=', query),
      priceEstimate: 0,
      currency: 'USD',
      availabilityStatus: 'search_required',
    },
    {
      providerName: 'Expedia',
      providerType: 'hotel_booking',
      bookingUrl: searchUrl('https://www.expedia.com/Hotel-Search?destination=', query),
      priceEstimate: 0,
      currency: 'USD',
      availabilityStatus: 'search_required',
    },
  ];
};
