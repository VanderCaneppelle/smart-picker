'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient, type AdminSubscriptionRow, type AdminPagination } from '@/lib/api-client';
import PageHeader from '../PageHeader';

const FILTROS = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'trialing', label: 'Em teste' },
  { value: 'trial_expiring', label: 'Vencendo em 7 dias' },
  { value: 'trial_expired', label: 'Teste vencido' },
  { value: 'problem', label: 'Com problema' },
];

const STATUS_LABEL: Record<string, string> = {
  trialing: 'Em teste',
  active: 'Ativa',
  past_due: 'Pagamento atrasado',
  canceled: 'Cancelada',
  unpaid: 'Não paga',
};

function diasAte(iso: string | null): string {
  if (!iso) return '—';
  const dias = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (dias < 0) return `vencido há ${Math.abs(dias)}d`;
  if (dias === 0) return 'vence hoje';
  return `em ${dias}d`;
}

function AssinaturasContent() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([]);
  const [pagination, setPagination] = useState<AdminPagination | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (f: string, p: number) => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminSubscriptions({ filter: f, page: p });
      setRows(res.data);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter, page);
  }, [filter, page, load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assinaturas"
        description="Quem paga, quem está testando e quem precisa de contato"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
              filter === f.value
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        {pagination && (
          <span className="ml-auto text-[13px] text-gray-500">{pagination.total} no filtro</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              {['Recrutador', 'Situação', 'Plano', 'Teste termina', 'Renova em'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Nada neste filtro.
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{s.recruiter.name}</p>
                  <a
                    href={`mailto:${s.recruiter.email}`}
                    className="text-[13px] text-gray-500 hover:text-emerald-700 hover:underline"
                  >
                    {s.recruiter.email}
                  </a>
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-700">
                  {STATUS_LABEL[s.status] || s.status}
                  {s.cancel_at_period_end && (
                    <span className="ml-1.5 text-[12px] text-amber-700">cancela no fim</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] capitalize text-gray-700">{s.plan || '—'}</td>
                <td className="px-4 py-3 text-[13px] text-gray-500">
                  {s.trial_ends_at ? diasAte(s.trial_ends_at) : '—'}
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-500">
                  {s.current_period_end
                    ? new Date(s.current_period_end).toLocaleDateString('pt-BR')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.page <= 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-[13px] font-medium text-gray-700 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-[13px] text-gray-500">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-[13px] font-medium text-gray-700 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Carregando...</p>}>
      <AssinaturasContent />
    </Suspense>
  );
}
