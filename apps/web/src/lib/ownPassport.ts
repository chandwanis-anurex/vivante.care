// Persists the logged-in worker's own passport (id + form values + field
// sharing) so it's stable across reloads instead of regenerated per mount,
// and so the org side (PassportVaultPage) can list it alongside the
// static mock vault — the only way to test the full assign-request loop
// in one browser without a real multi-account backend.
const STORAGE_KEY = 'vivantecare.ownPassport';

export interface OwnPassport {
  id: string;
  values: Record<string, string>;
  shared: Record<string, boolean>;
}

export function getOwnPassport(): OwnPassport | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OwnPassport;
  } catch {
    return null;
  }
}

export function saveOwnPassport(passport: OwnPassport) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
}

export function generatePassportId(): string {
  return `V${Math.floor(1000000 + Math.random() * 9000000)}`;
}
