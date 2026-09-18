'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Brain, ShieldAlert, Info, Share2, ClipboardCopy, Check, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, isPlanLimitError } from '@/lib/api-client';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  Button,
  Input,
  Select,
  Textarea,
  RichTextEditor,
} from '@/components/ui';
import type { ApplicationQuestion, QuestionType, EliminatoryCriteria } from '@hunter/core';
import { useTranslations } from 'next-intl';

const employmentTypeOptions = [
  { value: 'full_time', labelKey: 'formVaga.contrato.full_time' },
  { value: 'part_time', labelKey: 'formVaga.contrato.part_time' },
  { value: 'contract', labelKey: 'formVaga.contrato.contract' },
  { value: 'internship', labelKey: 'formVaga.contrato.internship' },
  { value: 'freelance', labelKey: 'formVaga.contrato.freelance' },
];

const statusOptions = [
  { value: 'draft', labelKey: 'formVaga.statusOpcoes.draft' },
  { value: 'active', labelKey: 'formVaga.statusOpcoes.active' },
  { value: 'on_hold', labelKey: 'formVaga.statusOpcoes.on_hold' },
];

const currencyOptions = [
  { value: '', labelKey: 'formVaga.selecioneMoeda' },
  { value: 'AED', labelKey: 'formVaga.moedas.AED' },
  { value: 'BRL', labelKey: 'formVaga.moedas.BRL' },
  { value: 'EUR', labelKey: 'formVaga.moedas.EUR' },
  { value: 'GBP', labelKey: 'formVaga.moedas.GBP' },
  { value: 'INR', labelKey: 'formVaga.moedas.INR' },
  { value: 'SAR', labelKey: 'formVaga.moedas.SAR' },
  { value: 'USD', labelKey: 'formVaga.moedas.USD' },
];

const questionTypeOptions = [
  { value: 'text', labelKey: 'formVaga.tiposPergunta.text' },
  { value: 'textarea', labelKey: 'formVaga.tiposPergunta.textarea' },
  { value: 'number', labelKey: 'formVaga.tiposPergunta.number' },
  { value: 'yes_no', labelKey: 'formVaga.tiposPergunta.yes_no' },
  { value: 'select', labelKey: 'formVaga.tiposPergunta.select' },
  { value: 'multiselect', labelKey: 'formVaga.tiposPergunta.multiselect' },
];

const ELIMINATORY_ALLOWED_TYPES = ['yes_no', 'select', 'multiselect', 'number'];

