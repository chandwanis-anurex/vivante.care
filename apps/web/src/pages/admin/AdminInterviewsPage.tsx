import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useScheduleStore } from '@/hooks/useScheduleStore';

export function AdminInterviewsPage() {
  const { interviewRequests, sendInterviewSlot } = useScheduleStore();
  const [slots, setSlots] = useState<Record<string, string>>({});

  const pending = interviewRequests.filter((ir) => ir.status === 'pending_admin');
  const sent = interviewRequests.filter((ir) => ir.status === 'sent_to_worker');

  return (
    <AdminLayout
      hero={{
        title: 'Interviews',
        subtitle: 'Orgs request an interview; only VivanteCare picks the actual slot and sends it to the worker.',
      }}
    >

      <div className="text-lg font-bold text-charcoal mb-3">Awaiting a Slot</div>
      {pending.length === 0 ? (
        <Card className="text-center py-10 mb-8">
          <p className="text-base text-charcoal/50">No pending interview requests.</p>
        </Card>
      ) : (
        <div className="space-y-3 mb-8">
          {pending.map((ir) => (
            <Card key={ir.id} accent="neutral">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="text-lg font-bold text-charcoal">{ir.candidateName}</div>
                  <div className="text-sm text-charcoal/60">
                    {ir.orgName} · "{ir.requirementTitle}" · Requested{' '}
                    {new Date(ir.createdAt).toLocaleString()}
                  </div>
                  {ir.note && <div className="text-sm text-charcoal/70 mt-1 italic">"{ir.note}"</div>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={slots[ir.id] ?? ''}
                    onChange={(e) => setSlots({ ...slots, [ir.id]: e.target.value })}
                    className="border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
                  />
                  <Button
                    size="sm"
                    disabled={!slots[ir.id]}
                    onClick={() => sendInterviewSlot(ir.id, new Date(slots[ir.id]).toISOString())}
                  >
                    Send to Worker
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="text-lg font-bold text-charcoal mb-3">Scheduled</div>
      {sent.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-base text-charcoal/50">No interviews scheduled yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sent.map((ir) => (
            <Card key={ir.id} accent="neutral" className="flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-charcoal">{ir.candidateName}</div>
                <div className="text-sm text-charcoal/60">
                  {ir.orgName} · "{ir.requirementTitle}"
                </div>
              </div>
              <div className="text-sm font-semibold text-teal">
                {ir.scheduledAt && new Date(ir.scheduledAt).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
