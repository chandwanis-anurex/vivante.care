import type { Requirement } from '@/types';
import { getOwnPassport } from '@/lib/ownPassport';

export interface VaultEntry {
  id: string;
  name: string;
  specialty: string;
  licenseStatus: string;
  location: string;
}

export const MOCK_VAULT: VaultEntry[] = [
  { id: 'V4471290', name: 'Renee Castillo', specialty: 'Registered Nurse', licenseStatus: 'Current', location: 'San Diego, CA' },
  { id: 'V2290381', name: 'Marcus Whitfield', specialty: 'Registered Nurse', licenseStatus: 'Current', location: 'Austin, TX' },
  { id: 'V8813204', name: 'Priya Nandakumar', specialty: 'LVN', licenseStatus: 'Expiring Soon', location: 'Sacramento, CA' },
];

// No real multi-account backend yet — merges in whatever passport the
// worker persona in this same browser has actually filled out, so the
// assign-request flow is testable end to end without a server.
export function getVaultWithOwnPassport(): VaultEntry[] {
  const own = getOwnPassport();
  if (!own?.values.fullName) return MOCK_VAULT;
  const ownEntry: VaultEntry = {
    id: own.id,
    name: own.values.fullName,
    specialty: own.values.specialty || 'Unspecified',
    licenseStatus: 'Current',
    location: own.values.location || 'Unspecified',
  };
  return [ownEntry, ...MOCK_VAULT.filter((v) => v.id !== own.id)];
}

// Prototype fixture data standing in for GET /api/requirements.
// Shapes match the Requirement type so swapping in the real
// apps/server endpoint later is a drop-in replacement.
export const MOCK_REQUIREMENTS: Requirement[] = [
  {
    id: 'req_1',
    title: 'Weekend RN — Home Health',
    specialty: 'Registered Nurse',
    location: 'San Diego, CA',
    shiftType: 'Weekend, Days',
    orgName: 'Concierge Home Care',
    openedAt: '2026-07-18T14:00:00Z',
    archived: false,
    matches: [
      {
        id: 'm_1',
        passportId: 'V4471290',
        candidateName: 'Renee Castillo',
        specialty: 'Registered Nurse',
        status: 'open',
        matchedAt: '2026-07-19T09:00:00Z',
      },
      {
        id: 'm_2',
        passportId: 'V2290381',
        candidateName: 'Marcus Whitfield',
        specialty: 'Registered Nurse',
        status: 'invited_to_interview',
        matchedAt: '2026-07-19T09:00:00Z',
      },
    ],
  },
  {
    id: 'req_2',
    title: 'PT Coverage — Post-Surgical',
    specialty: 'Physical Therapist',
    location: 'Austin, TX',
    shiftType: 'Weekday, Flexible',
    orgName: 'Palmeira Home Health',
    openedAt: '2026-07-20T10:30:00Z',
    archived: false,
    matches: [],
  },
  {
    id: 'req_3',
    title: 'Overnight LVN — Pediatric',
    specialty: 'Licensed Vocational Nurse',
    location: 'Sacramento, CA',
    shiftType: 'Overnight',
    orgName: 'Sunrise Staffing Partners',
    openedAt: '2026-07-15T08:00:00Z',
    archived: true,
    matches: [
      {
        id: 'm_3',
        passportId: 'V8813204',
        candidateName: 'Priya Nandakumar',
        specialty: 'Licensed Vocational Nurse',
        status: 'not_interested',
        matchedAt: '2026-07-16T09:00:00Z',
      },
    ],
  },
];
