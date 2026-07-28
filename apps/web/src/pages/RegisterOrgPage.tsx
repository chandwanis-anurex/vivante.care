import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useOrgRegistry } from '@/hooks/useOrgRegistry';
import { setSession } from '@/hooks/useSession';
import type { OrgConflictResult } from '@/lib/orgRegistration';
import type { OrgType, SubscriptionPlan } from '@/types';
import { Building2, Mail, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

const ORG_TYPES: OrgType[] = [
  'Hospital',
  'Clinic',
  'Skilled Nursing Facility',
  'Home Health',
  'Behavioral Health',
  'Hospice',
  'Rehabilitation',
];

const PLANS: { plan: SubscriptionPlan; blurb: string }[] = [
  { plan: 'Free Trial', blurb: '14 days, full feature access, no card required.' },
  { plan: 'Starter', blurb: 'For single-facility orgs getting started.' },
  { plan: 'Professional', blurb: 'Multi-facility, priority matching, VivanteIQ analytics.' },
  { plan: 'Enterprise', blurb: 'Custom terms — our team will reach out to activate.' },
];

type Step = 'form' | 'verify-email' | 'blocked' | 'subscription' | 'enterprise-pending';

export function RegisterOrgPage() {
  const { registerOrganization, verifyOrganization, completeSubscription } = useOrgRegistry();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('form');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<OrgConflictResult | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  const [name, setName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orgType, setOrgType] = useState<OrgType>('Home Health');
  const [numFacilities, setNumFacilities] = useState('1');
  const [numEmployees, setNumEmployees] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [timeZone, setTimeZone] = useState('');

  function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    const org = registerOrganization({
      name: name.trim(),
      businessEmail: businessEmail.trim(),
      phone: phone.trim(),
      orgType,
      numFacilities: Number(numFacilities) || 0,
      numEmployees: Number(numEmployees) || 0,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
      timeZone: timeZone.trim() || undefined,
    });
    setOrgId(org.id);
    setStep('verify-email');
  }

  function handleSimulateVerify() {
    if (!orgId) return;
    const result = verifyOrganization(orgId);
    if (!result) return;
    if (result.status === 'blocked') {
      setConflicts(result.conflicts);
      setStep('blocked');
    } else {
      setStep('subscription');
    }
  }

  function handleChoosePlan(plan: SubscriptionPlan) {
    if (!orgId) return;
    if (plan === 'Enterprise') {
      setStep('enterprise-pending');
      return;
    }
    completeSubscription(orgId, plan);
    setSession({ role: 'org', name: 'Organization Admin', orgName: name.trim() });
    navigate('/org/setup');
  }

  return (
    <PageShell>
      <div className="max-w-[640px] mx-auto px-6 py-16">
        <div className="text-xs font-bold tracking-wide text-teal uppercase mb-3 text-center">
          Get Started
        </div>
        <h1 className="text-4xl font-extrabold text-charcoal text-center mb-10">
          Register Your Organization
        </h1>

        {step === 'form' && (
          <Card accent="navy">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-navy" size={24} strokeWidth={1.75} />
              <div className="text-xl font-bold text-charcoal">Create Organization</div>
            </div>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                  Organization Name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                  placeholder="e.g. Riverside Home Health"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                    Business Email
                  </label>
                  <input
                    type="email"
                    required
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                    placeholder="you@organization.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                    placeholder="(555) 010-0100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                  Organization Type
                </label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as OrgType)}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none bg-white"
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                    Number of Facilities
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={numFacilities}
                    onChange={(e) => setNumFacilities(e.target.value)}
                    className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                    Number of Employees
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={numEmployees}
                    onChange={(e) => setNumEmployees(e.target.value)}
                    className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOptional((v) => !v)}
                className="flex items-center gap-1 text-sm font-semibold text-teal"
              >
                {showOptional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Optional details
              </button>

              {showOptional && (
                <div className="space-y-4 border-t border-charcoal/10 pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">Website</label>
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">Address</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">Time Zone</label>
                    <input
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                      placeholder="e.g. America/Los_Angeles"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg">
                Continue
              </Button>
            </form>
          </Card>
        )}

        {step === 'verify-email' && (
          <Card accent="neutral" className="text-center py-12">
            <Mail className="text-teal mx-auto mb-4" size={32} strokeWidth={1.75} />
            <div className="text-xl font-bold text-charcoal mb-2">Check your email</div>
            <p className="text-base text-charcoal/60 mb-6 max-w-sm mx-auto">
              We've sent a verification link to <span className="font-semibold">{businessEmail}</span>.
              No access until it's confirmed.
            </p>
            <Button onClick={handleSimulateVerify}>Simulate: Click Verification Link</Button>
            <p className="text-xs text-charcoal/40 mt-3">
              (No real email service is wired up in this prototype — this button stands in for it.)
            </p>
          </Card>
        )}

        {step === 'blocked' && (
          <Card accent="neutral" className="text-center py-12 border-red-200 bg-red-50/40">
            <ShieldAlert className="text-red-600 mx-auto mb-4" size={32} strokeWidth={1.75} />
            <div className="text-xl font-bold text-charcoal mb-2">
              An organization already exists
            </div>
            <p className="text-base text-charcoal/60 mb-6 max-w-sm mx-auto">
              {conflicts?.domainConflict
                ? "An organization is already registered with this email domain."
                : 'An organization with this name is already registered.'}{' '}
              Please contact your administrator to be added to the existing organization rather
              than creating a duplicate.
            </p>
            <Link to="/login" className="text-teal font-semibold underline">
              Back to Login
            </Link>
          </Card>
        )}

        {step === 'subscription' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map(({ plan, blurb }) => (
              <button key={plan} onClick={() => handleChoosePlan(plan)} className="text-left">
                <Card
                  accent={plan === 'Enterprise' ? 'purple' : 'teal'}
                  className="h-full hover:bg-teal/[0.08] transition-colors cursor-pointer"
                >
                  <div className="text-xl font-bold text-charcoal mb-2">{plan}</div>
                  <p className="text-sm text-charcoal/70">{blurb}</p>
                </Card>
              </button>
            ))}
          </div>
        )}

        {step === 'enterprise-pending' && (
          <Card accent="neutral" className="text-center py-12">
            <div className="text-xl font-bold text-charcoal mb-2">Thanks for your interest</div>
            <p className="text-base text-charcoal/60 mb-6 max-w-sm mx-auto">
              Our sales team will reach out within one business day to finish setting up your
              Enterprise plan.
            </p>
            <Link to="/" className="text-teal font-semibold underline">
              Back to Home
            </Link>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
