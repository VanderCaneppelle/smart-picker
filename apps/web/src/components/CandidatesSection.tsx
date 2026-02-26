'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Loading, EmptyState, Select } from '@/components/ui';
import CandidatesViewToggle, {
  resolveInitialView,
  type CandidatesView,
} from './CandidatesViewToggle';
import CandidatesTable from './CandidatesTable';
import CandidatesKanbanBoard from './CandidatesKanbanBoard';
import type { Candidate } from '@hunter/core';

const statusOptions = [
  { value: '', label: 'Todos (excl. rejeitados)' },
  { value: 'new', label: 'Novos' },
  { value: 'reviewing', label: 'Em análise' },
  { value: 'interview', label: 'Entrevista' },
  { value: 'in_validation', label: 'Em validação' },
  { value: 'rejected', label: 'Rejeitados' },
  { value: 'hired', label: 'Contratados' },
];

interface CandidatesSectionProps {
  jobId: string;
}

export default function CandidatesSection({ jobId }: CandidatesSectionProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<CandidatesView>('list');
  const [statusFilter, setStatusFilter] = useState('');

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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: candidates.filter((c) => c.status !== 'rejected').length,
      new: 0,
      reviewing: 0,
      interview: 0,
      in_validation: 0,
      rejected: 0,
      hired: 0,
    };
    candidates.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [candidates]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <CandidatesViewToggle view={view} onViewChange={setView} />
        {view === 'list' && (
          <div className="flex items-center gap-3 sm:ml-auto">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-56"
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {statusFilter ? (statusCounts[statusFilter] ?? 0) : statusCounts.all} candidatos
            </span>
          </div>
        )}
      </div>

      {view === 'list' ? (
        <CandidatesTable
          jobId={jobId}
          candidates={candidates}
          setCandidates={setCandidates}
          onRefetch={fetchCandidates}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      ) : (
        <CandidatesKanbanBoard candidates={candidates} setCandidates={setCandidates} />
      )}
    </div>
  );
}
