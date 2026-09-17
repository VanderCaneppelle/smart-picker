'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, type AdminOverview } from '@/lib/api-client';
import PageHeader from './PageHeader';

function Stat({
  label,
  value,
  hint,
  href,
  emphasis,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  emphasis?: boolean;
}) {
  const body = (
    <div
      className={`rounded-lg border bg-white p-4 ${
        emphasis ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'
      } ${href ? 'transition-colors hover:border-gray-300' : ''}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-[13px] text-gray-500">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const STATUS_LABEL: Record<string, string> = {
  trialing: 'Em teste',
  active: 'Ativa',
  past_due: 'Pagamento atrasado',
  canceled: 'Cancelada',
  unpaid: 'Não paga',
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getAdminOverview()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-gray-500">Carregando...</p>;

  const brl = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão geral"
        description="Como o negócio está agora"
      />
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
          Negócio
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="MRR estimado"
            value={brl(data.subscriptions.mrr)}
            hint="Preço de tabela das assinaturas ativas"
          />
          <Stat
            label="Assinaturas ativas"
            value={data.subscriptions.byStatus.active || 0}
            href="/admin/assinaturas?filter=active"
          />
          <Stat
            label="Vencendo em 7 dias"
            value={data.subscriptions.trialsExpiring7d}
            hint="Trials que precisam de contato agora"
            href="/admin/assinaturas?filter=trial_expiring"
            emphasis={data.subscriptions.trialsExpiring7d > 0}
          />
          <Stat
            label="Trials vencidos"
            value={data.subscriptions.trialsExpired}
            hint="Nunca converteram"
            href="/admin/assinaturas?filter=trial_expired"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
          Uso
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Recrutadores"
            value={data.recruiters.total}
            hint={`+${data.recruiters.last7d} em 7 dias, +${data.recruiters.last30d} em 30`}
            href="/admin/recrutadores"
          />
          <Stat label="Vagas ativas" value={data.jobs.active} hint={`${data.jobs.total} no total`} />
          <Stat
            label="Candidaturas"
            value={data.candidates.total}
            hint={`+${data.candidates.last7d} em 7 dias, +${data.candidates.last30d} em 30`}
          />
          <Stat
            label="Candidaturas por vaga"
            value={data.jobs.total > 0 ? (data.candidates.total / data.jobs.total).toFixed(1) : '0'}
            hint="Média sobre todas as vagas"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
            Assinaturas por situação
          </h3>
          {Object.keys(data.subscriptions.byStatus).length === 0 ? (
            <p className="text-[13px] text-gray-500">Nenhuma assinatura ainda.</p>
          ) : (
            <ul className="space-y-1.5">
              {Object.entries(data.subscriptions.byStatus).map(([status, count]) => (
                <li key={status} className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-600">{STATUS_LABEL[status] || status}</span>
                  <span className="font-medium tabular-nums text-gray-900">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
            Assinaturas ativas por plano
          </h3>
          {Object.keys(data.subscriptions.byPlan).length === 0 ? (
            <p className="text-[13px] text-gray-500">Nenhum plano pago ainda.</p>
          ) : (
            <ul className="space-y-1.5">
              {Object.entries(data.subscriptions.byPlan).map(([plan, count]) => (
                <li key={plan} className="flex items-center justify-between text-[13px]">
                  <span className="capitalize text-gray-600">{plan}</span>
                  <span className="font-medium tabular-nums text-gray-900">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
