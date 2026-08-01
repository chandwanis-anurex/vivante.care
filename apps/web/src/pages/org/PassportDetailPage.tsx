import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { ChatFillsFormPanel, type FormFieldDef } from '@/components/ChatFillsFormPanel';
import { ScheduleChatPanel } from '@/components/ScheduleChatPanel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/hooks/useSession';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { getVaultWithOwnPassport } from '@/lib/mockData';
import type { ScheduleRule } from '@/types';
import { ChevronLeft } from 'lucide-react';

const FIELDS: FormFieldDef[] = [
  { key: 'title', label: 'Shift Title', type: 'text', placeholder: 'e.g. Weekend RN Coverage' },
  { key: 'location', label: 'Location', type: 'text', placeholder: 'City, State' },
  { key: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Anything else worth noting' },
];

export function PassportDetailPage() {
  const { id } = useParams();
  const { session } = useSession();
  const { requestShiftForPassport } = useScheduleStore();
  const navigate = useNavigate();
  const vault = useMemo(() => getVaultWithOwnPassport(), []);
  const passport = vault.find((v) => v.id === id);

  const [showRequest, setShowRequest] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<ScheduleRule[]>([]);

  if (!passport) {
    return (
      <OrgLayout hero={{ title: 'Passport Not Found' }}>
        <p className="text-charcoal/60">No passport with ID "{id}".</p>
      </OrgLayout>
    );
  }

  const fieldsFilled = FIELDS.every((f) => values[f.key]?.trim());
  const schedule = rules[0];

  function handleRequestShift() {
    if (!passport || !schedule || !fieldsFilled) return;
    requestShiftForPassport(
      {
        title: values.title,
        specialty: passport.specialty,
        location: values.location,
        orgName: session?.orgName ?? 'Unspecified',
        notes: values.notes,
        daysOfWeek: schedule.daysOfWeek,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        label: schedule.label,
      },
      passport.id,
      passport.name
    );
    navigate('/org/shifts');
  }

  return (
    <OrgLayout hero={{ title: passport.name, subtitle: `${passport.specialty} · ${passport.location}` }}>
      <Link
        to="/org/passport-vault"
        className="inline-flex items-center gap-1 text-sm font-semibold text-charcoal/60 hover:text-navy mb-4"
      >
        <ChevronLeft size={16} /> All Passports
      </Link>

      <Card accent="teal" className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-md font-bold text-teal">{passport.id}</div>
            <div className="text-lg font-bold text-charcoal mt-1">{passport.name}</div>
          </div>
          {!showRequest && <Button onClick={() => setShowRequest(true)}>Request Shift</Button>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          <Field label="Specialty" value={passport.specialty} />
          <Field
            label="License Status"
            value={passport.licenseStatus}
            valueClassName={passport.licenseStatus === 'Current' ? 'text-teal' : 'text-amber-600'}
          />
          <Field label="Location" value={passport.location} />
          <Field label="Years Experience" value={passport.yearsExperience} />
          <Field
            label="Certifications"
            value={passport.certifications.length > 0 ? passport.certifications.join(', ') : 'None listed'}
          />
        </div>
      </Card>

      {showRequest && (
        <>
          <div className="text-lg font-bold text-charcoal mb-1">Request Shift</div>
          <p className="text-sm text-charcoal/60 mb-4">
            For {passport.name} ({passport.specialty}) — VivanteCare reviews every request before the worker is
            notified.
          </p>

          <ChatFillsFormPanel
            title="Shift Details"
            description="I'll ask about location and any notes for the worker."
            fields={FIELDS}
            extractEndpoint="/api/ai/shifts/extract"
            values={values}
            onValuesChange={setValues}
            onSubmit={() => {
              /* Captured live as you chat — the "When" panel below finishes the request. */
            }}
            submitLabel="Details Captured"
          />

          <div className="mt-8">
            <ScheduleChatPanel
              title="When"
              description={'Describe the schedule this shift needs covered, e.g. "Every Saturday and Sunday, 7am-7pm, all of August."'}
              extractEndpoint="/api/ai/schedule/extract"
              context="a healthcare organization describing when a single shift needs to be covered (a recurrence, not availability)"
              rules={rules}
              onRulesChange={setRules}
              onSubmit={handleRequestShift}
              submitLabel="Request Shift"
              showKindBadge={false}
              maxRules={1}
              submitDisabled={!fieldsFilled}
              disabledHint="Fill in the Shift Details above (via chat or directly) to continue."
            />
          </div>
        </>
      )}
    </OrgLayout>
  );
}

function Field({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-charcoal/50">{label}</div>
      <div className={`text-base font-semibold text-charcoal mt-0.5 ${valueClassName ?? ''}`}>{value}</div>
    </div>
  );
}
