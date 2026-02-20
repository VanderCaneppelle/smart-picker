'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Loading, EmptyState } from '@/components/ui';
import CandidatesViewToggle, {
  resolveInitialView,
  type CandidatesView,
} from './CandidatesViewToggle';
import CandidatesTable from './CandidatesTable';
import CandidatesKanbanBoard from './CandidatesKanbanBoard';
import type { Candidate } from '@hunter/core';

interface CandidatesSectionProps {
  jobId: string;
}

export default function CandidatesSection({ jobId }: CandidatesSectionProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<CandidatesView>('list');

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setView(resolveInitialView());
  }, []);

  const fetchCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getJobCandidates(jobId);
      setCandidates(data.candidates);
    } catch (error) {
      toast.error('Falha ao carregar candidatos');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  if (isLoading) {
    return <Loading text="Carregando candidatos..." />;
  }

  if (candidates.length === 0) {
    return (
      <EmptyState
        title="Nenhum candidato ainda"
        description="Compartilhe a vaga para começar a receber candidaturas"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <CandidatesViewToggle view={view} onViewChange={setView} />
      </div>

      {view === 'list' ? (
        <CandidatesTable
          jobId={jobId}
          candidates={candidates}
          setCandidates={setCandidates}
          onRefetch={fetchCandidates}
        />
      ) : (
        <CandidatesKanbanBoard candidates={candidates} setCandidates={setCandidates} />
      )}
    </div>
  );
}
