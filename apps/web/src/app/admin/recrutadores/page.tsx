'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, type AdminRecruiterRow, type AdminPagination } from '@/lib/api-client';
import PageHeader from '../PageHeader';

const STATUS_LABEL: Record<string, string> = {
  trialing: 'Em teste',
  active: 'Ativa',
  past_due: 'Atrasada',
  canceled: 'Cancelada',
  unpaid: 'Não paga',
};

function situacao(sub: AdminRecruiterRow['subscription']): { texto: string; tom: string } {
  if (!sub) return { texto: 'Sem assinatura', tom: 'text-gray-400' };
  if (sub.status === 'active') {
    return { texto: `Ativa${sub.plan ? ` · ${sub.plan}` : ''}`, tom: 'text-emerald-700' };
  }
  if (sub.status === 'trialing') {
    const fim = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    if (fim && fim.getTime() < Date.now()) {
      return { texto: 'Teste vencido', tom: 'text-red-600' };
    }
    const dias = fim ? Math.ceil((fim.getTime() - Date.now()) / 86400000) : null;
    return { texto: dias !== null ? `Teste · ${dias}d` : 'Em teste', tom: 'text-gray-600' };
  }
  return { texto: STATUS_LABEL[sub.status] || sub.status, tom: 'text-amber-700' };
}

export default function AdminRecruitersPage() {
  const [rows, setRows] = useState<AdminRecruiterRow[]>([]);
  const [pagination, setPagination] = useState<AdminPagination | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (searchTerm: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminRecruiters({ search: searchTerm, page: pageNum });
      setRows(res.data);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca com atraso para não disparar uma consulta por tecla.
  useEffect(() => {
    const t = setTimeout(() => load(search, page), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [search, page, load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recrutadores"
        description="Todas as contas, com uso e situação da assinatura"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome, e-mail ou empresa"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-80"
        />
        {pagination && (
          <span className="text-[13px] text-gray-500">
            {pagination.total} {pagination.total === 1 ? 'recrutador' : 'recrutadores'}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              {['Recrutador', 'Situação', 'Vagas', 'Candidaturas', 'Cadastro'].map((h) => (
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
                  Nenhum recrutador encontrado.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const s = situacao(r.subscription);
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-[13px] text-gray-500">{r.email}</p>
                    {r.company && <p className="text-[13px] text-gray-400">{r.company}</p>}
                  </td>
                  <td className={`px-4 py-3 text-[13px] font-medium ${s.tom}`}>{s.texto}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{r.jobs}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{r.candidates}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">
                    {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              );
            })}
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
