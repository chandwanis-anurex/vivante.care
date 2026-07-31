import type {
  AssignmentType,
  AssignRequest,
  Requirement,
  RequestPriority,
  RequirementBudget,
  RequirementSchedule,
  ShiftRequest,
} from '@/types';

// Canonical specialty list for the workforce-request wizard. Adapted from
// Module3's list to match vocabulary already used across the app
// (PassportPage, NewShiftPage, mockData's vault) — "Licensed Vocational
// Nurse" instead of Module3's "Licensed Practical Nurse (LPN)", and no
// "(RN)"/"(CNA)" abbreviations — so a request's specialty string still
// matches real passports/shifts for the existing matching engine
// (lib/matching.ts does exact specialty comparison).
export const SPECIALTY_OPTIONS = [
  'Registered Nurse',
  'Licensed Vocational Nurse',
  'Certified Nursing Assistant',
  'Respiratory Therapist',
  'Physical Therapist',
  'Occupational Therapist',
  'Speech Therapist',
  'Medical Assistant',
  'Surgical Tech',
  'Pharmacist',
  'Behavioral Health',
  'Physician Assistant',
  'Nurse Practitioner',
  'Home Health Aide',
  'Other',
];

// Ballpark per-hour bill rates (USD) used only to ground the deterministic
// forecast below — not a real market-data feed. Deliberately simulated
// per product decision (Module3 leans on "AI-powered" numbers for demo
// polish), but computed from real inputs so it responds sensibly when an
// org changes fields, unlike a random number.
const BASE_RATES: Record<string, number> = {
  'Registered Nurse': 65,
  'Licensed Vocational Nurse': 45,
  'Certified Nursing Assistant': 28,
  'Respiratory Therapist': 55,
  'Physical Therapist': 60,
  'Occupational Therapist': 58,
  'Speech Therapist': 58,
  'Medical Assistant': 30,
  'Surgical Tech': 48,
  Pharmacist: 75,
  'Behavioral Health': 42,
  'Physician Assistant': 80,
  'Nurse Practitioner': 85,
  'Home Health Aide': 26,
  Other: 40,
};

const ASSIGNMENT_MULTIPLIER: Record<AssignmentType, number> = {
  'Per Diem': 1.1,
  Temporary: 1.0,
  Contract: 1.05,
  Travel: 1.3,
  Permanent: 0.85,
  'Float Pool': 1.05,
  'Rapid Response': 1.4,
};

const PRIORITY_MULTIPLIER: Record<RequestPriority, number> = {
  Low: 0.97,
  Medium: 1.0,
  High: 1.05,
  Emergency: 1.15,
};

export function estimateMarketRate(
  specialty: string,
  assignmentType: AssignmentType,
  priority: RequestPriority
): number {
  const base = BASE_RATES[specialty] ?? BASE_RATES.Other;
  return Math.round(base * ASSIGNMENT_MULTIPLIER[assignmentType] * PRIORITY_MULTIPLIER[priority]);
}

export interface FillEstimate {
  fillProbabilityPct: number;
  expectedFillHours: number;
  source: 'historical' | 'heuristic';
}

/**
 * Anchors on real historical avg fill time for this org+specialty when
 * available (same style as dashboardMetrics.ts's avgTimeToFillHours, just
 * specialty-filtered); otherwise falls back to a deterministic heuristic
 * from budget-vs-market-rate and schedule flexibility. Never random.
 */
export function estimateFillProbability(
  budget: RequirementBudget,
  marketRate: number,
  schedule: Pick<RequirementSchedule, 'weekendRequired' | 'holidayRequired' | 'overtimeAllowed'>,
  historicalAvgFillHours: number | null
): FillEstimate {
  const rateRatio = marketRate === 0 ? 1 : budget.maxBillRate / marketRate;
  const rateScore = Math.max(0, Math.min(1, (rateRatio - 0.7) / 0.5)); // 0 at 70% of market, 1 at 120%+

  const flexCount = [schedule.weekendRequired, schedule.holidayRequired, schedule.overtimeAllowed].filter(
    Boolean
  ).length;
  const flexScore = flexCount / 3;

  const priorityBoost: Record<RequestPriority, number> = { Low: 0, Medium: 0.03, High: 0.06, Emergency: 0.1 };

  const pctRaw = (0.55 + rateScore * 0.3 + flexScore * 0.1 + priorityBoost[budget.priority]) * 100;
  const fillProbabilityPct = Math.round(Math.max(20, Math.min(97, pctRaw)));

  let expectedFillHours: number;
  let source: 'historical' | 'heuristic';
  if (historicalAvgFillHours !== null) {
    // Blend real history with the rate/flexibility signal rather than
    // echoing it verbatim — a strong offer should read as faster than
    // the org's own historical average, a weak one slower.
    expectedFillHours =
      Math.round(historicalAvgFillHours * (1.3 - rateScore * 0.3 - flexScore * 0.1) * 10) / 10;
    source = 'historical';
  } else {
    const baseline = 36; // hours — heuristic baseline with no history to anchor on
    expectedFillHours = Math.round(baseline * (1.4 - rateScore * 0.5 - flexScore * 0.2) * 10) / 10;
    source = 'heuristic';
  }
  expectedFillHours = Math.max(2, expectedFillHours);

  return { fillProbabilityPct, expectedFillHours, source };
}

type RarityTier = 'common' | 'moderate' | 'rare';

