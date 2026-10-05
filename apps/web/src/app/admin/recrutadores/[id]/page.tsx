'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient, type AdminRecruiterDetail } from '@/lib/api-client';
import PageHeader from '../../PageHeader';

const STATUS_VAGA: Record<string, string> = {
  active: 'Ativa',
  draft: 'Rascunho',
  closed: 'Fechada',
  on_hold: 'Pausada',
};

function data(valor: string | null): string {
  if (!valor) return 'Nunca';
  return new Date(valor).toLocaleDateString('pt-BR');
}

function Metrica({ titulo, valor, detalhe }: { titulo: string; valor: string | number; detalhe?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-gray-500">{detalhe}</p>}
    </div>
  );
}

export default function AdminRecruiterDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminRecruiterDetail | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getAdminRecruiterDetail(params.id)
      .then(setDetail)
      .catch((err) => setErro(err instanceof Error ? err.message : 'Erro ao carregar'));
  }, [params.id]);

  if (erro) return <p className="text-sm text-red-600">{erro}</p>;
  if (!detail) return <p className="text-sm text-gray-500">Carregando...</p>;

  const { recruiter, subscription, summary, jobs, team } = detail;

  return (
    <div className="space-y-6">
      <Link href="/admin/recrutadores" className="text-sm text-gray-500 hover:text-gray-900">
        ← Voltar para recrutadores
      </Link>

      <PageHeader
        title={recruiter.name}
        description={`${recruiter.email}${recruiter.company ? ` · ${recruiter.company}` : ''}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metrica titulo="Vagas ativas" valor={summary.jobsActive} detalhe={`${summary.jobsTotal} no total`} />
        <Metrica titulo="Candidaturas" valor={summary.candidatesTotal} />
        <Metrica titulo="Última vaga criada" valor={data(summary.lastJobCreatedAt)} />
        <Metrica titulo="Última candidatura" valor={data(summary.lastCandidateAt)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Conta</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Cadastro</dt><dd>{data(recruiter.created_at)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Telefone</dt><dd>{recruiter.phone_number || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Tipo</dt><dd>{recruiter.is_team_member ? 'Membro de equipe' : 'Conta principal'}</dd></div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Assinatura</dt>
              <dd>
                {subscription
                  ? `${subscription.status}${subscription.plan ? ` · ${subscription.plan}` : ''}`
                  : 'Sem assinatura'}
              </dd>
            </div>
            {subscription?.trial_ends_at && (
              <div className="flex justify-between"><dt className="text-gray-500">Teste termina</dt><dd>{data(subscription.trial_ends_at)}</dd></div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Equipe ({team.length})</h3>
          {team.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum membro convidado.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {team.map((m) => (
                <li key={m.id} className="flex justify-between">
                  <span>{m.name || m.email}</span>
                  <span className="text-gray-500">{data(m.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <h3 className="border-b border-gray-200 p-4 text-sm font-semibold text-gray-900">Vagas</h3>
        {jobs.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Nenhuma vaga criada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-2">Vaga</th>
                <th className="px-4 py-2">Situação</th>
                <th className="px-4 py-2">Criada em</th>
                <th className="px-4 py-2 text-right">Candidaturas</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900">{j.title}</td>
                  <td className="px-4 py-2">{STATUS_VAGA[j.status] || j.status}</td>
                  <td className="px-4 py-2">{data(j.created_at)}</td>
                  <td className="px-4 py-2 text-right">{j.candidates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
