import { useCallback, useSyncExternalStore } from 'react';
import type {
  AppNotification,
  AssignRequest,
  InterviewRequest,
  MatchStatus,
  Requirement,
  RequirementMatch,
  ScheduleRule,
  ShiftRequest,
  ShiftStatus,
} from '@/types';
import { ASSIGN_REQUEST_TTL_MINUTES } from '@/lib/config';
import { getEffectiveStatus } from '@/lib/matching';
import { MOCK_REQUIREMENTS, getVaultWithOwnPassport } from '@/lib/mockData';
import { computeWorkforceAnalysis, rankCandidatesForRequirement } from '@/lib/candidateMatching';

// Prototype-only cross-role store (localStorage), same pattern as
// hooks/useSession.ts: org and worker actions both land here so the whole
// assign-request loop is testable in one browser without a real backend.
const STORAGE_KEY = 'vivantecare.schedule';
const listeners = new Set<() => void>();

interface ScheduleState {
  availabilityRules: Record<string, ScheduleRule[]>;
  shiftRequests: ShiftRequest[];
  assignRequests: AssignRequest[];
  notifications: AppNotification[];
  requirements: Requirement[];
  interviewRequests: InterviewRequest[];
}

function seedState(): ScheduleState {
  return {
    availabilityRules: {
      V4471290: [
        {
          id: 'seed_r1',
          kind: 'available',
          daysOfWeek: [0, 6],
          startDate: '2026-08-01',
          endDate: '2026-12-31',
          startTime: '07:00',
          endTime: '19:00',
          label: 'Weekends, 7am–7pm, Aug–Dec',
        },
        {
          id: 'seed_r2',
          kind: 'occupied',
          daysOfWeek: null,
          startDate: '2026-08-15',
          endDate: '2026-08-16',
          startTime: null,
          endTime: null,
          label: 'Already booked Aug 15–16',
        },
      ],
      V2290381: [
        {
          id: 'seed_r3',
          kind: 'available',
          daysOfWeek: [1, 2, 3, 4, 5],
          startDate: '2026-08-01',
          endDate: '2026-10-31',
          startTime: '19:00',
          endTime: '07:00',
          label: 'Weeknights, 7pm–7am, Aug–Oct',
        },
      ],
      V8813204: [
        {
          id: 'seed_r4',
          kind: 'available',
          daysOfWeek: [2, 4],
          startDate: '2026-08-01',
          endDate: '2027-01-31',
          startTime: null,
          endTime: null,
          label: 'Tuesdays & Thursdays, all day, through Jan',
        },
      ],
    },
    shiftRequests: [],
    assignRequests: [],
    notifications: [],
    requirements: MOCK_REQUIREMENTS,
    interviewRequests: [],
  };
}

let cachedRaw: string | null | undefined;
let cachedState: ScheduleState | null = null;

// Backfills top-level state keys that didn't exist yet when a given
// browser's localStorage was first written (e.g. interviewRequests was
// added after the admin portal shipped) — without this, any array field
// missing from older cached data crashes the first `.find`/`.filter`/
// `.map` called on it directly.
function normalizeState(state: ScheduleState): ScheduleState {
  return {
    availabilityRules: state.availabilityRules ?? {},
    shiftRequests: state.shiftRequests ?? [],
    assignRequests: state.assignRequests ?? [],
    notifications: state.notifications ?? [],
    requirements: state.requirements ?? [],
    interviewRequests: state.interviewRequests ?? [],
  };
}

function readState(): ScheduleState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw && cachedState) {
    return cachedState;
  }
  cachedRaw = raw;
  try {
    cachedState = raw ? normalizeState(JSON.parse(raw) as ScheduleState) : seedState();
  } catch {
    cachedState = seedState();
  }
  return cachedState;
}

function writeState(next: ScheduleState) {
  cachedState = next;
  cachedRaw = JSON.stringify(next);
  localStorage.setItem(STORAGE_KEY, cachedRaw);
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): ScheduleState {
  return readState();
}

