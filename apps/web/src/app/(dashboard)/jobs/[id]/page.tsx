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
import CandidatesTable from '@/components/CandidatesTable';
import type { Job, ApplicationQuestion, QuestionType } from '@hunter/core';

const employmentTypeOptions = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'on_hold', label: 'On Hold' },
];

const currencyOptions = [
  { value: '', label: 'Select currency' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'INR', label: 'INR - Indian Rupee' },
];

const questionTypeOptions = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Single Choice' },
  { value: 'multiselect', label: 'Multiple Choice' },
  { value: 'file', label: 'File Upload' },
];

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
    } catch (error) {
      toast.error('Failed to load job');
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
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicated = await apiClient.duplicateJob(jobId);
      toast.success('Job duplicated successfully!');
      router.push(`/jobs/${duplicated.id}`);
    } catch (error) {
      toast.error('Failed to duplicate job');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.deleteJob(jobId);
      toast.success('Job deleted successfully!');
      router.push('/jobs');
    } catch (error) {
      toast.error('Failed to delete job');
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
      });
      setJob(updated);
      toast.success('Job updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update job');
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
      },
    ]);
  };

  const updateQuestion = (index: number, updates: Partial<ApplicationQuestion>) => {
    const newQuestions = [...applicationQuestions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setApplicationQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setApplicationQuestions(applicationQuestions.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return <Loading text="Loading job..." />;
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
            Back
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <Badge variant={getStatusBadgeVariant(job.status)}>
                {job.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.employment_type.replace(/_/g, ' ')}
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
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {activeTab === 'details' && (
              <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
                Save Changes
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
            Candidates ({job._count?.candidates || 0})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Job Details
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'candidates' ? (
        <CandidatesTable jobId={jobId} />
      ) : (
        <div className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Job Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <Select
                label="Employment Type"
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compensation</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Salary Range"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. 100,000 - 150,000"
              />
              <Select
                label="Currency"
                options={currencyOptions}
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              required
            />
          </div>

          {/* Application Questions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Application Questions</h2>
                <p className="text-sm text-gray-500">Custom questions for candidates</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addQuestion}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Question
              </Button>
            </div>

            {applicationQuestions.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                No questions added yet.
              </p>
            ) : (
              <div className="space-y-4">
                {applicationQuestions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <Input
                          label={`Question ${index + 1}`}
                          value={question.question}
                          onChange={(e) => updateQuestion(index, { question: e.target.value })}
                        />
                        <div className="flex items-center gap-4">
                          <Select
                            options={questionTypeOptions}
                            value={question.type}
                            onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
                            className="w-40"
                          />
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            Required
                          </label>
                        </div>
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
          </div>

          {/* Additional Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h2>
            <div className="space-y-4">
              <Input
                label="Calendly Link"
                value={calendlyLink}
                onChange={(e) => setCalendlyLink(e.target.value)}
                placeholder="https://calendly.com/your-link"
              />
              <Textarea
                label="Interview Questions (Internal)"
                value={interviewQuestions}
                onChange={(e) => setInterviewQuestions(e.target.value)}
                placeholder="Questions to ask during the interview..."
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
        title="Delete Job"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete this job? This action cannot be undone.
          All candidates associated with this job will also be removed.
        </p>
      </Modal>
    </div>
  );
}
