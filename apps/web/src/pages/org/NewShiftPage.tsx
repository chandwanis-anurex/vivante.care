import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { ChatFillsFormPanel, type FormFieldDef } from '@/components/ChatFillsFormPanel';
import { ScheduleChatPanel } from '@/components/ScheduleChatPanel';
import { useSession } from '@/hooks/useSession';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import type { ScheduleRule } from '@/types';

const FIELDS: FormFieldDef[] = [
  { key: 'title', label: 'Shift Title', type: 'text', placeholder: 'e.g. Weekend RN Coverage' },
  {
    key: 'specialty',
    label: 'Specialty',
    type: 'select',
    options: ['Registered Nurse', 'Licensed Vocational Nurse', 'Physical Therapist', 'Occupational Therapist', 'Home Health Aide'],
  },
  { key: 'location', label: 'Location', type: 'text', placeholder: 'City, State' },
  { key: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Anything else workers should know' },
];

export function NewShiftPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const { session } = useSession();
  const { createShiftRequest } = useScheduleStore();
  const navigate = useNavigate();

  const fieldsFilled = FIELDS.every((f) => values[f.key]?.trim());
  const schedule = rules[0];

  function handlePostShift() {
    if (!schedule || !fieldsFilled) return;
    createShiftRequest({
      title: values.title,
      specialty: values.specialty,
      location: values.location,
      orgName: session?.orgName ?? 'Unspecified',
      notes: values.notes,
      daysOfWeek: schedule.daysOfWeek,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      label: schedule.label,
    });
    navigate('/org/shifts');
  }

  return (
    <OrgLayout>
      <h1 className="text-3xl font-bold text-charcoal mb-2">New Shift</h1>
      <p className="text-base text-charcoal/60 mb-6">
        Describe the staffing need — the matching engine will use this to find or suggest
        available VivantePassports.
      </p>

      <ChatFillsFormPanel
        title="Shift Details"
        description="I'll ask about specialty, location, and any notes for the worker."
        fields={FIELDS}
        extractEndpoint="/api/ai/shifts/extract"
        values={values}
        onValuesChange={setValues}
        onSubmit={() => {
          /* Captured live as you chat — the "When" panel below finishes posting the shift. */
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
          onSubmit={handlePostShift}
          submitLabel="Post Shift"
          showKindBadge={false}
          maxRules={1}
          submitDisabled={!fieldsFilled}
          disabledHint="Fill in the Shift Details above (via chat or directly) to continue."
        />
      </div>
    </OrgLayout>
  );
}
