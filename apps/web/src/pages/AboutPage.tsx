import { PageShell } from '@/components/layout/PageShell';
import { Hammer } from 'lucide-react';

export function AboutPage() {
  return (
    <PageShell>
      <div className="max-w-[640px] mx-auto px-6 py-28 text-center">
        <Hammer className="text-teal mx-auto mb-6" size={40} strokeWidth={1.5} />
        <h1 className="text-4xl font-extrabold text-charcoal mb-3">About Us</h1>
        <p className="text-lg text-charcoal/60">
          This page is under construction — check back soon.
        </p>
      </div>
    </PageShell>
  );
}
