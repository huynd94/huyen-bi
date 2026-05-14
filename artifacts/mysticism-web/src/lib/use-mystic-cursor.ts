import { useEffect, useState } from "react";

import {
  MYSTIC_CURSOR_STORAGE_KEY,
  readMysticCursorEnabled,
  subscribeMysticCursor,
  toggleMysticCursor,
  writeMysticCursorEnabled,
} from "@/lib/mystic-cursor-store";

/**
 * React binding around the framework-agnostic `mystic-cursor-store`.
 *
 * Returns the current preference plus stable setters. Subscribes to both
 * in-memory updates (other UI that calls {@link writeMysticCursorEnabled})
 * and `storage` events so toggling the preference in another tab updates
 * the current tab automatically.
 *
 * SSR-safe: during the first render `enabled` defaults to the store value
 * which is `MYSTIC_CURSOR_DEFAULT_ENABLED` when `window` is unavailable.
 *
 * Validates: Requirements 17.5.
 */
export function useMysticCursorEnabled(): {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
  toggle: () => void;
} {
  const [enabled, setLocal] = useState<boolean>(() => readMysticCursorEnabled());

  useEffect(() => {
    // Sync once on mount in case the value was changed before subscription
    // (e.g. another component called `writeMysticCursorEnabled` synchronously
    // during initial render).
    setLocal(readMysticCursorEnabled());

    const unsubscribe = subscribeMysticCursor((next) => setLocal(next));

    const onStorage = (event: StorageEvent) => {
      if (event.key !== MYSTIC_CURSOR_STORAGE_KEY) return;
      setLocal(readMysticCursorEnabled());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return {
    enabled,
    setEnabled: writeMysticCursorEnabled,
    toggle: () => {
      toggleMysticCursor();
    },
  };
}
