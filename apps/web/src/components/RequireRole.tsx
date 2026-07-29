import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import type { UserRole } from '@/types';

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { session } = useSession();

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) {
    const home =
      session.role === 'org'
        ? '/org/vivanteiq'
        : session.role === 'worker'
          ? '/worker/passport'
          : '/admin/requirements';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
