import { updateBudgetDto } from '../modules/budget/dto/updateBudget.dto';

describe('budget DTOs', () => {
  it('rejects negative budget values', () => {
    expect(() =>
      updateBudgetDto.parse({
        currency: 'USD',
        total: -1,
      }),
    ).toThrow();
  });

  it('requires a currency', () => {
    expect(() =>
      updateBudgetDto.parse({
        total: 100,
      }),
    ).toThrow();
  });
});
