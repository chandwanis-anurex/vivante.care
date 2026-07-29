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
} from '@/types';
import { ASSIGN_REQUEST_TTL_MINUTES } from '@/lib/config';
import { getEffectiveStatus } from '@/lib/matching';
import { MOCK_REQUIREMENTS } from '@/lib/mockData';

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

function readState(): ScheduleState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw && cachedState) {
    return cachedState;
  }
  cachedRaw = raw;
  try {
    cachedState = raw ? (JSON.parse(raw) as ScheduleState) : seedState();
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

    writeState({
      ...current,
      assignRequests: current.assignRequests.map((a) =>
        a.id === id ? { ...a, status: response, respondedAt: now } : a
      ),
      shiftRequests: current.shiftRequests.map((s) =>
        s.id === ar.shiftId
          ? response === 'accepted'
            ? { ...s, status: 'assigned' }
            : { ...s, status: 'open', assignedPassportId: undefined, assignedWorkerName: undefined }
          : s
      ),
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
      const requirement: Requirement = {
        ...input,
        id: crypto.randomUUID(),
        openedAt: new Date().toISOString(),
        archived: false,
        matches: [],
      };
      writeState({ ...current, requirements: [requirement, ...current.requirements] });
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

  return {
    ...state,
    setAvailabilityRules,
    createShiftRequest,
    createAssignRequest,
    respondToAssignRequest,
    markNotificationRead,
    createRequirement,
    updateMatchStatus,
    requestMoreInfo,
    createInterviewRequest,
    sendInterviewSlot,
    createManualMatch,
  };
}
