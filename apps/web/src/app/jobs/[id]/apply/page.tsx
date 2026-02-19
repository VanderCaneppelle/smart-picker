'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Upload,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button, Input, Textarea, Badge, Loading } from '@/components/ui';
import type { Job, ApplicationQuestion, ApplicationAnswer } from '@hunter/core';

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

const formatEmploymentType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function ApplyPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchJob = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getJob(jobId);
      setJob(data);

      // Initialize answers
      const initialAnswers: Record<string, string> = {};
      (data.application_questions as ApplicationQuestion[]).forEach((q) => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Por favor, envie um arquivo PDF ou Word');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await apiClient.uploadFile(file);
      setResumeUrl(result.url);
      setResumeFileName(result.originalName);
      toast.success('Currículo enviado com sucesso');
    } catch (error) {
      toast.error('Falha ao enviar currículo');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!email.trim()) newErrors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Por favor, insira um e-mail válido';
    }
    if (!resumeUrl) newErrors.resume = 'Currículo é obrigatório';

    if (linkedin && !linkedin.startsWith('http')) {
      newErrors.linkedin = 'Por favor, insira uma URL válida';
    }

    // Validate required questions
    const questions = (job?.application_questions || []) as ApplicationQuestion[];
    questions.forEach((q) => {
      if (q.required && !answers[q.id]?.trim()) {
        newErrors[`question_${q.id}`] = 'Esta pergunta é obrigatória';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor, corrija os erros antes de enviar');
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationAnswers: ApplicationAnswer[] = Object.entries(answers)
        .filter(([, answer]) => answer.trim())
        .map(([questionId, answer]) => ({
          question_id: questionId,
          answer: answer.trim(),
        }));

      await apiClient.createCandidate({
        job_id: jobId,
        name: name.trim(),
        email: email.trim(),
        phone_number: phone.trim() || null,
        linkedin_url: linkedin.trim() || null,
        resume_url: resumeUrl,
        application_answers: applicationAnswers,
      });

      setIsSubmitted(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao enviar candidatura');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Header component
  const Header = () => (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Rankea</span>
          </Link>
        </div>
      </div>
    </header>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loading text="Carregando vaga..." />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Vaga não encontrada</h1>
            <p className="text-gray-600">Esta vaga pode ter sido removida ou não está mais disponível.</p>
          </div>
        </div>
      </div>
    );
  }

  if (job.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center px-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Candidaturas encerradas</h1>
            <p className="text-gray-600">Esta vaga não está mais aceitando candidaturas.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center max-w-md px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Candidatura enviada!</h1>
            <p className="text-gray-600 mb-4">
              Obrigado por se candidatar para a vaga de <strong>{job.title}</strong>.
              Analisaremos sua candidatura e entraremos em contato em breve.
            </p>
            <p className="text-sm text-gray-500 bg-gray-100 rounded-lg px-4 py-3">
              Um e-mail de confirmação foi enviado para <strong>{email}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const questions = (job.application_questions || []) as ApplicationQuestion[];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Job Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    {formatEmploymentType(job.employment_type)}
                  </span>
                  {job.salary_range && (
                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                      <DollarSign className="h-4 w-4" />
                      {job.salary_range} {job.currency_code}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Sobre a vaga</h2>
              <div
                className="prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-emerald-600"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Candidate-se</h2>
                <p className="text-sm text-gray-500">Preencha os dados abaixo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  required
                  placeholder="Seu nome"
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  required
                  placeholder="seu@email.com"
                />
                <Input
                  label="Telefone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
                <Input
                  label="LinkedIn"
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  error={errors.linkedin}
                  placeholder="https://linkedin.com/in/seu-perfil"
                />
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currículo <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    errors.resume 
                      ? 'border-red-300 bg-red-50' 
                      : resumeUrl 
                        ? 'border-emerald-300 bg-emerald-50' 
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  {resumeUrl ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900 font-medium">{resumeFileName}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setResumeUrl('');
                            setResumeFileName('');
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remover arquivo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                      <span className="text-gray-700 font-medium">
                        {isUploading ? 'Enviando...' : 'Clique para enviar seu currículo'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">PDF ou Word, máximo 10MB</p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {errors.resume && (
                  <p className="mt-2 text-sm text-red-500">{errors.resume}</p>
                )}
              </div>

              {/* Application Questions */}
              {questions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900">Perguntas adicionais</h3>
                  {questions.map((question) => (
                    <div key={question.id}>
                      {/* Texto longo */}
                      {question.type === 'textarea' && (
                        <Textarea
                          label={question.question}
                          value={answers[question.id] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [question.id]: e.target.value })
                          }
                          error={errors[`question_${question.id}`]}
                          required={question.required}
                          rows={4}
                        />
                      )}

                      {/* Texto curto */}
                      {question.type === 'text' && (
                        <Input
                          label={question.question}
                          value={answers[question.id] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [question.id]: e.target.value })
                          }
                          error={errors[`question_${question.id}`]}
                          required={question.required}
                        />
                      )}

                      {/* Sim/Não ou Escolha única */}
                      {(question.type === 'yes_no' || question.type === 'select') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <div className="space-y-2">
                            {(question.options || (question.type === 'yes_no' ? ['Sim', 'Não'] : [])).map((option, optIndex) => (
                              <label
                                key={optIndex}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                  answers[question.id] === option
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${question.id}`}
                                  value={option}
                                  checked={answers[question.id] === option}
                                  onChange={(e) =>
                                    setAnswers({ ...answers, [question.id]: e.target.value })
                                  }
                                  className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-gray-900">{option}</span>
                              </label>
                            ))}
                          </div>
                          {errors[`question_${question.id}`] && (
                            <p className="mt-1 text-sm text-red-500">{errors[`question_${question.id}`]}</p>
                          )}
                        </div>
                      )}

                      {/* Múltipla escolha */}
                      {question.type === 'multiselect' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <p className="text-xs text-gray-500 mb-2">Selecione uma ou mais opções</p>
                          <div className="space-y-2">
                            {(question.options || []).map((option, optIndex) => {
                              const selectedOptions = answers[question.id] ? answers[question.id].split('|||') : [];
                              const isChecked = selectedOptions.includes(option);
                              return (
                                <label
                                  key={optIndex}
                                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                    isChecked
                                      ? 'border-emerald-500 bg-emerald-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    value={option}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      let newSelected: string[];
                                      if (e.target.checked) {
                                        newSelected = [...selectedOptions, option];
                                      } else {
                                        newSelected = selectedOptions.filter((o) => o !== option);
                                      }
                                      setAnswers({ ...answers, [question.id]: newSelected.join('|||') });
                                    }}
                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="text-gray-900">{option}</span>
                                </label>
                              );
                            })}
                          </div>
                          {errors[`question_${question.id}`] && (
                            <p className="mt-1 text-sm text-red-500">{errors[`question_${question.id}`]}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:ring-emerald-500"
                size="lg"
                isLoading={isSubmitting}
              >
                Enviar candidatura
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Ao enviar, você concorda com nossa política de privacidade e termos de uso.
              </p>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Powered by{' '}
              <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Rankea
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
