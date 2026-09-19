'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Check,
  ArrowLeft,
  Rocket,
  Crown,
  Building2,
  Loader2,
} from 'lucide-react';
import { PLANS } from '@/lib/subscription';
import { usePlanoTraduzido } from '@/lib/plan-i18n';
import { apiClient } from '@/lib/api-client';
import { useTranslations } from 'next-intl';

/** Marcador de recurso ausente na tabela. */
const NAO = '\u2013';

export default function UpgradePage() {
  return (
    <Suspense fallback={null}>
      <UpgradeContent />
    </Suspense>
  );
}

function UpgradeContent() {
  const t = useTranslations();
  const tp = usePlanoTraduzido();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showHidden = searchParams.get('test') === '1';
  const visiblePlans = PLANS.filter((p) => showHidden || !p.hidden);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePlanClick = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const { url } = await apiClient.createCheckoutSession(planId);
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('precos.erroPagamento'));
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />{t('comum.voltar')}</button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('upgrade.titulo')}</h1>
          <p className="text-gray-600">{t('upgrade.subtitulo')}</p>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-8 items-start mb-16">
          {visiblePlans.map((plan, i) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-white ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.03]'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">{t('comum.maisPopular')}</span>
                </div>
              )}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {i === 0 && <Rocket className="h-5 w-5 text-emerald-600" />}
                  {i === 1 && <Crown className="h-5 w-5 text-emerald-600" />}
                  {i === 2 && <Building2 className="h-5 w-5 text-emerald-600" />}
                  <h3 className="text-lg font-bold text-gray-900">{tp(plan).nome}</h3>
                </div>
                <p className="text-sm text-gray-500">{tp(plan).descricao}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{tp(plan).preco}</span>
                <span className="text-gray-500 ml-1">{t('comum.porMes')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {tp(plan).recursos.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={loadingPlan !== null}
                onClick={() => handlePlanClick(plan.id)}
                className={`block w-full text-center py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-60 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {loadingPlan === plan.id ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />{t('comum.processando')}</span>
                ) : (
                  `Assinar ${tp(plan).nome}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">{t('upgrade.comparacao')}</h3>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-500">{t('upgrade.recurso')}</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-500">{t('upgrade.teste')}</th>
                  {PLANS.filter((p) => !p.hidden).map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-6 font-medium text-gray-500">
                      {tp(plan).nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: t('precos.linhas.vagasAtivas'), free: '10', values: ['3', '10', t('precos.linhas.ilimitadas')] },
                  { feature: t('precos.linhas.candidatosPorVaga'), free: t('precos.linhas.ilimitados'), values: [t('precos.linhas.ilimitados'), t('precos.linhas.ilimitados'), t('precos.linhas.ilimitados')] },
                  { feature: t('precos.linhas.rankingIA'), free: '✓', values: ['✓', '✓', '✓'] },
                  { feature: t('precos.linhas.emailsAutomaticos'), free: '✓', values: ['✓', '✓', '✓'] },
                  { feature: t('precos.linhas.paginaPublica'), free: '✓', values: ['✓', '✓', '✓'] },
                  { feature: t('precos.linhas.branding'), free: NAO, values: [NAO, '✓', '✓'] },
                  { feature: t('precos.linhas.suportePrioritario'), free: NAO, values: [NAO, '✓', '✓'] },
                  { feature: t('precos.linhas.suporteDedicado'), free: NAO, values: [NAO, NAO, '✓'] },
                  { feature: t('precos.linhas.entrevistaIA'), free: NAO, values: [NAO, t('precos.emBreve'), t('precos.emBreve')] },
                  { feature: t('precos.linhas.api'), free: NAO, values: [NAO, NAO, t('precos.emBreve')] },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-6 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-3 px-6 text-center text-gray-500">{row.free}</td>
                    {row.values.map((v, j) => (
                      <td key={j} className={`py-3 px-6 text-center ${v === '✓' ? 'text-emerald-600 font-medium' : v === NAO ? 'text-gray-300' : 'text-gray-700'}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
