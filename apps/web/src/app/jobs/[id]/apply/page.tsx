'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Upload,
  CheckCircle,
  AlertCircle,
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
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await apiClient.uploadFile(file);
      setResumeUrl(result.url);
      setResumeFileName(result.originalName);
      toast.success('Resume uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload resume');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!resumeUrl) newErrors.resume = 'Resume is required';

    if (linkedin && !linkedin.startsWith('http')) {
      newErrors.linkedin = 'Please enter a valid URL';
    }

    // Validate required questions
    const questions = (job?.application_questions || []) as ApplicationQuestion[];
    questions.forEach((q) => {
      if (q.required && !answers[q.id]?.trim()) {
        newErrors[`question_${q.id}`] = 'This question is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
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
      toast.error(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading job details..." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600">This job posting may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  if (job.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Applications Closed</h1>
          <p className="text-gray-600">This job is no longer accepting applications.</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for applying for the <strong>{job.title}</strong> position.
            We&apos;ll review your application and get back to you soon.
          </p>
          <p className="text-sm text-gray-500">
            A confirmation email has been sent to {email}
          </p>
        </div>
      </div>
    );
  }

  const questions = (job.application_questions || []) as ApplicationQuestion[];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Job Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {formatEmploymentType(job.employment_type)}
                </span>
                {job.salary_range && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {job.salary_range} {job.currency_code}
                  </span>
                )}
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(job.status)}>
              {job.status}
            </Badge>
          </div>

          {/* Job Description */}
          <div
            className="prose prose-sm max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Apply for this position</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
                placeholder="John Doe"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
                placeholder="john@example.com"
              />
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
              <Input
                label="LinkedIn URL"
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                error={errors.linkedin}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resume <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  errors.resume ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {resumeUrl ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-900">{resumeFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setResumeUrl('');
                        setResumeFileName('');
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-600">
                      {isUploading ? 'Uploading...' : 'Click to upload your resume'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">PDF or Word, max 10MB</p>
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
                <p className="mt-1 text-sm text-red-500">{errors.resume}</p>
              )}
            </div>

            {/* Application Questions */}
            {questions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Additional Questions</h3>
                {questions.map((question) => (
                  <div key={question.id}>
                    {question.type === 'textarea' ? (
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
                    ) : (
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
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Submit Application
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By submitting this application, you agree to our privacy policy and terms of service.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
