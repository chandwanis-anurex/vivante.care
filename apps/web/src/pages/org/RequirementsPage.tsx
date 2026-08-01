import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/hooks/useSession';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { Plus, Archive, Users, FileEdit } from 'lucide-react';

export function RequirementsPage() {
  const { session } = useSession();
  const { requirements } = useScheduleStore();
  const [showArchived, setShowArchived] = useState(false);

  const visible = useMemo(
    () => requirements.filter((r) => r.orgName === session?.orgName && r.archived === showArchived),
    [requirements, session?.orgName, showArchived]
  );

  return (
    <OrgLayout
      hero={{
        title: 'Requirements',
        subtitle: 'Matching runs every 12 hours. A requirement with no matches yet will stay open.',
      }}
    >
      <div className="flex items-center justify-end mb-8">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive size={16} />
            {showArchived ? 'View Active' : 'Archived Requirements'}
          </Button>
          <Link to="/org/requirements/drafts">
            <Button variant="outline">
              <FileEdit size={16} />
              Drafts
            </Button>
          </Link>
          <Link to="/org/requirements/new">
            <Button>
              <Plus size={16} />
              New Requirement
            </Button>
          </Link>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-lg text-charcoal/60">
            {showArchived ? 'No archived requirements.' : 'No requirements yet — create your first one.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((req) => (
            <Link key={req.id} to={`/org/requirements/${req.id}`}>
              <Card
                accent="neutral"
                className="flex items-center justify-between hover:border-navy/40 transition-colors cursor-pointer"
              >
                <div>
                  <div className="text-xl font-bold text-charcoal">{req.title}</div>
                  <div className="text-sm text-charcoal/60 mt-1">
                    {req.location} · {req.shiftType} · Opened{' '}
                    {new Date(req.openedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Users size={16} className="text-teal" />
                  <span className="text-md font-bold text-teal">
                    {req.matches.length} {req.matches.length === 1 ? 'match' : 'matches'}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </OrgLayout>
  );
}
