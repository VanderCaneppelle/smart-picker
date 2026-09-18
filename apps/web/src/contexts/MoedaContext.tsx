'use client';

import { createContext, useContext } from 'react';
import type { Moeda } from '@/lib/pais';

const MoedaContext = createContext<Moeda>('BRL');

/** Alimentado pelo layout servidor, que é onde o país da requisição existe. */
export function MoedaProvider({ moeda, children }: { moeda: Moeda; children: React.ReactNode }) {
  return <MoedaContext.Provider value={moeda}>{children}</MoedaContext.Provider>;
}

export function useMoeda(): Moeda {
  return useContext(MoedaContext);
}
