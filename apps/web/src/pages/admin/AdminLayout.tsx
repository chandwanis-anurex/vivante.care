import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

const ADMIN_NAV = [
  { label: 'Requirements', to: '/admin/requirements' },
  { label: 'Interviews', to: '/admin/interviews' },
  { label: 'Passports', to: '/admin/passports' },
  { label: 'Shifts', to: '/admin/shifts' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardShell navItems={ADMIN_NAV}>{children}</DashboardShell>;
}
