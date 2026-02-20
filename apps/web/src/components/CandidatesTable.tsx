'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ExternalLink,
  Eye,
  CheckCircle2,
  RefreshCw,
  MoreVertical,
  Calendar,
  AlertTriangle,
  XCircle,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Badge, Select, Loading, EmptyState, SortIcon } from '@/components/ui';
import type { Candidate, CandidateStatus, DisqualificationFlag } from '@hunter/core';

interface CandidatesTableProps {
  jobId: string;
}

const statusOptions = [
  { value: '', label: 'All (excl. rejected)' },
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'schedule_interview', label: 'Schedule Interview' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const statusUpdateOptions = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'schedule_interview', label: 'Schedule Interview' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'new':
      return 'warning';
    case 'reviewing':
      return 'info';
    case 'schedule_interview':
      return 'purple';
    case 'shortlisted':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'hired':
      return 'success';
    default:
      return 'default';
  }
};

type SortField = 'fit_score' | 'resume_rating' | 'answer_quality_rating' | 'created_at';
type SortDirection = 'asc' | 'desc';

function ActionsMenu({
  candidateId,
  recalculatingId,
  isSaved,
  savingId,
  onView,
  onRecalculate,
  onSave,
  onUnsave,
}: {
  candidateId: string;
  recalculatingId: string | null;
  isSaved: boolean;
  savingId: string | null;
  onView: () => void;
  onRecalculate: () => void;
  onSave: () => void;
  onUnsave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-1">
          <button
            onClick={() => {
              onView();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-4 w-4 text-gray-400" />
            Ver candidato
          </button>
          {isSaved ? (
            <button
              onClick={() => {
                onUnsave();
                setOpen(false);
              }}
              disabled={savingId === candidateId}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookmarkCheck className="h-4 w-4 text-gray-400" />
              {savingId === candidateId ? 'Removendo...' : 'Remover dos salvos'}
            </button>
          ) : (
            <button
              onClick={() => {
                onSave();
                setOpen(false);
              }}
              disabled={savingId === candidateId}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bookmark className="h-4 w-4 text-gray-400" />
              {savingId === candidateId ? 'Salvando...' : 'Salvar candidato'}
            </button>
          )}
          <button
            onClick={() => {
              onRecalculate();
              setOpen(false);
            }}
            disabled={recalculatingId === candidateId}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-400 ${recalculatingId === candidateId ? 'animate-spin' : ''}`}
            />
            {recalculatingId === candidateId ? 'Recalculando...' : 'Recalcular nota'}
          </button>
        </div>
      )}
    </div>
  );
}

function DisqualificationIndicator({ flags }: { flags?: DisqualificationFlag[] | null }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (!flags || flags.length === 0) return null;

  const hasElimination = flags.some((f) => f.severity === 'eliminated');
  const hasWarning = flags.some((f) => f.severity === 'warning');

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          hasElimination
            ? 'bg-red-50 text-red-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {hasElimination ? (
          <XCircle className="h-3 w-3" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
        {hasElimination ? 'Eliminado' : 'Atenção'}
      </button>
      {showTooltip && (
        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
          <div className="space-y-2">
            {flags.map((flag, i) => (
              <div key={i} className="space-y-0.5">
                <p className="font-medium flex items-center gap-1">
                  {flag.severity === 'eliminated' ? (
                    <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                  )}
                  {flag.question_text}
                </p>
                <p className="text-gray-300 pl-4">{flag.reason}</p>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export default function CandidatesTable({ jobId }: CandidatesTableProps) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('fit_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);
  const [savedCandidateIds, setSavedCandidateIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getJobCandidates(jobId);
      setCandidates(data.candidates);
    } catch (error) {
      toast.error('Failed to load candidates');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const fetchSavedIds = useCallback(async () => {
    try {
      const { candidateIds } = await apiClient.getSavedCandidateIds();
      setSavedCandidateIds(new Set(candidateIds));
    } catch {
      setSavedCandidateIds(new Set());
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds]);

  const handleStatusChange = async (candidateId: string, newStatus: CandidateStatus) => {
    try {
      await apiClient.updateCandidate(candidateId, { status: newStatus });
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
      );
      toast.success('Status updated');
      if (newStatus === 'schedule_interview') {
        setTimeout(() => fetchCandidates(), 3000);
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleRecalculate = async (candidateId: string) => {
    try {
      setRecalculatingId(candidateId);
      await apiClient.recalculateCandidateScore(candidateId);
      toast.success('Recalculation started. The score will be updated shortly.');
      setTimeout(() => fetchCandidates(), 5000);
    } catch (error) {
      toast.error('Failed to trigger recalculation');
      console.error(error);
    } finally {
      setRecalculatingId(null);
    }
  };

  const handleSaveCandidate = async (candidateId: string) => {
    try {
      setSavingId(candidateId);
      await apiClient.saveCandidate(candidateId);
      setSavedCandidateIds((prev) => new Set(prev).add(candidateId));
      toast.success('Candidato salvo');
    } catch (error) {
      toast.error('Falha ao salvar candidato');
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  const handleUnsaveCandidate = async (candidateId: string) => {
    try {
      setSavingId(candidateId);
      await apiClient.unsaveCandidate(candidateId);
      setSavedCandidateIds((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
      toast.success('Removido dos salvos');
    } catch (error) {
      toast.error('Falha ao remover dos salvos');
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedCandidates = useMemo(() => {
    let result = [...candidates];

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    } else {
      result = result.filter((c) => c.status !== 'rejected');
    }

    result.sort((a, b) => {
      if (sortField === 'created_at') {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }

      const aValue = a[sortField] ?? -1;
      const bValue = b[sortField] ?? -1;

      if (aValue === bValue) return 0;
      if (aValue === -1) return 1;
      if (bValue === -1) return -1;

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return result;
  }, [candidates, statusFilter, sortField, sortDirection]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: candidates.filter((c) => c.status !== 'rejected').length,
      new: 0,
      reviewing: 0,
      schedule_interview: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    };

    candidates.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });

    return counts;
  }, [candidates]);

  if (isLoading) {
    return <Loading text="Loading candidates..." />;
  }

  if (candidates.length === 0) {
    return (
      <EmptyState
        title="No candidates yet"
        description="Share your job posting to start receiving applications"
      />
    );
  }

  const thClass =
    'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const thSortClass = `${thClass} cursor-pointer select-none hover:bg-gray-100 transition-colors`;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Select
          options={statusOptions.map((opt) => ({
            ...opt,
            label: `${opt.label} (${opt.value ? statusCounts[opt.value] || 0 : statusCounts.all})`,
          }))}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-64"
        />
        <span className="text-sm text-gray-500 sm:shrink-0">
          {filteredAndSortedCandidates.length} candidatos
        </span>
      </div>

      {/* Mobile: card list (menos informação, clean) */}
      <div className="md:hidden space-y-3">
        {filteredAndSortedCandidates.map((candidate) => {
          const flags = (candidate.disqualification_flags || []) as DisqualificationFlag[];
          const hasElimination = flags.some((f) => f.severity === 'eliminated');
          return (
            <div
              key={candidate.id}
              className={`bg-white rounded-xl border p-4 shadow-sm ${
                hasElimination ? 'border-red-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{candidate.name}</p>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{candidate.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {candidate.fit_score != null ? (
                    <span
                      className={`font-semibold text-sm px-2 py-1 rounded-lg ${
                        candidate.fit_score >= 80
                          ? 'bg-green-100 text-green-800'
                          : candidate.fit_score >= 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {candidate.fit_score}%
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                  <ActionsMenu
                    candidateId={candidate.id}
                    recalculatingId={recalculatingId}
                    isSaved={savedCandidateIds.has(candidate.id)}
                    savingId={savingId}
                    onView={() => router.push(`/candidates/${candidate.id}`)}
                    onRecalculate={() => handleRecalculate(candidate.id)}
                    onSave={() => handleSaveCandidate(candidate.id)}
                    onUnsave={() => handleUnsaveCandidate(candidate.id)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <select
                  value={candidate.status}
                  onChange={(e) =>
                    handleStatusChange(candidate.id, e.target.value as CandidateStatus)
                  }
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {statusUpdateOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => router.push(`/candidates/${candidate.id}`)}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Ver candidato →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className={thClass} style={{ width: '19%' }}>
                Candidato
              </th>
              <th
                className={thSortClass}
                style={{ width: '9%' }}
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Aplicação
                  <SortIcon direction={sortField === 'created_at' ? sortDirection : null} />
                </div>
              </th>
              <th className={thClass} style={{ width: '6%' }}>
                LinkedIn
              </th>
              <th className={thClass} style={{ width: '6%' }}>
                Currículo
              </th>
              <th
                className={thSortClass}
                style={{ width: '8%' }}
                onClick={() => handleSort('resume_rating')}
              >
                <div className="flex items-center gap-1">
                  Nota CV
                  <SortIcon direction={sortField === 'resume_rating' ? sortDirection : null} />
                </div>
              </th>
              <th
                className={thSortClass}
                style={{ width: '9%' }}
                onClick={() => handleSort('answer_quality_rating')}
              >
                <div className="flex items-center gap-1">
                  Respostas
                  <SortIcon
                    direction={sortField === 'answer_quality_rating' ? sortDirection : null}
                  />
                </div>
              </th>
              <th
                className={thSortClass}
                style={{ width: '8%' }}
                onClick={() => handleSort('fit_score')}
              >
                <div className="flex items-center gap-1">
                  Fit Score
                  <SortIcon direction={sortField === 'fit_score' ? sortDirection : null} />
                </div>
              </th>
              <th className={thClass} style={{ width: '8%' }}>
                Elegibilidade
              </th>
              <th className={thClass} style={{ width: '12%' }}>
                Status
              </th>
              <th className={thClass} style={{ width: '9%' }}>
                Convite
              </th>
              <th className={thClass} style={{ width: '3%' }}>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAndSortedCandidates.map((candidate) => {
              const flags = (candidate.disqualification_flags || []) as DisqualificationFlag[];
              const hasFlags = flags.length > 0;

              return (
                <tr
                  key={candidate.id}
                  className={`transition-colors ${
                    hasFlags && flags.some((f) => f.severity === 'eliminated')
                      ? 'bg-red-50/40 hover:bg-red-50/70'
                      : hasFlags
                      ? 'bg-amber-50/30 hover:bg-amber-50/50'
                      : 'hover:bg-gray-50/70'
                  }`}
                >
                  {/* Candidato: nome + email */}
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{candidate.name}</p>
                      <p className="text-xs text-gray-400 truncate">{candidate.email}</p>
                    </div>
                  </td>

                  {/* Data de Aplicação */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {new Date(candidate.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </div>
                  </td>

                  {/* LinkedIn */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {candidate.linkedin_url ? (
                      <a
                        href={candidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Currículo */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver
                    </a>
                  </td>

                  {/* Nota CV */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {candidate.resume_rating != null ? (
                      <span className="font-medium text-sm">{candidate.resume_rating}/5</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Respostas */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {candidate.answer_quality_rating != null ? (
                      <span className="font-medium text-sm">
                        {candidate.answer_quality_rating}/5
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Fit Score */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {candidate.fit_score != null ? (
                      <span
                        className={`inline-flex items-center justify-center font-semibold text-sm px-2 py-0.5 rounded-full ${
                          candidate.fit_score >= 80
                            ? 'bg-green-50 text-green-700'
                            : candidate.fit_score >= 60
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {candidate.fit_score}%
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Elegibilidade */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {flags.length > 0 ? (
                      <DisqualificationIndicator flags={flags} />
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        OK
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={candidate.status}
                      onChange={(e) =>
                        handleStatusChange(candidate.id, e.target.value as CandidateStatus)
                      }
                      className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      {statusUpdateOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Convite */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {candidate.schedule_interview_email_sent_at ? (
                      <span
                        className="inline-flex items-center gap-1 text-green-600 text-xs"
                        title={`Enviado em ${new Date(candidate.schedule_interview_email_sent_at).toLocaleString('pt-BR')}`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        {new Date(candidate.schedule_interview_email_sent_at).toLocaleDateString(
                          'pt-BR',
                          { day: '2-digit', month: '2-digit', year: '2-digit' }
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-3 whitespace-nowrap">
                    <ActionsMenu
                      candidateId={candidate.id}
                      recalculatingId={recalculatingId}
                      isSaved={savedCandidateIds.has(candidate.id)}
                      savingId={savingId}
                      onView={() => router.push(`/candidates/${candidate.id}`)}
                      onRecalculate={() => handleRecalculate(candidate.id)}
                      onSave={() => handleSaveCandidate(candidate.id)}
                      onUnsave={() => handleUnsaveCandidate(candidate.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
