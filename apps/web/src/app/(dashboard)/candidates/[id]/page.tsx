'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  FileText,
  Briefcase,
  MapPin,
  Star,
  Target,
  MessageSquare,
  Flag,
  StickyNote,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button, Badge, Select, Loading, Textarea } from '@/components/ui';
import type { Candidate, CandidateStatus, ApplicationQuestion, ApplicationAnswer } from '@hunter/core';
import type { CandidateHistoryEvent } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import CandidateSourceBadge from '@/components/CandidateSourceBadge';
import CandidateReviewPanel from '@/components/CandidateReviewPanel';
import { useIntlLocale } from '@/lib/plan-i18n';

/** Chaves, não textos: constante de módulo é avaliada antes de existir idioma. */
const statusOptions = [
  { value: 'new', labelKey: 'candidatos.estados.novo' },
  { value: 'reviewing', labelKey: 'secaoCand.emRevisao' },
  { value: 'interview', labelKey: 'candidatos.filtros.entrevista' },
  { value: 'in_validation', labelKey: 'candidatos.filtros.emValidacao' },
  { value: 'rejected', labelKey: 'candidatos.estados.encerrado' },
  { value: 'hired', labelKey: 'candidatos.estados.contratado' },
];

const STATUS_DISPLAY_KEYS: Record<string, string> = {
  new: 'candidatos.estados.novo',
  reviewing: 'secaoCand.emRevisao',
  interview: 'candidatos.filtros.entrevista',
  in_validation: 'candidatos.filtros.emValidacao',
  rejected: 'candidatos.estados.encerrado',
  hired: 'candidatos.estados.contratado',
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'new':
      return 'warning';
    case 'reviewing':
      return 'info';
    case 'interview':
      return 'purple';
    case 'in_validation':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'hired':
      return 'success';
    default:
      return 'default';
  }
};

