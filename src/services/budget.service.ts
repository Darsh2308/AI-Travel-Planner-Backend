import { UserModel } from '../database/models/user.model';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';
import type {
  BudgetAllocationDto,
  UpdateBudgetDto,
} from '../modules/budget/dto/updateBudget.dto';

export type BudgetLedgerEntry = {
  type: 'allocation' | 'release' | 'update';
  amount: number;
  description: string;
  createdAt: string;
};

export type BudgetLedger = {
  currency: string;
  totalBudget: number;
  allocatedBudget: number;
  spentBudget: number;
  remainingBudget: number;
  entries: BudgetLedgerEntry[];
};

const defaultLedger: BudgetLedger = {
  currency: 'USD',
  totalBudget: 0,
  allocatedBudget: 0,
  spentBudget: 0,
  remainingBudget: 0,
  entries: [],
};

export const normalizeLedger = (ledger: unknown): BudgetLedger => {
  if (!ledger || typeof ledger !== 'object') {
    return { ...defaultLedger, entries: [] };
  }

  const source = ledger as Partial<BudgetLedger>;
  const totalBudget = Number(source.totalBudget ?? 0);
  const allocatedBudget = Number(source.allocatedBudget ?? 0);
  const spentBudget = Number(source.spentBudget ?? 0);

  return recalculateRemaining({
    currency: typeof source.currency === 'string' ? source.currency : 'USD',
    totalBudget: Number.isFinite(totalBudget) && totalBudget >= 0 ? totalBudget : 0,
    allocatedBudget:
      Number.isFinite(allocatedBudget) && allocatedBudget >= 0
        ? allocatedBudget
        : 0,
    spentBudget: Number.isFinite(spentBudget) && spentBudget >= 0 ? spentBudget : 0,
    remainingBudget: 0,
    entries: Array.isArray(source.entries) ? source.entries : [],
  });
};

export const recalculateRemaining = (ledger: BudgetLedger): BudgetLedger => {
  const remainingBudget = ledger.totalBudget - ledger.allocatedBudget - ledger.spentBudget;

  if (remainingBudget < 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Allocated and spent budget cannot exceed total budget',
    );
  }

  return {
    ...ledger,
    remainingBudget,
  };
};

export const canAllocate = (ledger: BudgetLedger, amount: number): boolean => {
  return amount >= 0 && ledger.remainingBudget >= amount;
};

export const updateBudget = (
  ledger: BudgetLedger,
  dto: UpdateBudgetDto,
): BudgetLedger => {
  const updatedLedger = recalculateRemaining({
    ...ledger,
    currency: dto.currency.toUpperCase(),
    totalBudget: dto.total,
    entries: [
      ...ledger.entries,
      {
        type: 'update',
        amount: dto.total,
        description: `Budget updated to ${dto.currency.toUpperCase()} ${dto.total}`,
        createdAt: new Date().toISOString(),
      },
    ],
  });

  return updatedLedger;
};

export const allocateBudget = (
  ledger: BudgetLedger,
  dto: BudgetAllocationDto,
): BudgetLedger => {
  if (!canAllocate(ledger, dto.amount)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Insufficient remaining budget for allocation',
    );
  }

  return recalculateRemaining({
    ...ledger,
    allocatedBudget: ledger.allocatedBudget + dto.amount,
    entries: [
      ...ledger.entries,
      {
        type: 'allocation',
        amount: dto.amount,
        description: dto.description,
        createdAt: new Date().toISOString(),
      },
    ],
  });
};

export const releaseBudget = (
  ledger: BudgetLedger,
  dto: BudgetAllocationDto,
): BudgetLedger => {
  if (dto.amount > ledger.allocatedBudget) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Release amount cannot exceed allocated budget',
    );
  }

  return recalculateRemaining({
    ...ledger,
    allocatedBudget: ledger.allocatedBudget - dto.amount,
    entries: [
      ...ledger.entries,
      {
        type: 'release',
        amount: dto.amount,
        description: dto.description,
        createdAt: new Date().toISOString(),
      },
    ],
  });
};

const getUserLedger = async (userId: string): Promise<BudgetLedger> => {
  const user = await UserModel.findOne({
    _id: userId,
    isActive: true,
  });

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  return normalizeLedger(user.budgetLedger);
};

const saveUserLedger = async (
  userId: string,
  budgetLedger: BudgetLedger,
): Promise<BudgetLedger> => {
  const user = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      isActive: true,
    },
    {
      $set: {
        budgetLedger,
      },
    },
    {
      new: true,
    },
  );

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  return normalizeLedger(user.budgetLedger);
};

export const getBudget = async (userId: string): Promise<BudgetLedger> => {
  return getUserLedger(userId);
};

export const updateUserBudget = async (
  userId: string,
  dto: UpdateBudgetDto,
): Promise<BudgetLedger> => {
  const ledger = await getUserLedger(userId);
  return saveUserLedger(userId, updateBudget(ledger, dto));
};

export const allocateUserBudget = async (
  userId: string,
  dto: BudgetAllocationDto,
): Promise<BudgetLedger> => {
  const ledger = await getUserLedger(userId);
  return saveUserLedger(userId, allocateBudget(ledger, dto));
};

export const releaseUserBudget = async (
  userId: string,
  dto: BudgetAllocationDto,
): Promise<BudgetLedger> => {
  const ledger = await getUserLedger(userId);
  return saveUserLedger(userId, releaseBudget(ledger, dto));
};
