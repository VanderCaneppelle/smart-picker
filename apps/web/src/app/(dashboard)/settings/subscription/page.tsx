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

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    apiClient
      .getSubscription()
      .then(setSubscription)
      .catch(() => {
        toast.error('Erro ao carregar assinatura');
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
    return <Loading text="Carregando assinatura..." />;
  }

  if (!subscription) {
    return (
      <div className="text-center py-12 text-gray-500">
        Não foi possível carregar informações da assinatura.
      </div>
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
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR', {
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
          <ArrowLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
        <p className="text-gray-600 mt-1">Gerencie seu plano e pagamentos</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Status da Assinatura</h2>
            <div className="flex items-center gap-2">
              {isActive && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-emerald-700 font-medium">Ativa</span>
                </>
              )}
              {isTrialing && (
                <>
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-blue-700 font-medium">Período de teste</span>
                </>
              )}
              {isExpired && (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-700 font-medium">Teste expirado</span>
                </>
              )}
              {isPastDue && (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 font-medium">Pagamento pendente</span>
                </>
              )}
              {isCanceled && (
                <>
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700 font-medium">Cancelada</span>
                </>
              )}
            </div>
          </div>
          {plan && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              {plan.id === 'starter' && <Rocket className="h-4 w-4 text-emerald-600" />}
              {plan.id === 'professional' && <Crown className="h-4 w-4 text-emerald-600" />}
              {plan.id === 'enterprise' && <Building2 className="h-4 w-4 text-emerald-600" />}
              <span className="text-sm font-medium text-emerald-700 capitalize">{plan.name}</span>
            </div>
          )}
        </div>

        {/* Trial info */}
        {isTrialing && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}</strong> no seu teste grátis.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Após o período de teste, sua assinatura será cobrada automaticamente se você não cancelar.
            </p>
          </div>
        )}

        {/* Active subscription info */}
        {isActive && plan && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Plano atual</span>
              <span className="font-medium text-gray-900">{plan.name} — {plan.priceLabel}/mês</span>
            </div>
            {nextBillingDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Próxima cobrança</span>
                <span className="font-medium text-gray-900">{nextBillingDate}</span>
              </div>
            )}
          </div>
        )}

        {/* Expired trial */}
        {isExpired && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 mb-3">
              Seu período de teste expirou. Assine um plano para continuar usando o Rankea.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors"
            >
              Ver planos
            </Link>
          </div>
        )}

        {/* Past due */}
        {isPastDue && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 mb-3">
              O pagamento da sua assinatura falhou. Atualize seu método de pagamento para continuar usando o Rankea.
            </p>
            <Button
              onClick={handleOpenPortal}
              isLoading={isOpeningPortal}
              className="bg-red-600 hover:bg-red-700"
            >
              Atualizar pagamento
            </Button>
          </div>
        )}

        {/* Canceled */}
        {isCanceled && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-800 mb-3">
              Sua assinatura foi cancelada. Você ainda tem acesso até o fim do período pago.
            </p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciar assinatura</h3>
          <p className="text-sm text-gray-600 mb-4">
            Abra o portal de pagamento do Stripe para atualizar seu método de pagamento, ver faturas,
            trocar de plano ou cancelar sua assinatura.
          </p>
          <Button
            onClick={handleOpenPortal}
            isLoading={isOpeningPortal}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir portal de pagamento
          </Button>
        </div>
      )}

      {/* Plan details */}
      {plan && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes do plano</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Plano</span>
              <span className="text-sm font-medium text-gray-900">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Preço</span>
              <span className="text-sm font-medium text-gray-900">{plan.priceLabel}/mês</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vagas ativas</span>
              <span className="text-sm font-medium text-gray-900">
                {plan.maxActiveJobs === Infinity ? 'Ilimitadas' : `Até ${plan.maxActiveJobs}`}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Inclui:</p>
            <ul className="space-y-1">
              {plan.features.map((feature, i) => (
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quer mais recursos?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Veja todos os planos disponíveis e escolha o que melhor se adapta às suas necessidades.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors"
          >
            Ver planos e preços
          </Link>
        </div>
      )}
    </div>
  );
}
