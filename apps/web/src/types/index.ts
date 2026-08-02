export type UserRole = 'org' | 'worker' | 'admin';

export interface Session {
  role: UserRole;
  name: string;
  orgName?: string;
}
