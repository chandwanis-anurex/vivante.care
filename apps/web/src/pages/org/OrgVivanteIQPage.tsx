import { OrgLayout } from './OrgLayout';
import { Card } from '@/components/ui/Card';

const METRICS = [
  { label: 'Open Requirements', value: '2' },
  { label: 'Passports in Vault', value: '3' },
  { label: 'Most Hired Specialty', value: 'Registered Nurse' },
  { label: 'No-Show Rate (30d)', value: '4.2%' },
];

export function OrgVivanteIQPage() {
  return (
    <OrgLayout>
      <h1 className="text-3xl font-bold text-charcoal mb-2">VivanteIQ</h1>
      <p className="text-base text-charcoal/60 mb-8">
        Workforce analytics across your requirements, vault, and shifts.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <Card key={m.label} accent="teal">
            <div className="text-3xl font-extrabold text-navy">{m.value}</div>
            <div className="text-sm text-charcoal/60 mt-1">{m.label}</div>
          </Card>
        ))}
      </div>
    </OrgLayout>
  );
}
