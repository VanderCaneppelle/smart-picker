'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, ExternalLink, FileText, Brain, MessageSquare, AlertCircle } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import type { Candidate, CandidateStatus } from '@hunter/core';

const EMAIL_TRIGGER_STATUSES: CandidateStatus[] = ['schedule_interview', 'hired', 'rejected'];

const STATUS_EMAIL_MESSAGES: Record<string, string> = {
  schedule_interview: 'Um e-mail de agendamento de entrevista será enviado ao candidato.',
  hired: 'Um e-mail de contratação será enviado ao candidato.',
  rejected: 'Um e-mail de rejeição será enviado ao candidato.',
};

interface CandidateDrawerProps {
  candidate: Candidate;
  onClose: () => void;
  onStatusChange: (candidateId: string, newStatus: CandidateStatus) => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  reviewing: 'Em análise',
  shortlisted: 'Pré-selecionado',
  schedule_interview: 'Agendar entrevista',
  flagged: 'Sinalizado',
  rejected: 'Rejeitado',
  hired: 'Contratado',
};

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  new: 'warning',
  reviewing: 'info',
  shortlisted: 'success',
  schedule_interview: 'purple',
  flagged: 'danger',
  rejected: 'danger',
  hired: 'success',
};

const QUICK_ACTIONS: { status: CandidateStatus; label: string }[] = [
  { status: 'reviewing', label: 'Em análise' },
  { status: 'shortlisted', label: 'Pré-selecionar' },
  { status: 'schedule_interview', label: 'Agendar entrevista' },
  { status: 'rejected', label: 'Rejeitar' },
];

type DrawerTab = 'summary' | 'answers' | 'resume';

function scoreColor(score: number) {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

export default function CandidateDrawer({
  candidate,
  onClose,
  onStatusChange,
}: CandidateDrawerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DrawerTab>('summary');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<CandidateStatus | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const requestQuickAction = useCallback(
    (newStatus: CandidateStatus) => {
      if (candidate.status === newStatus) return;
      if (EMAIL_TRIGGER_STATUSES.includes(newStatus)) {
        setPendingAction(newStatus);
      } else {
        executeQuickAction(newStatus);
      }
    },
    [candidate.status],
  );

  const executeQuickAction = useCallback(
    async (newStatus: CandidateStatus) => {
      setLoadingAction(newStatus);
      try {
        await onStatusChange(candidate.id, newStatus);
      } finally {
        setLoadingAction(null);
      }
    },
    [candidate.id, onStatusChange],
  );

  const confirmQuickAction = useCallback(() => {
    if (pendingAction) {
      executeQuickAction(pendingAction);
      setPendingAction(null);
    }
  }, [pendingAction, executeQuickAction]);

  const tabs: { id: DrawerTab; label: string; icon: typeof Brain }[] = [
    { id: 'summary', label: 'Resumo IA', icon: Brain },
    { id: 'answers', label: 'Respostas', icon: MessageSquare },
    { id: 'resume', label: 'Currículo', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300
          ${isVisible ? 'bg-opacity-40' : 'bg-opacity-0'}
        `}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`ml-auto relative w-full max-w-lg bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {candidate.name}
              </h2>
              <div className="flex items-center gap-2.5 mt-1.5">
                <Badge variant={STATUS_BADGE_VARIANT[candidate.status] ?? 'default'}>
                  {STATUS_LABELS[candidate.status] ?? candidate.status}
                </Badge>
                {candidate.fit_score != null && (
                  <span className={`text-xl font-bold ${scoreColor(candidate.fit_score)}`}>
                    {candidate.fit_score}%
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.status}
                onClick={() => requestQuickAction(action.status)}
                disabled={candidate.status === action.status || loadingAction !== null}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                  ${
                    candidate.status === action.status
                      ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {loadingAction === action.status ? '...' : action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 shrink-0">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-3 border-b-2 text-sm font-medium transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'summary' && <SummaryTab candidate={candidate} />}
          {activeTab === 'answers' && <AnswersTab candidate={candidate} />}
          {activeTab === 'resume' && <ResumeTab candidate={candidate} />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push(`/candidates/${candidate.id}`)}
          >
            Ver aplicação completa
          </Button>
        </div>
      </div>

      {/* Modal de confirmação de status com envio de e-mail */}
      {pendingAction && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setPendingAction(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar alteração</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Você está alterando o status para{' '}
              <span className="font-medium text-gray-900">
                {QUICK_ACTIONS.find((a) => a.status === pendingAction)?.label || pendingAction}
              </span>.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
              {STATUS_EMAIL_MESSAGES[pendingAction]}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmQuickAction}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ───────── Tab content components ───────── */

function ScoreCard({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value?: number | null;
  max: number;
  suffix: string;
}) {
  if (value == null) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-semibold text-gray-300">—</p>
      </div>
    );
  }

  const pct = (value / max) * 100;
  const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>
        {value}
        {suffix}
      </p>
    </div>
  );
}

function SummaryTab({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <ScoreCard label="Fit Score" value={candidate.fit_score} max={100} suffix="%" />
        <ScoreCard label="Currículo" value={candidate.resume_rating} max={5} suffix="/5" />
        <ScoreCard label="Respostas" value={candidate.answer_quality_rating} max={5} suffix="/5" />
      </div>

      {candidate.experience_level && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Nível de Experiência
          </p>
          <p className="text-sm text-gray-900">{candidate.experience_level}</p>
        </div>
      )}

      {candidate.resume_summary ? (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Resumo do Currículo (IA)
          </p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {candidate.resume_summary}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">Resumo não disponível</p>
      )}

      {candidate.status === 'flagged' && candidate.flagged_reason && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs font-medium text-orange-700 uppercase tracking-wider mb-1">
            Motivo do Flag
          </p>
          <p className="text-sm text-orange-800">{candidate.flagged_reason}</p>
        </div>
      )}
    </div>
  );
}

function AnswersTab({ candidate }: { candidate: Candidate }) {
  const answers = candidate.application_answers;

  if (!answers || answers.length === 0) {
    return <p className="text-sm text-gray-400 italic">Nenhuma resposta registrada</p>;
  }

  return (
    <div className="space-y-4">
      {answers.map((answer, index) => (
        <div
          key={answer.question_id || index}
          className="border-b border-gray-100 pb-3 last:border-0"
        >
          <p className="text-xs font-medium text-gray-500 mb-1">Pergunta {index + 1}</p>
          <p className="text-sm text-gray-800 whitespace-pre-line">{answer.answer}</p>
        </div>
      ))}
    </div>
  );
}

function ResumeTab({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-4">
      {candidate.resume_url ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-4">Currículo do candidato</p>
          <a
            href={candidate.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir currículo
          </a>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">Currículo não disponível</p>
      )}

      {candidate.linkedin_url && (
        <a
          href={candidate.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Ver perfil no LinkedIn
        </a>
      )}
    </div>
  );
}
