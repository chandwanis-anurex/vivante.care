export type UserRole = 'org' | 'worker' | 'admin';

export interface Session {
  role: UserRole;
  name: string;
  orgName?: string;
}

export type MatchStatus =
  | 'open'
  | 'more_info_required'
  | 'invited_to_interview'
  | 'under_interview'
  | 'selected' // org has chosen this candidate post-interview, awaiting shift assignment
  | 'not_interested'
  | 'archived'
  | 'closed';

export interface RequirementMatch {
  id: string;
  passportId: string; // e.g. V4471290
  candidateName: string;
  specialty: string;
  status: MatchStatus;
  matchedAt: string;
}

export interface Requirement {
  id: string;
  title: string;
  specialty: string;
  location: string;
  shiftType: string;
  orgName: string;
  openedAt: string;
  archived: boolean;
  matches: RequirementMatch[];
  additionalInfoRequested?: string[];
}

export type InterviewRequestStatus = 'pending_admin' | 'sent_to_worker';

// Created when an org requests an interview for a match — admin (not the
// org, not the worker) is the one who picks the actual slot.
export interface InterviewRequest {
  id: string;
  requirementId: string;
  requirementTitle: string;
  matchId: string;
  passportId: string;
  candidateName: string;
  orgName: string;
  createdAt: string;
  status: InterviewRequestStatus;
  scheduledAt?: string; // ISO datetime — set when admin sends it to the worker
  note?: string; // optional note the org left when requesting
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun–Sat

// One recurring or one-off block of time. daysOfWeek=null means "every day
// in the date range"; startTime/endTime=null means "all day". This single
// shape covers "weekends in August", "Tue/Thu evenings year-round", "Aug
// 15-16 I'm already booked", and a plain one-off single day.
export interface ScheduleRule {
  id: string;
  kind: 'available' | 'occupied';
  daysOfWeek: DayOfWeek[] | null;
  startDate: string; // ISO date, inclusive
  endDate: string; // ISO date, inclusive
  startTime: string | null; // "HH:mm"
  endTime: string | null;
  label: string; // human-readable summary (AI-authored or manual)
}

export type ShiftStatus = 'open' | 'pending_assignment' | 'assigned' | 'complete';

// The org's demand-side counterpart to ScheduleRule — reuses the same
// recurrence shape so matching is a straight overlap comparison.
export interface ShiftRequest {
  id: string;
  title: string;
  specialty: string;
  location: string;
  orgName: string;
  daysOfWeek: DayOfWeek[] | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  label: string;
  notes?: string;
  createdAt: string;
  status: ShiftStatus;
  assignedPassportId?: string;
  assignedWorkerName?: string;
}

export type AssignRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface AssignRequest {
  id: string;
  shiftId: string;
  passportId: string;
  workerName: string;
  orgName: string;
  createdAt: string;
  expiresAt: string;
  // Stored terminal state; a 'pending' request past expiresAt reads as
  // expired at read time — see getEffectiveStatus in lib/matching.ts.
  status: AssignRequestStatus;
  // Set when respondToAssignRequest fires — powers a real "time to fill"
  // metric instead of a fabricated one (see lib/dashboardMetrics.ts).
  respondedAt?: string;
}

export interface AppNotification {
  id: string;
  audience: 'worker' | 'org' | 'admin';
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
  // Everything created today is staffing-related — compliance/finance/
  // system notifications don't exist yet, so those groupings render with
  // a real empty state rather than fabricated content.
  category?: 'staffing' | 'compliance' | 'finance' | 'system';
}

export type OrgType =
  | 'Hospital'
  | 'Clinic'
  | 'Skilled Nursing Facility'
  | 'Home Health'
  | 'Behavioral Health'
  | 'Hospice'
  | 'Rehabilitation';

export type SubscriptionPlan = 'Free Trial' | 'Starter' | 'Professional' | 'Enterprise';

export type OrgVerificationStatus = 'pending_email' | 'verified' | 'blocked';

export type OrgRole =
  | 'Organization Administrator'
  | 'Staffing Manager'
  | 'Hiring Manager'
  | 'Department Manager'
  | 'Finance'
  | 'Executive Viewer';

export interface Facility {
  id: string;
  name: string;
  type: OrgType;
  location: string;
}

export interface Department {
  id: string;
  name: string;
  facilityId?: string;
}

export interface OrgLocation {
  id: string;
  label: string;
  address: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: OrgRole;
  invitedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  businessEmail: string;
  phone: string;
  orgType: OrgType;
  numFacilities: number;
  numEmployees: number;
  website?: string;
  address?: string;
  timeZone?: string;
  verificationStatus: OrgVerificationStatus;
  createdAt: string;
  // Unset while an Enterprise plan's sales workflow is pending —
  // absence of a plan is what keeps an org out of the login picker.
  subscriptionPlan?: SubscriptionPlan;
  facilities: Facility[];
  departments: Department[];
  locations: OrgLocation[];
  team: TeamInvite[];
  auditLog: AuditLogEntry[];
}
