import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrgLayout } from './OrgLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/hooks/useSession';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useOrgRegistry } from '@/hooks/useOrgRegistry';
import { getVaultWithOwnPassport } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import {
  SPECIALTY_OPTIONS,
  estimateMarketRate,
  estimateFillProbability,
  generateSuggestions,
  computeStaffingReadiness,
  findSimilarActiveRequirement,
  getRecentSpecialties,
  getHistoricalAvgFillHours,
} from '@/lib/workforceRequestForecast';
import type {
  AssignmentType,
  RequestPriority,
  RequestReason,
  RequirementBudget,
  RequirementQualifications,
  RequirementSchedule,
  RequirementTemplate,
  ShiftPeriod,
} from '@/types';
import { Sparkles, AlertTriangle, X, Search } from 'lucide-react';

const REASON_OPTIONS: RequestReason[] = [
  'Open Position',
  'Call-Off',
  'Vacation Coverage',
  'Seasonal Demand',
  'Census Increase',
  'Emergency',
  'New Unit',
  'Leave of Absence',
  'Other',
];

const ASSIGNMENT_TYPE_OPTIONS: AssignmentType[] = [
  'Per Diem',
  'Temporary',
  'Contract',
  'Travel',
  'Permanent',
  'Float Pool',
  'Rapid Response',
];

const SHIFT_OPTIONS: ShiftPeriod[] = ['Day', 'Evening', 'Night'];
const PRIORITY_OPTIONS: RequestPriority[] = ['Low', 'Medium', 'High', 'Emergency'];
const YEARS_EXPERIENCE_OPTIONS = ['Less than 1 year', '1-2 years', '2-5 years', '5+ years'];

interface WizardForm {
  specialty: string;
  reason: RequestReason | '';
  assignmentType: AssignmentType | '';
  facilityId: string;
  facilityFreeform: string;
  departmentId: string;
  unit: string;
  floor: string;
  costCenter: string;
  startDate: string;
  endDate: string;
  shift: ShiftPeriod | '';
  hoursPerWeek: string;
  weekendRequired: boolean;
  holidayRequired: boolean;
  overtimeAllowed: boolean;
  stateLicense: string;
  yearsExperience: string;
  requiredCertifications: string[];
  requiredSkills: string[];
  emrExperience: string;
  specialtyExperience: string;
  language: string;
  previousFacilityExperience: string;
  maxBillRate: string;
  estimatedHours: string;
  priority: RequestPriority;
  recruiterEmail: string;
  saveAsTemplate: boolean;
  templateName: string;
}

const INITIAL_FORM: WizardForm = {
  specialty: '',
  reason: '',
  assignmentType: '',
  facilityId: '',
  facilityFreeform: '',
  departmentId: '',
  unit: '',
  floor: '',
  costCenter: '',
  startDate: '',
  endDate: '',
  shift: '',
  hoursPerWeek: '',
  weekendRequired: false,
  holidayRequired: false,
  overtimeAllowed: false,
  stateLicense: '',
  yearsExperience: '',
  requiredCertifications: [],
  requiredSkills: [],
  emrExperience: '',
  specialtyExperience: '',
  language: '',
  previousFacilityExperience: '',
  maxBillRate: '',
  estimatedHours: '',
  priority: 'Medium',
  recruiterEmail: '',
  saveAsTemplate: false,
  templateName: '',
};

const TOTAL_STEPS = 8;

