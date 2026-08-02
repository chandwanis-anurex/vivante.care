import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, UserRound } from 'lucide-react';

const roleCopy: Record<'org' | 'worker', { title: string; blurb: string; accent: 'navy' | 'teal'; icon: typeof Building2 }> = {
  org: {
    title: 'Healthcare Org Registration',
    blurb: 'Post requirements, review matches, and manage your Passport Vault.',
    accent: 'navy',
    icon: Building2,
  },
  worker: {
    title: 'Healthcare Worker Registration',
    blurb: 'Build your VivantePassport and start matching with shifts.',
    accent: 'teal',
    icon: UserRound,
  },
};

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const role: 'org' | 'worker' = roleParam === 'worker' ? 'worker' : 'org';
  const copy = roleCopy[role];
  const Icon = copy.icon;

  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setSubmitted(true);
  }

  return (
    <PageShell>
      <div className="max-w-[560px] mx-auto px-6 py-20">
        <div className="text-xs font-bold tracking-wide text-teal uppercase mb-3 text-center">
          New Registration
        </div>
        <h1 className="text-4xl font-extrabold text-charcoal text-center mb-10">
          {copy.title}
        </h1>

        {submitted ? (
          <Card accent={copy.accent} className="text-center py-12">
            <p className="text-xl font-bold text-charcoal mb-2">Registration received.</p>
            <p className="text-base text-charcoal/70 mb-6">
              We're setting up account access — check back soon, or sign in once your account is active.
            </p>
            <Link to="/login">
              <Button variant="outline">Back to Sign In</Button>
            </Link>
          </Card>
        ) : (
          <Card accent="neutral">
            <div className="flex items-center gap-3 mb-4">
              <Icon className={role === 'org' ? 'text-navy' : 'text-teal'} size={24} strokeWidth={1.75} />
              <p className="text-base text-charcoal/70">{copy.blurb}</p>
            </div>

            <div className="text-md font-semibold text-charcoal/60 mb-4">
              Registering as{' '}
              <span className="text-navy font-bold">
                {role === 'org' ? 'Healthcare Organization' : 'Healthcare Worker'}
              </span>{' '}
              ·{' '}
              <Link
                to={role === 'org' ? '/register?role=worker' : '/register?role=org'}
                className="text-teal underline"
              >
                switch
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {role === 'org' && (
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
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                  placeholder="Your full name"
                />
              </div>
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
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

              <Button type="submit" className="w-full" size="lg">
                Create Account
              </Button>

              <p className="text-sm text-charcoal/60 text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-teal underline">
                  Sign in
                </Link>
              </p>
            </form>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
