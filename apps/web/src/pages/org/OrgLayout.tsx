import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

const ORG_NAV = [
  { label: 'VivanteIQ', to: '/org/vivanteiq' },
  { label: 'Requirements', to: '/org/requirements' },
  { label: 'Shifts', to: '/org/shifts' },
  { label: 'Passport Vault', to: '/org/passport-vault' },
  { label: 'Organization', to: '/org/setup' },
];

export function OrgLayout({ children }: { children: ReactNode }) {
  return <DashboardShell navItems={ORG_NAV}>{children}</DashboardShell>;
}
