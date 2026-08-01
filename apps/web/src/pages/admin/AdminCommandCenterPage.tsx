import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { Card } from '@/components/ui/Card';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useNow } from '@/hooks/useNow';
import { getDisplayShiftStatus } from '@/lib/matching';

export function AdminCommandCenterPage() {
  const { requirements, shiftRequests, assignRequests, interviewRequests } = useScheduleStore();
  const now = useNow();

  const openRequests = useMemo(() => requirements.filter((r) => !r.archived).length, [requirements]);

  const aiReadyCount = useMemo(
    () => requirements.flatMap((r) => r.matches).filter((m) => m.presented === false).length,
    [requirements]
  );

  const needReviewCount = useMemo(
    () => requirements.flatMap((r) => r.matches).filter((m) => m.status === 'more_info_required').length,
    [requirements]
  );

  const pendingInterviews = useMemo(
    () => interviewRequests.filter((i) => i.status === 'pending_admin').length,
    [interviewRequests]
  );

  const selectedCount = useMemo(
    () => requirements.flatMap((r) => r.matches).filter((m) => m.status === 'selected').length,
    [requirements]
  );

  const placementsCount = useMemo(
    () => shiftRequests.filter((s) => getDisplayShiftStatus(s, assignRequests, now) === 'assigned').length,
    [shiftRequests, assignRequests, now]
  );

  const credentialAlerts = useMemo(() => {
    return requirements.flatMap((requirement) =>
      requirement.matches
        .filter(
          (m) =>
            m.readiness &&
            (m.readiness.license !== 'green' ||
              m.readiness.background !== 'green' ||
              m.readiness.drugScreen !== 'green' ||
              m.readiness.vaccination !== 'green')
        )
        .map((match) => ({ requirement, match }))
    );
  }, [requirements]);

  // Real "at risk" flag: high/emergency-priority requests, still open,
  // past their own real forecasted fill time — not a fabricated SLA.
  const atRisk = useMemo(() => {
    return requirements.filter((r) => {
      if (r.archived || !r.budget || !r.forecast) return false;
      if (r.budget.priority !== 'High' && r.budget.priority !== 'Emergency') return false;
      if (r.matches.some((m) => m.status === 'selected' || m.status === 'closed')) return false;
      const hoursElapsed = (now - Date.parse(r.openedAt)) / (1000 * 60 * 60);
      return hoursElapsed > r.forecast.expectedFillHours;
    });
  }, [requirements, now]);

  return (
    <AdminLayout
      hero={{
        title: 'Command Center',
        subtitle:
          "Today's queue — every number below is computed live from real requests, matches, interviews, and shifts.",
      }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <QueueStat label="Open Requests" value={openRequests} link="/admin/requirements" />
        <QueueStat label="AI Ready" value={aiReadyCount} link="/admin/requirements" />
        <QueueStat label="Need Review" value={needReviewCount} link="/admin/requirements" />
        <QueueStat label="Interviews Pending" value={pendingInterviews} link="/admin/interviews" />
        <QueueStat label="Selected" value={selectedCount} link="/admin/requirements" />
        <QueueStat label="Placements" value={placementsCount} link="/admin/shifts" />
      </div>

      <div className="text-lg font-bold text-charcoal mb-3">Credential Alerts</div>
      {credentialAlerts.length === 0 ? (
        <Card className="text-center py-10 mb-8">
          <p className="text-base text-charcoal/50">No credential issues flagged.</p>
        </Card>
      ) : (
        <div className="space-y-2 mb-8">
          {credentialAlerts.map(({ requirement, match }) => (
            <Link key={match.id} to={`/admin/requirements`}>
              <Card accent="neutral" className="border-amber-300 bg-amber-50/40 hover:border-amber-400 transition-colors">
                <div className="text-base font-bold text-charcoal">{match.candidateName}</div>
                <div className="text-sm text-charcoal/60">
                  {match.passportId} · flagged for "{requirement.title}" ({requirement.orgName})
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="text-lg font-bold text-charcoal mb-3">At Risk</div>
      <p className="text-sm text-charcoal/60 mb-3">
        High/emergency-priority requests past their own estimated fill time with no candidate selected yet.
      </p>
      {atRisk.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-base text-charcoal/50">Nothing at risk right now.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {atRisk.map((r) => (
            <Link key={r.id} to={`/org/requirements/${r.id}`}>
              <Card accent="neutral" className="border-red-300 bg-red-50/40 hover:border-red-400 transition-colors">
                <div className="text-base font-bold text-charcoal">{r.title}</div>
                <div className="text-sm text-charcoal/60">
                  {r.orgName} · {r.budget?.priority} priority · estimated fill {r.forecast?.expectedFillHours}h
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function QueueStat({ label, value, link }: { label: string; value: number; link: string }) {
  return (
    <Link to={link}>
      <Card accent="teal" className="hover:bg-teal/[0.08] transition-colors cursor-pointer h-full">
        <div className="text-2xl font-extrabold text-navy">{value}</div>
        <div className="text-xs text-charcoal/60 mt-1">{label}</div>
      </Card>
    </Link>
  );
}
