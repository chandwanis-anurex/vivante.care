import { WorkerLayout } from './WorkerLayout';
import { Card } from '@/components/ui/Card';

const METRICS = [
  { label: 'Shifts Completed (90d)', value: '11' },
  { label: 'Active Job Matches', value: '2' },
  { label: 'Passport Completeness', value: '92%' },
];

export function WorkerVivanteIQPage() {
  return (
    <WorkerLayout>
      <h1 className="text-3xl font-bold text-charcoal mb-2">VivanteIQ</h1>
      <p className="text-base text-charcoal/60 mb-8">Your activity at a glance.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <Card key={m.label} accent="teal">
            <div className="text-3xl font-extrabold text-navy">{m.value}</div>
            <div className="text-sm text-charcoal/60 mt-1">{m.label}</div>
          </Card>
        ))}
      </div>
    </WorkerLayout>
  );
}
