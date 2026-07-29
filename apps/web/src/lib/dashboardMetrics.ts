import type { AssignRequest, InterviewRequest, MatchStatus, Requirement, ShiftRequest } from '@/types';
import { getDisplayShiftStatus, getEffectiveStatus } from '@/lib/matching';

function assignedPassportIds(shiftRequests: ShiftRequest[]): Set<string> {
  return new Set(shiftRequests.filter((s) => s.assignedPassportId).map((s) => s.assignedPassportId as string));
}

export interface DashboardKpis {
  openRequests: number;
  activeProfessionals: number;
  fillRatePct: number | null;
  avgTimeToFillHours: number | null;
  workforceHealthScore: number;
}

/**
 * Every field here is derived from data that already exists — no
 * fabricated numbers. workforceHealthScore is a simplified, documented
 * composite: the full Module2 formula also factors overtime, credential
 * compliance, and turnover, none of which this pass tracks.
 */
export function computeKpis(
  requirements: Requirement[],
  shiftRequests: ShiftRequest[],
  assignRequests: AssignRequest[],
  interviewRequests: InterviewRequest[],
  now: number = Date.now()
): DashboardKpis {
  const openRequests = requirements.filter((r) => !r.archived).length;

  const activeProfessionals = new Set(
    shiftRequests
      .filter((s) => getDisplayShiftStatus(s, assignRequests, now) === 'assigned')
      .map((s) => s.assignedPassportId)
      .filter((id): id is string => Boolean(id))
  ).size;

  const totalShifts = shiftRequests.length;
  const filledShifts = shiftRequests.filter((s) => {
    const status = getDisplayShiftStatus(s, assignRequests, now);
    return status === 'assigned' || status === 'complete';
  }).length;
  const fillRatePct = totalShifts === 0 ? null : Math.round((filledShifts / totalShifts) * 100);

  const respondedHours = assignRequests
    .filter((a) => a.status === 'accepted' && a.respondedAt)
    .map((a) => (Date.parse(a.respondedAt as string) - Date.parse(a.createdAt)) / (1000 * 60 * 60));
  const avgTimeToFillHours =
    respondedHours.length === 0
      ? null
      : Math.round((respondedHours.reduce((sum, h) => sum + h, 0) / respondedHours.length) * 10) / 10;

  const pendingInterviews = interviewRequests.filter((i) => i.status === 'pending_admin').length;
  const interviewResponsivenessScore =
    interviewRequests.length === 0 ? 100 : Math.round((1 - pendingInterviews / interviewRequests.length) * 100);

  const openShiftRatio = totalShifts === 0 ? 0 : (totalShifts - filledShifts) / totalShifts;
  const backlogScore = Math.round((1 - openShiftRatio) * 100);
  const fillScore = fillRatePct ?? 100; // no shifts posted yet reads as neutral, not penalized

  const workforceHealthScore = Math.max(
    0,
    Math.min(100, Math.round(fillScore * 0.5 + backlogScore * 0.3 + interviewResponsivenessScore * 0.2))
  );

  return { openRequests, activeProfessionals, fillRatePct, avgTimeToFillHours, workforceHealthScore };
}

export interface PipelineStage {
  key: string;
  label: string;
  count: number;
  link: string;
}

/**
 * Adapted from Module2's 6-stage concept onto our actual MatchStatus
 * enum rather than inventing an "AI Matching" stage nothing backs.
 * "Assigned to Shift" cross-references shiftRequests since a match's own
 * status never changes once a shift is assigned — it's a separate event.
 */
export function computeCandidatePipeline(requirements: Requirement[], shiftRequests: ShiftRequest[]): PipelineStage[] {
  const allMatches = requirements.flatMap((r) => r.matches);
  const assigned = assignedPassportIds(shiftRequests);
  const countStatus = (status: MatchStatus) => allMatches.filter((m) => m.status === status).length;
  const selectedCount = countStatus('selected');
  const selectedAssignedCount = allMatches.filter((m) => m.status === 'selected' && assigned.has(m.passportId)).length;

  return [
    { key: 'open', label: 'Open', count: countStatus('open'), link: '/org/requirements' },
    { key: 'invited', label: 'Invited to Interview', count: countStatus('invited_to_interview'), link: '/org/requirements' },
    { key: 'under_interview', label: 'Under Interview', count: countStatus('under_interview'), link: '/org/requirements' },
    { key: 'selected', label: 'Selected', count: selectedCount - selectedAssignedCount, link: '/org/requirements' },
    { key: 'assigned', label: 'Assigned to Shift', count: selectedAssignedCount, link: '/org/shifts' },
  ];
}

export interface UrgentAction {
  id: string;
  severity: 'red' | 'amber' | 'yellow';
  message: string;
  link: string;
}

