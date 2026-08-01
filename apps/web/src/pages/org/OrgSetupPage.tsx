import { useState } from 'react';
import { OrgLayout } from './OrgLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/hooks/useSession';
import { useOrgRegistry } from '@/hooks/useOrgRegistry';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { getSetupProgress } from '@/lib/orgRegistration';
import type { Department, Facility, OrgLocation, OrgRole, OrgType, SubscriptionPlan } from '@/types';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from 'lucide-react';

const ORG_TYPES: OrgType[] = [
  'Hospital',
  'Clinic',
  'Skilled Nursing Facility',
  'Home Health',
  'Behavioral Health',
  'Hospice',
  'Rehabilitation',
];

const ORG_ROLES: OrgRole[] = [
  'Organization Administrator',
  'Staffing Manager',
  'Hiring Manager',
  'Department Manager',
  'Finance',
  'Executive Viewer',
];

const PLANS: SubscriptionPlan[] = ['Free Trial', 'Starter', 'Professional', 'Enterprise'];

type Section = 'organization' | 'facilities' | 'departments' | 'locations' | 'users' | 'billing';

export function OrgSetupPage() {
  const { session } = useSession();
  const { organizations, updateOrganizationProfile, setFacilities, setDepartments, setLocations, inviteTeamMember, completeSubscription } =
    useOrgRegistry();
  const { requirements } = useScheduleStore();
  const [expanded, setExpanded] = useState<Section | null>('organization');

  const org = organizations.find((o) => o.name === session?.orgName);

  const [newFacility, setNewFacility] = useState({ name: '', type: 'Home Health' as OrgType, location: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '', facilityId: '' });
  const [newLocation, setNewLocation] = useState({ label: '', address: '' });
  const [newInvite, setNewInvite] = useState({ email: '', role: 'Staffing Manager' as OrgRole });

  const [profile, setProfile] = useState(() => ({
    name: org?.name ?? '',
    businessEmail: org?.businessEmail ?? '',
    phone: org?.phone ?? '',
    orgType: org?.orgType ?? 'Home Health',
    numFacilities: String(org?.numFacilities ?? ''),
    numEmployees: String(org?.numEmployees ?? ''),
    website: org?.website ?? '',
    address: org?.address ?? '',
    timeZone: org?.timeZone ?? '',
  }));

  const hero = {
    title: 'Organization',
    subtitle: 'Manage your organization profile, facilities, departments, team, and billing.',
  };

  if (!org) {
    return (
      <OrgLayout hero={hero}>
        <p className="text-charcoal/60">
          No organization record found for this session — this page only works for orgs created
          via the /register flow (the 3 seeded demo orgs included).
        </p>
      </OrgLayout>
    );
  }

  const progress = getSetupProgress(org);
  const workforceRequests = requirements.filter((r) => r.orgName === org.name).length;

  const SECTIONS: { key: Section; label: string; done: boolean }[] = [
    { key: 'organization', label: 'Organization', done: progress.organization },
    { key: 'facilities', label: 'Facilities', done: progress.facilities },
    { key: 'departments', label: 'Departments', done: progress.departments },
    { key: 'locations', label: 'Locations', done: progress.locations },
    { key: 'users', label: 'Users', done: progress.users },
    { key: 'billing', label: 'Billing', done: progress.billing },
  ];

  return (
    <OrgLayout hero={hero}>

      <Card accent="navy" className="mb-8">
        <div className="text-lg font-bold text-charcoal mb-4">Today's Workforce Snapshot</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
          <Stat label="Facilities configured" value={org.facilities.length} />
          <Stat label="Users invited" value={org.team.length} />
          <Stat label="Departments configured" value={org.departments.length} />
          <Stat label="Workforce requests" value={workforceRequests} />
          <Stat label="Setup progress" value={`${progress.percent}%`} />
        </div>
        {progress.percent < 100 && (
          <p className="text-sm font-semibold text-navy">
            Complete your organization setup to start requesting clinicians.
          </p>
        )}
      </Card>

      <div className="space-y-3 mb-8">
        {SECTIONS.map((s) => {
          const isExpanded = expanded === s.key;
          return (
            <Card key={s.key} accent="neutral">
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => setExpanded(isExpanded ? null : s.key)}
              >
                <div className="flex items-center gap-2">
                  {s.done ? (
                    <CheckCircle2 size={18} className="text-teal" />
                  ) : (
                    <Circle size={18} className="text-charcoal/30" />
                  )}
                  <span className="text-lg font-bold text-charcoal">{s.label}</span>
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isExpanded && (
                <div className="mt-4 border-t border-charcoal/10 pt-4">
                  {s.key === 'organization' && (
                    <div className="space-y-3 max-w-lg">
                      <Field label="Organization Name">
                        <input
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                      </Field>
                      <Field label="Business Email">
                        <input
                          value={profile.businessEmail}
                          onChange={(e) => setProfile({ ...profile, businessEmail: e.target.value })}
                          className="w-full border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                      </Field>
                      <Field label="Phone">
                        <input
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                      </Field>
                      <Field label="Organization Type">
                        <select
                          value={profile.orgType}
                          onChange={(e) => setProfile({ ...profile, orgType: e.target.value as OrgType })}
                          className="w-full border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy bg-white"
                        >
                          {ORG_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Facilities">
                          <input
                            type="number"
                            value={profile.numFacilities}
                            onChange={(e) => setProfile({ ...profile, numFacilities: e.target.value })}
                            className="w-full border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                          />
                        </Field>
                        <Field label="Employees">
                          <input
                            type="number"
                            value={profile.numEmployees}
                            onChange={(e) => setProfile({ ...profile, numEmployees: e.target.value })}
                            className="w-full border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                          />
                        </Field>
                      </div>
                      <Field label="Website">
                        <input
                          value={profile.website}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                          className="w-full border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                      </Field>
                      <Field label="Address">
                        <input
                          value={profile.address}
                          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                          className="w-full border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                      </Field>
                      <Field label="Time Zone">
                        <input
                          value={profile.timeZone}
                          onChange={(e) => setProfile({ ...profile, timeZone: e.target.value })}
                          className="w-full border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                      </Field>
                      <Button
                        size="sm"
                        onClick={() =>
                          updateOrganizationProfile(org.id, {
                            ...profile,
                            numFacilities: Number(profile.numFacilities) || 0,
                            numEmployees: Number(profile.numEmployees) || 0,
                            website: profile.website || undefined,
                            address: profile.address || undefined,
                            timeZone: profile.timeZone || undefined,
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  )}

                  {s.key === 'facilities' && (
                    <div>
                      <ListRows
                        rows={org.facilities.map((f) => `${f.name} — ${f.type} — ${f.location}`)}
                        onRemove={(i) => setFacilities(org.id, org.facilities.filter((_, idx) => idx !== i))}
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                        <input
                          placeholder="Name"
                          value={newFacility.name}
                          onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                        <select
                          value={newFacility.type}
                          onChange={(e) => setNewFacility({ ...newFacility, type: e.target.value as OrgType })}
                          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy bg-white"
                        >
                          {ORG_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <input
                          placeholder="Location"
                          value={newFacility.location}
                          onChange={(e) => setNewFacility({ ...newFacility, location: e.target.value })}
                          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                        <Button
                          size="sm"
                          disabled={!newFacility.name.trim() || !newFacility.location.trim()}
                          onClick={() => {
                            const facility: Facility = { id: crypto.randomUUID(), ...newFacility };
                            setFacilities(org.id, [...org.facilities, facility]);
                            setNewFacility({ name: '', type: 'Home Health', location: '' });
                          }}
                        >
                          Add Facility
                        </Button>
                      </div>
                    </div>
                  )}

                  {s.key === 'departments' && (
                    <div>
                      <ListRows
                        rows={org.departments.map((d) => d.name)}
                        onRemove={(i) => setDepartments(org.id, org.departments.filter((_, idx) => idx !== i))}
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                        <input
                          placeholder="Department name"
                          value={newDepartment.name}
                          onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                        <select
                          value={newDepartment.facilityId}
                          onChange={(e) => setNewDepartment({ ...newDepartment, facilityId: e.target.value })}
                          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy bg-white"
                        >
                          <option value="">No specific facility</option>
                          {org.facilities.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={!newDepartment.name.trim()}
                          onClick={() => {
                            const department: Department = {
                              id: crypto.randomUUID(),
                              name: newDepartment.name,
                              facilityId: newDepartment.facilityId || undefined,
                            };
                            setDepartments(org.id, [...org.departments, department]);
                            setNewDepartment({ name: '', facilityId: '' });
                          }}
                        >
                          Add Department
                        </Button>
                      </div>
                    </div>
                  )}

                  {s.key === 'locations' && (
                    <div>
                      <ListRows
                        rows={org.locations.map((l) => `${l.label} — ${l.address}`)}
                        onRemove={(i) => setLocations(org.id, org.locations.filter((_, idx) => idx !== i))}
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                        <input
                          placeholder="Label"
                          value={newLocation.label}
                          onChange={(e) => setNewLocation({ ...newLocation, label: e.target.value })}
                          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                        <input
                          placeholder="Address"
                          value={newLocation.address}
                          onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                        <Button
                          size="sm"
                          disabled={!newLocation.label.trim() || !newLocation.address.trim()}
                          onClick={() => {
                            const location: OrgLocation = { id: crypto.randomUUID(), ...newLocation };
                            setLocations(org.id, [...org.locations, location]);
                            setNewLocation({ label: '', address: '' });
                          }}
                        >
                          Add Location
                        </Button>
                      </div>
                    </div>
                  )}

                  {s.key === 'users' && (
                    <div>
                      <ListRows rows={org.team.map((t) => `${t.email} — ${t.role}`)} />
                      <div className="flex flex-wrap gap-2 mt-3">
                        <input
                          type="email"
                          placeholder="Email"
                          value={newInvite.email}
                          onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                        />
                        <select
                          value={newInvite.role}
                          onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value as OrgRole })}
                          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy bg-white"
                        >
                          {ORG_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={!newInvite.email.trim()}
                          onClick={() => {
                            inviteTeamMember(org.id, newInvite.email.trim(), newInvite.role);
                            setNewInvite({ email: '', role: 'Staffing Manager' });
                          }}
                        >
                          Invite
                        </Button>
                      </div>
                      <p className="text-xs text-charcoal/40 mt-2">
                        Roles are recorded for reference — every invited teammate currently signs in
                        with the same organization access.
                      </p>
                    </div>
                  )}

                  {s.key === 'billing' && (
                    <div>
                      <p className="text-base text-charcoal mb-3">
                        Current plan:{' '}
                        <span className="font-bold text-teal">{org.subscriptionPlan ?? 'None selected'}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PLANS.map((p) => (
                          <Button
                            key={p}
                            size="sm"
                            variant={org.subscriptionPlan === p ? 'primary' : 'outline'}
                            onClick={() => completeSubscription(org.id, p)}
                          >
                            {p}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div>
        <div className="text-lg font-bold text-charcoal mb-3">Audit Trail</div>
        <div className="border border-charcoal/15 divide-y divide-charcoal/10">
          {org.auditLog.map((entry) => (
            <div key={entry.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
              <span className="text-charcoal">{entry.action}</span>
              <span className="text-charcoal/40">{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </OrgLayout>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-navy">{value}</div>
      <div className="text-xs text-charcoal/60 mt-0.5">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ListRows({ rows, onRemove }: { rows: string[]; onRemove?: (index: number) => void }) {
  if (rows.length === 0) {
    return <p className="text-sm text-charcoal/50">None yet.</p>;
  }
  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between border border-charcoal/10 px-3 py-2 text-sm">
          <span className="text-charcoal">{row}</span>
          {onRemove && (
            <button onClick={() => onRemove(i)} className="text-charcoal/40 hover:text-red-600">
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
