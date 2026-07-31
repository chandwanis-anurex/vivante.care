import { useNavigate } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/hooks/useSession';
import { useOrgRegistry } from '@/hooks/useOrgRegistry';
import { cn } from '@/lib/utils';

const APPROVAL_LABEL: Record<string, string> = {
  not_required: 'No approval needed',
  pending: 'Awaiting approval',
  approved: 'Approved',
  changes_requested: 'Changes requested',
};

export function DraftRequestsPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const { organizations, deleteDraft } = useOrgRegistry();
  const org = organizations.find((o) => o.name === session?.orgName);

  if (!org) {
    return (
      <OrgLayout>
        <p className="text-charcoal/60">No organization record found for this session.</p>
      </OrgLayout>
    );
  }

  return (
    <OrgLayout>
      <h1 className="text-3xl font-bold text-charcoal mb-2">Draft Requests</h1>
      <p className="text-base text-charcoal/60 mb-6">
        Saved workforce requests you haven't submitted yet — resume anytime.
      </p>

      {org.requestDrafts.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">No drafts saved yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {org.requestDrafts.map((draft) => (
            <Card key={draft.id} accent="neutral" className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-bold text-charcoal">{draft.title}</div>
                <div className="text-sm text-charcoal/60 mt-0.5">
                  Step {draft.step} of 8 · Created by {draft.createdBy} · Updated{' '}
                  {new Date(draft.updatedAt).toLocaleString()}
                </div>
                <span
                  className={cn(
                    'inline-block text-xs font-bold uppercase px-2 py-1 mt-2',
                    draft.approvalStatus === 'approved'
                      ? 'bg-teal/10 text-teal'
                      : draft.approvalStatus === 'changes_requested'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-charcoal/5 text-charcoal/60'
                  )}
                >
                  {APPROVAL_LABEL[draft.approvalStatus]}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => navigate(`/org/requirements/new?draft=${draft.id}`)}>
                  Resume
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteDraft(org.id, draft.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </OrgLayout>
  );
}