const RARITY_TIER: Record<string, RarityTier> = {
  'Registered Nurse': 'common',
  'Licensed Vocational Nurse': 'common',
  'Certified Nursing Assistant': 'common',
  'Home Health Aide': 'common',
  'Medical Assistant': 'common',
  'Physical Therapist': 'moderate',
  'Occupational Therapist': 'moderate',
  'Speech Therapist': 'moderate',
  'Respiratory Therapist': 'moderate',
  'Surgical Tech': 'moderate',
  'Behavioral Health': 'moderate',
  'Physician Assistant': 'rare',
  'Nurse Practitioner': 'rare',
  Pharmacist: 'rare',
};

const RADIUS_SUGGESTION_PCT: Record<RarityTier, number> = { common: 8, moderate: 14, rare: 22 };

export function generateSuggestions(
  specialty: string,
  budget: RequirementBudget,
  marketRate: number,
  qualifications: { requiredCertifications: string[] }
): string[] {
  const suggestions: string[] = [];

  if (budget.maxBillRate < marketRate) {
    const gap = marketRate - budget.maxBillRate;
    const hoursSaved = Math.max(1, Math.round(gap / 2));
    suggestions.push(
      `Increasing the bill rate by $${gap}/hour toward the $${marketRate}/hr market rate could reduce fill time by approximately ${hoursSaved} hours.`
    );
  }

  if (qualifications.requiredCertifications.length > 2) {
    const pct = Math.min(25, qualifications.requiredCertifications.length * 5);
    suggestions.push(`Allowing an alternative certification could increase eligible clinicians by approximately ${pct}%.`);
  }

  const tier = RARITY_TIER[specialty] ?? 'moderate';
  suggestions.push(
    `Expanding your search radius by 10 miles could increase available candidates by approximately ${RADIUS_SUGGESTION_PCT[tier]}%.`
  );

  return suggestions.slice(0, 3);
}

export interface StaffingReadinessFactor {
  label: string;
  pct: number;
}
export interface StaffingReadiness {
  score: number;
  factors: StaffingReadinessFactor[];
}

/**
 * Mostly real: budget/schedule factors derive from the forecast above and
 * the org's own actual inputs; "local talent availability" counts real
 * matching passports in the vault rather than fabricating a number.
 */
export function computeStaffingReadiness(
  budget: RequirementBudget,
  marketRate: number,
  schedule: Pick<RequirementSchedule, 'weekendRequired' | 'holidayRequired' | 'overtimeAllowed'>,
  qualifications: { requiredCertifications: string[] },
  matchingVaultCount: number
): StaffingReadiness {
  const rateRatio = marketRate === 0 ? 1 : budget.maxBillRate / marketRate;
  const budgetPct = Math.round(Math.max(0, Math.min(1, (rateRatio - 0.7) / 0.5)) * 100);

  const flexCount = [schedule.weekendRequired, schedule.holidayRequired, schedule.overtimeAllowed].filter(
    Boolean
  ).length;
  const flexPct = Math.round((flexCount / 3) * 100);

  const certPct = Math.max(20, 100 - qualifications.requiredCertifications.length * 15);
  const talentPct = Math.max(10, Math.min(100, matchingVaultCount * 25));

  const factors: StaffingReadinessFactor[] = [
    { label: 'Budget competitiveness', pct: budgetPct },
    { label: 'Schedule flexibility', pct: flexPct },
    { label: 'Certification requirements', pct: certPct },
    { label: 'Local talent availability', pct: talentPct },
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.pct, 0) / factors.length);
  return { score, factors };
}

/**
 * Real average hours-to-fill for this org+specialty, from actual
 * accepted assign requests (same style as dashboardMetrics.ts's
 * avgTimeToFillHours, specialty-filtered). Null when there's no history
 * yet — the forecast falls back to the heuristic baseline in that case.
 */
export function getHistoricalAvgFillHours(
  shiftRequests: ShiftRequest[],
  assignRequests: AssignRequest[],
  orgName: string,
  specialty: string
): number | null {
  const shiftIds = new Set(
    shiftRequests.filter((s) => s.orgName === orgName && s.specialty === specialty).map((s) => s.id)
  );
  const hours = assignRequests
    .filter((a) => a.orgName === orgName && a.status === 'accepted' && a.respondedAt && shiftIds.has(a.shiftId))
    .map((a) => (Date.parse(a.respondedAt as string) - Date.parse(a.createdAt)) / (1000 * 60 * 60));

  if (hours.length === 0) return null;
  return Math.round((hours.reduce((sum, h) => sum + h, 0) / hours.length) * 10) / 10;
}

/** Real duplicate check — Module3 differentiator #3. */
export function findSimilarActiveRequirement(
  requirements: Requirement[],
  orgName: string,
  specialty: string,
  excludeId?: string
): Requirement | null {
  return (
    requirements.find(
      (r) => r.orgName === orgName && r.specialty === specialty && !r.archived && r.id !== excludeId
    ) ?? null
  );
}

/** Real "recently requested roles" — Module3 Screen 1 smart feature. */
export function getRecentSpecialties(requirements: Requirement[], orgName: string, limit = 5): string[] {
  const counts = new Map<string, number>();
  requirements
    .filter((r) => r.orgName === orgName)
    .forEach((r) => counts.set(r.specialty, (counts.get(r.specialty) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([specialty]) => specialty);
}
