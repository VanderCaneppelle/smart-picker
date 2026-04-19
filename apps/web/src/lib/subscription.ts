export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export type PlanId = 'starter' | 'professional' | 'enterprise' | 'test';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  maxActiveJobs: number;
  highlighted?: boolean;
  hidden?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    priceLabel: 'R$ 97',
    description: 'Para recrutadores autônomos começando.',
    maxActiveJobs: 3,
    features: [
      'Até 3 vagas ativas',
      'Candidatos ilimitados',
      'Ranking por IA',
      'E-mails automáticos',
      'Página pública de vagas',
    ],
  },
  {
    id: 'professional',
    name: 'Profissional',
    price: 197,
    priceLabel: 'R$ 197',
    description: 'Para consultorias e recrutadores em crescimento.',
    maxActiveJobs: 10,
    highlighted: true,
    features: [
      'Até 10 vagas ativas',
      'Candidatos ilimitados',
      'Ranking por IA',
      'E-mails automáticos',
      'Página pública personalizada',
      'Branding customizado',
      'Suporte prioritário',
    ],
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 397,
    priceLabel: 'R$ 397',
    description: 'Para equipes e operações de alto volume.',
    maxActiveJobs: Infinity,
    features: [
      'Vagas ilimitadas',
      'Candidatos ilimitados',
      'Ranking por IA',
      'E-mails automáticos',
      'Página pública personalizada',
      'Branding customizado',
      'Suporte dedicado',
      'API de integração (em breve)',
    ],
  },
  {
    id: 'test',
    name: 'Teste',
    price: 2,
    priceLabel: 'R$ 2',
    description: 'Plano para teste interno do fluxo de pagamento.',
    maxActiveJobs: 1,
    hidden: true,
    features: ['Apenas para testes internos'],
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

export function getMaxActiveJobs(info: SubscriptionInfo): number {
  if (info.status === 'trialing') return TRIAL_MAX_ACTIVE_JOBS;
  if (info.status === 'active' && info.plan) {
    const plan = PLANS.find((p) => p.id === info.plan);
    return plan?.maxActiveJobs ?? TRIAL_MAX_ACTIVE_JOBS;
  }
  return 0;
}

export function getPlanById(id: PlanId | null): Plan | undefined {
  if (!id) return undefined;
  return PLANS.find((p) => p.id === id);
}

export function shouldShowPaywall(info: SubscriptionInfo): boolean {
  if (info.status === 'active') return false;
  if (info.status === 'trialing' && !isTrialExpired(info.trialEndsAt)) return false;
  return true;
}
