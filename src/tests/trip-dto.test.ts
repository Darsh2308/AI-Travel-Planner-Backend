import { createTripDto } from '../modules/trips/dto/createTrip.dto';

describe('trip DTOs', () => {
  it('rejects missing destination', () => {
    expect(() =>
      createTripDto.parse({
        totalDays: 3,
        budgetTier: 'standard',
      }),
    ).toThrow();
  });

  it('rejects non-positive days', () => {
    expect(() =>
      createTripDto.parse({
        destinationCity: 'Goa',
        totalDays: 0,
        budgetTier: 'standard',
      }),
    ).toThrow();
  });

  it('rejects invalid budget tier', () => {
    expect(() =>
      createTripDto.parse({
        destinationCity: 'Goa',
        totalDays: 3,
        budgetTier: 'ultra',
      }),
    ).toThrow();
  });
});
