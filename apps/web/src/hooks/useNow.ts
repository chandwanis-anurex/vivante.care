import { useEffect, useState } from 'react';

/** Re-renders the caller every `intervalMs` — used for live "expires in X" countdowns. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
