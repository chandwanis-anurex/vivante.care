import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/hooks/useSession';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useNow } from '@/hooks/useNow';
import {
  computeKpis,
  computeCandidatePipeline,
  computeUrgentActions,
  computeInsights,
  computeRecommendedAction,
} from '@/lib/dashboardMetrics';
import type { Requirement } from '@/types';
import { Plus, Search, Building2, UserPlus, Sparkles, Target, AlertCircle } from 'lucide-react';

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const SEVERITY_DOT: Record<string, string> = { red: '🔴', amber: '🟠', yellow: '🟡' };

function deriveRequirementStatus(r: Requirement): string {
  if (r.matches.some((m) => m.status === 'selected')) return 'Candidate Selected';
  if (r.matches.some((m) => m.status === 'under_interview' || m.status === 'invited_to_interview')) {
    return 'Interviewing';
  }
  if (r.matches.length > 0) return 'Matching';
  return 'Open';
}

export function OrgVivanteIQPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const {
    requirements: allRequirements,
    shiftRequests: allShifts,
    assignRequests: allAssignRequests,
    interviewRequests: allInterviewRequests,
    notifications,
  } = useScheduleStore();
  const now = useNow(60_000);
  const nowDate = new Date(now);

  const requirements = useMemo(
    () => allRequirements.filter((r) => r.orgName === session?.orgName),
    [allRequirements, session?.orgName]
  );
  const shiftRequests = useMemo(
    () => allShifts.filter((s) => s.orgName === session?.orgName),
    [allShifts, session?.orgName]
  );
  const assignRequests = useMemo(
    () => allAssignRequests.filter((a) => a.orgName === session?.orgName),
    [allAssignRequests, session?.orgName]
  );
  const interviewRequests = useMemo(
    () => allInterviewRequests.filter((i) => i.orgName === session?.orgName),
    [allInterviewRequests, session?.orgName]
  );
  const orgNotifications = useMemo(() => notifications.filter((n) => n.audience === 'org'), [notifications]);

  const kpis = useMemo(
    () => computeKpis(requirements, shiftRequests, assignRequests, interviewRequests, now),
    [requirements, shiftRequests, assignRequests, interviewRequests, now]
  );
  const pipeline = useMemo(
    () => computeCandidatePipeline(requirements, shiftRequests),
    [requirements, shiftRequests]
  );
  const urgentActions = useMemo(
    () => computeUrgentActions(requirements, shiftRequests, assignRequests, interviewRequests, now),
    [requirements, shiftRequests, assignRequests, interviewRequests, now]
  );
  const insights = useMemo(
    () => computeInsights(requirements, shiftRequests, assignRequests, interviewRequests, now),
    [requirements, shiftRequests, assignRequests, interviewRequests, now]
  );
  const recommendedAction = useMemo(
    () => computeRecommendedAction(requirements, shiftRequests, assignRequests, interviewRequests, now),
    [requirements, shiftRequests, assignRequests, interviewRequests, now]
  );

  const statusLine =
    urgentActions.length > 0
      ? `${urgentActions.length} item${urgentActions.length === 1 ? '' : 's'} need${urgentActions.length === 1 ? 's' : ''} your attention.`
      : 'Today looks healthy.';

  const activeRequirements = requirements.filter((r) => !r.archived);

  return (
    <OrgLayout>
      {/* Hero */}
      <Card accent="navy" className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-2xl font-bold text-charcoal">
              {greeting(nowDate)}, {session?.name?.split(' ')[0] ?? 'there'}
            </div>
            <div className="text-base text-charcoal/60 mt-1">
              {session?.orgName} ·{' '}
              {nowDate.toLocaleDateString(undefined, { weekday: 'long' })},{' '}
              {nowDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </div>
            <div className="text-md font-semibold text-navy mt-2">{statusLine}</div>
          </div>
          <div className="text-center shrink-0">
            <div className="text-4xl font-extrabold text-teal">{kpis.workforceHealthScore}</div>
            <div className="text-xs text-charcoal/60 uppercase tracking-wide mt-1">Workforce Readiness</div>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Open Requests" value={kpis.openRequests} link="/org/requirements" />
        <KpiCard label="Active Professionals" value={kpis.activeProfessionals} link="/org/shifts" />
        <KpiCard label="Fill Rate" value={kpis.fillRatePct !== null ? `${kpis.fillRatePct}%` : '—'} link="/org/shifts" />
        <KpiCard
          label="Avg. Time to Fill"
          value={kpis.avgTimeToFillHours !== null ? `${kpis.avgTimeToFillHours}h` : '—'}
          link="/org/shifts"
        />
        <PlaceholderKpiCard label="Compliance" />
        <KpiCard label="Workforce Health" value={`${kpis.workforceHealthScore}/100`} link="/org/vivanteiq" />
      </div>

      {/* AI Insights */}
      <Card accent="teal" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-teal" strokeWidth={2} />
          <div className="text-lg font-bold text-charcoal">VivanteIQ™ Insights</div>
        </div>
        {insights.length === 0 ? (
          <p className="text-base text-charcoal/50">No new insights right now.</p>
        ) : (
          <div className="space-y-2">
            {insights.map((i) => (
              <Link
                key={i.id}
                to={i.link}
                className="block text-base text-charcoal hover:text-navy border-b border-charcoal/10 last:border-0 py-2"
              >
                {i.message}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Recommended Action */}
      <Card accent="navy" className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Target size={18} className="text-navy" strokeWidth={2} />
          <div className="text-lg font-bold text-charcoal">Recommended Action</div>
        </div>
        <Link to={recommendedAction.link} className="text-base text-charcoal hover:text-navy font-semibold">
          {recommendedAction.message}
        </Link>
      </Card>

      {/* Urgent Action Center */}
      <Card accent="neutral" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={18} className="text-charcoal/70" strokeWidth={2} />
          <div className="text-lg font-bold text-charcoal">Urgent Action Center</div>
        </div>
        {urgentActions.length === 0 ? (
          <p className="text-base text-charcoal/50">Nothing urgent — you're all caught up.</p>
        ) : (
          <div className="space-y-2">
            {urgentActions.map((a) => (
              <Link
                key={a.id}
                to={a.link}
                className="flex items-center gap-2 text-base text-charcoal hover:text-navy border-b border-charcoal/10 last:border-0 py-2"
              >
                <span>{SEVERITY_DOT[a.severity]}</span>
                {a.message}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Candidate Pipeline */}
      <Card accent="neutral" className="mb-6">
        <div className="text-lg font-bold text-charcoal mb-4">Candidate Pipeline</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {pipeline.map((stage) => (
            <Link key={stage.key} to={stage.link} className="text-center hover:opacity-80">
              <div className="text-2xl font-extrabold text-navy">{stage.count}</div>
              <div className="text-xs text-charcoal/60 mt-1">{stage.label}</div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Workforce Requests table */}
      <Card accent="neutral" className="mb-6 p-0 overflow-hidden">
        <div className="text-lg font-bold text-charcoal p-6 pb-0">Workforce Requests</div>
        {activeRequirements.length === 0 ? (
          <p className="text-base text-charcoal/50 px-6 pb-6 pt-3">No open workforce requests yet.</p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-base">
              <thead className="bg-gray text-left">
                <tr>
                  <th className="px-6 py-3 font-bold text-charcoal/70">Title</th>
                  <th className="px-4 py-3 font-bold text-charcoal/70">Specialty</th>
                  <th className="px-4 py-3 font-bold text-charcoal/70">Location</th>
                  <th className="px-4 py-3 font-bold text-charcoal/70">Shift Type</th>
                  <th className="px-4 py-3 font-bold text-charcoal/70">Matches</th>
                  <th className="px-4 py-3 font-bold text-charcoal/70">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeRequirements.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/org/requirements/${r.id}`)}
                    className="border-t border-charcoal/10 hover:bg-navy/[0.03] cursor-pointer"
                  >
                    <td className="px-6 py-3 font-semibold text-charcoal">{r.title}</td>
                    <td className="px-4 py-3">{r.specialty}</td>
                    <td className="px-4 py-3">{r.location}</td>
                    <td className="px-4 py-3">{r.shiftType}</td>
                    <td className="px-4 py-3">{r.matches.length}</td>
                    <td className="px-4 py-3 font-semibold text-teal">{deriveRequirementStatus(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Placeholder sections — no real data model behind these yet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ComingSoonSection
          title="Assignment Overview"
          items={['Scheduled', 'Checked In', 'Late', 'Absent', 'Completed']}
        />
        <ComingSoonSection
          title="Compliance Dashboard"
          items={['Licenses', 'CPR Renewals', 'Background Checks', 'Drug Screens', 'Immunizations']}
        />
        <ComingSoonSection
          title="Financial Overview"
          items={['Agency Spend', 'Open Invoices', 'Avg. Bill Rate', 'Cost Savings', 'Budget Utilization']}
        />
      </div>

      {/* Notifications */}
      <Card accent="neutral" className="mb-6">
        <div className="text-lg font-bold text-charcoal mb-4">Notifications</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['staffing', 'compliance', 'finance', 'system'] as const).map((cat) => {
            const items = orgNotifications.filter((n) => (n.category ?? 'staffing') === cat).slice(0, 3);
            return (
              <div key={cat}>
                <div className="text-xs font-bold uppercase tracking-wide text-charcoal/50 mb-2">{cat}</div>
                {items.length === 0 ? (
                  <p className="text-sm text-charcoal/40">No {cat} notifications yet.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((n) => (
                      <Link key={n.id} to={n.link ?? '#'} className="block text-sm text-charcoal hover:text-navy">
                        {n.message}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card accent="neutral">
        <div className="text-lg font-bold text-charcoal mb-4">Quick Actions</div>
        <div className="flex flex-wrap gap-3">
          <Link to="/org/requirements/new">
            <Button size="sm">
              <Plus size={16} /> New Workforce Request
            </Button>
          </Link>
          <Link to="/org/shifts/new">
            <Button size="sm" variant="outline">
              <Plus size={16} /> Post a Shift
            </Button>
          </Link>
          <Link to="/org/passport-vault">
            <Button size="sm" variant="outline">
              <Search size={16} /> Search Clinicians
            </Button>
          </Link>
          <Link to="/org/setup">
            <Button size="sm" variant="outline">
              <Building2 size={16} /> Manage Organization
            </Button>
          </Link>
          <Link to="/org/setup">
            <Button size="sm" variant="outline">
              <UserPlus size={16} /> Invite Team Member
            </Button>
          </Link>
        </div>
      </Card>
    </OrgLayout>
  );
}

function KpiCard({ label, value, link }: { label: string; value: string | number; link: string }) {
  return (
    <Link to={link}>
      <Card accent="teal" className="hover:bg-teal/[0.08] transition-colors cursor-pointer h-full">
        <div className="text-2xl font-extrabold text-navy">{value}</div>
        <div className="text-xs text-charcoal/60 mt-1">{label}</div>
      </Card>
    </Link>
  );
}

function PlaceholderKpiCard({ label }: { label: string }) {
  return (
    <Card accent="neutral" className="h-full border-dashed opacity-60">
      <div className="text-2xl font-extrabold text-charcoal/30">—</div>
      <div className="text-xs text-charcoal/50 mt-1">{label}</div>
    </Card>
  );
}

function ComingSoonSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Card accent="neutral" className="border-dashed opacity-70">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="text-base font-bold text-charcoal">{title}</div>
        <span className="text-[10px] font-bold uppercase text-charcoal/40 border border-charcoal/20 px-1.5 py-0.5 whitespace-nowrap">
          Later module
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span key={i} className="text-xs text-charcoal/40 border border-charcoal/10 px-2 py-1">
            {i}
          </span>
        ))}
      </div>
    </Card>
  );
}
