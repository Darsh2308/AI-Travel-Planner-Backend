import { generateHotelBookingLinks } from '../services/booking-link.service';
import { searchHotelMetadata } from '../services/hotel-provider.service';

describe('hotel support services', () => {
  it('generates deterministic hotel booking search links', () => {
    const links = generateHotelBookingLinks({
      name: 'Hotel Lumiere',
      city: 'Paris',
      country: 'France',
    });

    expect(links).toHaveLength(2);
    expect(links[0].bookingUrl).toContain('booking.com');
    expect(links[1].bookingUrl).toContain('expedia.com');
  });

  it('returns metadata for valid hotel name', async () => {
    const metadata = await searchHotelMetadata('Hotel Lumiere', 'Paris', 'France');

    expect(metadata?.rating).toBeGreaterThan(0);
    expect(metadata?.reviewCount).toBeGreaterThan(0);
    expect(metadata?.amenities).toContain('WiFi');
  });

  it('returns null for invalid hotel name', async () => {
    await expect(searchHotelMetadata('', 'Paris')).resolves.toBeNull();
  });
});
