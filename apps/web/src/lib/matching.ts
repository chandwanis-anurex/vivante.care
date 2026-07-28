import type { AssignRequest, AssignRequestStatus, DayOfWeek, ScheduleRule, ShiftRequest, ShiftStatus } from '@/types';

export interface Occurrence {
  date: string; // ISO date, "YYYY-MM-DD"
  startTime: string | null;
  endTime: string | null;
}

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function formatUtcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayOfWeekUtc(d: Date): DayOfWeek {
  return d.getUTCDay() as DayOfWeek;
}

/** Minutes since midnight, with overnight windows (end <= start) wrapped past 24h. */
function toMinutesRange(startTime: string, endTime: string): [number, number] {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;
  return [start, end];
}

/**
 * Expands a recurring rule/shift into concrete calendar occurrences within
 * its own startDate..endDate (inclusive), filtered by daysOfWeek. Capped at
 * capDays as a sanity bound against runaway ranges — real availability and
 * shift windows are expected to be weeks/months, not years.
 */
export function expandOccurrences(
  spec: Pick<ScheduleRule | ShiftRequest, 'startDate' | 'endDate' | 'daysOfWeek' | 'startTime' | 'endTime'>,
  capDays = 366
): Occurrence[] {
  const occurrences: Occurrence[] = [];
  const start = toUtcDate(spec.startDate);
  const end = toUtcDate(spec.endDate);
  let cursor = start;
  let count = 0;

  while (cursor.getTime() <= end.getTime() && count < capDays) {
    if (!spec.daysOfWeek || spec.daysOfWeek.includes(dayOfWeekUtc(cursor))) {
      occurrences.push({ date: formatUtcDate(cursor), startTime: spec.startTime, endTime: spec.endTime });
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    count += 1;
  }

  return occurrences;
}

function timeWindowContains(
  ruleStart: string | null,
  ruleEnd: string | null,
  needStart: string | null,
  needEnd: string | null
): boolean {
  if (ruleStart === null || ruleEnd === null) return true; // all-day rule covers any window
  if (needStart === null || needEnd === null) return false; // all-day need, partial-day rule
  const [rStart, rEnd] = toMinutesRange(ruleStart, ruleEnd);
  const [nStart, nEnd] = toMinutesRange(needStart, needEnd);
  return rStart <= nStart && rEnd >= nEnd;
}

function timeWindowOverlaps(
  aStart: string | null,
  aEnd: string | null,
  bStart: string | null,
  bEnd: string | null
): boolean {
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return true;
  const [aS, aE] = toMinutesRange(aStart, aEnd);
  const [bS, bE] = toMinutesRange(bStart, bEnd);
  return aS < bE && bS < aE;
}

function rulesOnDate(rules: ScheduleRule[], date: string): ScheduleRule[] {
  return rules.filter((r) => {
    if (date < r.startDate || date > r.endDate) return false;
    if (!r.daysOfWeek) return true;
    return r.daysOfWeek.includes(dayOfWeekUtc(toUtcDate(date)));
  });
}

/** True if an `available` rule covers this slot and no `occupied` rule overrides it. */
export function isCoveredByRules(
  date: string,
  startTime: string | null,
  endTime: string | null,
  rules: ScheduleRule[]
): boolean {
  const applicable = rulesOnDate(rules, date);
  const occupied = applicable.some(
    (r) => r.kind === 'occupied' && timeWindowOverlaps(r.startTime, r.endTime, startTime, endTime)
  );
  if (occupied) return false;
  return applicable.some(
    (r) => r.kind === 'available' && timeWindowContains(r.startTime, r.endTime, startTime, endTime)
  );
}

export function matchShiftAgainstAvailability(
  shift: ShiftRequest,
  rules: ScheduleRule[]
): { totalOccurrences: number; coveredOccurrences: number } {
  const occurrences = expandOccurrences(shift);
  const coveredOccurrences = occurrences.filter((o) => isCoveredByRules(o.date, o.startTime, o.endTime, rules)).length;
  return { totalOccurrences: occurrences.length, coveredOccurrences };
}

/**
 * Returns the overlapping dates where this passport already holds an
 * accepted or still-pending (non-expired) assignment for a *different*
 * shift. A warning signal, not a hard block — the org may still assign
 * into a flagged conflict.
 */
export function findSchedulingConflicts(
  passportId: string,
  shift: ShiftRequest,
  assignRequests: AssignRequest[],
  allShifts: ShiftRequest[]
): string[] {
  const shiftDates = new Set(expandOccurrences(shift).map((o) => o.date));
  const conflictDates = new Set<string>();

  for (const ar of assignRequests) {
    if (ar.passportId !== passportId || ar.shiftId === shift.id) continue;
    const status = getEffectiveStatus(ar);
    if (status !== 'accepted' && status !== 'pending') continue;
    const otherShift = allShifts.find((s) => s.id === ar.shiftId);
    if (!otherShift) continue;
    for (const occ of expandOccurrences(otherShift)) {
      if (shiftDates.has(occ.date)) conflictDates.add(occ.date);
    }
  }

  return Array.from(conflictDates).sort();
}

export interface RankedCandidate {
  passportId: string;
  name: string;
  specialty: string;
  totalOccurrences: number;
  coveredOccurrences: number;
  coveragePct: number;
  conflicts: string[];
}

export function rankCandidates(
  vault: { id: string; name: string; specialty: string }[],
  rulesByPassport: Record<string, ScheduleRule[]>,
  shift: ShiftRequest,
  assignRequests: AssignRequest[],
  allShifts: ShiftRequest[]
): RankedCandidate[] {
  const wantedSpecialty = shift.specialty.trim().toLowerCase();

  const candidates = vault
    .filter((v) => !wantedSpecialty || v.specialty.trim().toLowerCase() === wantedSpecialty)
    .map((v) => {
      const { totalOccurrences, coveredOccurrences } = matchShiftAgainstAvailability(
        shift,
        rulesByPassport[v.id] ?? []
      );
      const conflicts = findSchedulingConflicts(v.id, shift, assignRequests, allShifts);
      return {
        passportId: v.id,
        name: v.name,
        specialty: v.specialty,
        totalOccurrences,
        coveredOccurrences,
        coveragePct: totalOccurrences === 0 ? 0 : coveredOccurrences / totalOccurrences,
        conflicts,
      };
    });

  return candidates.sort((a, b) => {
    if (a.conflicts.length !== b.conflicts.length) return a.conflicts.length - b.conflicts.length;
    return b.coveragePct - a.coveragePct;
  });
}

export function getEffectiveStatus(ar: AssignRequest, now: number = Date.now()): AssignRequestStatus {
  if (ar.status === 'pending' && Date.parse(ar.expiresAt) < now) return 'expired';
  return ar.status;
}

/** "Expires in 42 min" / "2h 15m" / "Expired" — shared by org/worker/admin shift views. */
export function formatCountdown(expiresAt: string, now: number): string {
  const ms = Date.parse(expiresAt) - now;
  if (ms <= 0) return 'Expired';
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/**
 * A shift's stored status only changes when someone accepts/rejects — an
 * unactioned request just times out with nothing writing that back. This
 * derives what should actually be shown: a `pending_assignment` shift
 * whose assign request has expired reads as `open` again (available for
 * reassignment) without needing a background job to rewrite storage.
 */
export function getDisplayShiftStatus(
  shift: ShiftRequest,
  assignRequests: AssignRequest[],
  now: number = Date.now()
): ShiftStatus {
  if (shift.status !== 'pending_assignment') return shift.status;
  const ar = assignRequests.find((a) => a.shiftId === shift.id && a.status === 'pending');
  if (!ar) return shift.status;
  return getEffectiveStatus(ar, now) === 'expired' ? 'open' : 'pending_assignment';
}
