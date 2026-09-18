'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  CreditCard,
  Crown,
  Rocket,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button, Loading } from '@/components/ui';
import {
  type SubscriptionInfo,
  getTrialDaysRemaining,
  getPlanById,
  PLANS,
} from '@/lib/subscription';
import { usePlanoTraduzido, useIntlLocale } from '@/lib/plan-i18n';
import { useTranslations } from 'next-intl';

export default function SubscriptionPage() {
  const t = useTranslations();
  const tp = usePlanoTraduzido();
  const localeIntl = useIntlLocale();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    apiClient
      .getSubscription()
      .then(setSubscription)
      .catch(() => {
        toast.error(t('assinatura.erroCarregar'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const { url } = await apiClient.createPortalSession();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir portal de pagamento');
      setIsOpeningPortal(false);
    }
  };

  if (isLoading) {
    return <Loading text={t('assinatura.carregando')} />;
  }

  if (!subscription) {
    return (
      <div className="text-center py-12 text-gray-500">{t('assinatura.naoCarregou')}</div>
    );
  }

  const daysRemaining = getTrialDaysRemaining(subscription.trialEndsAt);
  const plan = getPlanById(subscription.plan);
  const isActive = subscription.status === 'active';
  const isTrialing = subscription.status === 'trialing' && daysRemaining > 0;
  const isExpired = subscription.status === 'trialing' && daysRemaining === 0;
  const isPastDue = subscription.status === 'past_due';
  const isCanceled = subscription.status === 'canceled';

  const nextBillingDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(localeIntl, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />{t('assinatura.voltarPerfil')}</Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('assinatura.titulo')}</h1>
        <p className="text-gray-600 mt-1">{t('assinatura.subtitulo')}</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('assinatura.statusTitulo')}</h2>
            <div className="flex items-center gap-2">
              {isActive && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-emerald-700 font-medium">{t('assinatura.ativa')}</span>
                </>
              )}
              {isTrialing && (
                <>
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-blue-700 font-medium">{t('assinatura.periodoTeste')}</span>
                </>
              )}
              {isExpired && (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-700 font-medium">{t('assinatura.testeExpirado')}</span>
                </>
              )}
              {isPastDue && (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 font-medium">{t('assinatura.pagamentoPendente')}</span>
                </>
              )}
              {isCanceled && (
                <>
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700 font-medium">{t('assinatura.cancelada')}</span>
                </>
              )}
            </div>
          </div>
          {plan && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              {plan.id === 'starter' && <Rocket className="h-4 w-4 text-emerald-600" />}
              {plan.id === 'professional' && <Crown className="h-4 w-4 text-emerald-600" />}
              {plan.id === 'enterprise' && <Building2 className="h-4 w-4 text-emerald-600" />}
              <span className="text-sm font-medium text-emerald-700 capitalize">{tp(plan).nome}</span>
            </div>
          )}
        </div>

        {/* Trial info */}
        {isTrialing && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{t('assinatura.diasRestantes', { n: daysRemaining })}</strong>{t('assinatura.noTesteGratis')}</p>
            <p className="text-xs text-blue-600 mt-1">{t('assinatura.cobrancaAuto')}</p>
          </div>
        )}

        {/* Active subscription info */}
        {isActive && plan && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t('assinatura.planoAtual')}</span>
              <span className="font-medium text-gray-900">{tp(plan).nome} · {tp(plan).preco}{t('comum.porMes')}</span>
            </div>
            {nextBillingDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('assinatura.proximaCobranca')}</span>
                <span className="font-medium text-gray-900">{nextBillingDate}</span>
              </div>
            )}
          </div>
        )}

        {/* Expired trial */}
        {isExpired && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 mb-3">{t('assinatura.testeExpirouTexto')}</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors"
            >{t('assinatura.verPlanos')}</Link>
          </div>
        )}

        {/* Past due */}
        {isPastDue && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 mb-3">{t('assinatura.pagamentoFalhou')}</p>
            <Button
              onClick={handleOpenPortal}
              isLoading={isOpeningPortal}
              className="bg-red-600 hover:bg-red-700"
            >{t('assinatura.atualizarPagamento')}</Button>
          </div>
        )}

        {/* Canceled */}
        {isCanceled && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-800 mb-3">{t('assinatura.canceladaTexto')}</p>
            {nextBillingDate && (
              <p className="text-xs text-gray-600">
                Acesso até: {nextBillingDate}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {(isActive || isTrialing) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('assinatura.gerenciar')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('assinatura.portalTexto')}</p>
          <Button
            onClick={handleOpenPortal}
            isLoading={isOpeningPortal}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />{t('assinatura.abrirPortal')}</Button>
        </div>
      )}

      {/* Plan details */}
      {plan && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('assinatura.detalhesPlano')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('assinatura.plano')}</span>
              <span className="text-sm font-medium text-gray-900">{tp(plan).nome}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('assinatura.preco')}</span>
              <span className="text-sm font-medium text-gray-900">{tp(plan).preco}{t('comum.porMes')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('assinatura.vagasAtivas')}</span>
              <span className="text-sm font-medium text-gray-900">
                {plan.maxActiveJobs === Infinity
                  ? t('assinatura.ilimitadas')
                  : t('assinatura.ate', { n: plan.maxActiveJobs })}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">{t('assinatura.inclui')}</p>
            <ul className="space-y-1">
              {tp(plan).recursos.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Upgrade CTA if on trial or expired */}
      {(isTrialing || isExpired) && (
        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('assinatura.querMais')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('assinatura.verPlanosTexto')}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors"
          >{t('assinatura.verPlanosPrecos')}</Link>
        </div>
      )}
    </div>
  );
}
