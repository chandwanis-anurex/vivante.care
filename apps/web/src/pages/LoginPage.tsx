import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { setSession } from '@/hooks/useSession';
import { useOrgRegistry } from '@/hooks/useOrgRegistry';
import type { UserRole } from '@/types';
import { Building2, UserRound } from 'lucide-react';

export function LoginPage() {
  const { organizations } = useOrgRegistry();
  // Only fully activated orgs (verified + subscribed) can log in — a
  // registration mid-flow, blocked, or Enterprise-pending org won't
  // appear here. See RegisterOrgPage.tsx / hooks/useOrgRegistry.ts.
  const loginableOrgs = organizations.filter((o) => o.verificationStatus === 'verified' && o.subscriptionPlan);

  const [selected, setSelected] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState(() => loginableOrgs[0]?.name ?? '');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    // TODO: replace with real POST /api/auth/login against apps/server
    setSession({
      role: selected,
      name: selected === 'org' ? 'Jordan Alvarez' : 'Taylor Brooks',
      orgName: selected === 'org' ? orgName : undefined,
    });
    navigate(selected === 'org' ? '/org/requirements' : '/worker/passport');
  }

  return (
    <PageShell>
      <div className="max-w-[560px] mx-auto px-6 py-20">
        <div className="text-xs font-bold tracking-wide text-teal uppercase mb-3 text-center">
          Sign In
        </div>
        <h1 className="text-4xl font-extrabold text-charcoal text-center mb-10">
          How are you using VivanteCare?
        </h1>

        {!selected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Card accent="navy" className="h-full">
              <button onClick={() => setSelected('org')} className="text-left w-full hover:opacity-80 transition-opacity">
                <Building2 className="text-navy mb-4" size={28} strokeWidth={1.75} />
                <div className="text-2xl font-bold text-charcoal mb-2">Healthcare Org Login</div>
                <p className="text-base text-charcoal/70">
                  Post requirements, review matches, and manage your Passport Vault.
                </p>
              </button>
              <Link
                to="/register"
                className="inline-block text-sm font-semibold text-teal underline mt-3"
              >
                New organization? Register here
              </Link>
            </Card>

            <button onClick={() => setSelected('worker')} className="text-left">
              <Card accent="teal" className="h-full hover:bg-teal/[0.08] transition-colors cursor-pointer">
                <UserRound className="text-teal mb-4" size={28} strokeWidth={1.75} />
                <div className="text-2xl font-bold text-charcoal mb-2">Healthcare Worker Login</div>
                <p className="text-base text-charcoal/70">
                  Manage your VivantePassport, job matches, and shifts.
                </p>
              </Card>
            </button>
          </div>
        ) : (
          <Card accent="neutral">
            <div className="text-md font-semibold text-charcoal/60 mb-4">
              Signing in as{' '}
              <span className="text-navy font-bold">
                {selected === 'org' ? 'Healthcare Organization' : 'Healthcare Worker'}
              </span>{' '}
              ·{' '}
              <button type="button" onClick={() => setSelected(null)} className="text-teal underline">
                change
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {selected === 'org' && (
                <div>
                  <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                    Organization
                  </label>
                  <select
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none bg-white"
                  >
                    {loginableOrgs.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                  placeholder="you@organization.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Sign In
              </Button>
            </form>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
