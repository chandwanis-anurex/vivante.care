import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import type { RequirementMatch } from '@/types';
import { ChevronLeft, X } from 'lucide-react';

export function RequirementDetailPage() {
  const { id } = useParams();
  const { requirements, updateMatchStatus, requestMoreInfo, createInterviewRequest } = useScheduleStore();
  const requirement = requirements.find((r) => r.id === id);
  const [openProfile, setOpenProfile] = useState<RequirementMatch | null>(null);
  const [needMoreInfoFor, setNeedMoreInfoFor] = useState<RequirementMatch | null>(null);
  const [inviteFor, setInviteFor] = useState<RequirementMatch | null>(null);
  const [infoText, setInfoText] = useState('');
  const [inviteNote, setInviteNote] = useState('');

  if (!requirement) {
    return (
      <OrgLayout>
        <p className="text-charcoal/60">Requirement not found.</p>
      </OrgLayout>
    );
  }

  return (
    <OrgLayout>
      <Link
        to="/org/requirements"
        className="inline-flex items-center gap-1 text-sm font-semibold text-charcoal/60 hover:text-navy mb-4"
      >
        <ChevronLeft size={16} /> All Requirements
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">{requirement.title}</h1>
          <p className="text-base text-charcoal/60 mt-1">
            {requirement.location} · {requirement.shiftType} · Opened{' '}
            {new Date(requirement.openedAt).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline">Duplicate Requirement</Button>
      </div>

      {requirement.matches.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">
            No matches yet. The matching engine runs every 12 hours — check back soon.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requirement.matches.map((match) => (
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
      )}

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
              interview slot with {inviteFor.candidateName} directly.
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
