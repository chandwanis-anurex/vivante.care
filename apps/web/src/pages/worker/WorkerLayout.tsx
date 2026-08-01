import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

const WORKER_NAV = [
  { label: 'VivantePassport', to: '/worker/passport' },
  { label: 'Job Matches', to: '/worker/matches' },
  { label: 'Shifts', to: '/worker/shifts' },
  { label: 'VivanteIQ', to: '/worker/vivanteiq' },
];

interface WorkerLayoutProps {
  hero: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode };
  children: ReactNode;
}

export function WorkerLayout({ hero, children }: WorkerLayoutProps) {
  return (
    <DashboardShell navItems={WORKER_NAV} hero={hero}>
      {children}
    </DashboardShell>
  );
}
