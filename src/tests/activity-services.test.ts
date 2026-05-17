import {
  classifyActivityBookingRequirement,
  generateActivityBookingLinks,
} from '../services/activity-booking.service';
import { enrichActivityMetadata } from '../services/activity-provider.service';

describe('activity support services', () => {
  it('classifies bookable attractions', () => {
    expect(classifyActivityBookingRequirement('Eiffel Tower summit')).toBe(true);
    expect(classifyActivityBookingRequirement('Louvre Museum')).toBe(true);
  });

  it('classifies non-bookable activities', () => {
    expect(classifyActivityBookingRequirement('Walk through public park')).toBe(false);
    expect(generateActivityBookingLinks('Walk through public park')).toEqual([]);
  });

  it('generates booking links for bookable attractions', () => {
    const links = generateActivityBookingLinks('Louvre Museum', 'Paris');

    expect(links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ providerName: 'GetYourGuide' }),
        expect.objectContaining({ providerName: 'Viator' }),
      ]),
    );
  });

  it('returns metadata for valid attractions and null for invalid names', async () => {
    await expect(enrichActivityMetadata('Louvre Museum', 'Paris')).resolves.toEqual(
      expect.objectContaining({
        rating: expect.any(Number),
        reviewCount: expect.any(Number),
      }),
    );
    await expect(enrichActivityMetadata('', 'Paris')).resolves.toBeNull();
  });
});
