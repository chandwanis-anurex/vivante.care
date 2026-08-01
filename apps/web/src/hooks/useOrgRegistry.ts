import { useCallback, useSyncExternalStore } from 'react';
import type {
  AuditLogEntry,
  Department,
  DraftApprovalStatus,
  Facility,
  OrgLocation,
  OrgRole,
  Organization,
  OrgVerificationStatus,
  RequirementDraft,
  RequirementTemplate,
  SubscriptionPlan,
  WizardFormSnapshot,
} from '@/types';
import { MOCK_ORGS } from '@/lib/orgs';
import { checkOrgConflicts } from '@/lib/orgRegistration';

// Prototype-only store (localStorage), same useSyncExternalStore pattern
// as hooks/useSession.ts / hooks/useScheduleStore.ts. Kept as its own
// domain/key rather than folded into useScheduleStore — org registration
// (verification, subscription, facilities/departments/team) is a
// distinct concern from the shift/requirement matching data.
const STORAGE_KEY = 'vivantecare.orgRegistry';
const listeners = new Set<() => void>();

interface RegistryState {
  organizations: Organization[];
}

function seedState(): RegistryState {
  const now = new Date().toISOString();
  const base = (
    name: string,
    businessEmail: string,
    orgType: Organization['orgType'],
    plan: SubscriptionPlan
  ): Organization => ({
    id: crypto.randomUUID(),
    name,
    businessEmail,
    phone: '(555) 010-0100',
    orgType,
    numFacilities: 1,
    numEmployees: 25,
    verificationStatus: 'verified',
    createdAt: now,
    subscriptionPlan: plan,
    facilities: [],
    departments: [],
    locations: [],
    team: [],
    auditLog: [{ id: crypto.randomUUID(), action: 'Created organization', actor: 'System', createdAt: now }],
    requestTemplates: [],
    requestDrafts: [],
  });

  return {
    organizations: [
      base(MOCK_ORGS[0], 'admin@concierge.com', 'Home Health', 'Professional'),
      base(MOCK_ORGS[1], 'admin@palmeirahomehealth.com', 'Home Health', 'Starter'),
      base(MOCK_ORGS[2], 'admin@sunrisestaffing.com', 'Hospice', 'Free Trial'),
    ],
  };
}

// Backfills array fields that didn't exist yet when a given browser's
// localStorage was first written (e.g. requestTemplates/requestDrafts
// were added in later modules) — without this, an org persisted before
// one of those fields existed crashes every read site that assumes it's
// always an array (e.g. `org.requestDrafts.find(...)`).
function normalizeOrg(org: Organization): Organization {
  return {
    ...org,
    facilities: org.facilities ?? [],
    departments: org.departments ?? [],
    locations: org.locations ?? [],
    team: org.team ?? [],
    auditLog: org.auditLog ?? [],
    requestTemplates: org.requestTemplates ?? [],
    requestDrafts: org.requestDrafts ?? [],
  };
}

let cachedRaw: string | null | undefined;
let cachedState: RegistryState | null = null;

function readState(): RegistryState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw && cachedState) {
    return cachedState;
  }
  cachedRaw = raw;
  try {
    cachedState = raw ? (JSON.parse(raw) as RegistryState) : seedState();
    if (raw) cachedState.organizations = cachedState.organizations.map(normalizeOrg);
  } catch {
    cachedState = seedState();
  }
  return cachedState;
}

function writeState(next: RegistryState) {
  cachedState = next;
  cachedRaw = JSON.stringify(next);
  localStorage.setItem(STORAGE_KEY, cachedRaw);
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): RegistryState {
  return readState();
}

function getServerSnapshot(): RegistryState {
  return seedState();
}

function audit(action: string): AuditLogEntry {
  return { id: crypto.randomUUID(), action, actor: 'Organization Admin', createdAt: new Date().toISOString() };
}

