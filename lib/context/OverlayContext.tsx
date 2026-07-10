'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, startTransition } from 'react';

type OverlayState = 'idle' | 'loading' | 'success';

interface OverlayContextType {
  state: OverlayState;
  executeWithOverlay: <T>(action: () => Promise<T>) => Promise<T>;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState>('idle');

  const executeWithOverlay = useCallback(<T,>(action: () => Promise<T>): Promise<T> => {
    return new Promise<T>(async (resolve, reject) => {
      setState('loading');
      try {
        const result = await action();
        // Resolve immediately so the caller's logic (like closing a modal) isn't delayed
        resolve(result);
        
        // Check if the server action returned an error object
        const hasError = result && typeof result === 'object' && 'error' in result && result.error;
        
        if (hasError) {
          setState('idle');
        } else {
          setState('success');
          // Wait briefly before removing the success checkmark overlay
          setTimeout(() => {
            setState('idle');
          }, 1200);
        }
      } catch (error) {
        setState('idle');
        reject(error);
      }
    });
  }, []);

  return (
    <OverlayContext.Provider value={{ state, executeWithOverlay }}>
      {children}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (context === undefined) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
}

export function useOverlayTransition(): [boolean, (action: () => Promise<any>) => void] {
  const { state, executeWithOverlay } = useOverlay();
  const startTransitionWithOverlay = useCallback((action: () => Promise<any>) => {
    executeWithOverlay(action).catch(console.error);
  }, [executeWithOverlay]);
  
  return [state !== 'idle', startTransitionWithOverlay];
}
