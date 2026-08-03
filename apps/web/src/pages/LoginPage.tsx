import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/hooks/useSession';
import type { UserRole } from '@/types';
import { Building2, UserRound } from 'lucide-react';

export function LoginPage() {
  const { setSession } = useSession();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSession({
      role: selected,
      name: selected === 'org' ? 'Jordan Alvarez' : 'Taylor Brooks',
      orgName: selected === 'org' ? orgName : undefined,
    });
    setSubmitted(true);
  }

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative w-full min-h-[420px] overflow-hidden bg-navy">
        <img
          src="/images/login-security-banner.png"
          alt=""
          className="absolute inset-y-0 right-0 w-full sm:w-1/2 h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/0" />
        <div className="relative z-10 max-w-[520px] p-10 py-16">
          <div className="text-xs font-bold tracking-wide text-teal uppercase mb-3">
            Secure Access
          </div>
          <h1 className="text-6xl font-extrabold text-white leading-tight mb-4">
            Sign In to <span className="text-teal">VivanteCare</span>
          </h1>
          <p className="text-xl leading-relaxed text-white/80 max-w-[420px]">
            Your credentials, verified and protected at every step.
          </p>
        </div>
      </section>

      <div className="max-w-[560px] mx-auto px-6 py-20">
        <div className="text-xs font-bold tracking-wide text-teal uppercase mb-3 text-center">
          Sign In
        </div>
        <h1 className="text-4xl font-extrabold text-charcoal text-center mb-10">
          How are you using VivanteCare?
        </h1>

        {submitted ? (
          <Card accent="teal" className="text-center py-12">
            <p className="text-xl font-bold text-charcoal mb-2">You're signed in.</p>
            <p className="text-base text-charcoal/70">
              Full dashboards are being rebuilt — check back soon.
            </p>
          </Card>
        ) : !selected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <button onClick={() => setSelected('org')} className="text-left w-full">
                <Card accent="navy" className="h-full hover:bg-navy/[0.06] transition-colors cursor-pointer">
                  <Building2 className="text-navy mb-4" size={28} strokeWidth={1.75} />
                  <div className="text-2xl font-bold text-charcoal mb-2">Healthcare Org Login</div>
                  <p className="text-base text-charcoal/70">
                    Post requirements, review matches, and manage your Passport Vault.
                  </p>
                </Card>
              </button>
              <div className="text-center mt-3">
                <Link to="/register?role=org" className="text-sm font-semibold text-navy underline">
                  New Registration
                </Link>
              </div>
            </div>

            <div>
              <button onClick={() => setSelected('worker')} className="text-left w-full">
                <Card accent="teal" className="h-full hover:bg-teal/[0.08] transition-colors cursor-pointer">
                  <UserRound className="text-teal mb-4" size={28} strokeWidth={1.75} />
                  <div className="text-2xl font-bold text-charcoal mb-2">Healthcare Worker Login</div>
                  <p className="text-base text-charcoal/70">
                    Manage your VivantePassport, job matches, and shifts.
                  </p>
                </Card>
              </button>
              <div className="text-center mt-3">
                <Link to="/register?role=worker" className="text-sm font-semibold text-teal underline">
                  New Registration
                </Link>
              </div>
            </div>
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
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                    placeholder="Your organization name"
                  />
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
