import { useMemo, useState } from 'react';
import { WorkerLayout } from './WorkerLayout';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { getOwnPassport } from '@/lib/ownPassport';

export function JobMatchesPage() {
  const [passportId] = useState(() => getOwnPassport()?.id ?? null);
  const { requirements, interviewRequests } = useScheduleStore();

  const myMatches = useMemo(() => {
    if (!passportId) return [];
    return requirements.flatMap((requirement) =>
      requirement.matches
        .filter((match) => match.passportId === passportId)
        .map((match) => ({
          requirement,
          match,
          interview: interviewRequests.find((ir) => ir.matchId === match.id),
        }))
    );
  }, [requirements, interviewRequests, passportId]);

  return (
    <WorkerLayout>
      <h1 className="text-3xl font-bold text-charcoal mb-2">Job Matches</h1>
      <p className="text-base text-charcoal/60 mb-8">
        Interview slots are scheduled and confirmed by the VivanteCare team — you'll see the
        confirmed time here once it's set.
      </p>

      {!passportId ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">
            Complete your VivantePassport first so organizations can match with you.
          </p>
        </Card>
      ) : myMatches.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">No matches yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {myMatches.map(({ requirement, match, interview }) => (
            <Card key={match.id} accent="neutral">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-lg font-bold text-charcoal">{requirement.title}</div>
                  <div className="text-sm text-charcoal/60">{requirement.orgName}</div>
                </div>
                <StatusBadge status={match.status} />
              </div>

              {match.status === 'invited_to_interview' && interview && (
                <div className="mt-3 text-sm">
                  {interview.status === 'sent_to_worker' && interview.scheduledAt ? (
                    <p className="font-semibold text-teal">
                      Interview confirmed: {new Date(interview.scheduledAt).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-charcoal/60">
                      Interview requested — the VivanteCare team will confirm a time soon.
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </WorkerLayout>
  );
}
