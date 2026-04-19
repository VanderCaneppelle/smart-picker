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
import { apiClient } from '@/lib/api-client';

export default function UpgradePage() {
  return (
    <Suspense fallback={null}>
      <UpgradeContent />
    </Suspense>
  );
}

function UpgradeContent() {
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
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar pagamento');
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
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Atualize seu plano</h1>
          <p className="text-gray-600">Escolha o melhor plano para seu negócio</p>
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
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                    Mais popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {i === 0 && <Rocket className="h-5 w-5 text-emerald-600" />}
                  {i === 1 && <Crown className="h-5 w-5 text-emerald-600" />}
                  {i === 2 && <Building2 className="h-5 w-5 text-emerald-600" />}
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                </div>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.priceLabel}</span>
                <span className="text-gray-500 ml-1">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </span>
                ) : (
                  `Assinar ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Comparação detalhada</h3>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Recurso</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-500">Plano Atual</th>
                  {PLANS.filter((p) => !p.hidden).map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-6 font-medium text-gray-500">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Vagas ativas', free: '1', values: ['3', '10', 'Ilimitadas'] },
                  { feature: 'Candidatos por vaga', free: 'Ilimitados', values: ['Ilimitados', 'Ilimitados', 'Ilimitados'] },
                  { feature: 'Ranking por IA', free: '✓', values: ['✓', '✓', '✓'] },
                  { feature: 'E-mails automáticos', free: '✓', values: ['✓', '✓', '✓'] },
                  { feature: 'Página pública', free: '✓', values: ['✓', '✓', '✓'] },
                  { feature: 'Branding customizado', free: '—', values: ['—', '✓', '✓'] },
                  { feature: 'Suporte prioritário', free: '—', values: ['—', '✓', '✓'] },
                  { feature: 'Suporte dedicado', free: '—', values: ['—', '—', '✓'] },
                  { feature: 'API de integração', free: '—', values: ['—', '—', 'Em breve'] },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-6 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-3 px-6 text-center text-gray-500">{row.free}</td>
                    {row.values.map((v, j) => (
                      <td key={j} className={`py-3 px-6 text-center ${v === '✓' ? 'text-emerald-600 font-medium' : v === '—' ? 'text-gray-300' : 'text-gray-700'}`}>
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
