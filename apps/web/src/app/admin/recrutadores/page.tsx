'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  apiClient,
  type AdminRecruiterRow,
  type AdminRecruitersResponse,
  type AdminPagination,
} from '@/lib/api-client';
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

/** "Reais" é o padrão: robô e conta de teste nossa não são cliente. */
const TIPOS = [
  { value: 'real', label: 'Reais' },
  { value: 'internal', label: 'Internas' },
  { value: 'bot', label: 'Robôs' },
  { value: 'all', label: 'Todas' },
] as const;

const TIPO_BADGE: Record<string, { texto: string; tom: string }> = {
  internal: { texto: 'Interna', tom: 'border-sky-200 bg-sky-50 text-sky-700' },
  bot: { texto: 'Robô', tom: 'border-gray-200 bg-gray-50 text-gray-500' },
};

function ultimoAcesso(iso: string | null | undefined): string {
  if (!iso) return 'Nunca';
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  if (dias < 30) return `Há ${dias} dias`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function AdminRecruitersPage() {
  const [rows, setRows] = useState<AdminRecruiterRow[]>([]);
  const [pagination, setPagination] = useState<AdminPagination | null>(null);
  const [counts, setCounts] = useState<AdminRecruitersResponse['counts'] | null>(null);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<string>('real');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (searchTerm: string, pageNum: number, kindValue: string) => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminRecruiters({
        search: searchTerm,
        page: pageNum,
        kind: kindValue,
      });
      setRows(res.data);
      setPagination(res.pagination);
      setCounts(res.counts ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca com atraso para não disparar uma consulta por tecla.
  useEffect(() => {
    const t = setTimeout(() => load(search, page, kind), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [search, page, kind, load]);

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

      <div className="flex flex-wrap items-center gap-1.5">
        {TIPOS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setKind(t.value);
              setPage(1);
            }}
            className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
              kind === t.value
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {counts && <span className="ml-1.5 tabular-nums opacity-60">{counts[t.value]}</span>}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              {['Recrutador', 'Situação', 'Vagas', 'Candidaturas', 'Cadastro', 'Último acesso'].map((h) => (
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nenhum recrutador encontrado.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const s = situacao(r.subscription);
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/recrutadores/${r.id}`} className="font-medium text-gray-900 hover:text-emerald-700 hover:underline">{r.name}</Link>
                    {r.kind && TIPO_BADGE[r.kind] && (
                      <span
                        className={`ml-2 rounded border px-1.5 py-0.5 text-[11px] font-medium ${TIPO_BADGE[r.kind].tom}`}
                      >
                        {TIPO_BADGE[r.kind].texto}
                      </span>
                    )}
                    <p className="text-[13px] text-gray-500">{r.email}</p>
                    {r.company && <p className="text-[13px] text-gray-400">{r.company}</p>}
                  </td>
                  <td className={`px-4 py-3 text-[13px] font-medium ${s.tom}`}>{s.texto}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{r.jobs}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{r.candidates}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">
                    {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">
                    {ultimoAcesso(r.last_sign_in_at)}
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
