'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useMoeda } from '@/contexts/MoedaContext';
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
  /**
   * A moeda vem do PAÍS, não do idioma: é o mesmo sinal que o Stripe usa para
   * cobrar. Um brasileiro que lê o site em inglês continua vendo R$, porque é
   * o que o cartão dele vai pagar. Os dois valores vivem no mesmo preço do
   * Stripe (currency_options), então tela e checkout batem.
   */
  const emDolar = useMoeda() === 'USD';
  return (plan: Plan) => ({
    nome: t(plan.nameKey),
    descricao: t(plan.descriptionKey),
    preco: emDolar ? plan.priceLabelUsd : plan.priceLabel,
    recursos: plan.featureKeys.map((k) => t(k)),
  });
}

/** Locale do Intl dentro de componente cliente. */
export function useIntlLocale(): string {
  return intlLocale(useLocale());
}
