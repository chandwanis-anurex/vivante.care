import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { getVaultWithOwnPassport } from '@/lib/mockData';
import { expandOccurrences, isCoveredByRules } from '@/lib/matching';
import { scheduleToOccurrenceSpec } from '@/lib/candidateMatching';
import { cn } from '@/lib/utils';
import type { RequirementMatch, RequirementPipelineStatus } from '@/types';
import { ChevronLeft, X } from 'lucide-react';

const PIPELINE_STEPS: { key: RequirementPipelineStatus; label: string }[] = [
  { key: 'submitted', label: 'Request Submitted' },
  { key: 'ai_analysis', label: 'AI Analysis Started' },
  { key: 'finding_candidates', label: 'Finding Candidates' },
  { key: 'recruiter_review', label: 'Recruiter Review' },
  { key: 'provider_review', label: 'Provider Review' },
];

export function RequirementDetailPage() {
  const { id } = useParams();
  const {
    requirements,
    availabilityRules,
    updateMatchStatus,
    requestMoreInfo,
    createInterviewRequest,
    providerRequestAnotherCandidate,
    providerShortlistMatch,
  } = useScheduleStore();
  const requirement = requirements.find((r) => r.id === id);
  const vault = useMemo(() => getVaultWithOwnPassport(), []);
  const [openProfile, setOpenProfile] = useState<RequirementMatch | null>(null);
  const [needMoreInfoFor, setNeedMoreInfoFor] = useState<RequirementMatch | null>(null);
  const [inviteFor, setInviteFor] = useState<RequirementMatch | null>(null);
  const [infoText, setInfoText] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  if (!requirement) {
    return (
      <OrgLayout>
        <p className="text-charcoal/60">Requirement not found.</p>
      </OrgLayout>
    );
  }

  // "presented === false" is the only anonymized state — matches created
  // before Module4 (seeded mock data, admin's Create Manual Match) never
  // set this field and keep showing full names exactly as before.
  const presentedMatches = requirement.matches.filter((m) => m.presented !== false);
  const anonymizedMatches = requirement.matches.filter((m) => m.presented === false);
  const comparableMatches = [...presentedMatches, ...anonymizedMatches];

  const topMatch = comparableMatches
    .filter((m) => m.aiMatchScore !== undefined)
    .sort((a, b) => (b.aiMatchScore ?? 0) - (a.aiMatchScore ?? 0))[0];

  function earliestStart(match: RequirementMatch): string {
    if (!requirement?.schedule) return '—';
    const rules = availabilityRules[match.passportId] ?? [];
    const occurrences = expandOccurrences(scheduleToOccurrenceSpec(requirement.schedule));
    const covered = occurrences.find((o) => isCoveredByRules(o.date, o.startTime, o.endTime, rules));
    return covered ? new Date(covered.date).toLocaleDateString() : 'Unavailable';
  }

  function displayName(match: RequirementMatch, index: number): string {
    return match.presented === false ? `Candidate ${String.fromCharCode(65 + index)}` : match.candidateName;
  }

  return (
    <OrgLayout>
      <Link
        to="/org/requirements"
        className="inline-flex items-center gap-1 text-sm font-semibold text-charcoal/60 hover:text-navy mb-4"
      >
        <ChevronLeft size={16} /> All Requirements
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">{requirement.title}</h1>
          <p className="text-base text-charcoal/60 mt-1">
            {requirement.location} · {requirement.shiftType} · Opened{' '}
            {new Date(requirement.openedAt).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline">Duplicate Requirement</Button>
      </div>

      {requirement.pipelineStatus && (
        <Card accent="neutral" className="mb-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {PIPELINE_STEPS.map((s, i) => {
              const currentIndex = PIPELINE_STEPS.findIndex((step) => step.key === requirement.pipelineStatus);
              const done = i <= currentIndex;
              return (
                <div key={s.key} className="flex items-center gap-1.5 text-sm">
                  <span>{done ? '✓' : '⏳'}</span>
                  <span className={done ? 'text-charcoal font-semibold' : 'text-charcoal/40'}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {requirement.workforceAnalysis && (
        <Card accent="teal" className="mb-6">
          <div className="text-lg font-bold text-charcoal mb-3">VivanteIQ™ Workforce Analysis</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <DetailRow label="Estimated Fill Time" value={`${requirement.workforceAnalysis.estimatedFillHours}h`} />
            <DetailRow label="Market Availability" value={requirement.workforceAnalysis.marketAvailability} />
            <DetailRow
              label="Expected Candidates"
              value={String(requirement.workforceAnalysis.expectedQualifiedCandidates)}
            />
            <DetailRow
              label="Search Radius"
              value={`${requirement.workforceAnalysis.recommendedSearchRadiusMiles} mi`}
            />
            <DetailRow
              label="Success Probability"
              value={`${requirement.workforceAnalysis.successProbabilityPct}%`}
            />
          </div>
        </Card>
      )}

      {(requirement.reason || requirement.schedule || requirement.budget || requirement.forecast) && (
        <Card accent="neutral" className="mb-6">
          <div className="text-lg font-bold text-charcoal mb-4">Request Details</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 text-sm">
            {requirement.reason && <DetailRow label="Reason" value={requirement.reason} />}
            {requirement.assignmentType && <DetailRow label="Assignment Type" value={requirement.assignmentType} />}
            {requirement.unit && <DetailRow label="Unit" value={requirement.unit} />}
            {requirement.costCenter && <DetailRow label="Cost Center" value={requirement.costCenter} />}
            {requirement.schedule && (
              <>
                <DetailRow label="Start" value={new Date(requirement.schedule.startDate).toLocaleDateString()} />
                <DetailRow label="End" value={new Date(requirement.schedule.endDate).toLocaleDateString()} />
                <DetailRow label="Shift" value={requirement.schedule.shift} />
                <DetailRow label="Hours" value={requirement.schedule.hoursPerWeek || '—'} />
              </>
            )}
            {requirement.budget && (
              <>
                <DetailRow label="Max Bill Rate" value={`$${requirement.budget.maxBillRate}/hr`} />
                <DetailRow label="Priority" value={requirement.budget.priority} />
              </>
            )}
            {requirement.budget && (
              <DetailRow label="Recruiter" value={requirement.recruiterEmail || 'Unassigned'} />
            )}
          </div>

          {requirement.qualifications &&
            (requirement.qualifications.requiredCertifications.length > 0 ||
              requirement.qualifications.requiredSkills.length > 0) && (
              <div className="mt-4 pt-4 border-t border-charcoal/10 flex flex-wrap gap-6">
                {requirement.qualifications.requiredCertifications.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase text-charcoal/50 mb-1.5">
                      Required Certifications
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {requirement.qualifications.requiredCertifications.map((c) => (
                        <Tag key={c}>{c}</Tag>
                      ))}
                    </div>
                  </div>
                )}
                {requirement.qualifications.requiredSkills.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase text-charcoal/50 mb-1.5">Required Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {requirement.qualifications.requiredSkills.map((s) => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {requirement.forecast && (
            <div className="mt-4 pt-4 border-t border-charcoal/10">
              <div className="grid grid-cols-3 gap-4 mb-3">
                <DetailRow label="Market Rate" value={`$${requirement.forecast.estimatedMarketRate}/hr`} />
                <DetailRow label="Est. Fill Time" value={`${requirement.forecast.expectedFillHours}h`} />
                <DetailRow label="Fill Likelihood" value={`${requirement.forecast.fillProbabilityPct}%`} />
              </div>
              {requirement.forecast.suggestions.length > 0 && (
                <ul className="space-y-1">
                  {requirement.forecast.suggestions.map((s) => (
                    <li key={s} className="text-sm text-charcoal/70">
                      • {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

      {topMatch && (
        <Card accent="navy" className="mb-6">
          <div className="text-xs font-bold text-teal uppercase tracking-wide mb-1">Recommendation</div>
          <div className="text-xl font-bold text-charcoal mb-2">{displayName(topMatch, 0)}</div>
          {topMatch.aiWhyReasons && topMatch.aiWhyReasons.length > 0 && (
            <ul className="space-y-1 mb-2">
              {topMatch.aiWhyReasons.slice(0, 3).map((r) => (
                <li key={r} className="text-sm text-charcoal/80">
                  • {r}
                </li>
              ))}
            </ul>
          )}
          <div className="text-sm text-charcoal/60">
            Estimated placement success:{' '}
            <span className="font-bold text-teal">
              {requirement.forecast?.fillProbabilityPct ?? topMatch.readiness?.score ?? '—'}%
            </span>
          </div>
        </Card>
      )}

      {comparableMatches.length >= 2 && (
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => setShowComparison((v) => !v)}>
            {showComparison ? 'Hide' : 'Compare'} Candidates
          </Button>
          {showComparison && (
            <div className="mt-3 border border-charcoal/15 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray text-left">
                  <tr>
                    <th className="px-4 py-2 font-bold text-charcoal/70">Candidate</th>
                    <th className="px-4 py-2 font-bold text-charcoal/70">Match Score</th>
                    <th className="px-4 py-2 font-bold text-charcoal/70">Readiness</th>
                    <th className="px-4 py-2 font-bold text-charcoal/70">Years Experience</th>
                    <th className="px-4 py-2 font-bold text-charcoal/70">Certifications</th>
                    <th className="px-4 py-2 font-bold text-charcoal/70">Previous Assignment</th>
                    <th className="px-4 py-2 font-bold text-charcoal/70">Earliest Start</th>
                  </tr>
                </thead>
                <tbody>
                  {comparableMatches.map((m, i) => {
                    const vaultEntry = vault.find((v) => v.id === m.passportId);
                    const requiredCerts = requirement.qualifications?.requiredCertifications ?? [];
                    const hasCerts =
                      requiredCerts.length > 0 &&
                      requiredCerts.every((c) =>
                        vaultEntry?.certifications.some((cc) => cc.toLowerCase() === c.toLowerCase())
                      );
                    const previouslyAssigned = m.aiWhyReasons?.some((r) => r.includes('previously'));
                    return (
                      <tr key={m.id} className="border-t border-charcoal/10">
                        <td className="px-4 py-2 font-semibold text-charcoal">{displayName(m, i)}</td>
                        <td className="px-4 py-2">{m.aiMatchScore ?? '—'}</td>
                        <td className="px-4 py-2">{m.readiness ? `${m.readiness.score}/100` : '—'}</td>
                        <td className="px-4 py-2">{vaultEntry?.yearsExperience ?? '—'}</td>
                        <td className="px-4 py-2">{requiredCerts.length === 0 ? '—' : hasCerts ? '✓' : '✗'}</td>
                        <td className="px-4 py-2">
                          {previouslyAssigned === undefined ? '—' : previouslyAssigned ? '✓' : '✗'}
                        </td>
                        <td className="px-4 py-2">{earliestStart(m)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {anonymizedMatches.length > 0 && (
        <div className="mb-6">
          <div className="text-lg font-bold text-charcoal mb-1">Candidates Under Review</div>
          <p className="text-sm text-charcoal/60 mb-3">
            Anonymized until a VivanteCare recruiter validates and presents them.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anonymizedMatches.map((match, i) => (
              <Card key={match.id} accent="neutral" className="border-dashed">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-lg font-bold text-charcoal">{displayName(match, i)}</div>
                    <div className="text-sm text-charcoal/60">{match.specialty}</div>
                  </div>
                  {match.aiMatchScore !== undefined && (
                    <div className="text-center shrink-0">
                      <div className="text-2xl font-extrabold text-teal">{match.aiMatchScore}</div>
                      <div className="text-[10px] text-charcoal/50 uppercase">Match Score</div>
                    </div>
                  )}
                </div>
                {match.aiWhyReasons && match.aiWhyReasons.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {match.aiWhyReasons.map((r) => (
                      <li key={r} className="text-sm text-charcoal/80">
                        ✓ {r}
                      </li>
                    ))}
                  </ul>
                )}
                {match.readiness && (
                  <div className="flex flex-wrap gap-2.5 mb-3">
                    <ReadinessDot label="License" status={match.readiness.license} />
                    <ReadinessDot label="Background" status={match.readiness.background} />
                    <ReadinessDot label="Drug Screen" status={match.readiness.drugScreen} />
                    <ReadinessDot label="Vaccination" status={match.readiness.vaccination} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" onClick={() => setInviteFor(match)}>
                    Interview
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => providerShortlistMatch(requirement.id, match.id)}>
                    {match.shortlisted ? 'Shortlisted ✓' : 'Shortlist'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateMatchStatus(requirement.id, match.id, 'not_interested')}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => providerRequestAnotherCandidate(requirement.id)}
          >
            Request Another Candidate
          </Button>
        </div>
      )}

      {presentedMatches.length === 0 && anonymizedMatches.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">
            No matches yet. The matching engine runs every 12 hours — check back soon.
          </p>
        </Card>
      ) : presentedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presentedMatches.map((match) => (
            <Card key={match.id} accent="neutral">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-lg font-bold text-charcoal">{match.candidateName}</div>
                  <div className="text-sm text-charcoal/60">
                    {match.specialty} · {match.passportId}
                  </div>
                </div>
                <StatusBadge status={match.status} />
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => setOpenProfile(match)}>
                  Review Passport
                </Button>
                <Button size="sm" onClick={() => setInviteFor(match)}>
                  Invite to Interview
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNeedMoreInfoFor(match)}>
                  Need More Info
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateMatchStatus(requirement.id, match.id, 'selected')}
                >
                  Select Candidate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateMatchStatus(requirement.id, match.id, 'not_interested')}
                >
                  Not Interested
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateMatchStatus(requirement.id, match.id, 'archived')}
                >
                  Archive
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {/* VivantePassport profile viewer */}
      {openProfile && (
        <div className="fixed inset-0 bg-charcoal/40 flex items-center justify-center z-50 p-6">
          <Card accent="neutral" className="bg-white max-w-lg w-full relative">
            <button
              onClick={() => setOpenProfile(null)}
              className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal"
            >
              <X size={20} />
            </button>
            <div className="text-2xl font-bold text-charcoal mb-1">{openProfile.candidateName}</div>
            <div className="text-sm text-teal font-bold mb-4">{openProfile.passportId}</div>
            <dl className="space-y-2 text-base">
              <div className="flex justify-between border-b border-charcoal/10 py-2">
                <dt className="text-charcoal/60">Specialty</dt>
                <dd className="font-semibold">{openProfile.specialty}</dd>
              </div>
              <div className="flex justify-between border-b border-charcoal/10 py-2">
                <dt className="text-charcoal/60">Matched</dt>
                <dd className="font-semibold">{new Date(openProfile.matchedAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between border-b border-charcoal/10 py-2">
                <dt className="text-charcoal/60">License Status</dt>
                <dd className="font-semibold text-teal">Current</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {/* Need more info modal */}
      {needMoreInfoFor && (
        <div className="fixed inset-0 bg-charcoal/40 flex items-center justify-center z-50 p-6">
          <Card accent="neutral" className="bg-white max-w-md w-full relative">
            <button
              onClick={() => setNeedMoreInfoFor(null)}
              className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal"
            >
              <X size={20} />
            </button>
            <div className="text-xl font-bold text-charcoal mb-1">Request More Info</div>
            <p className="text-sm text-charcoal/60 mb-4">
              What do you need from {needMoreInfoFor.candidateName}? This is added to "Additional
              Info Required" on the requirement.
            </p>
            <textarea
              value={infoText}
              onChange={(e) => setInfoText(e.target.value)}
              rows={4}
              className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy resize-none"
              placeholder="e.g. Please confirm availability for overnight shifts"
            />
            <Button
              className="w-full mt-4"
              disabled={!infoText.trim()}
              onClick={() => {
                requestMoreInfo(requirement.id, needMoreInfoFor.id, infoText.trim());
                setNeedMoreInfoFor(null);
                setInfoText('');
              }}
            >
              Send Request
            </Button>
          </Card>
        </div>
      )}

      {/* Invite to interview modal */}
      {inviteFor && (
        <div className="fixed inset-0 bg-charcoal/40 flex items-center justify-center z-50 p-6">
          <Card accent="neutral" className="bg-white max-w-md w-full relative">
            <button
              onClick={() => setInviteFor(null)}
              className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal"
            >
              <X size={20} />
            </button>
            <div className="text-xl font-bold text-charcoal mb-1">Request Interview</div>
            <p className="text-sm text-charcoal/60 mb-4">
              This sends a request to the VivanteCare team, who will schedule and confirm the
              interview slot with {inviteFor.presented === false ? 'this candidate' : inviteFor.candidateName}{' '}
              directly.
            </p>
            <textarea
              value={inviteNote}
              onChange={(e) => setInviteNote(e.target.value)}
              rows={3}
              className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy resize-none"
              placeholder="Optional note for the scheduling team"
            />
            <Button
              className="w-full mt-4"
              onClick={() => {
                createInterviewRequest(requirement.id, inviteFor.id, inviteNote.trim() || undefined);
                setInviteFor(null);
                setInviteNote('');
              }}
            >
              Request Interview
            </Button>
          </Card>
        </div>
      )}
    </OrgLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-charcoal/40">{label}</dt>
      <dd className="font-semibold text-charcoal mt-0.5">{value}</dd>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return <span className="text-xs font-semibold bg-teal/10 text-teal px-2 py-1">{children}</span>;
}

function ReadinessDot({ label, status }: { label: string; status: 'green' | 'amber' | 'red' }) {
  const color = status === 'green' ? 'bg-teal' : status === 'amber' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-charcoal/70">
      <span className={cn('w-2 h-2', color)} />
      {label}
    </span>
  );
}

