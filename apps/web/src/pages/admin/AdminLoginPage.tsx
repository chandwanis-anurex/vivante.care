import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { setSession } from '@/hooks/useSession';
import { getRoleHome } from '@/lib/roleHome';
import { ShieldCheck } from 'lucide-react';

// Deliberately not linked from Header/Footer/landing anywhere — the only
// way in is knowing this exact URL. Same accept-anything mock auth as the
// org/worker login (no real backend auth exists yet in this prototype).
export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: replace with real admin auth against apps/server
    setSession({ role: 'admin', name: 'VivanteCare Admin' });
    navigate(getRoleHome('admin'));
  }

  return (
    <PageShell>
      <div className="max-w-[420px] mx-auto px-6 py-24">
        <div className="text-center mb-8">
          <ShieldCheck className="text-navy mx-auto mb-4" size={28} strokeWidth={1.75} />
          <h1 className="text-2xl font-bold text-charcoal">VivanteCare Admin</h1>
          <p className="text-sm text-charcoal/60 mt-1">Internal team access only.</p>
        </div>
        <Card accent="neutral">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                placeholder="you@vivante.care"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">Password</label>
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
      </div>
    </PageShell>
  );
}
