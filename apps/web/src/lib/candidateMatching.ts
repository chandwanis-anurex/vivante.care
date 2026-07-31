import type {
  AssignRequest,
  CandidateReadiness,
  DayOfWeek,
  Requirement,
  RequirementSchedule,
  ScheduleRule,
  ShiftPeriod,
  ShiftRequest,
  WorkforceAnalysis,
} from '@/types';
import type { VaultEntry } from '@/lib/mockData';
import { expandOccurrences, isCoveredByRules } from '@/lib/matching';
import {
  estimateMarketRate,
  estimateFillProbability,
  getHistoricalAvgFillHours,
  getSearchRadiusSuggestion,
} from '@/lib/workforceRequestForecast';

/**
 * Module4 Step 2 — VivanteIQ Workforce Analysis. Reuses the same
 * heuristic-but-input-driven forecast Module3 already built rather than
 * a second parallel formula; expectedQualifiedCandidates is a real vault
 * count, not inflated.
 */
export function computeWorkforceAnalysis(
  requirement: Pick<Requirement, 'specialty' | 'assignmentType' | 'budget' | 'schedule' | 'orgName'>,
  vault: VaultEntry[],
  shiftRequests: ShiftRequest[],
  assignRequests: AssignRequest[]
): WorkforceAnalysis {
  const budget = requirement.budget ?? { maxBillRate: 0, estimatedHours: 0, priority: 'Medium' as const };
  const assignmentType = requirement.assignmentType ?? 'Per Diem';
  const marketRate = estimateMarketRate(requirement.specialty, assignmentType, budget.priority);
  const historicalAvg = getHistoricalAvgFillHours(
    shiftRequests,
    assignRequests,
    requirement.orgName,
    requirement.specialty
  );
  const scheduleFlags = requirement.schedule
    ? {
        weekendRequired: requirement.schedule.weekendRequired,
        holidayRequired: requirement.schedule.holidayRequired,
        overtimeAllowed: requirement.schedule.overtimeAllowed,
      }
    : { weekendRequired: false, holidayRequired: false, overtimeAllowed: false };
  const fillEstimate = estimateFillProbability(budget, marketRate, scheduleFlags, historicalAvg);

  const expectedQualifiedCandidates = vault.filter(
    (v) => v.specialty.trim().toLowerCase() === requirement.specialty.trim().toLowerCase()
  ).length;
  const marketAvailability: WorkforceAnalysis['marketAvailability'] =
    expectedQualifiedCandidates >= 3 ? 'High' : expectedQualifiedCandidates >= 1 ? 'Medium' : 'Low';

  return {
    estimatedFillHours: fillEstimate.expectedFillHours,
    marketAvailability,
    expectedQualifiedCandidates,
    recommendedSearchRadiusMiles: getSearchRadiusSuggestion(requirement.specialty),
    successProbabilityPct: fillEstimate.fillProbabilityPct,
  };
}

// RequirementSchedule (Module3) describes a shift *period* (Day/Evening/
// Night) + weekend/holiday flags rather than lib/matching.ts's explicit
// daysOfWeek/HH:mm shape (ScheduleRule/ShiftRequest) — this adapts one to
// the other so the same occurrence-expansion/coverage logic applies to
// both. Windows are approximate, real enough for a coverage heuristic.
const SHIFT_TIME_WINDOWS: Record<ShiftPeriod, [string, string]> = {
  Day: ['07:00', '19:00'],
  Evening: ['15:00', '23:00'],
  Night: ['19:00', '07:00'],
};

export function scheduleToOccurrenceSpec(schedule: RequirementSchedule) {
  const [startTime, endTime] = SHIFT_TIME_WINDOWS[schedule.shift];
  const daysOfWeek: DayOfWeek[] | null = schedule.weekendRequired ? null : [1, 2, 3, 4, 5];
  return { startDate: schedule.startDate, endDate: schedule.endDate, daysOfWeek, startTime, endTime };
}

export interface MatchScoreResult {
  score: number;
  whyReasons: string[];
}

/**
 * Every point and every reason traces to real data — specialty match,
 * actual certifications on the passport, real availability overlap
 * (reuses lib/matching.ts's occurrence/coverage logic), real prior-
 * placement history, and passport completeness as a "verified" proxy.
 * Deliberately no distance and no fabricated performance-history claim —
 * nothing in this data model backs either one, unlike everything else
 * here which at least has a real input to point to.
 */
