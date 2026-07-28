import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { ChatFillsFormPanel, type FormFieldDef } from '@/components/ChatFillsFormPanel';
import { useSession } from '@/hooks/useSession';
import { useScheduleStore } from '@/hooks/useScheduleStore';

const FIELDS: FormFieldDef[] = [
  { key: 'title', label: 'Requirement Title', type: 'text', placeholder: 'e.g. Weekend RN — Home Health' },
  {
    key: 'specialty',
    label: 'Specialty',
    type: 'select',
    options: ['Registered Nurse', 'Licensed Vocational Nurse', 'Physical Therapist', 'Occupational Therapist', 'Home Health Aide'],
  },
  { key: 'location', label: 'Location', type: 'text', placeholder: 'City, State' },
  { key: 'shiftType', label: 'Shift Type', type: 'text', placeholder: 'e.g. Weekday Days, Overnight, Flexible' },
  { key: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Anything else the matching engine should know' },
];

export function NewRequirementPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const { session } = useSession();
  const { createRequirement } = useScheduleStore();
  const navigate = useNavigate();

  function handleSubmit() {
    // Matching engine runs once per 12h; this requirement will appear in
    // the list immediately with 0 matches until the next run.
    createRequirement({
      title: values.title,
      specialty: values.specialty,
      location: values.location,
      shiftType: values.shiftType,
      orgName: session?.orgName ?? 'Unspecified',
    });
    navigate('/org/requirements');
  }

  return (
    <OrgLayout>
      <h1 className="text-3xl font-bold text-charcoal mb-2">New Requirement</h1>
      <p className="text-base text-charcoal/60 mb-6">
        Describe the staffing need in the chat, or fill the form directly. Submitting sends this
        into the next matching run.
      </p>

      <ChatFillsFormPanel
        title="Requirement Details"
        description="I'll ask about specialty, location, and shift type as needed."
        fields={FIELDS}
        extractEndpoint="/api/ai/requirements/extract"
        values={values}
        onValuesChange={setValues}
        onSubmit={handleSubmit}
        submitLabel="Submit Requirement"
      />
    </OrgLayout>
  );
}
