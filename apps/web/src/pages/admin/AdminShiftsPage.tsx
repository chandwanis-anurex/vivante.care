import { useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShiftStatusBadge } from '@/components/ui/StatusBadge';
import { useScheduleStore } from '@/hooks/useScheduleStore';
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
import { X } from 'lucide-react';

const DEFAULT_SUBSTITUTE_NOTE = 'Not available for the requested dates';

interface Picker {
  shift: ShiftRequest;
  mode: 'auto' | 'browse' | 'substitute';
}

export function AdminShiftsPage() {
  const {
    requirements,
    shiftRequests,
    availabilityRules,
    assignRequests,
    createAssignRequest,
    adminConfirmPreferred,
    adminSuggestSubstitute,
  } = useScheduleStore();
  const now = useNow();
  const vault = useMemo(() => getVaultWithOwnPassport(), []);
  const [picker, setPicker] = useState<Picker | null>(null);

  const pendingReview = useMemo(
    () => shiftRequests.filter((s) => getDisplayShiftStatus(s, assignRequests, now) === 'pending_admin_review'),
    [shiftRequests, assignRequests, now]
  );

  // Selected (post-interview) candidates who don't yet have an active or
  // confirmed shift assignment anywhere.
  const selectedUnassigned = useMemo(() => {
    return requirements.flatMap((requirement) =>
      requirement.matches
        .filter((match) => match.status === 'selected')
        .filter(
          (match) =>
            !shiftRequests.some(
              (s) =>
                s.assignedPassportId === match.passportId &&
                getDisplayShiftStatus(s, assignRequests, now) !== 'open'
            )
        )
        .map((match) => ({ requirement, match }))
    );
  }, [requirements, shiftRequests, assignRequests, now]);

  function pendingAssignRequestFor(shiftId: string) {
    return assignRequests.find((ar) => ar.shiftId === shiftId && getEffectiveStatus(ar) === 'pending');
  }

  function handleAssign(shift: ShiftRequest, candidate: RankedCandidate) {
    createAssignRequest(shift, candidate.passportId, candidate.name, shift.orgName);
    setPicker(null);
  }

  function handleSuggestSubstitute(shift: ShiftRequest, candidate: RankedCandidate) {
    adminSuggestSubstitute(shift.id, candidate.passportId, candidate.name, DEFAULT_SUBSTITUTE_NOTE);
    setPicker(null);
  }

  const candidates = picker
    ? rankCandidates(vault, availabilityRules, picker.shift, assignRequests, shiftRequests).filter(
        (c) => c.passportId !== picker.shift.preferredPassportId
      )
    : [];
  const shownCandidates = picker?.mode === 'auto' ? candidates.slice(0, 3) : candidates;

  return (
    <AdminLayout
      hero={{
        title: 'Shifts',
        subtitle: "Every org's shifts. Manually match a worker to a shift instead of relying on auto-match.",
      }}
    >
      <div className="text-lg font-bold text-charcoal mb-3">Pending Review</div>
      {pendingReview.length === 0 ? (
        <Card className="text-center py-10 mb-8">
          <p className="text-base text-charcoal/50">No shift requests waiting on review.</p>
        </Card>
      ) : (
        <div className="space-y-2 mb-8">
          {pendingReview.map((shift) => (
            <Card key={shift.id} accent="neutral">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-base font-bold text-charcoal">{shift.title}</div>
                  <div className="text-sm text-charcoal/60">
                    {shift.orgName} · {shift.specialty} · {shift.location} · {shift.label}
                  </div>
                  <div className="text-sm text-charcoal/70 mt-1">
                    Requested worker:{' '}
                    <span className="font-semibold text-navy">
                      {shift.preferredWorkerName} ({shift.preferredPassportId})
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => adminConfirmPreferred(shift.id)}>
                    Confirm &amp; Notify Worker
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPicker({ shift, mode: 'substitute' })}>
                    Suggest Alternate
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="text-lg font-bold text-charcoal mb-3">Selected &amp; Awaiting Shift</div>
      {selectedUnassigned.length === 0 ? (
        <Card className="text-center py-10 mb-8">
          <p className="text-base text-charcoal/50">No selected candidates waiting on a shift.</p>
        </Card>
      ) : (
        <div className="space-y-2 mb-8">
          {selectedUnassigned.map(({ requirement, match }) => (
            <Card key={match.id} accent="neutral" className="flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-charcoal">{match.candidateName}</div>
                <div className="text-sm text-charcoal/60">
                  {match.passportId} · {match.specialty} · selected by {requirement.orgName} for "
                  {requirement.title}"
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="text-lg font-bold text-charcoal mb-3">All Shifts</div>
      {shiftRequests.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">No shifts posted yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {shiftRequests.map((shift) => {
            const displayStatus = getDisplayShiftStatus(shift, assignRequests, now);
            const ar = pendingAssignRequestFor(shift.id);
            return (
              <Card key={shift.id} accent="neutral">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-charcoal">{shift.title}</div>
                    <div className="text-sm text-charcoal/60 mt-0.5">
                      {shift.orgName} · {shift.specialty} · {shift.location} · {shift.label}
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
                      Manually Assign
                    </Button>
                  </div>
                )}

                {displayStatus === 'pending_admin_review' && (
                  <div className="mt-4 text-sm text-charcoal/70">
                    Requested <span className="font-semibold text-navy">{shift.preferredWorkerName}</span> — see
                    Pending Review above.
                  </div>
                )}

                {displayStatus === 'pending_org_response' && (
                  <div className="mt-4 text-sm text-charcoal/70">
                    Suggested <span className="font-semibold text-navy">{shift.substituteWorkerName}</span> ·{' '}
                    <span className="font-semibold text-purple">Awaiting org response</span>
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
              {picker.mode === 'auto'
                ? 'Suggested Matches'
                : picker.mode === 'substitute'
                  ? 'Suggest an Alternate'
                  : 'Manually Assign'}
            </div>
            <p className="text-sm text-charcoal/60 mb-4">
              For "{picker.shift.title}" ({picker.shift.orgName}) — {picker.shift.label}
              {picker.mode === 'substitute' && ` — excluding ${picker.shift.preferredWorkerName}`}
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
                    <Button
                      size="sm"
                      onClick={() =>
                        picker.mode === 'substitute'
                          ? handleSuggestSubstitute(picker.shift, c)
                          : handleAssign(picker.shift, c)
                      }
                    >
                      {picker.mode === 'substitute' ? 'Suggest' : 'Assign'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
