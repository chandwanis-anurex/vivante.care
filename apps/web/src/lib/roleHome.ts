import type { UserRole } from '@/types';

// Single source of truth for "where does this role land" — used by
// RequireRole's mismatch redirect, both login flows, and the header logo
// link (clicking the logo while logged in should go home, not to the
// public landing page).
export function getRoleHome(role: UserRole): string {
  switch (role) {
    case 'org':
      return '/org/vivanteiq';
    case 'worker':
      return '/worker/passport';
    case 'admin':
      return '/admin/requirements';
  }
}