export function computeMatchScore(
  candidate: VaultEntry,
  requirement: Requirement,
  candidateRules: ScheduleRule[],
  allRequirements: Requirement[]
): MatchScoreResult {
  const reasons: string[] = [];
  let score = 0;

  const specialtyMatch = candidate.specialty.trim().toLowerCase() === requirement.specialty.trim().toLowerCase();
  if (specialtyMatch) {
    score += 40;
    reasons.push(`${requirement.specialty} specialty match`);
  }

  if (candidate.yearsExperience && candidate.yearsExperience !== 'Unspecified') {
    score += 10;
    reasons.push(`${candidate.yearsExperience} experience`);
  }

  const requiredCerts = requirement.qualifications?.requiredCertifications ?? [];
  const matchedCerts = requiredCerts.filter((c) =>
    candidate.certifications.some((cc) => cc.toLowerCase() === c.toLowerCase())
  );
  if (requiredCerts.length > 0 && matchedCerts.length === requiredCerts.length) {
    score += 15;
    reasons.push(`${matchedCerts.join(', ')} certified`);
  } else if (matchedCerts.length > 0) {
    score += 8;
    reasons.push(`${matchedCerts.join(', ')} certified`);
  }

  if (requirement.schedule) {
    const occurrences = expandOccurrences(scheduleToOccurrenceSpec(requirement.schedule));
    if (occurrences.length > 0) {
      const coveredCount = occurrences.filter((o) =>
        isCoveredByRules(o.date, o.startTime, o.endTime, candidateRules)
      ).length;
      const coverageRatio = coveredCount / occurrences.length;
      if (coverageRatio >= 0.8) {
        score += 20;
        reasons.push(`Available for ${Math.round(coverageRatio * 100)}% of the requested schedule`);
      } else if (coverageRatio > 0) {
        score += 10;
        reasons.push(`Partially available (${Math.round(coverageRatio * 100)}% of requested schedule)`);
      }
    }
  }

  const previouslyPlaced = allRequirements.some(
    (r) =>
      r.orgName === requirement.orgName &&
      r.matches.some(
        (m) => m.passportId === candidate.id && (m.status === 'selected' || m.status === 'closed')
      )
  );
  if (previouslyPlaced) {
    score += 10;
    reasons.push('Worked with this organization previously');
  }

  if (candidate.name && candidate.specialty && candidate.licenseStatus === 'Current') {
    score += 5;
    reasons.push('Passport verified, license current');
  }

  return { score: Math.min(98, score), whyReasons: reasons };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Simulated per Module4's Candidate Readiness Score — clearly not real
 * credential verification. Deterministic per passport (not random) so a
 * given candidate reads the same way across a demo session. License
 * status reuses the passport's real licenseStatus field where it can
 * ("Expiring Soon" reads as amber) rather than inventing an unrelated
 * number for something we do actually track.
 */
export function computeCandidateReadiness(candidate: VaultEntry): CandidateReadiness {
  const license: CandidateReadiness['license'] =
    candidate.licenseStatus === 'Current' ? 'green' : candidate.licenseStatus === 'Expiring Soon' ? 'amber' : 'red';
  const seed = hashString(candidate.id);
  const background: CandidateReadiness['background'] = seed % 10 === 0 ? 'amber' : 'green';
  const drugScreen: CandidateReadiness['drugScreen'] = 'green';
  const vaccination: CandidateReadiness['vaccination'] = seed % 7 === 0 ? 'amber' : 'green';

  const greenCount = [license, background, drugScreen, vaccination].filter((s) => s === 'green').length;
  const score = Math.round((greenCount / 4) * 100);

  return {
    score,
    license,
    background,
    drugScreen,
    vaccination,
    availabilityConfirmed: true,
    interestConfirmed: true,
    passportVerified: license !== 'red',
  };
}

export interface RankedCandidateMatch {
  candidate: VaultEntry;
  matchScore: MatchScoreResult;
  readiness: CandidateReadiness;
}

/** Module4 Step 3/4 — searches the one real candidate source we have
 * (the Passport Vault) and ranks by real Match Score. Doesn't invent
 * separate fake "float pool"/"travel pool" candidate lists — see the
 * plan's note on honest sourcing. */
export function rankCandidatesForRequirement(
  vault: VaultEntry[],
  requirement: Requirement,
  requirements: Requirement[],
  rulesByPassport: Record<string, ScheduleRule[]>,
  excludePassportIds: string[] = []
): RankedCandidateMatch[] {
  return vault
    .filter((v) => v.specialty.trim().toLowerCase() === requirement.specialty.trim().toLowerCase())
    .filter((v) => !excludePassportIds.includes(v.id))
    .map((v) => ({
      candidate: v,
      matchScore: computeMatchScore(v, requirement, rulesByPassport[v.id] ?? [], requirements),
      readiness: computeCandidateReadiness(v),
    }))
    .sort((a, b) => b.matchScore.score - a.matchScore.score);
}
