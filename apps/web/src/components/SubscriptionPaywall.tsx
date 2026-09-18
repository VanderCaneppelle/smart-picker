'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Crown,
  Check,
  ArrowRight,
  AlertCircle,
  Clock,
  Rocket,
  Building2,
  Gift,
  Loader2,
  LogOut,
} from 'lucide-react';
import { PLANS, type SubscriptionInfo, getTrialDaysRemaining } from '@/lib/subscription';
import { usePlanoTraduzido } from '@/lib/plan-i18n';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface SubscriptionPaywallProps {
  subscription: SubscriptionInfo;
  onLogout?: () => void;
}

export function SubscriptionPaywall({ subscription, onLogout }: SubscriptionPaywallProps) {
  const t = useTranslations();
  const tp = usePlanoTraduzido();
  const daysLeft = getTrialDaysRemaining(subscription.trialEndsAt);
  const isExpired = daysLeft === 0;
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const { url } = await apiClient.createCheckoutSession(planId);
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('paywall.erroSessao'));
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('app.nav.sair')}
        </button>
      )}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl px-6 sm:px-8 py-8 text-white text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            {isExpired ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isExpired
                ? t('paywall.testeExpirou')
                : t('paywall.restamNoTeste', { n: daysLeft })}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {isExpired
              ? t('paywall.escolhaPlano')
              : t('paywall.testeAcabando')}
          </h2>
          <p className="text-emerald-100 max-w-lg mx-auto">
            {isExpired
              ? 'Seus dados estão salvos. Assine um plano para voltar a publicar vagas e usar o ranking por IA.'
              : t('paywall.naoPerca')}
          </p>
        </div>

        {/* Plans */}
        <div className="px-6 sm:px-8 py-8">
          <div className="grid md:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <div
                key={plan.id}
                className={`relative rounded-xl p-5 ${
                  plan.highlighted
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/50'
                    : 'border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{t('comum.recomendado')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  {i === 0 && <Rocket className="h-4 w-4 text-emerald-600" />}
                  {i === 1 && <Crown className="h-4 w-4 text-emerald-600" />}
                  {i === 2 && <Building2 className="h-4 w-4 text-emerald-600" />}
                  <h3 className="font-bold text-gray-900">{tp(plan).nome}</h3>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-gray-900">{tp(plan).preco}</span>
                  <span className="text-gray-500 text-sm">{t('comum.porMes')}</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {tp(plan).recursos.slice(0, 4).map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-600">{f}</span>
                    </li>
                  ))}
                  {tp(plan).recursos.length > 4 && (
                    <li className="text-xs text-gray-400 pl-6">
                      +{tp(plan).recursos.length - 4} mais...
                    </li>
                  )}
                </ul>
                <button
                  type="button"
                  disabled={loadingPlan !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-60 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />{t('comum.redirecionando')}</span>
                  ) : (
                    `Assinar ${tp(plan).nome}`
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/dashboard/upgrade"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
            >{t('upgrade.verComparacao')}<ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TrialBannerProps {
  daysRemaining: number;
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const t = useTranslations();
  if (daysRemaining > 7) return null;

  const urgency = daysRemaining <= 3;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm ${
        urgency
          ? 'bg-amber-50 border border-amber-200 text-amber-800'
          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
      }`}
    >
      <div className="flex items-center gap-2">
        {urgency ? (
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        ) : (
          <Gift className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        )}
        <span>
          {daysRemaining === 0
            ? t('paywall.expirouPonto')
            : daysRemaining === 1
              ? t('paywall.ultimoDia')
              : t('paywall.restamNoTestePonto', { n: daysRemaining })}
        </span>
      </div>
      <Link
        href="/dashboard/upgrade"
        className={`font-medium whitespace-nowrap ${
          urgency ? 'text-amber-700 hover:text-amber-900' : 'text-emerald-700 hover:text-emerald-900'
        }`}
      >{t('upgrade.verPlanos')}</Link>
    </div>
  );
}

interface TrialSidebarBadgeProps {
  daysRemaining: number;
  status: string;
  plan: string | null;
}

export function TrialSidebarBadge({ daysRemaining, status, plan }: TrialSidebarBadgeProps) {
  const t = useTranslations();
  if (status === 'active' && plan) {
    return (
      <div className="px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
        <div className="flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700 capitalize">{plan}</span>
        </div>
      </div>
    );
  }

  const urgency = daysRemaining <= 3;

  return (
    <Link href="/pricing" className="block">
      <div
        className={`px-3 py-2 rounded-lg border transition-colors ${
          urgency
            ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
            : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Gift className={`h-3.5 w-3.5 ${urgency ? 'text-amber-500' : 'text-emerald-500'}`} />
          <div className="min-w-0">
            <p className={`text-xs font-medium ${urgency ? 'text-amber-700' : 'text-emerald-700'}`}>
              {daysRemaining === 0
                ? t('paywall.testeExpiradoCurto')
                : t('paywall.restantesCurto', { n: daysRemaining })}
            </p>
            <p className={`text-[10px] ${urgency ? 'text-amber-500' : 'text-emerald-500'}`}>
              {daysRemaining === 0 ? t('paywall.verPlanos') : t('nav.testeGratis')}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