export default function NewJobPage() {
  const t = useTranslations();
  /** As listas de opções guardam a chave, não o texto: o rótulo é resolvido na hora de renderizar. */
  const opcoes = (lista: { value: string; labelKey: string }[]) =>
    lista.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const router = useRouter();
  const { completeStep } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareJob, setShareJob] = useState<{ id: string; title: string; status: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [description, setDescription] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [currencyCode, setCurrencyCode] = useState('BRL');
  const [showSalaryToCandidates, setShowSalaryToCandidates] = useState(false);
  const [calendlyLink, setCalendlyLink] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState('');
  const [status, setStatus] = useState('draft');
  const [applicationQuestions, setApplicationQuestions] = useState<ApplicationQuestion[]>([]);
  const [resumeWeight, setResumeWeight] = useState(5);
  const [answersWeight, setAnswersWeight] = useState(5);
  const [scoringInstructions, setScoringInstructions] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addQuestion = () => {
    setApplicationQuestions([
      ...applicationQuestions,
      {
        id: uuidv4(),
        question: '',
        required: false,
        type: 'text' as QuestionType,
        options: [],
      },
    ]);
  };

  const updateQuestion = (index: number, updates: Partial<ApplicationQuestion>) => {
    const newQuestions = [...applicationQuestions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    
    if (updates.type === 'yes_no') {
      newQuestions[index].options = [t('formVaga.sim'), t('formVaga.nao')];
    }
    if (updates.type === 'text' || updates.type === 'textarea' || updates.type === 'number') {
      newQuestions[index].options = [];
    }
    if ((updates.type === 'select' || updates.type === 'multiselect') && !newQuestions[index].options?.length) {
      newQuestions[index].options = [''];
    }

    // Reset eliminatory when switching to a type that doesn't support it
    if (updates.type && !ELIMINATORY_ALLOWED_TYPES.includes(updates.type)) {
      newQuestions[index].is_eliminatory = false;
      newQuestions[index].eliminatory_criteria = undefined;
    }
    
    setApplicationQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...applicationQuestions];
    const options = newQuestions[questionIndex].options || [];
    newQuestions[questionIndex].options = [...options, ''];
    setApplicationQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...applicationQuestions];
    const options = [...(newQuestions[questionIndex].options || [])];
    options[optionIndex] = value;
    newQuestions[questionIndex].options = options;
    setApplicationQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...applicationQuestions];
    const options = newQuestions[questionIndex].options || [];
    newQuestions[questionIndex].options = options.filter((_, i) => i !== optionIndex);
    setApplicationQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setApplicationQuestions(applicationQuestions.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = t('formVaga.erros.titulo');
    if (!location.trim()) newErrors.location = t('formVaga.erros.localizacao');
    if (!description.trim()) newErrors.description = t('formVaga.erros.descricao');

    if (calendlyLink && !calendlyLink.startsWith('http')) {
      newErrors.calendlyLink = t('formVaga.erros.url');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error(t('candidatura.erros.revise'));
      return;
    }

    setIsSubmitting(true);

    try {
      const job = await apiClient.createJob({
        title: title.trim(),
        location: location.trim(),
        employment_type: employmentType as 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance',
        description,
        salary_range: salaryRange.trim() || null,
        currency_code: (currencyCode || null) as 'USD' | 'EUR' | 'SAR' | 'AED' | 'KWD' | 'QAR' | 'BHD' | 'OMR' | 'INR' | 'GBP' | 'BRL' | null,
        show_salary_to_candidates: showSalaryToCandidates,
        calendly_link: calendlyLink.trim() || null,
        interview_questions: interviewQuestions.trim() || null,
        status: status as 'draft' | 'active' | 'on_hold',
        application_questions: applicationQuestions.filter((q) => q.question.trim()),
        resume_weight: resumeWeight,
        answers_weight: answersWeight,
        scoring_instructions: scoringInstructions.trim() || null,
      });

      completeStep('create-job');
      if (applicationQuestions.filter((q) => q.question.trim()).length > 0) {
        completeStep('add-questions');
      }
      if (scoringInstructions.trim() || resumeWeight !== 5 || answersWeight !== 5) {
        completeStep('ia-config');
      }
      setShareJob({ id: job.id, title: job.title, status: job.status });
    } catch (error) {
      if (isPlanLimitError(error)) {
        toast.error(error instanceof Error ? error.message : 'Limite do plano atingido', {
          action: { label: 'Atualizar plano', onClick: () => router.push('/dashboard/upgrade') },
        });
      } else {
        toast.error(error instanceof Error ? error.message : 'Falha ao criar vaga');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareUrl = shareJob ? `${typeof window !== 'undefined' ? window.location.origin : ''}/jobs/${shareJob.id}/apply` : '';

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div>
      {/* Share modal shown after job creation */}
      {shareJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest">{t('formVaga.vagaCriada')}</p>
                  <h2 className="text-white font-bold text-lg leading-tight">{shareJob.title}</h2>
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-gray-600 text-sm mb-4">
                {shareJob?.status === 'active'
                  ? t('vaga.ativaCompartilhe')
                  : t('formVaga.criadaRascunho')}
              </p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                <span className="text-sm text-gray-500 flex-1 truncate">{shareUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    linkCopied
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {linkCopied ? <><Check className="h-3.5 w-3.5" />{t('formVaga.copiado')}</> : <><ClipboardCopy className="h-3.5 w-3.5" />{t('formVaga.copiarLink')}</>}
                </button>
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 pb-5 flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => router.push('/jobs')}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >{t('formVaga.verVagas')}</button>
              <button
                type="button"
                onClick={() => router.push(`/jobs/${shareJob.id}?tab=details`)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
              >{t('formVaga.verVaga')}<ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/jobs')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >{t('formVaga.voltar')}</Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('formVaga.titulo')}</h1>
          <p className="text-gray-600 mt-1">{t('formVaga.subtitulo')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('formVaga.secaoBasico')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t('formVaga.tituloVaga')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
              placeholder={t('formVaga.tituloPlaceholder')}
            />
            <Input
              label={t('formVaga.localizacao')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              error={errors.location}
              required
              placeholder={t('formVaga.localizacaoPlaceholder')}
            />
            <Select
              label={t('formVaga.tipoContratacao')}
              options={opcoes(employmentTypeOptions)}
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              required
            />
            <Select
              label={t('formVaga.status')}
              options={opcoes(statusOptions)}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Compensation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('formVaga.secaoRemuneracao')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t('formVaga.faixaSalarial')}
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              placeholder={t('formVaga.faixaPlaceholder')}
              helperText={t('formVaga.faixaAjuda')}
            />
            <Select
              label={t('formVaga.moeda')}
              options={opcoes(currencyOptions)}
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
            />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showSalaryToCandidates}
              onChange={(e) => setShowSalaryToCandidates(e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>{t('formVaga.exibirSalario')}</span>
          </label>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('formVaga.secaoDescricao')}</h2>
          <RichTextEditor
            label={t('formVaga.descricao')}
            value={description}
            onChange={setDescription}
            error={errors.description}
            required
            placeholder={t('formVaga.descricaoPlaceholder')}
            aiPolish
            aiContext={title}
          />
        </div>

        {/* Application Questions */}
        <div data-onboarding-id="onb-job-questions" className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('formVaga.secaoPerguntas')}</h2>
            <p className="text-sm text-gray-500">{t('formVaga.perguntasSub')}</p>
          </div>

          {applicationQuestions.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">{t('vaga.semPerguntas')}</p>
          ) : (
            <div className="space-y-4">
              {applicationQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    question.is_eliminatory
                      ? 'border-amber-300 bg-amber-50/30'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <Input
                        label={`Pergunta ${index + 1}`}
                        value={question.question}
                        onChange={(e) =>
                          updateQuestion(index, { question: e.target.value })
                        }
                        placeholder={t('formVaga.digitePergunta')}
                      />
                      <div className="flex items-center gap-4 flex-wrap">
                        <Select
                          id={`question-${index}-type`}
                          label={t('formVaga.tipoResposta')}
                          options={opcoes(questionTypeOptions)}
                          value={question.type}
                          onChange={(e) =>
                            updateQuestion(index, { type: e.target.value as QuestionType })
                          }
                          className="w-44"
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) =>
                              updateQuestion(index, { required: e.target.checked })
                            }
                            className="rounded border-gray-300"
                          />{t('formVaga.obrigatoria')}</label>
                        {ELIMINATORY_ALLOWED_TYPES.includes(question.type) && (
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={question.is_eliminatory || false}
                              onChange={(e) => {
                                const isElim = e.target.checked;
                                const updates: Partial<ApplicationQuestion> = { is_eliminatory: isElim };
                                if (isElim && !question.eliminatory_criteria) {
                                  const criteria: EliminatoryCriteria = {};
                                  if (question.type === 'yes_no') {
                                    criteria.expected_answer = t('formVaga.sim');
                                  }
                                  if (question.type === 'select' || question.type === 'multiselect') {
                                    criteria.accepted_values = [...(question.options || [])];
                                  }
                                  if (question.type === 'number') {
                                    criteria.tolerance_percent = 15;
                                  }
                                  updates.eliminatory_criteria = criteria;
                                }
                                if (!isElim) {
                                  updates.eliminatory_criteria = undefined;
                                }
                                updateQuestion(index, updates);
                              }}
                              className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="flex items-center gap-1 text-amber-700">
                              <ShieldAlert className="h-3.5 w-3.5" />{t('formVaga.eliminatoria')}</span>
                          </label>
                        )}
                      </div>

                      {/* Opções para select e multiselect */}
                      {(question.type === 'select' || question.type === 'multiselect') && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">{t('formVaga.opcoesResposta')}</p>
                          <div className="space-y-2">
                            {(question.options || []).map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                  placeholder={`Opção ${optIndex + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(index, optIndex)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  disabled={(question.options?.length || 0) <= 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addOption(index)}
                            leftIcon={<Plus className="h-3 w-3" />}
                            className="mt-2 text-emerald-600 hover:text-emerald-700"
                          >{t('formVaga.adicionarOpcao')}</Button>
                        </div>
                      )}

                      {/* Mostrar opções fixas para yes_no */}
                      {question.type === 'yes_no' && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-200">
                          <p className="text-sm text-gray-500">{t('formVaga.opcoes')}<span className="font-medium">{t('formVaga.sim')}</span> / <span className="font-medium">{t('formVaga.nao')}</span>
                          </p>
                        </div>
                      )}

                      {/* Configuração Eliminatória */}
                      {question.is_eliminatory && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5" />{t('formVaga.criteriosEliminatorios')}</p>

                          {question.type === 'yes_no' && (
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">{t('formVaga.respostaEsperada')}</label>
                              <select
                                value={question.eliminatory_criteria?.expected_answer || t('formVaga.sim')}
                                onChange={(e) =>
                                  updateQuestion(index, {
                                    eliminatory_criteria: {
                                      ...question.eliminatory_criteria,
                                      expected_answer: e.target.value,
                                    },
                                  })
                                }
                                className="text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                              >
                                <option value="Sim">{t('formVaga.sim')}</option>
                                <option value="Não">{t('formVaga.nao')}</option>
                              </select>
                            </div>
                          )}

                          {(question.type === 'select' || question.type === 'multiselect') && (
                            <div>
                              <label className="block text-sm text-gray-700 mb-2">{t('formVaga.respostasAceitas')}</label>
                              <div className="space-y-1.5">
                                {(question.options || []).map((option, optIdx) => (
                                  <label key={optIdx} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={
                                        question.eliminatory_criteria?.accepted_values?.includes(option) ?? true
                                      }
                                      onChange={(e) => {
                                        const current = question.eliminatory_criteria?.accepted_values || [...(question.options || [])];
                                        const updated = e.target.checked
                                          ? [...current, option]
                                          : current.filter((v) => v !== option);
                                        updateQuestion(index, {
                                          eliminatory_criteria: {
                                            ...question.eliminatory_criteria,
                                            accepted_values: updated,
                                          },
                                        });
                                      }}
                                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {question.type === 'number' && (
                            <div className="space-y-3">
                              <p className="text-xs text-gray-600">{t('vaga.intervaloAjuda')}</p>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('formVaga.minimo')}</label>
                                  <input
                                    type="number"
                                    value={question.eliminatory_criteria?.range_min ?? ''}
                                    onChange={(e) =>
                                      updateQuestion(index, {
                                        eliminatory_criteria: {
                                          ...question.eliminatory_criteria,
                                          range_min: e.target.value ? Number(e.target.value) : undefined,
                                        },
                                      })
                                    }
                                    placeholder={t('formVaga.exMin')}
                                    className="w-full text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('formVaga.maximo')}</label>
                                  <input
                                    type="number"
                                    value={question.eliminatory_criteria?.range_max ?? ''}
                                    onChange={(e) =>
                                      updateQuestion(index, {
                                        eliminatory_criteria: {
                                          ...question.eliminatory_criteria,
                                          range_max: e.target.value ? Number(e.target.value) : undefined,
                                        },
                                      })
                                    }
                                    placeholder={t('formVaga.exMax')}
                                    className="w-full text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('formVaga.tolerancia')}</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={question.eliminatory_criteria?.tolerance_percent ?? 15}
                                    onChange={(e) =>
                                      updateQuestion(index, {
                                        eliminatory_criteria: {
                                          ...question.eliminatory_criteria,
                                          tolerance_percent: Number(e.target.value),
                                        },
                                      })
                                    }
                                    className="w-full text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">
                                Dentro da tolerância = aviso (negociável). Fora da tolerância = eliminado.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addQuestion}
              leftIcon={<Plus className="h-4 w-4" />}
            >{t('formVaga.adicionarPergunta')}</Button>
          </div>
        </div>

        {/* AI Scoring Settings */}
        <div data-onboarding-id="onb-job-ia" className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">{t('formVaga.secaoIA')}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">{t('vaga.pesosDescricao')}</p>
          
          <div className="space-y-6">
            {/* Resume Weight */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">{t('formVaga.pesoCurriculo')}</label>
                <span className="text-sm font-semibold text-emerald-600">{resumeWeight}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={resumeWeight}
                onChange={(e) => setResumeWeight(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-xs text-gray-500 mt-1">{t('formVaga.pesoCurriculoSub')}</p>
            </div>

            {/* Answers Weight */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">{t('formVaga.pesoRespostas')}</label>
                <span className="text-sm font-semibold text-emerald-600">{answersWeight}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={answersWeight}
                onChange={(e) => setAnswersWeight(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-xs text-gray-500 mt-1">{t('formVaga.pesoRespostasSub')}</p>
            </div>

            {/* Weight Distribution Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">{t('formVaga.distribuicaoPesos')}</p>
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 bg-emerald-500 rounded-l-full transition-all"
                  style={{ width: `${(resumeWeight / (resumeWeight + answersWeight)) * 100}%` }}
                />
                <div 
                  className="h-3 bg-teal-400 rounded-r-full transition-all"
                  style={{ width: `${(answersWeight / (resumeWeight + answersWeight)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>Currículo: {Math.round((resumeWeight / (resumeWeight + answersWeight)) * 100)}%</span>
                <span>Respostas: {Math.round((answersWeight / (resumeWeight + answersWeight)) * 100)}%</span>
              </div>
            </div>

            {/* Scoring Instructions */}
            <Textarea
              label={t('formVaga.instrucoesIA')}
              value={scoringInstructions}
              onChange={(e) => setScoringInstructions(e.target.value)}
              placeholder={t('formVaga.iaExemplo')}
              helperText={t('formVaga.instrucoesIAPlaceholder')}
              rows={3}
            />
          </div>
        </div>

        {/* Agendamento de entrevista */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('formVaga.agendamento')}</h2>
          <Input
            label={t('formVaga.linkCalendly')}
            value={calendlyLink}
            onChange={(e) => setCalendlyLink(e.target.value)}
            error={errors.calendlyLink}
            placeholder={t('formVaga.calendlyPlaceholder')}
            helperText={t('formVaga.calendlyAjuda')}
          />
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t('formVaga.envioEmail')}</p>
              <p>
                Se você preencher o link do Calendly acima, ao mover um candidato para &quot;Entrevista&quot;
                será enviado automaticamente um e-mail com o link para ele agendar. Caso não preencha,
                você precisará fazer o agendamento manualmente com cada candidato.
              </p>
            </div>
          </div>
        </div>

        {/* Anotações internas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('formVaga.anotacoes')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('vaga.notaInternaAjuda')}</p>
          <Textarea
            label={t('formVaga.perguntasEntrevista')}
            value={interviewQuestions}
            onChange={(e) => setInterviewQuestions(e.target.value)}
            placeholder={t('formVaga.perguntasEntrevistaPlaceholder')}
            rows={4}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/jobs')}
          >{t('formVaga.cancelar')}</Button>
          <Button type="submit" isLoading={isSubmitting}>{t('formVaga.titulo')}</Button>
        </div>
      </form>
    </div>
  );
}
