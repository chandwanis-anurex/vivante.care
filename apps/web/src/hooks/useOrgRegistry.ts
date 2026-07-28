import { useCallback, useSyncExternalStore } from 'react';
import type {
  AuditLogEntry,
  Department,
  Facility,
  OrgLocation,
  OrgRole,
  Organization,
  OrgVerificationStatus,
  SubscriptionPlan,
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
  });

  return {
    organizations: [
      base(MOCK_ORGS[0], 'admin@concierge.com', 'Home Health', 'Professional'),
      base(MOCK_ORGS[1], 'admin@palmeirahomehealth.com', 'Home Health', 'Starter'),
      base(MOCK_ORGS[2], 'admin@sunrisestaffing.com', 'Hospice', 'Free Trial'),
    ],
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
  };
}
