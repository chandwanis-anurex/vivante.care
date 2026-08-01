import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

const ORG_NAV = [
  { label: 'VivanteIQ', to: '/org/vivanteiq' },
  { label: 'Requirements', to: '/org/requirements' },
  { label: 'Shifts', to: '/org/shifts' },
  { label: 'Passport Vault', to: '/org/passport-vault' },
  { label: 'Organization', to: '/org/setup' },
];

interface OrgLayoutProps {
  hero: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode };
  children: ReactNode;
}

export function OrgLayout({ hero, children }: OrgLayoutProps) {
  return (
    <DashboardShell navItems={ORG_NAV} hero={hero}>
      {children}
    </DashboardShell>
  );
}
