'use client';

import { Suspense, useEffect } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Check,
  Rocket,
  Crown,
  Building2,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { PLANS, TRIAL_DURATION_DAYS } from '@/lib/subscription';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showHidden = searchParams.get('test') === '1';
  const visiblePlans = PLANS.filter((p) => showHidden || !p.hidden);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const dest = showHidden ? '/dashboard/upgrade?test=1' : '/dashboard/upgrade';
      router.replace(dest);
    }
  }, [isAuthenticated, router, showHidden]);

  const handlePlanClick = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const endpoint = isAuthenticated
        ? '/api/subscription/checkout'
        : '/api/subscription/public-checkout';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: isAuthenticated ? 'include' : 'omit',
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao iniciar pagamento');
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar pagamento');
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao início
            </Link>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
              Preços
            </p>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Escolha o plano ideal para sua operação
            </h1>
            <p className="text-base text-gray-600 sm:text-lg">
              Teste grátis por {TRIAL_DURATION_DAYS} dias. Sem taxa de setup, cancele quando quiser.
            </p>
          </div>

          {/* Plans grid */}
          <div className="mx-auto grid max-w-5xl items-stretch gap-6 md:grid-cols-3 lg:gap-8">
            {visiblePlans.map((plan, i) => {
              const Icon = i === 0 ? Rocket : i === 1 ? Crown : Building2;
              return (
                <div
                  key={plan.id}
                  className={`relative flex h-full flex-col rounded-2xl bg-white p-8 ${
                    plan.highlighted
                      ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'border border-gray-200'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                        Mais popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                      <Icon className="h-5 w-5 text-emerald-600" />
                    </span>
                    <h3 className="text-base font-semibold tracking-tight text-gray-900">{plan.name}</h3>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-gray-500">{plan.description}</p>

                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">{plan.priceLabel}</span>
                    <span className="text-sm text-gray-500">/mês</span>
                  </div>

                  <div className="mb-6 h-px bg-gray-100" />

                  <ul className="mb-8 space-y-3 text-sm">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
                          <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                        </span>
                        <span className="leading-relaxed text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={loadingPlan !== null}
                    onClick={() => handlePlanClick(plan.id)}
                    className={`mt-auto block w-full rounded-lg px-6 py-2.5 text-center text-sm font-semibold transition-colors disabled:opacity-60 ${
                      plan.highlighted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'border border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecionando...
                      </span>
                    ) : (
                      `Assinar ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Trust indicators */}
          <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {TRIAL_DURATION_DAYS} dias grátis
            </div>
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Sem cartão de crédito no teste
            </div>
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Cancele a qualquer momento
            </div>
            <div className="inline-flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              Pagamentos seguros via Stripe
            </div>
          </div>

          {/* Comparison table */}
          <div className="mx-auto mt-20 max-w-4xl">
            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-600">
                Comparar
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Todos os recursos em detalhe
              </h3>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-4 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Recurso
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Grátis
                      </th>
                      {PLANS.filter((p) => !p.hidden).map((plan) => (
                        <th
                          key={plan.id}
                          className={`px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                            plan.highlighted ? 'text-emerald-700' : 'text-gray-500'
                          }`}
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
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
                      <tr key={i}>
                        <td className="py-4 pl-6 pr-4 font-medium text-gray-900">{row.feature}</td>
                        <td className="px-4 py-4 text-center text-gray-500">
                          {row.free === '✓' ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={3} />
                          ) : row.free === '—' ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            row.free
                          )}
                        </td>
                        {row.values.map((v, j) => (
                          <td key={j} className="px-4 py-4 text-center text-gray-700">
                            {v === '✓' ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={3} />
                            ) : v === '—' ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              v
                            )}
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
      </div>
    </>
  );
}
