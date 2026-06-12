import { createContext, useContext, useState, type ReactNode } from 'react';

type ConsentState = 'accepted' | 'declined' | null;

interface ConsentContextValue {
  consent: ConsentState;
  accept: () => void;
  decline: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: null,
  accept: () => {},
  decline: () => {},
});

const STORAGE_KEY = 'cookie_consent';

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'accepted' || v === 'declined') return v;
    } catch { /* private browsing */ }
    return null;
  });

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch { /* ignore */ }
    setConsent('accepted');
  };

  const decline = () => {
    try { localStorage.setItem(STORAGE_KEY, 'declined'); } catch { /* ignore */ }
    setConsent('declined');
  };

  return (
    <ConsentContext.Provider value={{ consent, accept, decline }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  return useContext(ConsentContext);
}
