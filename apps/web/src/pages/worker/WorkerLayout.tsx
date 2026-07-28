import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

const WORKER_NAV = [
  { label: 'VivantePassport', to: '/worker/passport' },
  { label: 'Job Matches', to: '/worker/matches' },
  { label: 'Shifts', to: '/worker/shifts' },
  { label: 'VivanteIQ', to: '/worker/vivanteiq' },
];

export function WorkerLayout({ children }: { children: ReactNode }) {
  return <DashboardShell navItems={WORKER_NAV}>{children}</DashboardShell>;
}
