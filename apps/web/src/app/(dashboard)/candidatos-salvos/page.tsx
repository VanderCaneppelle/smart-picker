'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ExternalLink, Eye, BookmarkCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Badge, Select, Loading, EmptyState } from '@/components/ui';
import type { Candidate, CandidateStatus } from '@hunter/core';
import { useTranslations } from 'next-intl';

type CandidateWithJob = Candidate & { job?: { id: string; title: string } };

const statusOptions = [
  { value: '', labelKey: 'secaoCand.todosExc' },
  { value: 'new', labelKey: 'candidatos.estados.novo' },
  { value: 'reviewing', labelKey: 'secaoCand.emRevisao' },
  { value: 'interview', labelKey: 'candidatos.filtros.entrevista' },
  { value: 'in_validation', labelKey: 'candidatos.filtros.emValidacao' },
  { value: 'rejected', labelKey: 'candidatos.estados.encerrado' },
  { value: 'hired', labelKey: 'candidatos.estados.contratado' },
];

/** Chaves, não textos: constante de módulo é avaliada antes de existir idioma. */
const STATUS_LABEL_KEYS: Record<CandidateStatus | string, string> = {
  new: 'candidatos.estados.novo',
  reviewing: 'secaoCand.emRevisao',
  interview: 'candidatos.filtros.entrevista',
  in_validation: 'candidatos.filtros.emValidacao',
  rejected: 'candidatos.estados.encerrado',
  hired: 'candidatos.estados.contratado',
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'new':
      return 'warning';
    case 'reviewing':
      return 'info';
    case 'interview':
      return 'purple';
    case 'in_validation':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'hired':
      return 'success';
    default:
      return 'default';
  }
};

export default function CandidatosSalvosPage() {
  const t = useTranslations();
  /** Rótulo resolvido na renderização: a lista guarda a chave. */
  const opcoes = (lista: { value: string; labelKey: string }[]) =>
    lista.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const router = useRouter();
  const searchParams = useSearchParams();
  const [candidates, setCandidates] = useState<CandidateWithJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getSavedCandidates();
      setCandidates(data.candidates ?? []);
    } catch {
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleRemoveSaved = async (candidateId: string) => {
    try {
      setRemovingId(candidateId);
      await apiClient.unsaveCandidate(candidateId);
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    } catch {
      // erro já tratado pelo api-client ou toast
    } finally {
      setRemovingId(null);
    }
  };

  const filtered = statusFilter
    ? candidates.filter((c) => c.status === statusFilter)
    : candidates.filter((c) => c.status !== 'rejected');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('salvos.titulo')}</h1>
          <p className="text-gray-600 mt-1">{t('salvos.subtitulo')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Select
          options={opcoes(statusOptions)}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48"
        />
      </div>

      {isLoading ? (
        <Loading text={t('salvos.carregando')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('salvos.nenhum')}
          description={
            statusFilter
              ? 'Tente outro filtro de status'
              : 'Salve candidatos pelo menu de ações (⋯) na página da vaga para vê-los aqui'
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('salvos.nome')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('salvos.email')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('salvos.vaga')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('salvos.fit')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('salvos.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('salvos.acao')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${c.email}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {c.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {c.job ? (
                        <Link
                          href={`/jobs/${c.job.id}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {c.job.title}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.fit_score != null ? (
                        <span
                          className={
                            c.fit_score >= 80
                              ? 'text-green-600 font-medium'
                              : c.fit_score >= 60
                                ? 'text-yellow-600 font-medium'
                                : 'text-gray-600'
                          }
                        >
                          {c.fit_score}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(c.status)}>
                        {t(STATUS_LABEL_KEYS[c.status] ?? '') ?? c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/candidates/${c.id}`)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />{t('salvos.ver')}</button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(c.id)}
                        disabled={removingId === c.id}
                        className="text-gray-500 hover:text-red-600 flex items-center gap-1 text-sm disabled:opacity-50"
                        title={t('salvos.remover')}
                      >
                        <BookmarkCheck className="h-4 w-4" />
                        {removingId === c.id ? 'Removendo...' : t('salvos.remover')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
