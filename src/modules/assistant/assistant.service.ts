import { verifyOwnership } from '../../services/trip.service';
import { generateConflictReport } from '../../services/conflict-detector.service';
import { optimizeTrip } from '../../services/optimization-engine.service';
import { generateAlternatives } from '../../services/recommendation-engine.service';
import { scoreItinerary } from '../../services/itinerary-scoring.service';
import type {
  CheckConflictsDto,
  OptimizeTripDto,
  RecommendAlternativesDto,
} from './assistant.dto';

export const checkConflicts = async (ownerId: string, dto: CheckConflictsDto) => {
  const trip = await verifyOwnership(ownerId, dto.tripId);
  const conflicts = generateConflictReport(trip);

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
  };
};

export const optimize = async (ownerId: string, dto: OptimizeTripDto) => {
  const trip = await verifyOwnership(ownerId, dto.tripId);

  return {
    optimizationGoal: dto.optimizationGoal,
    suggestions: optimizeTrip(trip, dto.optimizationGoal),
    score: scoreItinerary(trip),
  };
};

export const recommendAlternatives = async (
  ownerId: string,
  dto: RecommendAlternativesDto,
) => {
  const trip = await verifyOwnership(ownerId, dto.tripId);

  return {
    affectedDay: dto.affectedDay,
    reason: dto.reason,
    alternatives: generateAlternatives(trip, dto.affectedDay, dto.reason),
  };
};

export const getScore = async (ownerId: string, tripId: string) => {
  const trip = await verifyOwnership(ownerId, tripId);
  return scoreItinerary(trip);
};
