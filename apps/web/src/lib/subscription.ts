export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export type PlanId = 'starter' | 'professional' | 'enterprise' | 'test';

export interface Plan {
  id: PlanId;
  /** Fallback em português: usado fora da UI (admin, logs, Stripe). */
  name: string;
  /** Chave de tradução do nome. Constante de módulo não pode guardar texto traduzido. */
  nameKey: string;
  price: number;
  priceLabel: string;
  descriptionKey: string;
  featureKeys: string[];
  maxActiveJobs: number;
  highlighted?: boolean;
  hidden?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    nameKey: 'planos.starter.nome',
    price: 97,
    priceLabel: 'R$ 97',
    descriptionKey: 'planos.starter.descricao',
    maxActiveJobs: 3,
    featureKeys: [
      'planos.recursos.vagas3',
      'planos.recursos.candidatosIlimitados',
      'planos.recursos.rankingIA',
      'planos.recursos.emailsAutomaticos',
      'planos.recursos.paginaPublica',
    ],
  },
  {
    id: 'professional',
    name: 'Profissional',
    nameKey: 'planos.professional.nome',
    price: 197,
    priceLabel: 'R$ 197',
    descriptionKey: 'planos.professional.descricao',
    maxActiveJobs: 10,
    highlighted: true,
    featureKeys: [
      'planos.recursos.vagas10',
      'planos.recursos.candidatosIlimitados',
      'planos.recursos.rankingIA',
      'planos.recursos.emailsAutomaticos',
      'planos.recursos.paginaPersonalizada',
      'planos.recursos.branding',
      'planos.recursos.suportePrioritario',
      'planos.recursos.entrevistaIA',
    ],
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    nameKey: 'planos.enterprise.nome',
    price: 397,
    priceLabel: 'R$ 397',
    descriptionKey: 'planos.enterprise.descricao',
    maxActiveJobs: Infinity,
    featureKeys: [
      'planos.recursos.vagasIlimitadas',
      'planos.recursos.candidatosIlimitados',
      'planos.recursos.rankingIA',
      'planos.recursos.emailsAutomaticos',
      'planos.recursos.paginaPersonalizada',
      'planos.recursos.branding',
      'planos.recursos.suporteDedicado',
      'planos.recursos.entrevistaIA',
      'planos.recursos.api',
    ],
  },
  {
    id: 'test',
    name: 'Teste',
    nameKey: 'planos.test.nome',
    price: 2,
    priceLabel: 'R$ 2',
    descriptionKey: 'planos.test.descricao',
    maxActiveJobs: 1,
    hidden: true,
    featureKeys: ['planos.recursos.apenasTeste'],
  },
];

export const TRIAL_DURATION_DAYS = 30;
export const TRIAL_MAX_ACTIVE_JOBS = 10;


export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: PlanId | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  return getTrialDaysRemaining(trialEndsAt) === 0;
}

export function isSubscriptionActive(info: SubscriptionInfo): boolean {
  if (info.status === 'active') return true;
  if (info.status === 'trialing' && !isTrialExpired(info.trialEndsAt)) return true;
  return false;
}

/**
 * Fonte única do limite de vagas ativas. Não existe plano grátis: sem assinatura paga
 * e sem trial válido o limite é 0. A checagem de expiração é obrigatória aqui, porque
 * nada no sistema muda o status 'trialing' depois que o trial vence.
 */
export function getMaxActiveJobs(info: SubscriptionInfo): number {
  if (info.status === 'active' && info.plan) {
    const plan = PLANS.find((p) => p.id === info.plan);
    return plan?.maxActiveJobs ?? 0;
  }
  if (info.status === 'trialing' && !isTrialExpired(info.trialEndsAt)) {
    return TRIAL_MAX_ACTIVE_JOBS;
  }
  return 0;
}

/** Precisa assinar: trial vencido (ou cancelado) e sem plano pago ativo. */
export function needsSubscription(info: SubscriptionInfo): boolean {
  if (info.status === 'active' && info.plan) return false;
  if (info.status === 'trialing' && !isTrialExpired(info.trialEndsAt)) return false;
  return true;
}

export function getPlanById(id: PlanId | null): Plan | undefined {
  if (!id) return undefined;
  return PLANS.find((p) => p.id === id);
}


