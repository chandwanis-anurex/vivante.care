import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

const ADMIN_NAV = [
  { label: 'Command Center', to: '/admin/command-center' },
  { label: 'Requirements', to: '/admin/requirements' },
  { label: 'Interviews', to: '/admin/interviews' },
  { label: 'Passports', to: '/admin/passports' },
  { label: 'Shifts', to: '/admin/shifts' },
];

interface AdminLayoutProps {
  hero: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode };
  children: ReactNode;
}

export function AdminLayout({ hero, children }: AdminLayoutProps) {
  return (
    <DashboardShell navItems={ADMIN_NAV} hero={hero}>
      {children}
    </DashboardShell>
  );
}
