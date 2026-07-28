import type { Organization } from '@/types';

export function getEmailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

export interface OrgConflictResult {
  nameConflict: boolean;
  domainConflict: boolean;
}

/** Module1 Step 4 — duplicate org name and duplicate email domain checks. */
export function checkOrgConflicts(
  organizations: Organization[],
  name: string,
  businessEmail: string,
  excludeOrgId?: string
): OrgConflictResult {
  const normalizedName = name.trim().toLowerCase();
  const domain = getEmailDomain(businessEmail);
  const others = organizations.filter((o) => o.id !== excludeOrgId);

  return {
    nameConflict: others.some((o) => o.name.trim().toLowerCase() === normalizedName),
    domainConflict: others.some((o) => getEmailDomain(o.businessEmail) === domain),
  };
}

export interface SetupProgress {
  organization: boolean;
  facilities: boolean;
  departments: boolean;
  locations: boolean;
  users: boolean;
  billing: boolean;
  percent: number;
}

/** Derived from the org record itself — no separate completion flags to drift out of sync. */
export function getSetupProgress(org: Organization): SetupProgress {
  const steps = {
    organization: true, // exists once the record does — Step 2 is done by construction
    facilities: org.facilities.length > 0,
    departments: org.departments.length > 0,
    locations: org.locations.length > 0,
    users: org.team.length > 0,
    billing: Boolean(org.subscriptionPlan),
  };
  const doneCount = Object.values(steps).filter(Boolean).length;
  return { ...steps, percent: Math.round((doneCount / 6) * 100) };
}
