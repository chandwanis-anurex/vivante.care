import { useState } from 'react';
import { WorkerLayout } from './WorkerLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShiftStatusBadge } from '@/components/ui/StatusBadge';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useNow } from '@/hooks/useNow';
import { getOwnPassport } from '@/lib/ownPassport';
import { getDisplayShiftStatus, formatCountdown } from '@/lib/matching';

export function WorkerShiftsPage() {
  const [passportId] = useState(() => getOwnPassport()?.id ?? null);
  const { shiftRequests, assignRequests, respondToAssignRequest } = useScheduleStore();
  const now = useNow();

  const myShifts = passportId
    ? shiftRequests.filter(
        (s) => s.assignedPassportId === passportId && getDisplayShiftStatus(s, assignRequests, now) !== 'open'
      )
    : [];

  return (
    <WorkerLayout>
      <h1 className="text-3xl font-bold text-charcoal mb-2">Shifts</h1>
      <p className="text-base text-charcoal/60 mb-8">
        Assignment requests from organizations you've matched with. Accept or reject before the
        request expires.
      </p>

      {!passportId ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">
            Complete your VivantePassport first so organizations can assign you shifts.
          </p>
        </Card>
      ) : myShifts.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">No shift assignments yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {myShifts.map((shift) => {
            const displayStatus = getDisplayShiftStatus(shift, assignRequests, now);
            const ar = assignRequests.find(
              (a) => a.shiftId === shift.id && a.passportId === passportId && a.status === 'pending'
            );
            return (
              <Card key={shift.id} accent="neutral">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-charcoal">{shift.title}</div>
                    <div className="text-sm text-charcoal/60 mt-0.5">
                      {shift.location} · {shift.label}
                    </div>
                  </div>
                  <ShiftStatusBadge status={displayStatus} />
                </div>

                {displayStatus === 'pending_assignment' && ar && (
                  <div className="mt-4">
                    <p className="text-sm text-charcoal/70 mb-3">
                      Respond within{' '}
                      <span className="font-semibold text-amber-700">{formatCountdown(ar.expiresAt, now)}</span> or
                      this request expires.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => respondToAssignRequest(ar.id, 'accepted')}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToAssignRequest(ar.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {displayStatus === 'assigned' && (
                  <div className="mt-4 text-sm font-semibold text-teal">
                    Confirmed — you're on this shift.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </WorkerLayout>
  );
}