export function useOrgRegistry() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const registerOrganization = useCallback(
    (input: Pick<
      Organization,
      'name' | 'businessEmail' | 'phone' | 'orgType' | 'numFacilities' | 'numEmployees' | 'website' | 'address' | 'timeZone'
    >) => {
      const current = readState();
      const org: Organization = {
        ...input,
        id: crypto.randomUUID(),
        verificationStatus: 'pending_email',
        createdAt: new Date().toISOString(),
        facilities: [],
        departments: [],
        locations: [],
        team: [],
        auditLog: [audit('Created organization')],
        requestTemplates: [],
        requestDrafts: [],
      };
      writeState({ organizations: [org, ...current.organizations] });
      return org;
    },
    []
  );

  const verifyOrganization = useCallback((orgId: string) => {
    const current = readState();
    const org = current.organizations.find((o) => o.id === orgId);
    if (!org) return null;

    const conflicts = checkOrgConflicts(current.organizations, org.name, org.businessEmail, orgId);
    const status: OrgVerificationStatus = conflicts.nameConflict || conflicts.domainConflict ? 'blocked' : 'verified';

    writeState({
      organizations: current.organizations.map((o) => (o.id === orgId ? { ...o, verificationStatus: status } : o)),
    });
    return { status, conflicts };
  }, []);

  const completeSubscription = useCallback((orgId: string, plan: SubscriptionPlan) => {
    const current = readState();
    writeState({
      organizations: current.organizations.map((o) =>
        o.id === orgId
          ? { ...o, subscriptionPlan: plan, auditLog: [audit(`Updated settings (subscription: ${plan})`), ...o.auditLog] }
          : o
      ),
    });
  }, []);

  const setFacilities = useCallback((orgId: string, facilities: Facility[]) => {
    const current = readState();
    writeState({
      organizations: current.organizations.map((o) => (o.id === orgId ? { ...o, facilities } : o)),
    });
  }, []);

  const setDepartments = useCallback((orgId: string, departments: Department[]) => {
    const current = readState();
    writeState({
      organizations: current.organizations.map((o) => (o.id === orgId ? { ...o, departments } : o)),
    });
  }, []);

  const setLocations = useCallback((orgId: string, locations: OrgLocation[]) => {
    const current = readState();
    writeState({
      organizations: current.organizations.map((o) => (o.id === orgId ? { ...o, locations } : o)),
    });
  }, []);

  const inviteTeamMember = useCallback((orgId: string, email: string, role: OrgRole) => {
    const current = readState();
    writeState({
      organizations: current.organizations.map((o) =>
        o.id === orgId
          ? {
              ...o,
              team: [{ id: crypto.randomUUID(), email, role, invitedAt: new Date().toISOString() }, ...o.team],
              auditLog: [audit(`Invited user (${email}) as ${role}`), ...o.auditLog],
            }
          : o
      ),
    });
  }, []);

  const updateOrganizationProfile = useCallback(
    (
      orgId: string,
      fields: Partial<
        Pick<
          Organization,
          'name' | 'businessEmail' | 'phone' | 'orgType' | 'numFacilities' | 'numEmployees' | 'website' | 'address' | 'timeZone'
        >
      >
    ) => {
      const current = readState();
      writeState({
        organizations: current.organizations.map((o) =>
          o.id === orgId ? { ...o, ...fields, auditLog: [audit('Updated settings'), ...o.auditLog] } : o
        ),
      });
    },
    []
  );

  // General-purpose external audit hook — lets other stores/pages (e.g.
  // the workforce-request wizard) record an action on this org without
  // reaching into useOrgRegistry's internals.
  const logAudit = useCallback((orgId: string, action: string) => {
    const current = readState();
    writeState({
      organizations: current.organizations.map((o) =>
        o.id === orgId ? { ...o, auditLog: [audit(action), ...o.auditLog] } : o
      ),
    });
  }, []);

  const saveRequestTemplate = useCallback(
    (orgId: string, template: Omit<RequirementTemplate, 'id' | 'createdAt'>) => {
      const current = readState();
      const saved: RequirementTemplate = { ...template, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      writeState({
        organizations: current.organizations.map((o) =>
          o.id === orgId ? { ...o, requestTemplates: [saved, ...o.requestTemplates] } : o
        ),
      });
      return saved;
    },
    []
  );

  // Module4 — Draft Workforce Requests: save/resume, reviewers, comments,
  // and version history. updateDraft is the silent 30s-autosave path
  // (just patches the live snapshot); saveDraftVersion is the explicit,
  // deliberate checkpoint — kept separate so autosave doesn't flood
  // version history every 30 seconds.
  const createDraft = useCallback((orgId: string, form: WizardFormSnapshot, createdBy: string) => {
    const current = readState();
    const now = new Date().toISOString();
    const draft: RequirementDraft = {
      id: crypto.randomUUID(),
      orgName: current.organizations.find((o) => o.id === orgId)?.name ?? '',
      createdBy,
      title: form.specialty || 'Untitled Request',
      form,
      step: 1,
      reviewers: [],
      comments: [],
      versions: [],
      approvalStatus: 'not_required',
      createdAt: now,
      updatedAt: now,
    };
    writeState({
      organizations: current.organizations.map((o) =>
        o.id === orgId ? { ...o, requestDrafts: [draft, ...o.requestDrafts] } : o
      ),
    });
    return draft;
  }, []);

  const updateDraft = useCallback(
    (orgId: string, draftId: string, patch: { form?: WizardFormSnapshot; step?: number }) => {
      const current = readState();
      writeState({
        organizations: current.organizations.map((o) =>
          o.id === orgId
            ? {
                ...o,
                requestDrafts: o.requestDrafts.map((d) =>
                  d.id === draftId
                    ? {
                        ...d,
                        ...patch,
                        title: patch.form?.specialty || d.title,
                        updatedAt: new Date().toISOString(),
                      }
                    : d
                ),
              }
            : o
        ),
      });
    },
    []
  );

  const saveDraftVersion = useCallback((orgId: string, draftId: string, label: string, savedBy: string) => {
    const current = readState();
    const org = current.organizations.find((o) => o.id === orgId);
    const draft = org?.requestDrafts.find((d) => d.id === draftId);
    if (!org || !draft) return;

    const version = { id: crypto.randomUUID(), label, snapshot: draft.form, savedAt: new Date().toISOString(), savedBy };
    writeState({
      organizations: current.organizations.map((o) =>
        o.id === orgId
          ? {
              ...o,
              requestDrafts: o.requestDrafts.map((d) =>
                d.id === draftId ? { ...d, versions: [version, ...d.versions] } : d
              ),
            }
          : o
      ),
    });
  }, []);

  const addDraftComment = useCallback((orgId: string, draftId: string, author: string, text: string) => {
    const current = readState();
    const comment = { id: crypto.randomUUID(), author, text, createdAt: new Date().toISOString() };
    writeState({
      organizations: current.organizations.map((o) =>
        o.id === orgId
          ? {
              ...o,
              requestDrafts: o.requestDrafts.map((d) =>
                d.id === draftId ? { ...d, comments: [comment, ...d.comments] } : d
              ),
            }
          : o
      ),
    });
  }, []);

  const setDraftReviewers = useCallback((orgId: string, draftId: string, reviewers: string[]) => {
    const current = readState();
    writeState({
      organizations: current.organizations.map((o) =>
        o.id === orgId
          ? {
              ...o,
              requestDrafts: o.requestDrafts.map((d) =>
                d.id === draftId
                  ? {
                      ...d,
                      reviewers,
                      approvalStatus:
                        reviewers.length > 0 && d.approvalStatus === 'not_required' ? 'pending' : d.approvalStatus,
                    }
                  : d
              ),
            }
          : o
      ),
    });
  }, []);

  const setDraftApproval = useCallback((orgId: string, draftId: string, status: DraftApprovalStatus) => {
    const current = readState();
    writeState({
      organizations: current.organizations.map((o) =>
        o.id === orgId
          ? { ...o, requestDrafts: o.requestDrafts.map((d) => (d.id === draftId ? { ...d, approvalStatus: status } : d)) }
          : o
      ),
    });
  }, []);

  const deleteDraft = useCallback((orgId: string, draftId: string) => {
    const current = readState();
    writeState({
      organizations: current.organizations.map((o) =>
        o.id === orgId ? { ...o, requestDrafts: o.requestDrafts.filter((d) => d.id !== draftId) } : o
      ),
    });
  }, []);

  return {
    ...state,
    registerOrganization,
    verifyOrganization,
    completeSubscription,
    setFacilities,
    setDepartments,
    setLocations,
    inviteTeamMember,
    updateOrganizationProfile,
    logAudit,
    saveRequestTemplate,
    createDraft,
    updateDraft,
    saveDraftVersion,
    addDraftComment,
    setDraftReviewers,
    setDraftApproval,
    deleteDraft,
  };
}
