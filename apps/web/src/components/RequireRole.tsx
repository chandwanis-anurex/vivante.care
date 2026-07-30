import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { getRoleHome } from '@/lib/roleHome';
import type { UserRole } from '@/types';

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { session } = useSession();

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) {
    return <Navigate to={getRoleHome(session.role)} replace />;
  }

  return <>{children}</>;
}
