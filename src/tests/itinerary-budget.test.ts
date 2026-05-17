import {
  calculateAddedCostDelta,
  calculateRemovedCostDelta,
  calculateUpdatedCostDelta,
} from '../services/itinerary-budget.service';

describe('itinerary budget service', () => {
  it('calculates add, remove, and update deltas', () => {
    expect(calculateAddedCostDelta(50)).toBe(50);
    expect(calculateRemovedCostDelta(40)).toBe(40);
    expect(calculateUpdatedCostDelta(100, 180)).toBe(80);
    expect(calculateUpdatedCostDelta(180, 100)).toBe(-80);
  });
});
