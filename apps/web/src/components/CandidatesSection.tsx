'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { Search, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Loading, EmptyState, Select } from '@/components/ui';
import CandidatesViewToggle, {
  resolveInitialView,
  type CandidatesView,
} from './CandidatesViewToggle';
import CandidatesTable from './CandidatesTable';
import CandidatesKanbanBoard from './CandidatesKanbanBoard';
import type { Candidate } from '@hunter/core';

/** Busca global: nome, e-mail, resumo do CV, nível de experiência, score numérico */
function filterCandidatesBySearch(candidates: Candidate[], query: string): Candidate[] {
  const q = query.trim().toLowerCase();
  if (!q) return candidates;
  return candidates.filter((c) => {
    if (c.name?.toLowerCase().includes(q)) return true;
    if (c.email?.toLowerCase().includes(q)) return true;
    if (c.resume_summary?.toLowerCase().includes(q)) return true;
    if (c.experience_level?.toLowerCase().includes(q)) return true;
    if (c.fit_score != null && String(c.fit_score).includes(q)) return true;
    return false;
  });
}

const statusOptions = [
  { value: '', label: 'Todos (excl. encerrados)' },
  { value: 'new', label: 'Novos' },
  { value: 'reviewing', label: 'Em análise' },
  { value: 'interview', label: 'Entrevista' },
  { value: 'in_validation', label: 'Em validação' },
  { value: 'rejected', label: 'Encerrados' },
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
  const [searchQuery, setSearchQuery] = useState('');

  const initializedRef = useRef(false);

  const filteredBySearch = useMemo(
    () => filterCandidatesBySearch(candidates, searchQuery),
    [candidates, searchQuery],
  );

  const displayCandidates = useMemo(() => {
    if (statusFilter) return filteredBySearch.filter((c) => c.status === statusFilter);
    return filteredBySearch.filter((c) => c.status !== 'rejected');
  }, [filteredBySearch, statusFilter]);

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
      all: filteredBySearch.filter((c) => c.status !== 'rejected').length,
      new: 0,
      reviewing: 0,
      interview: 0,
      in_validation: 0,
      rejected: 0,
      hired: 0,
    };
    filteredBySearch.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [filteredBySearch]);

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

  const hasSearchQuery = searchQuery.trim().length > 0;
  const showEmptySearchMessage =
    (view === 'kanban' || view === 'list') && displayCandidates.length === 0 && (hasSearchQuery || !!statusFilter);

  return (
    <div>
      {/* Control Bar única: mesma estrutura em Lista e Kanban */}
      <div className="flex flex-nowrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 shrink-0">
          <CandidatesViewToggle view={view} onViewChange={setView} />
          {view === 'list' && (
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[200px] shrink-0"
            />
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center w-[380px]">
            <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden />
            <input
              type="text"
              placeholder="Buscar por nome, email ou palavra-chave"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar por nome, email ou palavra-chave"
              className="w-full min-w-0 pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg
                placeholder-gray-400 text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-shadow"
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {displayCandidates.length} candidato{displayCandidates.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {showEmptySearchMessage && (
        <p className="text-sm text-gray-500 text-center py-4 mb-2 rounded-lg bg-gray-50 border border-gray-100">
          Nenhum candidato encontrado
        </p>
      )}

      {view === 'list' ? (
        <CandidatesTable
          jobId={jobId}
          candidates={displayCandidates}
          setCandidates={setCandidates}
          onRefetch={fetchCandidates}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      ) : (
        <CandidatesKanbanBoard
          candidates={displayCandidates}
          setCandidates={setCandidates}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
}
