import { useCallback, useSyncExternalStore } from 'react';
import type { Session } from '@/types';

// Prototype-only session store (localStorage). Swap for a real auth
// context backed by apps/server session/JWT endpoints when wiring up
// the Fastify API.
const STORAGE_KEY = 'vivantecare.session';
const listeners = new Set<() => void>();

// useSyncExternalStore requires getSnapshot to return a stable (===)
// reference when nothing has changed. Parsing localStorage fresh on
// every call returns a new object each time, which makes React think
// the store changed on every render and causes an infinite update
// loop ("Maximum update depth exceeded"). Cache the parsed result and
// only re-parse when the raw string actually differs.
let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;

function readSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedSession;
  }
  cachedRaw = raw;
  try {
    cachedSession = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function setSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emitChange();
}

export function clearSessionStore() {
  localStorage.removeItem(STORAGE_KEY);
  emitChange();
}

export function useSession() {
  const session = useSyncExternalStore(subscribe, readSession, () => null);

  const clearSession = useCallback(() => {
    clearSessionStore();
  }, []);

  return { session, setSession, clearSession };
}
