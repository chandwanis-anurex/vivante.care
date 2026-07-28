import { useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { getVaultWithOwnPassport } from '@/lib/mockData';
import type { MatchStatus, RequirementMatch } from '@/types';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

const STATUS_OPTIONS: MatchStatus[] = [
  'open',
  'more_info_required',
  'invited_to_interview',
  'under_interview',
  'selected',
  'not_interested',
  'archived',
  'closed',
];

interface ActionModal {
  mode: 'invite' | 'moreInfo';
  requirementId: string;
  match: RequirementMatch;
}

export function AdminRequirementsPage() {
  const { requirements, updateMatchStatus, requestMoreInfo, createInterviewRequest, createManualMatch } =
    useScheduleStore();
  const vault = useMemo(() => getVaultWithOwnPassport(), []);

  const [orgFilter, setOrgFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModal | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showManualMatch, setShowManualMatch] = useState(false);
  const [manualRequirementId, setManualRequirementId] = useState('');
  const [manualPassportId, setManualPassportId] = useState('');
  const [manualSlot, setManualSlot] = useState('');

  const orgNames = useMemo(() => Array.from(new Set(requirements.map((r) => r.orgName))), [requirements]);

  const rows = useMemo(() => {
    return requirements
      .filter((r) => orgFilter === 'all' || r.orgName === orgFilter)
      .map((r) => ({
        requirement: r,
        matches:
          statusFilter === 'all' ? r.matches : r.matches.filter((m) => m.status === statusFilter),
      }))
      .filter((row) => statusFilter === 'all' || row.matches.length > 0);
  }, [requirements, orgFilter, statusFilter]);

  function submitManualMatch() {
    const passport = vault.find((v) => v.id === manualPassportId);
    if (!manualRequirementId || !passport || !manualSlot) return;
    createManualMatch({
      requirementId: manualRequirementId,
      passportId: passport.id,
      candidateName: passport.name,
      specialty: passport.specialty,
      scheduledAt: new Date(manualSlot).toISOString(),
    });
    setShowManualMatch(false);
    setManualRequirementId('');
    setManualPassportId('');
    setManualSlot('');
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Requirements</h1>
          <p className="text-base text-charcoal/60 mt-1">Every requirement across every org.</p>
        </div>
        <Button onClick={() => setShowManualMatch(true)}>Create Manual Match</Button>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy bg-white"
        >
          <option value="all">All Organizations</option>
          {orgNames.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MatchStatus | 'all')}
          className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy bg-white"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">No requirements match these filters.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map(({ requirement, matches }) => {
            const expanded = expandedId === requirement.id;
            return (
              <Card key={requirement.id} accent="neutral">
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setExpandedId(expanded ? null : requirement.id)}
                >
                  <div>
                    <div className="text-lg font-bold text-charcoal">{requirement.title}</div>
                    <div className="text-sm text-charcoal/60 mt-0.5">
                      {requirement.orgName} · {requirement.location} · {requirement.shiftType} ·{' '}
                      {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                    </div>
                  </div>
                  {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expanded && (
                  <div className="mt-4 space-y-2 border-t border-charcoal/10 pt-4">
                    {matches.length === 0 ? (
                      <p className="text-sm text-charcoal/50">No matches for this filter.</p>
                    ) : (
                      matches.map((match) => (
                        <div
                          key={match.id}
                          className="border border-charcoal/15 p-3 flex items-start justify-between gap-3 flex-wrap"
                        >
                          <div>
                            <div className="text-base font-bold text-charcoal">{match.candidateName}</div>
                            <div className="text-sm text-charcoal/60">
                              {match.specialty} · {match.passportId}
                            </div>
                            <div className="mt-1.5">
                              <StatusBadge status={match.status} />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                setActionModal({ mode: 'invite', requirementId: requirement.id, match })
                              }
                            >
                              Invite to Interview
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setActionModal({ mode: 'moreInfo', requirementId: requirement.id, match })
                              }
                            >
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
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Invite / Need More Info modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-charcoal/40 flex items-center justify-center z-50 p-6">
          <Card accent="neutral" className="bg-white max-w-md w-full relative">
            <button
              onClick={() => {
                setActionModal(null);
                setNoteText('');
              }}
              className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal"
            >
              <X size={20} />
            </button>
            {actionModal.mode === 'invite' ? (
              <>
                <div className="text-xl font-bold text-charcoal mb-1">Request Interview</div>
                <p className="text-sm text-charcoal/60 mb-4">
                  Creates an interview request for {actionModal.match.candidateName} — you'll pick the
                  actual slot from the Interviews queue.
                </p>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-charcoal mb-1">Request More Info</div>
                <p className="text-sm text-charcoal/60 mb-4">
                  What do you need from {actionModal.match.candidateName}?
                </p>
              </>
            )}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy resize-none"
              placeholder={actionModal.mode === 'invite' ? 'Optional note' : 'e.g. Confirm availability for overnights'}
            />
            <Button
              className="w-full mt-4"
              disabled={actionModal.mode === 'moreInfo' && !noteText.trim()}
              onClick={() => {
                if (actionModal.mode === 'invite') {
                  createInterviewRequest(actionModal.requirementId, actionModal.match.id, noteText.trim() || undefined);
                } else {
                  requestMoreInfo(actionModal.requirementId, actionModal.match.id, noteText.trim());
                }
                setActionModal(null);
                setNoteText('');
              }}
            >
              {actionModal.mode === 'invite' ? 'Send Request' : 'Send Request'}
            </Button>
          </Card>
        </div>
      )}

      {/* Create Manual Match modal */}
      {showManualMatch && (
        <div className="fixed inset-0 bg-charcoal/40 flex items-center justify-center z-50 p-6">
          <Card accent="neutral" className="bg-white max-w-md w-full relative">
            <button
              onClick={() => setShowManualMatch(false)}
              className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal"
            >
              <X size={20} />
            </button>
            <div className="text-xl font-bold text-charcoal mb-1">Create Manual Match</div>
            <p className="text-sm text-charcoal/60 mb-4">
              Directly match a passport to a requirement and schedule the interview in one step.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">Requirement</label>
                <select
                  value={manualRequirementId}
                  onChange={(e) => setManualRequirementId(e.target.value)}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy bg-white"
                >
                  <option value="">Select…</option>
                  {requirements.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.orgName} — {r.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">Passport</label>
                <select
                  value={manualPassportId}
                  onChange={(e) => setManualPassportId(e.target.value)}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy bg-white"
                >
                  <option value="">Select…</option>
                  {vault.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} — {v.name} — {v.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                  Interview Slot
                </label>
                <input
                  type="datetime-local"
                  value={manualSlot}
                  onChange={(e) => setManualSlot(e.target.value)}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
                />
              </div>
            </div>
            <Button
              className="w-full mt-4"
              disabled={!manualRequirementId || !manualPassportId || !manualSlot}
              onClick={submitManualMatch}
            >
              Create Match & Send Slot
            </Button>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
