'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { Candidate } from '@hunter/core';
import { apiClient } from '@/lib/api-client';
import { Button, Input } from '@/components/ui';

/**
 * Correção de nome e e-mail do candidato que caiu no balde de revisão, feita sem sair
 * da tela. É o caminho de saída do provisório: o currículo importado nasce com nome de
 * arquivo e um e-mail em domínio inexistente, e enquanto ele estiver assim o recrutador
 * não consegue convidar nem recusar essa pessoa.
 *
 * Salvar também limpa needs_review. Se a IA não conseguiu ler os dados e o recrutador
 * conseguiu, não há mais nada a revisar.
 */
export default function CandidateReviewPanel({
  candidate,
  onUpdated,
  className = '',
}: {
  candidate: Candidate;
  onUpdated?: (candidate: Candidate) => void;
  className?: string;
}) {
  const t = useTranslations();
  const [nome, setNome] = useState(candidate.name);
  const [email, setEmail] = useState(candidate.email);
  const [salvando, setSalvando] = useState(false);

  const mudou = nome.trim() !== candidate.name || email.trim() !== candidate.email;

  const salvar = async () => {
    if (!nome.trim() || !email.trim()) return;

    setSalvando(true);
    try {
      const atualizado = await apiClient.updateCandidate(candidate.id, {
        name: nome.trim(),
        email: email.trim(),
        needs_review: false,
      });
      toast.success(t('importacao.revisao.salvo'));
      onUpdated?.(atualizado);
    } catch (error) {
      console.error('Falha ao salvar revisão do candidato:', error);
      toast.error(t('importacao.revisao.erro'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">{t('importacao.revisao.titulo')}</p>
          <p className="mt-0.5 text-xs text-amber-800">{t('importacao.revisao.explicacao')}</p>

          <div className="mt-3 space-y-3">
            <Input
              label={t('importacao.revisao.nome')}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <Input
              label={t('importacao.revisao.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              onClick={salvar}
              isLoading={salvando}
              disabled={!mudou || !nome.trim() || !email.trim()}
            >
              {t('importacao.revisao.salvar')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
