'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Share2,
  Copy,
  Trash2,
  Save,
  MapPin,
  Briefcase,
  DollarSign,
  Plus,
  Brain,
  ShieldAlert,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '@/lib/api-client';
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
import type { Job, ApplicationQuestion, QuestionType } from '@hunter/core';

type EliminatoryCriteria = NonNullable<ApplicationQuestion['eliminatory_criteria']>;

const employmentTypeOptions = [
  { value: 'full_time', label: 'Tempo integral' },
  { value: 'part_time', label: 'Meio período' },
  { value: 'contract', label: 'Contrato' },
  { value: 'internship', label: 'Estágio' },
  { value: 'freelance', label: 'Freelance' },
];

const statusOptions = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Ativa' },
  { value: 'closed', label: 'Fechada' },
  { value: 'on_hold', label: 'Pausada' },
];

const currencyOptions = [
  { value: '', label: 'Selecione a moeda' },
  { value: 'AED', label: 'AED - Dirham dos EAU' },
  { value: 'BRL', label: 'BRL - Real Brasileiro' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - Libra Esterlina' },
  { value: 'INR', label: 'INR - Rúpia Indiana' },
  { value: 'SAR', label: 'SAR - Riyal Saudita' },
  { value: 'USD', label: 'USD - Dólar Americano' },
];

const questionTypeOptions = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'yes_no', label: 'Sim / Não' },
  { value: 'select', label: 'Escolha única' },
  { value: 'multiselect', label: 'Múltipla escolha' },
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
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'candidates' | 'details'>('candidates');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [description, setDescription] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
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
      setCurrencyCode(data.currency_code || '');
      setCalendlyLink(data.calendly_link || '');
      setInterviewQuestions(data.interview_questions || '');
      setStatus(data.status);
      setApplicationQuestions(data.application_questions || []);
      setResumeWeight(data.resume_weight ?? 5);
      setAnswersWeight(data.answers_weight ?? 5);
      setScoringInstructions(data.scoring_instructions || '');
    } catch (error) {
      toast.error('Falha ao carregar vaga');
      console.error(error);
      router.push('/jobs');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleShare = async () => {
    const url = `${window.location.origin}/jobs/${jobId}/apply`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    } catch {
      toast.error('Falha ao copiar link');
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicated = await apiClient.duplicateJob(jobId);
      toast.success('Vaga duplicada com sucesso!');
      router.push(`/jobs/${duplicated.id}`);
    } catch (error) {
      toast.error('Falha ao duplicar vaga');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.deleteJob(jobId);
      toast.success('Vaga excluída com sucesso!');
      router.push('/jobs');
    } catch (error) {
      toast.error('Falha ao excluir vaga');
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
        calendly_link: calendlyLink.trim() || null,
        interview_questions: interviewQuestions.trim() || null,
        status: status as 'draft' | 'active' | 'closed' | 'on_hold',
        application_questions: applicationQuestions.filter((q) => q.question.trim()),
        resume_weight: resumeWeight,
        answers_weight: answersWeight,
        scoring_instructions: scoringInstructions.trim() || null,
      });
      setJob(updated);
      toast.success('Vaga atualizada com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar vaga');
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
      newQuestions[index].options = ['Sim', 'Não'];
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
    return <Loading text="Carregando vaga..." />;
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
            onClick={() => router.push('/jobs')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Voltar
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <Badge variant={getStatusBadgeVariant(job.status)}>
                {statusOptions.find((o) => o.value === job.status)?.label || job.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {employmentTypeOptions.find((o) => o.value === job.employment_type)?.label || job.employment_type}
              </span>
              {job.salary_range && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary_range} {job.currency_code}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare} title="Compartilhar link da vaga">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDuplicate} title="Duplicar vaga">
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Excluir vaga"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {activeTab === 'details' && (
              <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
                Salvar alterações
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'candidates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Candidatos ({job._count?.candidates || 0})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Detalhes da Vaga
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'candidates' ? (
        <CandidatesSection jobId={jobId} />
      ) : (
        <div className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Título da Vaga"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                label="Localização"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <Select
                label="Tipo de Contratação"
                options={employmentTypeOptions}
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                required
              />
              <Select
                label="Status"
                options={statusOptions}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Remuneração</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Faixa Salarial"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="Ex: 5.000 - 8.000"
              />
              <Select
                label="Moeda"
                options={currencyOptions}
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Descrição da Vaga</h2>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              required
            />
          </div>

          {/* Application Questions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Perguntas da Aplicação</h2>
              <p className="text-sm text-gray-500">Perguntas personalizadas para os candidatos</p>
            </div>

            {applicationQuestions.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Nenhuma pergunta adicionada.
              </p>
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
                          placeholder="Digite sua pergunta"
                        />
                        <div className="flex items-center gap-4 flex-wrap">
                          <Select
                            options={questionTypeOptions}
                            value={question.type}
                            onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
                            className="w-44"
                          />
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            Obrigatória
                          </label>
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
                                      criteria.expected_answer = 'Sim';
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
                                <ShieldAlert className="h-3.5 w-3.5" />
                                Eliminatória
                              </span>
                            </label>
                          )}
                        </div>

                        {/* Opções para select e multiselect */}
                        {(question.type === 'select' || question.type === 'multiselect') && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Opções de resposta:</p>
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
                            >
                              Adicionar opção
                            </Button>
                          </div>
                        )}

                        {/* Mostrar opções fixas para yes_no */}
                        {question.type === 'yes_no' && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200">
                            <p className="text-sm text-gray-500">
                              Opções: <span className="font-medium">Sim</span> / <span className="font-medium">Não</span>
                            </p>
                          </div>
                        )}

                        {/* Configuração Eliminatória */}
                        {question.is_eliminatory && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Critérios eliminatórios
                            </p>

                            {/* yes_no: resposta esperada */}
                            {question.type === 'yes_no' && (
                              <div>
                                <label className="block text-sm text-gray-700 mb-1">
                                  Resposta esperada (resposta diferente elimina o candidato):
                                </label>
                                <select
                                  value={question.eliminatory_criteria?.expected_answer || 'Sim'}
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
                                  <option value="Sim">Sim</option>
                                  <option value="Não">Não</option>
                                </select>
                              </div>
                            )}

                            {/* select / multiselect: valores aceitos */}
                            {(question.type === 'select' || question.type === 'multiselect') && (
                              <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                  Respostas aceitas (outras opções eliminam):
                                </label>
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
                                <p className="text-xs text-gray-600">
                                  Se a resposta numérica estiver fora do intervalo, o candidato será flagueado ou eliminado.
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Mínimo</label>
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
                                      placeholder="Ex: 3000"
                                      className="w-full text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Máximo</label>
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
                                      placeholder="Ex: 8000"
                                      className="w-full text-sm border border-amber-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tolerância %</label>
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
              >
                Adicionar pergunta
              </Button>
            </div>
          </div>

          {/* AI Scoring Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Configuração da Avaliação por IA</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Defina como a IA deve ponderar cada aspecto na avaliação dos candidatos.
            </p>
            
            <div className="space-y-6">
              {/* Resume Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Peso do Currículo
                  </label>
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
                <p className="text-xs text-gray-500 mt-1">
                  Experiência, formação e habilidades do currículo
                </p>
              </div>

              {/* Answers Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Peso das Respostas
                  </label>
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
                <p className="text-xs text-gray-500 mt-1">
                  Qualidade das respostas às perguntas da aplicação
                </p>
              </div>

              {/* Weight Distribution Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Distribuição dos pesos:</p>
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
                label="Instruções adicionais para a IA (opcional)"
                value={scoringInstructions}
                onChange={(e) => setScoringInstructions(e.target.value)}
                placeholder="Ex: Priorize candidatos com experiência em React. Valorize certificações AWS. Candidatos com inglês fluente devem ter pontuação maior..."
                rows={3}
              />
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações Adicionais</h2>
            <div className="space-y-4">
              <Input
                label="Link do Calendly"
                value={calendlyLink}
                onChange={(e) => setCalendlyLink(e.target.value)}
                placeholder="https://calendly.com/your-link"
              />
              <Textarea
                label="Perguntas da Entrevista (Interno)"
                value={interviewQuestions}
                onChange={(e) => setInterviewQuestions(e.target.value)}
                placeholder="Perguntas para fazer durante a entrevista..."
                rows={4}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Vaga"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita.
          Todos os candidatos associados a esta vaga também serão removidos.
        </p>
      </Modal>
    </div>
  );
}
