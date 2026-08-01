import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShiftStatusBadge } from '@/components/ui/StatusBadge';
import { useSession } from '@/hooks/useSession';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useOrgRegistry } from '@/hooks/useOrgRegistry';
import { useNow } from '@/hooks/useNow';
import { getVaultWithOwnPassport } from '@/lib/mockData';
import {
  rankCandidates,
  getEffectiveStatus,
  getDisplayShiftStatus,
  formatCountdown,
  type RankedCandidate,
} from '@/lib/matching';
import type { ShiftRequest } from '@/types';
import { Plus, X } from 'lucide-react';

interface Picker {
  shift: ShiftRequest;
  mode: 'auto' | 'browse';
}

export function OrgShiftsPage() {
  const { session } = useSession();
  const { shiftRequests, availabilityRules, assignRequests, pickPreferredCandidate, orgAcceptSubstitute, orgCancelShiftRequest } =
    useScheduleStore();
  const { organizations, logAudit } = useOrgRegistry();
  const now = useNow();
  const vault = useMemo(() => getVaultWithOwnPassport(), []);
  const [picker, setPicker] = useState<Picker | null>(null);
  const myShifts = useMemo(
    () => shiftRequests.filter((s) => s.orgName === session?.orgName),
    [shiftRequests, session?.orgName]
  );

  function auditThis(action: string) {
    const org = organizations.find((o) => o.name === session?.orgName);
    if (org) logAudit(org.id, action);
  }

  function pendingAssignRequestFor(shiftId: string) {
    return assignRequests.find((ar) => ar.shiftId === shiftId && getEffectiveStatus(ar) === 'pending');
  }

  function handleAssign(shift: ShiftRequest, candidate: RankedCandidate) {
    pickPreferredCandidate(shift.id, candidate.passportId, candidate.name);
    auditThis(`Requested ${candidate.name} (${candidate.passportId}) for "${shift.title}"`);
    setPicker(null);
  }

  const candidates = picker
    ? rankCandidates(vault, availabilityRules, picker.shift, assignRequests, shiftRequests)
    : [];
  const shownCandidates = picker?.mode === 'auto' ? candidates.slice(0, 3) : candidates;

  return (
    <OrgLayout
      hero={{
        title: 'Shifts',
        subtitle: 'Post a shift, then let the system suggest a match or browse the Passport Vault yourself.',
      }}
    >
      <div className="flex items-center justify-end mb-8">
        <Link to="/org/shifts/new">
          <Button>
            <Plus size={16} />
            New Shift
          </Button>
        </Link>
      </div>

      {myShifts.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">No shifts yet — post your first one.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {myShifts.map((shift) => {
            const displayStatus = getDisplayShiftStatus(shift, assignRequests, now);
            const ar = pendingAssignRequestFor(shift.id);
            return (
              <Card key={shift.id} accent="neutral">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-charcoal">{shift.title}</div>
                    <div className="text-sm text-charcoal/60 mt-0.5">
                      {shift.specialty} · {shift.location} · {shift.label}
                    </div>
                  </div>
                  <ShiftStatusBadge status={displayStatus} />
                </div>

                {displayStatus === 'open' && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => setPicker({ shift, mode: 'auto' })}>
                      Auto-Match
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPicker({ shift, mode: 'browse' })}>
                      Browse Vault
                    </Button>
                  </div>
                )}

                {displayStatus === 'pending_admin_review' && (
                  <div className="mt-4 text-sm text-charcoal/70">
                    Requested <span className="font-semibold text-navy">{shift.preferredWorkerName}</span> ·{' '}
                    <span className="font-semibold text-amber-600">Awaiting VivanteCare review</span>
                  </div>
                )}

                {displayStatus === 'pending_org_response' && (
                  <div className="mt-4 border border-purple/30 bg-purple/5 p-3">
                    <p className="text-sm text-charcoal/80">
                      <span className="font-semibold">{shift.preferredWorkerName}</span> isn't available.
                      VivanteCare suggests{' '}
                      <span className="font-semibold text-navy">
                        {shift.substituteWorkerName} ({shift.substitutePassportId})
                      </span>
                      {shift.substituteNote && ` — ${shift.substituteNote}`}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          orgAcceptSubstitute(shift.id);
                          auditThis(`Accepted substitute ${shift.substituteWorkerName} for "${shift.title}"`);
                        }}
                      >
                        Accept Shift
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          orgCancelShiftRequest(shift.id);
                          auditThis(`Cancelled shift request "${shift.title}"`);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {displayStatus === 'pending_assignment' && ar && (
                  <div className="mt-4 text-sm text-charcoal/70">
                    Awaiting response from{' '}
                    <span className="font-semibold text-navy">{shift.assignedWorkerName}</span>
                    {' · '}
                    <span className="font-semibold text-amber-700">
                      Expires in {formatCountdown(ar.expiresAt, now)}
                    </span>
                  </div>
                )}

                {displayStatus === 'assigned' && (
                  <div className="mt-4 text-sm font-semibold text-teal">
                    Assigned to {shift.assignedWorkerName}
                  </div>
                )}

                {displayStatus === 'cancelled' && (
                  <div className="mt-4 text-sm font-semibold text-red-600">Cancelled</div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {picker && (
        <div className="fixed inset-0 bg-charcoal/40 flex items-center justify-center z-50 p-6">
          <Card accent="neutral" className="bg-white max-w-2xl w-full relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setPicker(null)}
              className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal"
            >
              <X size={20} />
            </button>
            <div className="text-xl font-bold text-charcoal mb-1">
              {picker.mode === 'auto' ? 'Suggested Matches' : 'Browse Passport Vault'}
            </div>
            <p className="text-sm text-charcoal/60 mb-4">
              For "{picker.shift.title}" — {picker.shift.label}
            </p>

            {shownCandidates.length === 0 ? (
              <p className="text-base text-charcoal/50 py-8 text-center">
                No passports match this shift's specialty.
              </p>
            ) : (
              <div className="space-y-2">
                {shownCandidates.map((c) => (
                  <div
                    key={c.passportId}
                    className="border border-charcoal/15 p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-base font-bold text-charcoal">{c.name}</div>
                      <div className="text-sm text-charcoal/60">
                        {c.passportId} · {c.specialty} · {c.coveredOccurrences}/{c.totalOccurrences} shift dates
                        available
                      </div>
                      {c.conflicts.length > 0 && (
                        <div className="text-xs text-amber-700 font-semibold mt-1">
                          Conflicts on {c.conflicts.join(', ')}
                        </div>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleAssign(picker.shift, c)}>
                      Request
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </OrgLayout>
  );
}