export function computeUrgentActions(
  requirements: Requirement[],
  shiftRequests: ShiftRequest[],
  assignRequests: AssignRequest[],
  interviewRequests: InterviewRequest[],
  now: number = Date.now()
): UrgentAction[] {
  const actions: UrgentAction[] = [];
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  const expiringSoon = assignRequests.filter(
    (a) => getEffectiveStatus(a, now) === 'pending' && Date.parse(a.expiresAt) - now < 15 * 60 * 1000
  );
  if (expiringSoon.length > 0) {
    actions.push({
      id: 'expiring-assignments',
      severity: 'red',
      message: `${plural(expiringSoon.length, 'assign request')} expiring within 15 minutes`,
      link: '/org/shifts',
    });
  }

  const openShifts = shiftRequests.filter((s) => getDisplayShiftStatus(s, assignRequests, now) === 'open');
  if (openShifts.length > 0) {
    actions.push({
      id: 'open-shifts',
      severity: 'amber',
      message: `${plural(openShifts.length, 'open shift')} with no candidate assigned`,
      link: '/org/shifts',
    });
  }

  const assigned = assignedPassportIds(shiftRequests);
  const selectedUnassigned = requirements
    .flatMap((r) => r.matches)
    .filter((m) => m.status === 'selected' && !assigned.has(m.passportId)).length;
  if (selectedUnassigned > 0) {
    actions.push({
      id: 'selected-unassigned',
      severity: 'amber',
      message: `${plural(selectedUnassigned, 'selected candidate')} not yet assigned to a shift`,
      link: '/org/requirements',
    });
  }

  const pendingInterviews = interviewRequests.filter((i) => i.status === 'pending_admin').length;
  if (pendingInterviews > 0) {
    actions.push({
      id: 'pending-interviews',
      severity: 'yellow',
      message: `${plural(pendingInterviews, 'interview request')} awaiting scheduling`,
      link: '/org/requirements',
    });
  }

  return actions;
}

export interface Insight {
  id: string;
  message: string;
  link: string;
}

/**
 * Templated recommendations from current-state signals — not ML/trend
 * forecasting. No "demand expected to increase 20% next week" — nothing
 * in this data model backs a claim like that.
 */
export function computeInsights(
  requirements: Requirement[],
  shiftRequests: ShiftRequest[],
  assignRequests: AssignRequest[],
  interviewRequests: InterviewRequest[],
  now: number = Date.now()
): Insight[] {
  const insights: Insight[] = [];
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  const openShifts = shiftRequests.filter((s) => getDisplayShiftStatus(s, assignRequests, now) === 'open');
  if (openShifts.length > 0) {
    insights.push({
      id: 'open-shifts',
      message: `${plural(openShifts.length, 'open shift')} could be filled with Auto-Match.`,
      link: '/org/shifts',
    });
  }

  const assigned = assignedPassportIds(shiftRequests);
  const selectedUnassigned = requirements
    .flatMap((r) => r.matches)
    .filter((m) => m.status === 'selected' && !assigned.has(m.passportId));
  if (selectedUnassigned.length > 0) {
    insights.push({
      id: 'selected-ready',
      message: `${plural(selectedUnassigned.length, 'selected candidate')} ready for shift assignment.`,
      link: '/org/requirements',
    });
  }

  const pendingInterviews = interviewRequests.filter((i) => i.status === 'pending_admin').length;
  if (pendingInterviews > 0) {
    insights.push({
      id: 'pending-interviews',
      message: `${plural(pendingInterviews, 'interview request')} awaiting a slot from the VivanteCare team.`,
      link: '/org/requirements',
    });
  }

  const kpis = computeKpis(requirements, shiftRequests, assignRequests, interviewRequests, now);
  if (kpis.fillRatePct !== null) {
    insights.push({ id: 'fill-rate', message: `Current fill rate is ${kpis.fillRatePct}%.`, link: '/org/shifts' });
  }

  return insights;
}

export interface RecommendedAction {
  message: string;
  link: string;
}

export function computeRecommendedAction(
  requirements: Requirement[],
  shiftRequests: ShiftRequest[],
  assignRequests: AssignRequest[],
  interviewRequests: InterviewRequest[],
  now: number = Date.now()
): RecommendedAction {
  const assigned = assignedPassportIds(shiftRequests);
  const selectedUnassigned = requirements
    .flatMap((r) => r.matches)
    .filter((m) => m.status === 'selected' && !assigned.has(m.passportId));
  const openShifts = shiftRequests.filter((s) => getDisplayShiftStatus(s, assignRequests, now) === 'open');

  for (const candidate of selectedUnassigned) {
    const match = openShifts.find(
      (s) => s.specialty.trim().toLowerCase() === candidate.specialty.trim().toLowerCase()
    );
    if (match) {
      return {
        message: `Assign ${candidate.candidateName} to "${match.title}" to keep your fill rate on track.`,
        link: '/org/shifts',
      };
    }
  }

  const insights = computeInsights(requirements, shiftRequests, assignRequests, interviewRequests, now);
  if (insights.length > 0) {
    return { message: insights[0].message, link: insights[0].link };
  }

  return { message: "You're all caught up — no urgent actions right now.", link: '/org/vivanteiq' };
}
