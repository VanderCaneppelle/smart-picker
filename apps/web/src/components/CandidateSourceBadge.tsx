'use client';

import { useTranslations } from 'next-intl';
import type { CandidateSource } from '@hunter/core';

/**
 * Selo de origem do candidato.
 *
 * Existe porque as duas notas não são comparáveis às cegas: quem se candidatou foi
 * avaliado pelo currículo e pelas respostas do formulário, quem foi importado só pelo
 * currículo. Sem o selo, o recrutador lê o ranking achando que compara iguais.
 */
export default function CandidateSourceBadge({
  source,
  className = '',
}: {
  source: CandidateSource;
  className?: string;
}) {
  const t = useTranslations();

  const estilo =
    source === 'form'
      ? 'bg-gray-100 text-gray-600'
      : 'bg-indigo-50 text-indigo-700';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${estilo} ${className}`}
    >
      {t(`importacao.origem.${source}`)}
    </span>
  );
}