export default function CandidateDetailPage() {
  const t = useTranslations();
  /** Rótulo resolvido na renderização: a lista guarda a chave. */
  const opcoes = (lista: { value: string; labelKey: string }[]) =>
    lista.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const localeIntl = useIntlLocale();
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [events, setEvents] = useState<CandidateHistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchCandidate = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getCandidate(candidateId);
      setCandidate(data);
      const eventsData = await apiClient.getCandidateEvents(candidateId);
      setEvents(eventsData.events || []);
    } catch (error) {
      toast.error(t('candDetalhe.erroCarregar'));
      console.error(error);
      router.push('/jobs');
    } finally {
      setIsLoading(false);
    }
  }, [candidateId, router]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  useEffect(() => {
    if (candidate) {
      setRecruiterNotes(candidate.recruiter_notes || '');
    }
  }, [candidate?.id, candidate?.recruiter_notes]);

  const handleSaveNotes = async () => {
    if (!candidate) return;
    setIsSavingNotes(true);
    try {
      const updated = await apiClient.updateCandidate(candidateId, {
        recruiter_notes: recruiterNotes.trim() || null,
      });
      setCandidate(updated);
      toast.success(t('candDetalhe.notasSalvas'));
    } catch (error) {
      toast.error(t('candDetalhe.erroSalvarNotas'));
      console.error(error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (!candidate) return;

    try {
      const updated = await apiClient.updateCandidate(candidateId, { status: newStatus });
      setCandidate(updated);
      const eventsData = await apiClient.getCandidateEvents(candidateId);
      setEvents(eventsData.events || []);
      toast.success(t('candidatos.statusAtualizado'));
    } catch (error) {
      toast.error(t('candidatos.erroStatus'));
      console.error(error);
    }
  };

  if (isLoading) {
    return <Loading text="Carregando candidato..." />;
  }

  if (!candidate) {
    return null;
  }

  const job = candidate.job;
  const applicationQuestions = (job?.application_questions || []) as ApplicationQuestion[];
  const applicationAnswers = (candidate.application_answers || []) as ApplicationAnswer[];

  // Map answers by question_id for easy lookup
  const answersMap = new Map(applicationAnswers.map((a) => [a.question_id, a.answer]));

  const EVENT_LABELS: Record<string, string> = {
    application_submitted: t('historico.recebida'),
    status_changed: t('historico.statusAlterado'),
    email_sent_interview: t('historico.emailEntrevista'),
    email_sent_rejection: t('historico.emailRejeicao'),
    score_recalculated: t('historico.recalculo'),
  };

  const historyEvents: CandidateHistoryEvent[] = [
    {
      id: `application-${candidate.id}`,
      candidate_id: candidate.id,
      job_id: candidate.job_id,
      event_type: 'application_submitted',
      from_status: null,
      to_status: 'new',
      message: t('historico.dataAplicacao'),
      metadata: null,
      created_by: null,
      created_at: candidate.created_at,
    },
    ...events.filter((event) => event.event_type !== 'application_submitted'),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >{t('comum.voltar')}</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revisão: mesmo bloco da gaveta do kanban, porque quem usa a visão de lista
              chega ao candidato por aqui e precisa do mesmo caminho de correção. */}
          {candidate.needs_review && (
            <CandidateReviewPanel candidate={candidate} onUpdated={setCandidate} />
          )}

          {/* Candidate Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                {job && (
                  <p className="text-gray-600 mt-1">{t('candDetalhe.candidatouPara')}<span className="font-medium">{job.title}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CandidateSourceBadge source={candidate.source} />
                <Badge variant={getStatusBadgeVariant(candidate.status)} className="text-sm">
                  {t(STATUS_DISPLAY_KEYS[candidate.status] ?? '') || candidate.status}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href={`mailto:${candidate.email}`}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <Mail className="h-4 w-4" />
                {candidate.email}
              </a>

              {candidate.phone_number && (
                <a
                  href={`tel:${candidate.phone_number}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                >
                  <Phone className="h-4 w-4" />
                  {candidate.phone_number}
                </a>
              )}

              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                >
                  <Linkedin className="h-4 w-4" />{t('candDetalhe.perfilLinkedin')}</a>
              )}

              <a
                href={candidate.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <FileText className="h-4 w-4" />{t('candDetalhe.verCurriculo')}</a>
            </div>

            {/* Status Update */}
            <div className="mt-6 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('candDetalhe.atualizarStatus')}</label>
              <Select
                options={opcoes(statusOptions)}
                value={candidate.status}
                onChange={(e) => handleStatusChange(e.target.value as CandidateStatus)}
                className="w-48"
              />
            </div>

            {/* Alert reason */}
            {candidate.flagged_reason && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2 text-orange-800 text-sm">
                <Flag className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{t('candDetalhe.alertaAutomatico')}</p>
                  <p className="text-orange-700 mt-1">{candidate.flagged_reason}</p>
                </div>
              </div>
            )}

            {/* Notas e transcrição da entrevista */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <StickyNote className="h-4 w-4" />{t('candDetalhe.notasEntrevista')}</h3>
              <p className="text-xs text-gray-500 mb-2">{t('detalhe.notasPlaceholder')}</p>
              <Textarea
                value={recruiterNotes}
                onChange={(e) => setRecruiterNotes(e.target.value)}
                placeholder={t('candDetalhe.notasPlaceholder')}
                rows={6}
                className="min-h-[120px]"
              />
              <Button
                size="sm"
                onClick={handleSaveNotes}
                isLoading={isSavingNotes}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700"
              >{t('candDetalhe.salvarNotas')}</Button>
            </div>
          </div>

          {/* Application Answers */}
          {applicationQuestions.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />{t('candDetalhe.respostasAplicacao')}</h2>
              <div className="space-y-4">
                {applicationQuestions.map((question) => (
                  <div key={question.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <p className="font-medium text-gray-900 mb-1">
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <p className="text-gray-600">
                      {answersMap.get(question.id) || (
                        <span className="text-gray-400 italic">{t('candDetalhe.semResposta')}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume Summary */}
          {candidate.resume_summary && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />{t('candDetalhe.resumoCurriculo')}</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{candidate.resume_summary}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Scores */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('candDetalhe.avaliacaoIA')}</h2>

            <div className="space-y-4">
              {/* Fit Score */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Target className="h-4 w-4" />{t('candidatos.colFitScore')}</span>
                  <span
                    className={`font-bold ${
                      candidate.fit_score !== null && candidate.fit_score !== undefined
                        ? candidate.fit_score >= 80
                          ? 'text-green-600'
                          : candidate.fit_score >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {candidate.fit_score !== null && candidate.fit_score !== undefined
                      ? `${candidate.fit_score}%`
                      : 'Pendente'}
                  </span>
                </div>
                {candidate.fit_score !== null && candidate.fit_score !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        candidate.fit_score >= 80
                          ? 'bg-green-500'
                          : candidate.fit_score >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${candidate.fit_score}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Resume Rating */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Star className="h-4 w-4" />{t('candDetalhe.notaCurriculo')}</span>
                  <span className="font-bold text-gray-900">
                    {candidate.resume_rating !== null && candidate.resume_rating !== undefined
                      ? `${candidate.resume_rating}/5`
                      : 'Pendente'}
                  </span>
                </div>
              </div>

              {/* Answer Quality */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />{t('candDetalhe.qualidadeRespostas')}</span>
                  <span className="font-bold text-gray-900">
                    {candidate.answer_quality_rating !== null && candidate.answer_quality_rating !== undefined
                      ? `${candidate.answer_quality_rating}/5`
                      : 'Pendente'}
                  </span>
                </div>
              </div>

              {/* Experience Level */}
              {candidate.experience_level && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />{t('candDetalhe.nivelExperiencia')}</span>
                    <span className="font-medium text-gray-900">{candidate.experience_level}</span>
                  </div>
                </div>
              )}
            </div>

            {candidate.needs_scoring && (
              <p className="text-sm text-gray-500 mt-4 pt-4 border-t">{t('candDetalhe.avaliacaoAndamento')}</p>
            )}
          </div>

          {/* Job Info */}
          {job && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('candDetalhe.detalhesVaga')}</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  <span>{job.title}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="w-full mt-2"
                >{t('candDetalhe.verVaga')}</Button>
              </div>
            </div>
          )}

          {/* Histórico */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('candDetalhe.historico')}</h2>
            {historyEvents.length === 0 ? (
              <p className="text-sm text-gray-500">{t('candDetalhe.semEventos')}</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-auto">
                {historyEvents.map((event) => (
                  <div key={event.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">
                        {EVENT_LABELS[event.event_type] || event.message || event.event_type}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString(localeIntl, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {event.from_status && event.to_status && (
                      <p className="text-xs text-gray-600 mt-1">
                        {t(STATUS_DISPLAY_KEYS[event.from_status] ?? '') || event.from_status} {'->'}{' '}
                        {t(STATUS_DISPLAY_KEYS[event.to_status] ?? '') || event.to_status}
                      </p>
                    )}
                    {/* Para eventos de status, usamos apenas os rótulos em português acima.
                        Não exibimos a mensagem original do backend para evitar textos em inglês. */}
                    {event.message && event.event_type !== 'status_changed' && (
                      <p className="text-xs text-gray-500 mt-1">{event.message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
