'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Share2,
  Files,
  Trash2,
  Save,
  MapPin,
  Briefcase,
  DollarSign,
  Plus,
  Brain,
  ShieldAlert,
  Info,
  Pencil,
  X,
  Upload,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { apiClient, isPlanLimitError } from '@/lib/api-client';
import {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  RichTextEditor,
  Modal,
  Loading,
} from '@/components/ui';
import CandidatesSection from '@/components/CandidatesSection';
import ImportResumesModal from '@/components/ImportResumesModal';
import type { Job, ApplicationQuestion, QuestionType } from '@hunter/core';
import { useTranslations } from 'next-intl';

type EliminatoryCriteria = NonNullable<ApplicationQuestion['eliminatory_criteria']>;

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
  { value: 'closed', labelKey: 'editarVaga.statusFechada' },
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

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
      return 'default';
    case 'closed':
      return 'danger';
    case 'on_hold':
      return 'warning';
    default:
      return 'default';
  }
};

export default function JobDetailPage() {
  const t = useTranslations();
  /** Rótulo resolvido na renderização: as listas guardam a chave. */
  const opcoes = (lista: { value: string; labelKey: string }[]) =>
    lista.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const searchParams = useSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  /** Muda a cada importação concluída, para a lista de candidatos recarregar. */
  const [importToken, setImportToken] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'candidates' | 'details'>(() =>
    searchParams.get('tab') === 'details' ? 'details' : 'candidates'
  );
  const [isEditing, setIsEditing] = useState(() => searchParams.get('edit') === '1');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'tab-candidates' | 'tab-details' | 'back-to-jobs' | null>(null);

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

  const fetchJob = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getJob(jobId);
      setJob(data);

      // Populate form
      setTitle(data.title);
      setLocation(data.location);
      setEmploymentType(data.employment_type);
      setDescription(data.description);
      setSalaryRange(data.salary_range || '');
      setCurrencyCode(data.currency_code || 'BRL');
      setShowSalaryToCandidates(data.show_salary_to_candidates ?? false);
      setCalendlyLink(data.calendly_link || '');
      setInterviewQuestions(data.interview_questions || '');
      setStatus(data.status);
      setApplicationQuestions(data.application_questions || []);
      setResumeWeight(data.resume_weight ?? 5);
      setAnswersWeight(data.answers_weight ?? 5);
      setScoringInstructions(data.scoring_instructions || '');
    } catch (error) {
      toast.error(t('editarVaga.erroCarregar'));
      console.error(error);
      router.push('/jobs');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const edit = searchParams.get('edit');
    if (tab === 'details') {
      setActiveTab('details');
      if (edit === '1') setIsEditing(true);
    }
    if (tab === 'candidates') setActiveTab('candidates');
  }, [searchParams]);

  const isDirty = useMemo(() => {
    if (!job) return false;
    const q = (a: ApplicationQuestion[], b: ApplicationQuestion[]) =>
      JSON.stringify(a?.map((x) => ({ ...x }))) === JSON.stringify(b?.map((x) => ({ ...x })));
    return (
      title !== job.title ||
      location !== job.location ||
      employmentType !== job.employment_type ||
      description !== (job.description ?? '') ||
      (salaryRange || '') !== (job.salary_range ?? '') ||
      currencyCode !== (job.currency_code ?? 'BRL') ||
      showSalaryToCandidates !== (job.show_salary_to_candidates ?? false) ||
      (calendlyLink || '') !== (job.calendly_link ?? '') ||
      (interviewQuestions || '') !== (job.interview_questions ?? '') ||
      status !== job.status ||
      !q(applicationQuestions, (job.application_questions || []) as ApplicationQuestion[]) ||
      resumeWeight !== (job.resume_weight ?? 5) ||
      answersWeight !== (job.answers_weight ?? 5) ||
      (scoringInstructions || '') !== (job.scoring_instructions ?? '')
    );
  }, [
    job,
    title,
    location,
    employmentType,
    description,
    salaryRange,
    currencyCode,
    showSalaryToCandidates,
    calendlyLink,
    interviewQuestions,
    status,
    applicationQuestions,
    resumeWeight,
    answersWeight,
    scoringInstructions,
  ]);

  const revertForm = useCallback(() => {
    if (!job) return;
    setTitle(job.title);
    setLocation(job.location);
    setEmploymentType(job.employment_type);
    setDescription(job.description ?? '');
    setSalaryRange(job.salary_range ?? '');
    setCurrencyCode(job.currency_code ?? 'BRL');
    setShowSalaryToCandidates(job.show_salary_to_candidates ?? false);
    setCalendlyLink(job.calendly_link ?? '');
    setInterviewQuestions(job.interview_questions ?? '');
    setStatus(job.status);
    setApplicationQuestions((job.application_questions || []) as ApplicationQuestion[]);
    setResumeWeight(job.resume_weight ?? 5);
    setAnswersWeight(job.answers_weight ?? 5);
    setScoringInstructions(job.scoring_instructions ?? '');
  }, [job]);

  const applyTabToUrl = useCallback(
    (tab: 'candidates' | 'details', editing?: boolean) => {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      if (tab === 'candidates') {
        url.searchParams.delete('edit');
      } else if (editing) {
        url.searchParams.set('edit', '1');
      } else {
        url.searchParams.delete('edit');
      }
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
    },
    [router],
  );

  const switchTab = useCallback(
    (tab: 'candidates' | 'details') => {
      setActiveTab(tab);
      applyTabToUrl(tab, tab === 'details' && isEditing);
    },
    [isEditing, applyTabToUrl],
  );

  const handleTabClick = useCallback(
    (tab: 'candidates' | 'details') => {
      if (tab === activeTab) return;
      if (activeTab === 'details' && isEditing && isDirty) {
        setPendingAction(tab === 'candidates' ? 'tab-candidates' : 'tab-details');
        setShowUnsavedModal(true);
        return;
      }
      switchTab(tab);
    },
    [activeTab, isEditing, isDirty, switchTab],
  );

  const handleBackClick = useCallback(() => {
    if (activeTab === 'details' && isEditing && isDirty) {
      setPendingAction('back-to-jobs');
      setShowUnsavedModal(true);
      return;
    }
    router.push('/jobs');
  }, [activeTab, isEditing, isDirty, router]);

  const runPendingAction = useCallback(() => {
    if (pendingAction === 'tab-candidates') switchTab('candidates');
    else if (pendingAction === 'tab-details') switchTab('details');
    else if (pendingAction === 'back-to-jobs') router.push('/jobs');
    setPendingAction(null);
    setShowUnsavedModal(false);
  }, [pendingAction, switchTab, router]);

  const handleUnsavedSaveAndContinue = useCallback(async () => {
    if (!pendingAction) return;
    setIsSaving(true);
    try {
      await apiClient.updateJob(jobId, {
        title: title.trim(),
        location: location.trim(),
        employment_type: employmentType as 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance',
        description,
        salary_range: salaryRange.trim() || null,
        currency_code: (currencyCode || null) as 'USD' | 'EUR' | 'SAR' | 'AED' | 'KWD' | 'QAR' | 'BHD' | 'OMR' | 'INR' | 'GBP' | 'BRL' | null,
        show_salary_to_candidates: showSalaryToCandidates,
        calendly_link: calendlyLink.trim() || null,
        interview_questions: interviewQuestions.trim() || null,
        status: status as 'draft' | 'active' | 'closed' | 'on_hold',
        application_questions: applicationQuestions.filter((q) => q.question.trim()),
        resume_weight: resumeWeight,
        answers_weight: answersWeight,
        scoring_instructions: scoringInstructions.trim() || null,
      });
      const updated = await apiClient.getJob(jobId);
      setJob(updated);
      toast.success(t('editarVaga.atualizada'));
      setIsEditing(false);
      runPendingAction();
    } catch (error) {
      if (isPlanLimitError(error)) {
        toast.error(error instanceof Error ? error.message : t('editarVaga.limitePlano'), {
          action: { label: t('formVaga.atualizarPlano'), onClick: () => router.push('/dashboard/upgrade') },
        });
      } else {
        toast.error(error instanceof Error ? error.message : t('editarVaga.erroAtualizar'));
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    pendingAction,
    jobId,
    title,
    location,
    employmentType,
    description,
    salaryRange,
    currencyCode,
    showSalaryToCandidates,
    calendlyLink,
    interviewQuestions,
    status,
    applicationQuestions,
    resumeWeight,
    answersWeight,
    scoringInstructions,
    runPendingAction,
  ]);

  const handleUnsavedDiscard = useCallback(() => {
    revertForm();
    setIsEditing(false);
    runPendingAction();
  }, [revertForm, runPendingAction]);

  const handleCancelEdit = useCallback(() => {
    if (isDirty) {
      if (window.confirm(t('editarVaga.descartar'))) {
        revertForm();
        setIsEditing(false);
        applyTabToUrl('details', false);
      }
    } else {
      setIsEditing(false);
      applyTabToUrl('details', false);
    }
  }, [isDirty, revertForm, applyTabToUrl]);

  const handleShare = async () => {
    const url = `${window.location.origin}/jobs/${jobId}/apply`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('vagas.linkCopiado'));
    } catch {
      toast.error(t('vagas.erroCopiar'));
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicated = await apiClient.duplicateJob(jobId);
      toast.success(t('vagas.duplicada'));
      router.push(`/jobs/${duplicated.id}`);
    } catch (error) {
      toast.error(t('vagas.erroDuplicar'));
      console.error(error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.deleteJob(jobId);
      toast.success(t('editarVaga.excluida'));
      router.push('/jobs');
    } catch (error) {
      toast.error(t('editarVaga.erroExcluir'));
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await apiClient.updateJob(jobId, {
        title: title.trim(),
        location: location.trim(),
        employment_type: employmentType as 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance',
        description,
        salary_range: salaryRange.trim() || null,
        currency_code: (currencyCode || null) as 'USD' | 'EUR' | 'SAR' | 'AED' | 'KWD' | 'QAR' | 'BHD' | 'OMR' | 'INR' | 'GBP' | 'BRL' | null,
        show_salary_to_candidates: showSalaryToCandidates,
        calendly_link: calendlyLink.trim() || null,
        interview_questions: interviewQuestions.trim() || null,
        status: status as 'draft' | 'active' | 'closed' | 'on_hold',
        application_questions: applicationQuestions.filter((q) => q.question.trim()),
        resume_weight: resumeWeight,
        answers_weight: answersWeight,
        scoring_instructions: scoringInstructions.trim() || null,
      });
      setJob(updated);
      toast.success(t('editarVaga.atualizada'));
      setIsEditing(false);

      // Remove o modo de edição da URL (tab continua em detalhes)
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('edit');
        if (url.searchParams.get('tab') !== 'details') {
          url.searchParams.set('tab', 'details');
        }
        router.replace(`${url.pathname}${url.search}`, { scroll: false });
      } catch {
        // Ignora falhas ao manipular URL (ex: em ambientes sem window)
      }
    } catch (error) {
      if (isPlanLimitError(error)) {
        toast.error(error instanceof Error ? error.message : t('editarVaga.limitePlano'), {
          action: { label: t('formVaga.atualizarPlano'), onClick: () => router.push('/dashboard/upgrade') },
        });
      } else {
        toast.error(error instanceof Error ? error.message : t('editarVaga.erroAtualizar'));
      }
    } finally {
      setIsSaving(false);
    }
  };

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

  if (isLoading) {
    return <Loading text={t('editarVaga.carregando')} />;
  }

  if (!job) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >{t('formVaga.voltar')}</Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <Badge variant={getStatusBadgeVariant(job.status)}>
                {t(statusOptions.find((o) => o.value === job.status)?.labelKey ?? '') || job.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {t(employmentTypeOptions.find((o) => o.value === job.employment_type)?.labelKey ?? '') || job.employment_type}
              </span>
              {job.salary_range && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary_range} {job.currency_code}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t('importacao.botao')}</span>
            </Button>
            <Button data-onboarding-id="onb-job-share" variant="ghost" size="sm" onClick={handleShare}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t('vagas.compartilhar')}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDuplicate}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
              <Files className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t('vagas.duplicar')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t('editarVaga.excluir')}</span>
            </Button>
            {activeTab === 'details' && !isEditing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsEditing(true);
                  applyTabToUrl('details', true);
                }}
                leftIcon={<Pencil className="h-4 w-4" />}
              >{t('editarVaga.editar')}</Button>
            )}
            {activeTab === 'details' && isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  leftIcon={<X className="h-4 w-4" />}
                >{t('formVaga.cancelar')}</Button>
                <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>{t('editarVaga.salvarAlteracoes')}</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            type="button"
            onClick={() => handleTabClick('candidates')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'candidates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Candidatos ({job._count?.candidates || 0})
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('details')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t('editarVaga.titulo')}</button>
        </nav>
      </div>

      {/* Tab Content */}
      <ImportResumesModal
        jobId={jobId}
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={(resultado) => {
          setImportToken((n) => n + 1);
          // O contador da aba vem do _count da vaga, que foi buscado uma vez. Somar os
          // criados aqui evita refazer fetchJob, que repovoaria o formulário inteiro e
          // descartaria edição em andamento.
          setJob((atual) =>
            atual
              ? {
                  ...atual,
                  _count: {
                    ...atual._count,
                    candidates: (atual._count?.candidates ?? 0) + resultado.created.length,
                  },
                }
              : atual
          );
        }}
      />

      {activeTab === 'candidates' ? (
        <CandidatesSection jobId={jobId} refreshToken={importToken} />
      ) : (
        <div className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('formVaga.secaoBasico')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={t('formVaga.tituloVaga')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50 border-gray-200' : ''}
              />
              <Input
                label={t('formVaga.localizacao')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50 border-gray-200' : ''}
              />
              <Select
                label={t('formVaga.tipoContratacao')}
                options={opcoes(employmentTypeOptions)}
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                required
                disabled={!isEditing}
              />
              <Select
                label={t('formVaga.status')}
                options={opcoes(statusOptions)}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                disabled={!isEditing}
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
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50 border-gray-200' : ''}
              />
              <Select
                label={t('formVaga.moeda')}
                options={opcoes(currencyOptions)}
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('formVaga.secaoDescricao')}</h2>
            {isEditing ? (
              <RichTextEditor
                value={description}
                onChange={setDescription}
                required
                aiPolish
                aiContext={title}
              />
            ) : (
              <div
                className="prose prose-sm max-w-none text-gray-700 border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[120px]"
                dangerouslySetInnerHTML={{
                  __html: description || `<p class="text-gray-500">${t('editarVaga.semDescricao')}</p>`,
                }}
              />
            )}
          </div>

          {/* Application Questions */}
          <div data-onboarding-id="onb-job-questions" className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('formVaga.secaoPerguntas')}</h2>
              <p className="text-sm text-gray-500">{t('formVaga.perguntasSub')}</p>
            </div>

            {applicationQuestions.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">{t('editarVaga.semPerguntas')}</p>
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
                          onChange={(e) => updateQuestion(index, { question: e.target.value })}
                          placeholder={t('formVaga.digitePergunta')}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50 border-gray-200' : ''}
                        />
                        <div className="flex items-center gap-4 flex-wrap">
                          <Select
                            id={`question-${index}-type`}
                            label={t('formVaga.tipoResposta')}
                            options={opcoes(questionTypeOptions)}
                            value={question.type}
                            onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
                            className="w-44"
                            disabled={!isEditing}
                          />
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                              className="rounded border-gray-300"
                              disabled={!isEditing}
                            />{t('formVaga.obrigatoria')}</label>
                          {ELIMINATORY_ALLOWED_TYPES.includes(question.type) && (
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={question.is_eliminatory || false}
                                disabled={!isEditing}
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
                                    className={`flex-1 ${!isEditing ? 'bg-gray-50 border-gray-200' : ''}`}
                                    disabled={!isEditing}
                                  />
                                  {isEditing && (
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
                                  )}
                                </div>
                              ))}
                            </div>
                            {isEditing && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => addOption(index)}
                                leftIcon={<Plus className="h-3 w-3" />}
                                className="mt-2 text-emerald-600 hover:text-emerald-700"
                              >{t('formVaga.adicionarOpcao')}</Button>
                            )}
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

                            {/* yes_no: resposta esperada */}
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
                                  disabled={!isEditing}
                                  className="text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                  <option value="Sim">{t('formVaga.sim')}</option>
                                  <option value="Não">{t('formVaga.nao')}</option>
                                </select>
                              </div>
                            )}

                            {/* select / multiselect: valores aceitos */}
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
                                        disabled={!isEditing}
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
                                      disabled={!isEditing}
                                      className="w-full text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                      disabled={!isEditing}
                                      className="w-full text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                      disabled={!isEditing}
                                      className="w-full text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      {isEditing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isEditing && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addQuestion}
                  leftIcon={<Plus className="h-4 w-4" />}
                >{t('formVaga.adicionarPergunta')}</Button>
              </div>
            )}
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
                  disabled={!isEditing}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
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
                  disabled={!isEditing}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
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
                placeholder={t('vaga.instrucoesExemplo')}
                rows={3}
                disabled={!isEditing}
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
              placeholder={t('formVaga.calendlyPlaceholder')}
              helperText={t('formVaga.calendlyAjuda')}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50 border-gray-200' : ''}
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
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>{t('editarVaga.salvarAlteracoes')}</Button>
            </div>
          )}
        </div>
      )}

      {/* Unsaved changes confirmation */}
      <Modal
        isOpen={showUnsavedModal}
        onClose={() => {
          setShowUnsavedModal(false);
          setPendingAction(null);
        }}
        title={t('vaga.naoSalvo')}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowUnsavedModal(false);
                setPendingAction(null);
              }}
            >{t('formVaga.cancelar')}</Button>
            <Button variant="ghost" className="text-gray-700 hover:bg-gray-100" onClick={handleUnsavedDiscard}>{t('editarVaga.sairSemSalvar')}</Button>
            <Button onClick={handleUnsavedSaveAndContinue} isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>{t('editarVaga.salvarContinuar')}</Button>
          </>
        }
      >
        <p className="text-gray-600">{t('vaga.confirmarSair')}</p>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('vaga.excluirVaga')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>{t('formVaga.cancelar')}</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>{t('editarVaga.excluir')}</Button>
          </>
        }
      >
        <p className="text-gray-600">{t('vaga.confirmarExcluir')}</p>
      </Modal>
    </div>
  );
}
