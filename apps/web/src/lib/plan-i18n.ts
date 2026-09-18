'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { Plan } from './subscription';

/** Locale do Intl para datas e números. O dicionário usa 'pt'/'en'. */
export function intlLocale(locale: string): string {
  return locale === 'en' ? 'en-US' : 'pt-BR';
}

export interface PlanoTraduzido {
  nome: string;
  descricao: string;
  preco: string;
  recursos: string[];
}

/**
 * PLANS guarda chaves, não texto: a constante é avaliada na importação,
 * antes de existir idioma. A tradução acontece aqui, na renderização.
 */
export function usePlanoTraduzido(): (plan: Plan) => PlanoTraduzido {
  const t = useTranslations();
  return (plan: Plan) => ({
    nome: t(plan.nameKey),
    descricao: t(plan.descriptionKey),
    preco: plan.priceLabel,
    recursos: plan.featureKeys.map((k) => t(k)),
  });
}

/** Locale do Intl dentro de componente cliente. */
export function useIntlLocale(): string {
  return intlLocale(useLocale());
}
