import { getCoordinates } from '../services/weather-provider.service';

describe('weather provider service', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws for invalid city geocoding result', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    } as never);

    await expect(getCoordinates('Invalid City')).rejects.toThrow(
      'Unable to geocode destination city',
    );
  });

  it('surfaces provider timeout/failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('timeout'));

    await expect(getCoordinates('Paris')).rejects.toThrow('timeout');
  });
});
