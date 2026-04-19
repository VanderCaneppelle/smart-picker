'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  TrendingUp,
  Check,
  Gift,
  ArrowRight,
  Rocket,
  Crown,
  Building2,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { PLANS, TRIAL_DURATION_DAYS, TRIAL_MAX_ACTIVE_JOBS } from '@/lib/subscription';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
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
    if (!isAuthenticated) {
      router.push('/signup');
      return;
    }

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
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Rankea</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                Entrar
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                Teste grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao início
            </Link>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Planos e preços
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comece grátis por {TRIAL_DURATION_DAYS} dias. Escale quando precisar.
            </p>
          </div>

          {/* Trial card */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-8 text-center">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-emerald-200 mb-4">
                <Gift className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-emerald-700">Teste Grátis — {TRIAL_DURATION_DAYS} dias</span>
              </div>
              <p className="text-gray-700 mb-4 text-lg">
                Crie sua conta, publique <strong>{TRIAL_MAX_ACTIVE_JOBS} vaga ativa</strong> e receba <strong>candidatos ilimitados</strong> com ranking por IA.
              </p>
              <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Sem cartão de crédito
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Cancele quando quiser
                </div>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all"
              >
                Começar agora — é grátis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Plans grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
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
                      Redirecionando...
                    </span>
                  ) : isAuthenticated ? (
                    `Assinar ${plan.name}`
                  ) : (
                    'Começar teste grátis'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Comparação detalhada</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 pr-4 font-medium text-gray-500">Recurso</th>
                    <th className="text-center py-4 px-4 font-medium text-gray-500">Grátis</th>
                    {PLANS.filter((p) => !p.hidden).map((plan) => (
                      <th key={plan.id} className="text-center py-4 px-4 font-medium text-gray-500">
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
                      <td className="py-3 pr-4 font-medium text-gray-900">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-gray-500">{row.free}</td>
                      {row.values.map((v, j) => (
                        <td key={j} className={`py-3 px-4 text-center ${v === '✓' ? 'text-emerald-600 font-medium' : v === '—' ? 'text-gray-300' : 'text-gray-700'}`}>
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

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Rankea</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/termos" className="hover:text-gray-700">Termos</Link>
            <Link href="/privacidade" className="hover:text-gray-700">Privacidade</Link>
            <span>© {new Date().getFullYear()} Rankea</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
