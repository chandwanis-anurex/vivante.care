import { useEffect, useState } from 'react';
import { WorkerLayout } from './WorkerLayout';
import { ChatFillsFormPanel, type FormFieldDef } from '@/components/ChatFillsFormPanel';
import { ScheduleChatPanel } from '@/components/ScheduleChatPanel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getOwnPassport, generatePassportId, saveOwnPassport } from '@/lib/ownPassport';
import { useScheduleStore } from '@/hooks/useScheduleStore';

const FIELDS: FormFieldDef[] = [
  { key: 'fullName', label: 'Full Name', type: 'text' },
  {
    key: 'specialty',
    label: 'Specialty',
    type: 'select',
    options: ['Registered Nurse', 'Licensed Vocational Nurse', 'Physical Therapist', 'Occupational Therapist', 'Home Health Aide'],
  },
  { key: 'licenseNumber', label: 'License Number', type: 'text' },
  { key: 'location', label: 'Location', type: 'text', placeholder: 'City, State' },
];

// Mandatory fields cannot be hidden from organizations per spec.
const MANDATORY = new Set(['fullName', 'specialty', 'licenseNumber']);

export function PassportPage() {
  // Persisted so the ID/values are stable across reloads and visible to
  // the org side (PassportVaultPage) — a real passport ID is assigned
  // server-side and guaranteed unique/never reused per spec.
  const [passportId] = useState(() => getOwnPassport()?.id ?? generatePassportId());
  const [values, setValues] = useState<Record<string, string>>(() => getOwnPassport()?.values ?? {});
  const [shared, setShared] = useState<Record<string, boolean>>(
    () => getOwnPassport()?.shared ?? Object.fromEntries(FIELDS.map((f) => [f.key, true]))
  );
  const { availabilityRules, setAvailabilityRules } = useScheduleStore();
  const rules = availabilityRules[passportId] ?? [];

  useEffect(() => {
    saveOwnPassport({ id: passportId, values, shared });
  }, [passportId, values, shared]);

  return (
    <WorkerLayout
      hero={{
        title: 'VivantePassport',
        subtitle: 'Build your profile once. Choose which fields organizations can see below.',
      }}
    >
      <div className="flex justify-end mb-4">
        <span className="text-md font-bold text-teal">{passportId}</span>
      </div>

      <ChatFillsFormPanel
        title="Your Profile"
        description="I'll ask about specialty, licensing, and availability."
        fields={FIELDS}
        extractEndpoint="/api/ai/passport/extract"
        values={values}
        onValuesChange={setValues}
        onSubmit={() => {
          /* TODO: POST /api/passport */
        }}
        submitLabel="Save Passport"
      />

      <Card accent="neutral" className="mt-6">
        <div className="text-lg font-bold text-charcoal mb-4">Field Sharing</div>
        <div className="space-y-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex items-center justify-between py-2 border-b border-charcoal/10 last:border-0">
              <span className="text-base text-charcoal">
                {f.label}
                {MANDATORY.has(f.key) && (
                  <span className="text-xs text-charcoal/40 ml-2 uppercase">Required</span>
                )}
              </span>
              <input
                type="checkbox"
                checked={shared[f.key]}
                disabled={MANDATORY.has(f.key)}
                onChange={(e) => setShared({ ...shared, [f.key]: e.target.checked })}
                className="w-4 h-4 accent-navy"
              />
            </label>
          ))}
        </div>
      </Card>

      <div className="mt-6">
        <ScheduleChatPanel
          title="Availability"
          description={
            'Which shifts are you free for, and which are you already booked in? e.g. "I\'m free weekends ' +
            'in August, 7am-7pm, and Tuesday evenings year-round, but I\'m already booked Aug 15-16."'
          }
          extractEndpoint="/api/ai/schedule/extract"
          context="a healthcare worker's own availability — which shifts they're free for vs. already booked elsewhere"
          rules={rules}
          onRulesChange={(next) => setAvailabilityRules(passportId, next)}
          onSubmit={() => {
            /* Rules are already saved to the shared store as they're built — this just confirms. */
          }}
          submitLabel="Save Availability"
        />
      </div>

      <Card accent="neutral" className="mt-4 border-red-200 bg-red-50/40">
        <div className="text-lg font-bold text-charcoal mb-1">Delete Profile</div>
        <p className="text-sm text-charcoal/60 mb-3">
          Permanently deletes your VivantePassport and all associated data. Your passport ID can
          never be reassigned.
        </p>
        <Button variant="danger" size="sm">
          Delete My Profile
        </Button>
      </Card>
    </WorkerLayout>
  );
}