export function NewWorkforceRequestPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const { requirements, shiftRequests, assignRequests, createRequirement } = useScheduleStore();
  const { organizations, logAudit, saveRequestTemplate } = useOrgRegistry();
  const vault = useMemo(() => getVaultWithOwnPassport(), []);

  const org = organizations.find((o) => o.name === session?.orgName);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(INITIAL_FORM);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [showPreferred, setShowPreferred] = useState(false);

  function update(patch: Partial<WizardForm>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  const recentSpecialties = useMemo(
    () => (org ? getRecentSpecialties(requirements, org.name) : []),
    [requirements, org]
  );

  function applyTemplate(t: RequirementTemplate) {
    update({
      specialty: t.specialty,
      assignmentType: t.assignmentType ?? '',
      shift: t.schedule?.shift ?? '',
      hoursPerWeek: t.schedule?.hoursPerWeek ?? '',
      weekendRequired: t.schedule?.weekendRequired ?? false,
      holidayRequired: t.schedule?.holidayRequired ?? false,
      overtimeAllowed: t.schedule?.overtimeAllowed ?? false,
      stateLicense: t.qualifications?.stateLicense ?? '',
      yearsExperience: t.qualifications?.yearsExperience ?? '',
      requiredCertifications: t.qualifications?.requiredCertifications ?? [],
      requiredSkills: t.qualifications?.requiredSkills ?? [],
      emrExperience: t.qualifications?.emrExperience ?? '',
      specialtyExperience: t.qualifications?.specialtyExperience ?? '',
      language: t.qualifications?.language ?? '',
      previousFacilityExperience: t.qualifications?.previousFacilityExperience ?? '',
      maxBillRate: t.budget ? String(t.budget.maxBillRate) : '',
      estimatedHours: t.budget ? String(t.budget.estimatedHours) : '',
      priority: t.budget?.priority ?? 'Medium',
    });
  }

  const budgetDraft: RequirementBudget = {
    maxBillRate: Number(form.maxBillRate) || 0,
    estimatedHours: Number(form.estimatedHours) || 0,
    priority: form.priority,
  };
  const scheduleFlags = {
    weekendRequired: form.weekendRequired,
    holidayRequired: form.holidayRequired,
    overtimeAllowed: form.overtimeAllowed,
  };

  const liveForecast = useMemo(() => {
    if (!form.specialty || !form.assignmentType || !org) return null;
    const marketRate = estimateMarketRate(form.specialty, form.assignmentType as AssignmentType, form.priority);
    const historicalAvg = getHistoricalAvgFillHours(shiftRequests, assignRequests, org.name, form.specialty);
    const fillEstimate = estimateFillProbability(budgetDraft, marketRate, scheduleFlags, historicalAvg);
    return { marketRate, fillEstimate, estimatedCost: budgetDraft.maxBillRate * budgetDraft.estimatedHours };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.specialty,
    form.assignmentType,
    form.priority,
    form.maxBillRate,
    form.estimatedHours,
    form.weekendRequired,
    form.holidayRequired,
    form.overtimeAllowed,
    org,
    shiftRequests,
    assignRequests,
  ]);

  const qualificationsDraft: RequirementQualifications = {
    stateLicense: form.stateLicense,
    yearsExperience: form.yearsExperience,
    requiredCertifications: form.requiredCertifications,
    requiredSkills: form.requiredSkills,
    emrExperience: form.emrExperience || undefined,
    specialtyExperience: form.specialtyExperience || undefined,
    language: form.language || undefined,
    previousFacilityExperience: form.previousFacilityExperience || undefined,
  };

  const readiness = useMemo(() => {
    if (!liveForecast) return null;
    const matchingVaultCount = vault.filter((v) => v.specialty === form.specialty).length;
    return computeStaffingReadiness(
      budgetDraft,
      liveForecast.marketRate,
      scheduleFlags,
      qualificationsDraft,
      matchingVaultCount
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveForecast, form.requiredCertifications, form.specialty, vault]);

  const suggestions = useMemo(() => {
    if (!liveForecast) return [];
    return generateSuggestions(form.specialty, budgetDraft, liveForecast.marketRate, qualificationsDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveForecast, form.specialty, form.requiredCertifications]);

  const duplicate = useMemo(() => {
    if (!org || !form.specialty) return null;
    return findSimilarActiveRequirement(requirements, org.name, form.specialty);
  }, [requirements, org, form.specialty]);

  const filteredSpecialties = SPECIALTY_OPTIONS.filter((s) =>
    s.toLowerCase().includes(specialtyFilter.toLowerCase())
  );

  const selectedFacility = org?.facilities.find((f) => f.id === form.facilityId);
  const selectedDepartment = org?.departments.find((d) => d.id === form.departmentId);

  const nextDisabled: Record<number, boolean> = {
    1: !form.specialty,
    2: !form.reason,
    3: !form.assignmentType,
    4: !(form.facilityId || form.facilityFreeform.trim()),
    5: !(form.startDate && form.endDate && form.shift),
    6: !form.stateLicense.trim(),
    7: !(form.maxBillRate && form.estimatedHours),
  };

  function handleSubmit() {
    if (!org || !liveForecast) return;

    const schedule: RequirementSchedule = {
      startDate: form.startDate,
      endDate: form.endDate,
      shift: form.shift as ShiftPeriod,
      hoursPerWeek: form.hoursPerWeek,
      ...scheduleFlags,
    };

    const facilityName = selectedFacility?.name || form.facilityFreeform;
    const locationParts = [facilityName, selectedDepartment?.name, form.unit].filter(Boolean) as string[];
    const location = locationParts.length > 0 ? locationParts.join(' · ') : 'Unspecified';
    const shiftTypeSummary =
      [form.shift, form.weekendRequired && 'Weekends', form.holidayRequired && 'Holidays']
        .filter(Boolean)
        .join(' · ') || form.shift;
    const title = [form.shift, form.specialty].filter(Boolean).join(' ');

    const requirement = createRequirement({
      title,
      specialty: form.specialty,
      location,
      shiftType: shiftTypeSummary,
      orgName: org.name,
      reason: form.reason || undefined,
      assignmentType: (form.assignmentType || undefined) as AssignmentType | undefined,
      facilityId: form.facilityId || undefined,
      departmentId: form.departmentId || undefined,
      unit: form.unit || undefined,
      floor: form.floor || undefined,
      costCenter: form.costCenter || undefined,
      schedule,
      qualifications: qualificationsDraft,
      budget: budgetDraft,
      forecast: {
        estimatedMarketRate: liveForecast.marketRate,
        fillProbabilityPct: liveForecast.fillEstimate.fillProbabilityPct,
        expectedFillHours: liveForecast.fillEstimate.expectedFillHours,
        suggestions,
      },
      recruiterEmail: form.recruiterEmail || undefined,
    });

    logAudit(org.id, `Created workforce request "${title}"`);

    if (form.saveAsTemplate && form.templateName.trim()) {
      saveRequestTemplate(org.id, {
        name: form.templateName.trim(),
        specialty: form.specialty,
        assignmentType: (form.assignmentType || undefined) as AssignmentType | undefined,
        schedule: {
          shift: schedule.shift,
          hoursPerWeek: schedule.hoursPerWeek,
          weekendRequired: schedule.weekendRequired,
          holidayRequired: schedule.holidayRequired,
          overtimeAllowed: schedule.overtimeAllowed,
        },
        qualifications: qualificationsDraft,
        budget: budgetDraft,
      });
    }

    navigate(`/org/requirements/${requirement.id}`);
  }

  if (!org) {
    return (
      <OrgLayout>
        <p className="text-charcoal/60">No organization record found for this session.</p>
      </OrgLayout>
    );
  }

  return (
    <OrgLayout>
      <h1 className="text-3xl font-bold text-charcoal mb-2">New Workforce Request</h1>
      <p className="text-base text-charcoal/60 mb-6">
        A few quick screens instead of one long form — most requests take under 2 minutes.
      </p>

      {step === 1 && (
        <StepShell
          step={step}
          title="What do you need?"
          subtitle="What type of healthcare professional do you need?"
          onNext={() => setStep(2)}
          nextDisabled={nextDisabled[1]}
        >
          {(recentSpecialties.length > 0 || org.requestTemplates.length > 0) && (
            <div className="space-y-3">
              {recentSpecialties.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-charcoal/60 mb-1.5">Recently requested</div>
                  <div className="flex flex-wrap gap-2">
                    {recentSpecialties.map((s) => (
                      <ChipButton key={s} selected={form.specialty === s} onClick={() => update({ specialty: s })}>
                        {s}
                      </ChipButton>
                    ))}
                  </div>
                </div>
              )}
              {org.requestTemplates.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-charcoal/60 mb-1.5">Saved templates</div>
                  <div className="flex flex-wrap gap-2">
                    {org.requestTemplates.map((t) => (
                      <ChipButton key={t.id} selected={false} onClick={() => applyTemplate(t)}>
                        {t.name}
                      </ChipButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              placeholder="Search roles…"
              className="w-full border border-charcoal/20 pl-9 pr-3 py-2.5 text-base outline-none focus:border-navy"
            />
          </div>
          <div className="border border-charcoal/15 max-h-64 overflow-y-auto">
            {filteredSpecialties.map((s) => (
              <button
                key={s}
                onClick={() => update({ specialty: s })}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-base border-b border-charcoal/10 last:border-0',
                  form.specialty === s ? 'bg-navy text-white' : 'hover:bg-navy/[0.04] text-charcoal'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          step={step}
          title="Why do you need staff?"
          subtitle="This helps AI prioritize."
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          nextDisabled={nextDisabled[2]}
        >
          <ChipSelect options={REASON_OPTIONS} value={form.reason} onChange={(v) => update({ reason: v })} />
        </StepShell>
      )}

      {step === 3 && (
        <StepShell
          step={step}
          title="Assignment type"
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          nextDisabled={nextDisabled[3]}
        >
          <ChipSelect
            options={ASSIGNMENT_TYPE_OPTIONS}
            value={form.assignmentType}
            onChange={(v) => update({ assignmentType: v })}
          />
        </StepShell>
      )}

      {step === 4 && (
        <StepShell
          step={step}
          title="Where?"
          subtitle="Location auto-populates from your organization setup."
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
          nextDisabled={nextDisabled[4]}
        >
          {org.facilities.length > 0 ? (
            <Field label="Facility">
              <select
                value={form.facilityId}
                onChange={(e) => update({ facilityId: e.target.value, departmentId: '' })}
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy bg-white"
              >
                <option value="">Select…</option>
                {org.facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Facility">
              <input
                value={form.facilityFreeform}
                onChange={(e) => update({ facilityFreeform: e.target.value })}
                placeholder="e.g. Main Campus"
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
              />
              <p className="text-xs text-charcoal/50 mt-1.5">
                No facilities configured yet —{' '}
                <Link to="/org/setup" className="text-teal underline">
                  add them in Organization settings
                </Link>{' '}
                for a picker next time.
              </p>
            </Field>
          )}

          {org.departments.length > 0 ? (
            <Field label="Department">
              <select
                value={form.departmentId}
                onChange={(e) => update({ departmentId: e.target.value })}
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy bg-white"
              >
                <option value="">Select…</option>
                {org.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Unit">
              <input
                value={form.unit}
                onChange={(e) => update({ unit: e.target.value })}
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
              />
            </Field>
            <Field label="Floor (optional)">
              <input
                value={form.floor}
                onChange={(e) => update({ floor: e.target.value })}
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
              />
            </Field>
            <Field label="Cost Center">
              <input
                value={form.costCenter}
                onChange={(e) => update({ costCenter: e.target.value })}
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
              />
            </Field>
          </div>
        </StepShell>
      )}

      {step === 5 && (
        <StepShell
          step={step}
          title="Schedule"
          onBack={() => setStep(4)}
          onNext={() => setStep(6)}
          nextDisabled={nextDisabled[5]}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update({ startDate: e.target.value })}
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
              />
            </Field>
            <Field label="End Date">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update({ endDate: e.target.value })}
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
              />
            </Field>
          </div>
          <Field label="Shift">
            <ChipSelect options={SHIFT_OPTIONS} value={form.shift} onChange={(v) => update({ shift: v })} />
          </Field>
          <Field label="Hours">
            <input
              value={form.hoursPerWeek}
              onChange={(e) => update({ hoursPerWeek: e.target.value })}
              placeholder="e.g. 36 hrs/week"
              className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
            />
          </Field>
          <div className="flex flex-wrap gap-6 pt-2">
            <Toggle label="Weekend Required?" checked={form.weekendRequired} onChange={(v) => update({ weekendRequired: v })} />
            <Toggle label="Holiday Required?" checked={form.holidayRequired} onChange={(v) => update({ holidayRequired: v })} />
            <Toggle label="Overtime Allowed?" checked={form.overtimeAllowed} onChange={(v) => update({ overtimeAllowed: v })} />
          </div>
        </StepShell>
      )}

      {step === 6 && (
        <StepShell
          step={step}
          title="Required qualifications"
          onBack={() => setStep(5)}
          onNext={() => setStep(7)}
          nextDisabled={nextDisabled[6]}
        >
          <Field label="State License">
            <input
              value={form.stateLicense}
              onChange={(e) => update({ stateLicense: e.target.value })}
              placeholder="e.g. CA RN License"
              className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
            />
          </Field>
          <Field label="Years of Experience">
            <select
              value={form.yearsExperience}
              onChange={(e) => update({ yearsExperience: e.target.value })}
              className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy bg-white"
            >
              <option value="">Select…</option>
              {YEARS_EXPERIENCE_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
          <TagInput
            label="Required Certifications"
            values={form.requiredCertifications}
            onChange={(v) => update({ requiredCertifications: v })}
            placeholder="e.g. BLS, ACLS — press Enter to add"
          />
          <TagInput
            label="Required Skills"
            values={form.requiredSkills}
            onChange={(v) => update({ requiredSkills: v })}
            placeholder="e.g. IV insertion — press Enter to add"
          />

          <button
            type="button"
            onClick={() => setShowPreferred((v) => !v)}
            className="text-sm font-semibold text-teal"
          >
            {showPreferred ? 'Hide' : 'Show'} preferred qualifications (optional)
          </button>
          {showPreferred && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-charcoal/10 pt-4">
              <Field label="EMR Experience">
                <input
                  value={form.emrExperience}
                  onChange={(e) => update({ emrExperience: e.target.value })}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
                />
              </Field>
              <Field label="Specialty Experience">
                <input
                  value={form.specialtyExperience}
                  onChange={(e) => update({ specialtyExperience: e.target.value })}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
                />
              </Field>
              <Field label="Language">
                <input
                  value={form.language}
                  onChange={(e) => update({ language: e.target.value })}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
                />
              </Field>
              <Field label="Previous Facility Experience">
                <input
                  value={form.previousFacilityExperience}
                  onChange={(e) => update({ previousFacilityExperience: e.target.value })}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
                />
              </Field>
            </div>
          )}
        </StepShell>
      )}

      {step === 7 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <StepShell
              step={step}
              title="Budget"
              onBack={() => setStep(6)}
              onNext={() => setStep(8)}
              nextDisabled={nextDisabled[7]}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Maximum Bill Rate ($/hr)">
                  <input
                    type="number"
                    min={0}
                    value={form.maxBillRate}
                    onChange={(e) => update({ maxBillRate: e.target.value })}
                    className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
                  />
                </Field>
                <Field label="Estimated Hours">
                  <input
                    type="number"
                    min={0}
                    value={form.estimatedHours}
                    onChange={(e) => update({ estimatedHours: e.target.value })}
                    className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy"
                  />
                </Field>
              </div>
              <Field label="Priority">
                <ChipSelect options={PRIORITY_OPTIONS} value={form.priority} onChange={(v) => update({ priority: v })} />
              </Field>
            </StepShell>
          </div>
          <div>
            <Card accent="teal">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-teal" />
                <div className="text-md font-bold text-charcoal">VivanteIQ™ responds</div>
              </div>
              {liveForecast ? (
                <div className="space-y-3 text-sm">
                  <ForecastStat label="Market Rate" value={`$${liveForecast.marketRate}/hr`} />
                  <ForecastStat
                    label="Expected Fill Time"
                    value={`${liveForecast.fillEstimate.expectedFillHours}h`}
                  />
                  <ForecastStat
                    label="Estimated Cost"
                    value={`$${liveForecast.estimatedCost.toLocaleString()}`}
                  />
                  <ForecastStat
                    label="Likelihood of Filling"
                    value={`${liveForecast.fillEstimate.fillProbabilityPct}%`}
                  />
                </div>
              ) : (
                <p className="text-sm text-charcoal/50">Enter budget details to see live estimates.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {step === 8 && liveForecast && (
        <div className="space-y-4">
          <Card accent="navy">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-navy" />
              <div className="text-xl font-bold text-charcoal">AI Review</div>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-base">
              <SummaryRow label="Role" value={form.specialty} />
              <SummaryRow label="Reason" value={form.reason} />
              <SummaryRow label="Assignment Type" value={form.assignmentType} />
              <SummaryRow
                label="Facility"
                value={selectedFacility?.name || form.facilityFreeform || 'Unspecified'}
              />
              <SummaryRow label="Shift" value={form.shift} />
              <SummaryRow label="Start" value={form.startDate} />
              <SummaryRow label="Priority" value={form.priority} />
              <SummaryRow label="Estimated Fill Time" value={`${liveForecast.fillEstimate.expectedFillHours} hrs`} />
            </dl>
          </Card>

          {duplicate && (
            <Card accent="neutral" className="border-amber-300 bg-amber-50/60">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-base text-charcoal">
                  A similar {form.specialty} request is already active ("{duplicate.title}"). You can{' '}
                  <Link to={`/org/requirements/${duplicate.id}`} className="text-teal underline font-semibold">
                    view it
                  </Link>{' '}
                  or continue creating this one.
                </p>
              </div>
            </Card>
          )}

          {readiness && (
            <Card accent="teal">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold text-charcoal">Staffing Readiness Score™</div>
                <div className="text-3xl font-extrabold text-teal">{readiness.score}/100</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {readiness.factors.map((f) => (
                  <div key={f.label}>
                    <div className="text-lg font-bold text-navy">{f.pct}%</div>
                    <div className="text-xs text-charcoal/60">{f.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card accent="neutral">
            <div className="text-lg font-bold text-charcoal mb-3">AI Suggestions</div>
            <ul className="space-y-2">
              {suggestions.map((s) => (
                <li key={s} className="text-base text-charcoal/80">
                  • {s}
                </li>
              ))}
            </ul>
            <p className="text-xs text-charcoal/40 mt-3">These are recommendations, not automatic changes.</p>
          </Card>

          <Card accent="neutral">
            <div className="text-lg font-bold text-charcoal mb-3">Assign &amp; Submit</div>
            {org.team.length > 0 ? (
              <Field label="Assigned Recruiter">
                <select
                  value={form.recruiterEmail}
                  onChange={(e) => update({ recruiterEmail: e.target.value })}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy bg-white"
                >
                  <option value="">Unassigned</option>
                  {org.team.map((t) => (
                    <option key={t.id} value={t.email}>
                      {t.email} ({t.role})
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <p className="text-sm text-charcoal/50 mb-4">
                No team members invited yet — this request will be Unassigned.{' '}
                <Link to="/org/setup" className="text-teal underline">
                  Invite your team
                </Link>
                .
              </p>
            )}

            <label className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={form.saveAsTemplate}
                onChange={(e) => update({ saveAsTemplate: e.target.checked })}
                className="w-4 h-4 accent-navy"
              />
              <span className="text-base text-charcoal">Save as a template for next time</span>
            </label>
            {form.saveAsTemplate && (
              <input
                value={form.templateName}
                onChange={(e) => update({ templateName: e.target.value })}
                placeholder='e.g. "ICU Night RN"'
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base outline-none focus:border-navy mt-2"
              />
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(7)}>
                Back
              </Button>
              <Button onClick={handleSubmit}>Submit Request</Button>
            </div>
          </Card>
        </div>
      )}
    </OrgLayout>
  );
}

function StepShell({
  step,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextDisabled,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <Card accent="neutral" className="max-w-2xl">
      <div className="text-xs font-bold text-teal uppercase tracking-wide mb-1">
        Step {step} of {TOTAL_STEPS}
      </div>
      <div className="text-2xl font-bold text-charcoal mb-1">{title}</div>
      {subtitle && <p className="text-base text-charcoal/60 mb-6">{subtitle}</p>}
      <div className="space-y-4">{children}</div>
      <div className="flex justify-between mt-8">
        {onBack ? (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : (
          <div />
        )}
        <Button onClick={onNext} disabled={nextDisabled}>
          Continue
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ChipButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-sm font-semibold px-3 py-1.5 border transition-colors',
        selected ? 'bg-navy text-white border-navy' : 'border-charcoal/20 text-charcoal hover:border-navy'
      )}
    >
      {children}
    </button>
  );
}

function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T | '';
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <ChipButton key={opt} selected={value === opt} onClick={() => onChange(opt)}>
          {opt}
        </ChipButton>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-navy"
      />
      <span className="text-base text-charcoal">{label}</span>
    </label>
  );
}

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  }

  return (
    <Field label={label}>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 text-xs font-semibold bg-teal/10 text-teal px-2 py-1"
            >
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="hover:text-red-600">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-navy"
        />
        <Button type="button" size="sm" variant="outline" onClick={add}>
          Add
        </Button>
      </div>
    </Field>
  );
}

function ForecastStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-charcoal/10 pb-2 last:border-0">
      <span className="text-charcoal/60">{label}</span>
      <span className="font-bold text-navy">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between border-b border-charcoal/10 py-1.5">
      <dt className="text-charcoal/60">{label}</dt>
      <dd className="font-semibold text-charcoal">{value || '—'}</dd>
    </div>
  );
}
