import {
  allocateBudget,
  canAllocate,
  releaseBudget,
  type BudgetLedger,
  updateBudget,
} from '../services/budget.service';

const baseLedger = (): BudgetLedger => ({
  currency: 'USD',
  totalBudget: 1000,
  allocatedBudget: 400,
  spentBudget: 0,
  remainingBudget: 600,
  entries: [],
});

describe('budget service', () => {
  it('increases budget and recalculates remaining', () => {
    const ledger = updateBudget(baseLedger(), {
      currency: 'USD',
      total: 1200,
    });

    expect(ledger.totalBudget).toBe(1200);
    expect(ledger.allocatedBudget).toBe(400);
    expect(ledger.remainingBudget).toBe(800);
  });

  it('decreases budget and recalculates remaining', () => {
    const ledger = updateBudget(baseLedger(), {
      currency: 'USD',
      total: 700,
    });

    expect(ledger.totalBudget).toBe(700);
    expect(ledger.remainingBudget).toBe(300);
  });

  it('rejects budget decreases below allocated amount', () => {
    expect(() =>
      updateBudget(baseLedger(), {
        currency: 'USD',
        total: 300,
      }),
    ).toThrow('Allocated and spent budget cannot exceed total budget');
  });

  it('rejects allocation above remaining budget', () => {
    expect(canAllocate(baseLedger(), 700)).toBe(false);
    expect(() =>
      allocateBudget(baseLedger(), {
        amount: 700,
        description: 'Hotel hold',
      }),
    ).toThrow('Insufficient remaining budget for allocation');
  });

  it('allocates and releases budget', () => {
    const allocated = allocateBudget(baseLedger(), {
      amount: 100,
      description: 'Flight booking',
    });

    expect(allocated.allocatedBudget).toBe(500);
    expect(allocated.remainingBudget).toBe(500);
    expect(allocated.entries.at(-1)?.type).toBe('allocation');

    const released = releaseBudget(allocated, {
      amount: 150,
      description: 'Flight refund',
    });

    expect(released.allocatedBudget).toBe(350);
    expect(released.remainingBudget).toBe(650);
    expect(released.entries.at(-1)?.type).toBe('release');
  });

  it('rejects release above allocated budget', () => {
    expect(() =>
      releaseBudget(baseLedger(), {
        amount: 500,
        description: 'Over release',
      }),
    ).toThrow('Release amount cannot exceed allocated budget');
  });
});
