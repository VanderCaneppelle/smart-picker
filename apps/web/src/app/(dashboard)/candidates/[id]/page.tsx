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
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button, Badge, Select, Loading } from '@/components/ui';
import type { Candidate, CandidateStatus, ApplicationQuestion, ApplicationAnswer } from '@hunter/core';

const statusOptions = [
  { value: 'new', label: 'Novo' },
  { value: 'reviewing', label: 'Em análise' },
  { value: 'schedule_interview', label: 'Agendar entrevista' },
  { value: 'shortlisted', label: 'Pré-selecionado' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'hired', label: 'Contratado' },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'new':
      return 'warning';
    case 'reviewing':
      return 'info';
    case 'schedule_interview':
      return 'purple';
    case 'shortlisted':
      return 'success';
    case 'flagged':
      return 'danger';
    case 'rejected':
      return 'danger';
    case 'hired':
      return 'success';
    default:
      return 'default';
  }
};

export default function CandidateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCandidate = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getCandidate(candidateId);
      setCandidate(data);
    } catch (error) {
      toast.error('Failed to load candidate');
      console.error(error);
      router.push('/jobs');
    } finally {
      setIsLoading(false);
    }
  }, [candidateId, router]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (!candidate) return;

    try {
      const updated = await apiClient.updateCandidate(candidateId, { status: newStatus });
      setCandidate(updated);
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  if (isLoading) {
    return <Loading text="Loading candidate..." />;
  }

  if (!candidate) {
    return null;
  }

  const job = candidate.job;
  const applicationQuestions = (job?.application_questions || []) as ApplicationQuestion[];
  const applicationAnswers = (candidate.application_answers || []) as ApplicationAnswer[];

  // Map answers by question_id for easy lookup
  const answersMap = new Map(applicationAnswers.map((a) => [a.question_id, a.answer]));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                {job && (
                  <p className="text-gray-600 mt-1">
                    Applied for: <span className="font-medium">{job.title}</span>
                  </p>
                )}
              </div>
              <Badge variant={getStatusBadgeVariant(candidate.status)} className="text-sm">
                {candidate.status.replace(/_/g, ' ')}
              </Badge>
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
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </a>
              )}

              <a
                href={candidate.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <FileText className="h-4 w-4" />
                View Resume
              </a>
            </div>

            {/* Status Update */}
            <div className="mt-6 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Status
              </label>
              <Select
                options={statusOptions}
                value={candidate.status}
                onChange={(e) => handleStatusChange(e.target.value as CandidateStatus)}
                className="w-48"
              />
            </div>

            {/* Flagged reason */}
            {candidate.status === 'flagged' && candidate.flagged_reason && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2 text-orange-800 text-sm">
                <Flag className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Candidato flagueado automaticamente</p>
                  <p className="text-orange-700 mt-1">{candidate.flagged_reason}</p>
                </div>
              </div>
            )}

            {/* Schedule interview email sent */}
            {candidate.schedule_interview_email_sent_at && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-sm">
                <span>E-mail de agendamento (Convite Calendly) enviado em{' '}
                  {new Date(candidate.schedule_interview_email_sent_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Application Answers */}
          {applicationQuestions.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Application Answers
              </h2>
              <div className="space-y-4">
                {applicationQuestions.map((question) => (
                  <div key={question.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <p className="font-medium text-gray-900 mb-1">
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <p className="text-gray-600">
                      {answersMap.get(question.id) || (
                        <span className="text-gray-400 italic">No answer provided</span>
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
                <FileText className="h-5 w-5" />
                Resume Summary
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">{candidate.resume_summary}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Scores */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Evaluation</h2>

            <div className="space-y-4">
              {/* Fit Score */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Fit Score
                  </span>
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
                      : 'Pending'}
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
                    <Star className="h-4 w-4" />
                    Resume Rating
                  </span>
                  <span className="font-bold text-gray-900">
                    {candidate.resume_rating !== null && candidate.resume_rating !== undefined
                      ? `${candidate.resume_rating}/5`
                      : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Answer Quality */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Answer Quality
                  </span>
                  <span className="font-bold text-gray-900">
                    {candidate.answer_quality_rating !== null && candidate.answer_quality_rating !== undefined
                      ? `${candidate.answer_quality_rating}/5`
                      : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Experience Level */}
              {candidate.experience_level && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      Experience Level
                    </span>
                    <span className="font-medium text-gray-900">{candidate.experience_level}</span>
                  </div>
                </div>
              )}
            </div>

            {candidate.needs_scoring && (
              <p className="text-sm text-gray-500 mt-4 pt-4 border-t">
                AI evaluation is pending. Scores will be available shortly.
              </p>
            )}
          </div>

          {/* Job Info */}
          {job && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
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
                >
                  View Job
                </Button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Applied</span>
                <span className="text-gray-900">
                  {new Date(candidate.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="text-gray-900">
                  {new Date(candidate.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
