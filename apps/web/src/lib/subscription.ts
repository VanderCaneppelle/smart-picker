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
  /** Valor em reais. Espelha o unit_amount do preço no Stripe. */
  price: number;
  priceLabel: string;
  /**
   * Valor em dólar. Espelha currency_options.usd do MESMO preço no Stripe
   * (lookup key em PRICE_LOOKUP_KEYS). Mexeu num, mexe no outro: com
   * currency_options definido, o Adaptive Pricing não converte, cobra isto.
   */
  priceUsd: number;
  priceLabelUsd: string;
  descriptionKey: string;
  featureKeys: string[];
  maxActiveJobs: number;
  /**
   * Assentos da conta, contando o dono. starter 1 = só o dono, professional 3 =
   * dono + 2, enterprise 10 = dono + 9. Ver getMaxUsers.
   */
  maxUsers: number;
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
    priceUsd: 29,
    priceLabelUsd: 'US$ 29',
    descriptionKey: 'planos.starter.descricao',
    maxActiveJobs: 3,
    maxUsers: 1,
    featureKeys: [
      'planos.recursos.vagas3',
      'planos.recursos.usuarios1',
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
    priceUsd: 49,
    priceLabelUsd: 'US$ 49',
    descriptionKey: 'planos.professional.descricao',
    maxActiveJobs: 10,
    maxUsers: 3,
    highlighted: true,
    featureKeys: [
      'planos.recursos.vagas10',
      'planos.recursos.usuarios3',
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
    priceUsd: 99,
    priceLabelUsd: 'US$ 99',
    descriptionKey: 'planos.enterprise.descricao',
    maxActiveJobs: Infinity,
    maxUsers: 10,
    featureKeys: [
      'planos.recursos.vagasIlimitadas',
      'planos.recursos.usuarios10',
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
    priceUsd: 1,
    priceLabelUsd: 'US$ 1',
    descriptionKey: 'planos.test.descricao',
    maxActiveJobs: 1,
    maxUsers: 1,
    hidden: true,
    featureKeys: ['planos.recursos.apenasTeste'],
  },
];

export const TRIAL_DURATION_DAYS = 30;
export const TRIAL_MAX_ACTIVE_JOBS = 10;
/**
 * O trial é generoso em vagas (10, mais que o Starter) mas fechado em usuários: quem
 * está avaliando o produto avalia sozinho. Convidar equipe é motivo para assinar.
 */
export const TRIAL_MAX_USERS = 1;


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

/**
 * Fonte única do limite de assentos, incluindo o dono. Mesmo formato de
 * getMaxActiveJobs: sem assinatura válida o limite é 1, e não 0, porque o dono nunca
 * perde o acesso à própria conta por causa de assento. Quem perde acesso quando o
 * plano cai são os membros excedentes, e isso é decidido em resolveSeatBlock.
 */
export function getMaxUsers(info: SubscriptionInfo): number {
  if (info.status === 'active' && info.plan) {
    const plan = PLANS.find((p) => p.id === info.plan);
    return plan?.maxUsers ?? 1;
  }
  if (info.status === 'trialing' && !isTrialExpired(info.trialEndsAt)) {
    return TRIAL_MAX_USERS;
  }
  return 1;
}

export interface ImportLimits {
  /** Arquivos aceitos num único lote. */
  perBatch: number;
  /** Currículos importados no mês corrente, somando todas as vagas da conta. */
  perMonth: number;
}

/**
 * Teto do trial. Sem teto, uma conta de teste sobe 5.000 PDFs e o Rankea vira parser
 * de currículo grátis, pagando IA por arquivo.
 */
export const TRIAL_IMPORT_LIMITS: ImportLimits = { perBatch: 50, perMonth: 100 };

/**
 * PROVISÓRIO: os tetos mensais dos planos pagos ainda não foram decididos. Os números
 * abaixo são um ponto de partida seguro (custo de IA por currículo importado), não uma
 * decisão de produto. Revisar antes de anunciar a importação, e lembrar que a página de
 * planos hoje anuncia "candidatos ilimitados": ou o texto muda, ou estes tetos somem.
 */
const PAID_IMPORT_LIMITS: Record<PlanId, ImportLimits> = {
  starter: { perBatch: 200, perMonth: 300 },
  professional: { perBatch: 200, perMonth: 1000 },
  enterprise: { perBatch: 200, perMonth: Infinity },
  test: { perBatch: 50, perMonth: 100 },
};

/**
 * Fonte única dos limites de importação. Mesmo formato de getMaxActiveJobs: sem
 * assinatura válida o limite é zero, porque importar currículo custa IA por arquivo.
 */
export function getImportLimits(info: SubscriptionInfo): ImportLimits {
  if (info.status === 'active' && info.plan) {
    return PAID_IMPORT_LIMITS[info.plan] ?? { perBatch: 0, perMonth: 0 };
  }
  if (info.status === 'trialing' && !isTrialExpired(info.trialEndsAt)) {
    return TRIAL_IMPORT_LIMITS;
  }
  return { perBatch: 0, perMonth: 0 };
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