function getServerSnapshot(): ScheduleState {
  return seedState();
}

export function useScheduleStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setAvailabilityRules = useCallback((passportId: string, rules: ScheduleRule[]) => {
    const current = readState();
    writeState({
      ...current,
      availabilityRules: { ...current.availabilityRules, [passportId]: rules },
    });
  }, []);

  const createShiftRequest = useCallback(
    (input: Omit<ShiftRequest, 'id' | 'createdAt' | 'status' | 'assignedPassportId' | 'assignedWorkerName'>) => {
      const current = readState();
      const shift: ShiftRequest = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'open',
      };
      writeState({ ...current, shiftRequests: [shift, ...current.shiftRequests] });
      return shift;
    },
    []
  );

  const createAssignRequest = useCallback(
    (shift: ShiftRequest, passportId: string, workerName: string, orgName: string) => {
      const current = readState();
      const now = Date.now();
      const assignRequest: AssignRequest = {
        id: crypto.randomUUID(),
        shiftId: shift.id,
        passportId,
        workerName,
        orgName,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + ASSIGN_REQUEST_TTL_MINUTES * 60 * 1000).toISOString(),
        status: 'pending',
      };
      const notification: AppNotification = {
        id: crypto.randomUUID(),
        audience: 'worker',
        message: `${orgName} wants to assign you to "${shift.title}" (${shift.label}). Respond within ${ASSIGN_REQUEST_TTL_MINUTES} min.`,
        createdAt: new Date(now).toISOString(),
        read: false,
        link: '/worker/shifts',
        category: 'staffing',
      };
      writeState({
        ...current,
        shiftRequests: current.shiftRequests.map((s) =>
          s.id === shift.id
            ? { ...s, status: 'pending_assignment', assignedPassportId: passportId, assignedWorkerName: workerName }
            : s
        ),
        assignRequests: [assignRequest, ...current.assignRequests],
        notifications: [notification, ...current.notifications],
      });
      return assignRequest;
    },
    []
  );

  const respondToAssignRequest = useCallback((id: string, response: 'accepted' | 'rejected') => {
    const current = readState();
    const ar = current.assignRequests.find((a) => a.id === id);
    if (!ar || getEffectiveStatus(ar) !== 'pending') return;

    const shift = current.shiftRequests.find((s) => s.id === ar.shiftId);
    const now = new Date().toISOString();
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'org',
      message: `${ar.workerName} ${response} the assignment for "${shift?.title ?? 'a shift'}".`,
      createdAt: now,
      read: false,
      link: '/org/shifts',
      category: 'staffing',
    };

    // A rejected/expired org-initiated request (one with a preferred
    // worker on file) falls back to admin review so admin can try a
    // substitute, instead of silently dropping the preferred-worker info.
    // Admin-initiated direct assigns (no preferredPassportId) fall back to
    // 'open' exactly as before — admin already was the approval step.
    const fallbackStatus: ShiftStatus = shift?.preferredPassportId ? 'pending_admin_review' : 'open';

    writeState({
      ...current,
      assignRequests: current.assignRequests.map((a) =>
        a.id === id ? { ...a, status: response, respondedAt: now } : a
      ),
      shiftRequests: current.shiftRequests.map((s) =>
        s.id === ar.shiftId
          ? response === 'accepted'
            ? { ...s, status: 'assigned' }
            : { ...s, status: fallbackStatus, assignedPassportId: undefined, assignedWorkerName: undefined }
          : s
      ),
      notifications: [notification, ...current.notifications],
    });
  }, []);

  // Org proposed a worker (either the Passport-Vault "Request Shift" flow
  // or OrgShiftsPage's Auto-Match/Browse picker) — creates/updates the
  // shift with a preferred candidate and routes to admin for review
  // instead of notifying the worker directly.
  const requestShiftForPassport = useCallback(
    (
      input: Omit<ShiftRequest, 'id' | 'createdAt' | 'status' | 'assignedPassportId' | 'assignedWorkerName' | 'preferredPassportId' | 'preferredWorkerName'>,
      passportId: string,
      workerName: string
    ) => {
      const current = readState();
      const now = new Date().toISOString();
      const shift: ShiftRequest = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        status: 'pending_admin_review',
        preferredPassportId: passportId,
        preferredWorkerName: workerName,
      };
      const notification: AppNotification = {
        id: crypto.randomUUID(),
        audience: 'admin',
        message: `${input.orgName} wants to request ${workerName} (${passportId}) for "${shift.title}".`,
        createdAt: now,
        read: false,
        link: '/admin/shifts',
        category: 'staffing',
      };
      writeState({
        ...current,
        shiftRequests: [shift, ...current.shiftRequests],
        notifications: [notification, ...current.notifications],
      });
      return shift;
    },
    []
  );

  // OrgShiftsPage's Auto-Match/Browse Vault picker — used to call
  // createAssignRequest directly; now routes through the same admin
  // review gate as requestShiftForPassport above.
  const pickPreferredCandidate = useCallback((shiftId: string, passportId: string, workerName: string) => {
    const current = readState();
    const shift = current.shiftRequests.find((s) => s.id === shiftId);
    if (!shift) return;
    const now = new Date().toISOString();
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'admin',
      message: `${shift.orgName} wants to request ${workerName} (${passportId}) for "${shift.title}".`,
      createdAt: now,
      read: false,
      link: '/admin/shifts',
      category: 'staffing',
    };
    writeState({
      ...current,
      shiftRequests: current.shiftRequests.map((s) =>
        s.id === shiftId
          ? { ...s, status: 'pending_admin_review', preferredPassportId: passportId, preferredWorkerName: workerName }
          : s
      ),
      notifications: [notification, ...current.notifications],
    });
  }, []);

  const adminConfirmPreferred = useCallback(
    (shiftId: string) => {
      const current = readState();
      const shift = current.shiftRequests.find((s) => s.id === shiftId);
      if (!shift?.preferredPassportId || !shift.preferredWorkerName) return;
      createAssignRequest(shift, shift.preferredPassportId, shift.preferredWorkerName, shift.orgName);
    },
    [createAssignRequest]
  );

  const adminSuggestSubstitute = useCallback(
    (shiftId: string, passportId: string, workerName: string, note: string) => {
      const current = readState();
      const shift = current.shiftRequests.find((s) => s.id === shiftId);
      if (!shift) return;
      const now = new Date().toISOString();
      const notification: AppNotification = {
        id: crypto.randomUUID(),
        audience: 'org',
        message: `${shift.preferredWorkerName ?? 'Your requested worker'} isn't available for "${shift.title}". VivanteCare suggests ${workerName} (${passportId}) — ${note}`,
        createdAt: now,
        read: false,
        link: '/org/shifts',
        category: 'staffing',
      };
      writeState({
        ...current,
        shiftRequests: current.shiftRequests.map((s) =>
          s.id === shiftId
            ? {
                ...s,
                status: 'pending_org_response',
                substitutePassportId: passportId,
                substituteWorkerName: workerName,
                substituteNote: note,
              }
            : s
        ),
        notifications: [notification, ...current.notifications],
      });
    },
    []
  );

  const orgAcceptSubstitute = useCallback(
    (shiftId: string) => {
      const current = readState();
      const shift = current.shiftRequests.find((s) => s.id === shiftId);
      if (!shift?.substitutePassportId || !shift.substituteWorkerName) return;
      createAssignRequest(shift, shift.substitutePassportId, shift.substituteWorkerName, shift.orgName);
      const after = readState();
      writeState({
        ...after,
        shiftRequests: after.shiftRequests.map((s) =>
          s.id === shiftId
            ? { ...s, substitutePassportId: undefined, substituteWorkerName: undefined, substituteNote: undefined }
            : s
        ),
      });
    },
    [createAssignRequest]
  );

  const orgCancelShiftRequest = useCallback((shiftId: string) => {
    const current = readState();
    const shift = current.shiftRequests.find((s) => s.id === shiftId);
    if (!shift) return;
    const now = new Date().toISOString();
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'admin',
      message: `${shift.orgName} cancelled the request for "${shift.title}".`,
      createdAt: now,
      read: false,
      link: '/admin/shifts',
      category: 'staffing',
    };
    writeState({
      ...current,
      shiftRequests: current.shiftRequests.map((s) => (s.id === shiftId ? { ...s, status: 'cancelled' } : s)),
      notifications: [notification, ...current.notifications],
    });
  }, []);

  const completeShift = useCallback((shiftId: string) => {
    const current = readState();
    const shift = current.shiftRequests.find((s) => s.id === shiftId);
    if (!shift || shift.status !== 'assigned') return;
    const now = new Date().toISOString();
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'org',
      message: `${shift.assignedWorkerName ?? 'Worker'} marked "${shift.title}" complete.`,
      createdAt: now,
      read: false,
      link: '/org/shifts',
      category: 'staffing',
    };
    writeState({
      ...current,
      shiftRequests: current.shiftRequests.map((s) => (s.id === shiftId ? { ...s, status: 'complete' } : s)),
      notifications: [notification, ...current.notifications],
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    const current = readState();
    writeState({
      ...current,
      notifications: current.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });
  }, []);

  const createRequirement = useCallback(
    (input: Omit<Requirement, 'id' | 'openedAt' | 'archived' | 'matches'>) => {
      const current = readState();
      const now = new Date().toISOString();
      const requirement: Requirement = {
        ...input,
        id: crypto.randomUUID(),
        openedAt: now,
        archived: false,
        matches: [],
        pipelineStatus: 'submitted',
      };
      const notifications: AppNotification[] = [
        {
          id: crypto.randomUUID(),
          audience: 'org',
          message: `Workforce request "${requirement.title}" submitted.`,
          createdAt: now,
          read: false,
          link: `/org/requirements/${requirement.id}`,
          category: 'staffing',
        },
        {
          id: crypto.randomUUID(),
          audience: 'admin',
          message: `New request assigned: "${requirement.title}" (${requirement.orgName}).`,
          createdAt: now,
          read: false,
          link: '/admin/requirements',
          category: 'staffing',
        },
      ];
      if (input.recruiterEmail) {
        notifications.push({
          id: crypto.randomUUID(),
          audience: 'org',
          message: `${input.recruiterEmail} was assigned to "${requirement.title}".`,
          createdAt: now,
          read: false,
          link: `/org/requirements/${requirement.id}`,
          category: 'staffing',
        });
      }
      writeState({
        ...current,
        requirements: [requirement, ...current.requirements],
        notifications: [...notifications, ...current.notifications],
      });
      return requirement;
    },
    []
  );

  const updateMatchStatus = useCallback((requirementId: string, matchId: string, status: MatchStatus) => {
    const current = readState();
    writeState({
      ...current,
      requirements: current.requirements.map((r) =>
        r.id === requirementId
          ? { ...r, matches: r.matches.map((m) => (m.id === matchId ? { ...m, status } : m)) }
          : r
      ),
    });
  }, []);

  const requestMoreInfo = useCallback((requirementId: string, matchId: string, note: string) => {
    const current = readState();
    writeState({
      ...current,
      requirements: current.requirements.map((r) =>
        r.id === requirementId
          ? {
              ...r,
              matches: r.matches.map((m) =>
                m.id === matchId ? { ...m, status: 'more_info_required' } : m
              ),
              additionalInfoRequested: [...(r.additionalInfoRequested ?? []), note],
            }
          : r
      ),
    });
  }, []);

  // Replaces the org picking interview slots directly — the org just
  // requests one; admin (not the org, not the worker) picks the slot.
  const createInterviewRequest = useCallback((requirementId: string, matchId: string, note?: string) => {
    const current = readState();
    const requirement = current.requirements.find((r) => r.id === requirementId);
    const match = requirement?.matches.find((m) => m.id === matchId);
    if (!requirement || !match) return;

    const now = new Date().toISOString();
    const interviewRequest: InterviewRequest = {
      id: crypto.randomUUID(),
      requirementId,
      requirementTitle: requirement.title,
      matchId,
      passportId: match.passportId,
      candidateName: match.candidateName,
      orgName: requirement.orgName,
      createdAt: now,
      status: 'pending_admin',
      note,
    };
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'admin',
      message: `${requirement.orgName} requested an interview with ${match.candidateName} for "${requirement.title}".`,
      createdAt: now,
      read: false,
      link: '/admin/interviews',
      category: 'staffing',
    };

    writeState({
      ...current,
      requirements: current.requirements.map((r) =>
        r.id === requirementId
          ? {
              ...r,
              matches: r.matches.map((m) =>
                m.id === matchId ? { ...m, status: 'invited_to_interview' } : m
              ),
            }
          : r
      ),
      interviewRequests: [interviewRequest, ...current.interviewRequests],
      notifications: [notification, ...current.notifications],
    });
    return interviewRequest;
  }, []);

  const sendInterviewSlot = useCallback((interviewRequestId: string, scheduledAt: string) => {
    const current = readState();
    const ir = current.interviewRequests.find((i) => i.id === interviewRequestId);
    if (!ir) return;

    const now = new Date().toISOString();
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'worker',
      message: `${ir.orgName} scheduled your interview for "${ir.requirementTitle}" on ${new Date(scheduledAt).toLocaleString()}.`,
      createdAt: now,
      read: false,
      link: '/worker/matches',
      category: 'staffing',
    };

    writeState({
      ...current,
      interviewRequests: current.interviewRequests.map((i) =>
        i.id === interviewRequestId ? { ...i, status: 'sent_to_worker', scheduledAt } : i
      ),
      notifications: [notification, ...current.notifications],
    });
  }, []);

  // Admin's one-step bypass of the normal org-discovers-then-invites path:
  // creates the match and immediately notifies the worker with a slot,
  // since admin already knows it — no separate approval round-trip.
  const createManualMatch = useCallback(
    (input: {
      requirementId: string;
      passportId: string;
      candidateName: string;
      specialty: string;
      scheduledAt: string;
    }) => {
      const current = readState();
      const requirement = current.requirements.find((r) => r.id === input.requirementId);
      if (!requirement) return;

      const now = new Date().toISOString();
      const match: RequirementMatch = {
        id: crypto.randomUUID(),
        passportId: input.passportId,
        candidateName: input.candidateName,
        specialty: input.specialty,
        status: 'invited_to_interview',
        matchedAt: now,
        // Admin picked this candidate directly — already "presented",
        // unlike an AI-suggested match which starts anonymized.
        presented: true,
      };
      const interviewRequest: InterviewRequest = {
        id: crypto.randomUUID(),
        requirementId: requirement.id,
        requirementTitle: requirement.title,
        matchId: match.id,
        passportId: input.passportId,
        candidateName: input.candidateName,
        orgName: requirement.orgName,
        createdAt: now,
        status: 'sent_to_worker',
        scheduledAt: input.scheduledAt,
      };
      const notification: AppNotification = {
        id: crypto.randomUUID(),
        audience: 'worker',
        message: `${requirement.orgName} scheduled your interview for "${requirement.title}" on ${new Date(input.scheduledAt).toLocaleString()}.`,
        createdAt: now,
        read: false,
        link: '/worker/matches',
        category: 'staffing',
      };

      writeState({
        ...current,
        requirements: current.requirements.map((r) =>
          r.id === requirement.id ? { ...r, matches: [match, ...r.matches] } : r
        ),
        interviewRequests: [interviewRequest, ...current.interviewRequests],
        notifications: [notification, ...current.notifications],
      });
      return match;
    },
    []
  );

  // Module4 — VivanteMatch AI ranking. Deterministic, instant (no fake
  // "thinking" delay, same convention as Module1's org verification):
  // scores the real Passport Vault against the requirement and appends
  // anonymized (presented: false) matches — recruiter (admin) approval
  // is what makes them visible to the org.
  const runAiMatching = useCallback((requirementId: string) => {
    const current = readState();
    const requirement = current.requirements.find((r) => r.id === requirementId);
    if (!requirement) return;

    const vault = getVaultWithOwnPassport();
    const workforceAnalysis = computeWorkforceAnalysis(
      requirement,
      vault,
      current.shiftRequests,
      current.assignRequests
    );
    const existingPassportIds = requirement.matches.map((m) => m.passportId);
    const ranked = rankCandidatesForRequirement(
      vault,
      requirement,
      current.requirements,
      current.availabilityRules,
      existingPassportIds
    );
    const now = new Date().toISOString();
    const newMatches: RequirementMatch[] = ranked.slice(0, 5).map((r) => ({
      id: crypto.randomUUID(),
      passportId: r.candidate.id,
      candidateName: r.candidate.name,
      specialty: r.candidate.specialty,
      status: 'open',
      matchedAt: now,
      aiMatchScore: r.matchScore.score,
      aiWhyReasons: r.matchScore.whyReasons,
      readiness: r.readiness,
      presented: false,
    }));

    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'org',
      message: `AI analysis complete for "${requirement.title}" — ${newMatches.length} candidate${newMatches.length === 1 ? '' : 's'} found.`,
      createdAt: now,
      read: false,
      link: `/org/requirements/${requirementId}`,
      category: 'staffing',
    };

    writeState({
      ...current,
      requirements: current.requirements.map((r) =>
        r.id === requirementId
          ? {
              ...r,
              workforceAnalysis,
              pipelineStatus: newMatches.length > 0 ? 'recruiter_review' : 'finding_candidates',
              matches: [...newMatches, ...r.matches],
            }
          : r
      ),
      notifications: [notification, ...current.notifications],
    });
    return newMatches;
  }, []);

  const recruiterApproveMatch = useCallback((requirementId: string, matchId: string) => {
    const current = readState();
    const requirement = current.requirements.find((r) => r.id === requirementId);
    const match = requirement?.matches.find((m) => m.id === matchId);
    if (!requirement || !match) return;

    const now = new Date().toISOString();
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'org',
      message: `Candidates ready for review on "${requirement.title}".`,
      createdAt: now,
      read: false,
      link: `/org/requirements/${requirementId}`,
      category: 'staffing',
    };

    writeState({
      ...current,
      requirements: current.requirements.map((r) =>
        r.id === requirementId
          ? {
              ...r,
              pipelineStatus: 'provider_review',
              matches: r.matches.map((m) => (m.id === matchId ? { ...m, presented: true } : m)),
            }
          : r
      ),
      notifications: [notification, ...current.notifications],
    });
  }, []);

  const recruiterEscalate = useCallback((requirementId: string, matchId: string) => {
    const current = readState();
    writeState({
      ...current,
      requirements: current.requirements.map((r) =>
        r.id === requirementId
          ? { ...r, matches: r.matches.map((m) => (m.id === matchId ? { ...m, escalated: true } : m)) }
          : r
      ),
    });
  }, []);

  const recruiterRequestCredentialUpdate = useCallback((requirementId: string, matchId: string) => {
    const current = readState();
    const requirement = current.requirements.find((r) => r.id === requirementId);
    const match = requirement?.matches.find((m) => m.id === matchId);
    if (!requirement || !match) return;

    const now = new Date().toISOString();
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'worker',
      message: `Please update your certifications/credentials on VivantePassport — requested for "${requirement.title}".`,
      createdAt: now,
      read: false,
      link: '/worker/passport',
      category: 'staffing',
    };
    writeState({ ...current, notifications: [notification, ...current.notifications] });
  }, []);

  const recruiterSearchAgain = useCallback((requirementId: string) => {
    const current = readState();
    const requirement = current.requirements.find((r) => r.id === requirementId);
    if (!requirement) return;

    const vault = getVaultWithOwnPassport();
    const existingPassportIds = requirement.matches.map((m) => m.passportId);
    const ranked = rankCandidatesForRequirement(
      vault,
      requirement,
      current.requirements,
      current.availabilityRules,
      existingPassportIds
    );
    const now = new Date().toISOString();
    const newMatches: RequirementMatch[] = ranked.slice(0, 3).map((r) => ({
      id: crypto.randomUUID(),
      passportId: r.candidate.id,
      candidateName: r.candidate.name,
      specialty: r.candidate.specialty,
      status: 'open',
      matchedAt: now,
      aiMatchScore: r.matchScore.score,
      aiWhyReasons: r.matchScore.whyReasons,
      readiness: r.readiness,
      presented: false,
    }));

    writeState({
      ...current,
      requirements: current.requirements.map((r) =>
        r.id === requirementId ? { ...r, matches: [...newMatches, ...r.matches] } : r
      ),
    });
    return newMatches;
  }, []);

  const providerRequestAnotherCandidate = useCallback((requirementId: string) => {
    const current = readState();
    const requirement = current.requirements.find((r) => r.id === requirementId);
    if (!requirement) return;

    const vault = getVaultWithOwnPassport();
    const existingPassportIds = requirement.matches.map((m) => m.passportId);
    const ranked = rankCandidatesForRequirement(
      vault,
      requirement,
      current.requirements,
      current.availabilityRules,
      existingPassportIds
    );
    const now = new Date().toISOString();
    const newMatches: RequirementMatch[] = ranked.slice(0, 3).map((r) => ({
      id: crypto.randomUUID(),
      passportId: r.candidate.id,
      candidateName: r.candidate.name,
      specialty: r.candidate.specialty,
      status: 'open',
      matchedAt: now,
      aiMatchScore: r.matchScore.score,
      aiWhyReasons: r.matchScore.whyReasons,
      readiness: r.readiness,
      presented: false,
    }));
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      audience: 'admin',
      message: `${requirement.orgName} requested more candidates for "${requirement.title}".`,
      createdAt: now,
      read: false,
      link: '/admin/requirements',
      category: 'staffing',
    };

    writeState({
      ...current,
      requirements: current.requirements.map((r) =>
        r.id === requirementId ? { ...r, matches: [...newMatches, ...r.matches] } : r
      ),
      notifications: [notification, ...current.notifications],
    });
    return newMatches;
  }, []);

  const providerShortlistMatch = useCallback((requirementId: string, matchId: string) => {
    const current = readState();
    writeState({
      ...current,
      requirements: current.requirements.map((r) =>
        r.id === requirementId
          ? { ...r, matches: r.matches.map((m) => (m.id === matchId ? { ...m, shortlisted: !m.shortlisted } : m)) }
          : r
      ),
    });
  }, []);

  return {
    ...state,
    setAvailabilityRules,
    createShiftRequest,
    createAssignRequest,
    respondToAssignRequest,
    requestShiftForPassport,
    pickPreferredCandidate,
    adminConfirmPreferred,
    adminSuggestSubstitute,
    orgAcceptSubstitute,
    orgCancelShiftRequest,
    completeShift,
    markNotificationRead,
    createRequirement,
    updateMatchStatus,
    requestMoreInfo,
    createInterviewRequest,
    sendInterviewSlot,
    createManualMatch,
    runAiMatching,
    recruiterApproveMatch,
    recruiterEscalate,
    recruiterRequestCredentialUpdate,
    recruiterSearchAgain,
    providerRequestAnotherCandidate,
    providerShortlistMatch,
  };
}
