'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutList, Columns3 } from 'lucide-react';

export type CandidatesView = 'list' | 'kanban';

const STORAGE_KEY = 'candidates_view';

export function resolveInitialView(): CandidatesView {
  if (typeof window === 'undefined') return 'list';

  const urlView = new URLSearchParams(window.location.search).get('view');
  if (urlView === 'list' || urlView === 'kanban') {
    localStorage.setItem(STORAGE_KEY, urlView);
    return urlView;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'list' || stored === 'kanban') return stored;

  return 'list';
}

interface CandidatesViewToggleProps {
  view: CandidatesView;
  onViewChange: (view: CandidatesView) => void;
}

export default function CandidatesViewToggle({ view, onViewChange }: CandidatesViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  const setView = useCallback(
    (newView: CandidatesView) => {
      onViewChange(newView);
      localStorage.setItem(STORAGE_KEY, newView);

      const url = new URL(window.location.href);
      url.searchParams.set('view', newView);
      router.replace(`${pathname}${url.search}`, { scroll: false });
    },
    [onViewChange, router, pathname],
  );

  const btnBase =
    'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all';

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
      <button
        onClick={() => setView('list')}
        className={`${btnBase} ${
          view === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <LayoutList className="h-4 w-4" />
        Lista
      </button>
      <button
        onClick={() => setView('kanban')}
        className={`${btnBase} ${
          view === 'kanban'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Columns3 className="h-4 w-4" />
        Kanban
      </button>
    </div>
  );
}
