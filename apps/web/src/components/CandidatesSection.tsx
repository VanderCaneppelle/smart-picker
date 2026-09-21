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
import { useTranslations } from 'next-intl';

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
  { value: '', labelKey: 'candidatos.filtros.todos' },
  { value: 'active', labelKey: 'candidatos.filtros.todosExcl' },
  { value: 'new', labelKey: 'candidatos.filtros.novos' },
  { value: 'reviewing', labelKey: 'candidatos.filtros.emAnalise' },
  { value: 'interview', labelKey: 'candidatos.filtros.entrevista' },
  { value: 'in_validation', labelKey: 'candidatos.filtros.emValidacao' },
  { value: 'rejected', labelKey: 'candidatos.filtros.encerrados' },
  { value: 'hired', labelKey: 'candidatos.filtros.contratados' },
];

const sourceOptions = [
  { value: '', labelKey: 'importacao.filtroOrigem.todos' },
  { value: 'import', labelKey: 'importacao.filtroOrigem.import' },
  { value: 'form', labelKey: 'importacao.filtroOrigem.form' },
];

/** De quanto em quanto tempo a tela confere a fila de pontuação. */
const INTERVALO_POLLING_MS = 5_000;

interface CandidatesSectionProps {
  jobId: string;
  /** Muda quando uma importação termina, para recarregar a lista. */
  refreshToken?: number;
}

export default function CandidatesSection({ jobId, refreshToken = 0 }: CandidatesSectionProps) {
  const t = useTranslations();
  /** Rótulo resolvido na renderização: a lista guarda a chave. */
  const opcoes = (lista: { value: string; labelKey: string }[]) =>
    lista.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<CandidatesView>('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const initializedRef = useRef(false);

  const filteredBySource = useMemo(() => {
    if (!sourceFilter) return candidates;
    // "Só candidatados" quer dizer quem veio pelo formulário público; importado e
    // recebido por e-mail são as outras origens.
    if (sourceFilter === 'form') return candidates.filter((c) => c.source === 'form');
    return candidates.filter((c) => c.source !== 'form');
  }, [candidates, sourceFilter]);

  const filteredBySearch = useMemo(
    () => filterCandidatesBySearch(filteredBySource, searchQuery),
    [filteredBySource, searchQuery],
  );

  const displayCandidates = useMemo(() => {
    // Kanban: sempre mostra todos os status (incluindo encerrados), apenas aplicando a busca.
    if (view === 'kanban') {
      return filteredBySearch;
    }

    // Lista: respeita o filtro de status.
    if (statusFilter === 'active') {
      // "Todos (excl. encerrados)"
      return filteredBySearch.filter((c) => c.status !== 'rejected');
    }

    if (statusFilter && statusFilter !== 'active') {
      // Status específico (novo, em análise, encerrado, etc.)
      return filteredBySearch.filter((c) => c.status === statusFilter);
    }

    // Padrão: "Todos" (inclui encerrados)
    return filteredBySearch;
  }, [filteredBySearch, statusFilter, view]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setView(resolveInitialView());
  }, []);

  const fetchCandidates = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setIsLoading(true);
      const data = await apiClient.getJobCandidates(jobId);
      setCandidates(data.candidates);
    } catch (error) {
      if (!silencioso) {
        toast.error(t('secaoCand.erroCarregar'));
        console.error(error);
      }
    } finally {
      if (!silencioso) setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates, refreshToken]);

  const pontuando = useMemo(
    () => candidates.filter((c) => c.needs_scoring).length,
    [candidates],
  );

  // Enquanto houver fila, a tela se atualiza sozinha. Recarga silenciosa: um erro de
  // rede no meio do polling não deve encher a tela de toast enquanto o recrutador lê os
  // candidatos que já chegaram.
  useEffect(() => {
    if (pontuando === 0) return;
    const timer = setInterval(() => fetchCandidates(true), INTERVALO_POLLING_MS);
    return () => clearInterval(timer);
  }, [pontuando, fetchCandidates]);

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
    return <Loading text={t('secaoCand.carregando')} />;
  }

  if (candidates.length === 0) {
    return (
      <EmptyState
        title={t('secaoCand.nenhumAinda')}
        description={t('secaoCand.vazioDica')}
      />
    );
  }

  const hasSearchQuery = searchQuery.trim().length > 0;
  const showEmptySearchMessage =
    displayCandidates.length === 0 &&
    (hasSearchQuery || (view === 'list' && !!statusFilter));

  return (
    <div>
      {/* Control Bar única: mesma estrutura em Lista e Kanban */}
      <div className="flex flex-nowrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 shrink-0">
          <CandidatesViewToggle view={view} onViewChange={setView} />
          {view === 'list' && (
            <Select
              options={opcoes(statusOptions)}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[200px] shrink-0"
            />
          )}
          <Select
            options={opcoes(sourceOptions)}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-[180px] shrink-0"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center w-[380px]">
            <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden />
            <input
              type="text"
              placeholder={t('secaoCand.buscar')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t('secaoCand.buscar')}
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
                aria-label={t('secaoCand.limparBusca')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {pontuando > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-blue-600 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" aria-hidden />
              {t('importacao.pontuando', {
                feitos: candidates.length - pontuando,
                total: candidates.length,
              })}
            </span>
          )}
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {t('secaoCand.contagem', { n: displayCandidates.length })}
          </span>
        </div>
      </div>

      {showEmptySearchMessage && (
        <p className="text-sm text-gray-500 text-center py-4 mb-2 rounded-lg bg-gray-50 border border-gray-100">{t('secaoCand.nenhumEncontrado')}</p>
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
