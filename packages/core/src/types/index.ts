// ============================================
// Enums
// ============================================

export const JobStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  ON_HOLD: 'on_hold',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const EmploymentType = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance',
} as const;

export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

export const CandidateStatus = {
  NEW: 'new',
  REVIEWING: 'reviewing',
  SCHEDULE_INTERVIEW: 'schedule_interview',
  SHORTLISTED: 'shortlisted',
  REJECTED: 'rejected',
  HIRED: 'hired',
} as const;

export type CandidateStatus = (typeof CandidateStatus)[keyof typeof CandidateStatus];

export const Currency = {
  USD: 'USD',
  EUR: 'EUR',
  SAR: 'SAR',
  AED: 'AED',
  KWD: 'KWD',
  QAR: 'QAR',
  BHD: 'BHD',
  OMR: 'OMR',
  INR: 'INR',
  GBP: 'GBP',
  BRL: 'BRL',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const QuestionType = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  FILE: 'file',
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

// ============================================
// Application Questions
// ============================================

export interface ApplicationQuestion {
  id: string;
  question: string;
  required: boolean;
  type: QuestionType;
  options?: string[];
}

export interface ApplicationAnswer {
  question_id: string;
  answer: string;
}

// ============================================
// Job
// ============================================

export interface Job {
  id: string;
  title: string;
  location: string;
  employment_type: EmploymentType;
  description: string;
  salary_range?: string | null;
  currency_code?: Currency | null;
  calendly_link?: string | null;
  application_questions: ApplicationQuestion[];
  interview_questions?: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  _count?: {
    candidates: number;
  };
}

export interface CreateJobInput {
  title: string;
  location: string;
  employment_type: EmploymentType;
  description: string;
  salary_range?: string | null;
  currency_code?: Currency | null;
  calendly_link?: string | null;
  application_questions?: ApplicationQuestion[];
  interview_questions?: string | null;
  status?: JobStatus;
}

export interface UpdateJobInput {
  title?: string;
  location?: string;
  employment_type?: EmploymentType;
  description?: string;
  salary_range?: string | null;
  currency_code?: Currency | null;
  calendly_link?: string | null;
  application_questions?: ApplicationQuestion[];
  interview_questions?: string | null;
  status?: JobStatus;
}

// ============================================
// Candidate
// ============================================

export interface Candidate {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  linkedin_url?: string | null;
  resume_url: string;
  application_answers: ApplicationAnswer[];
  status: CandidateStatus;
  fit_score?: number | null;
  resume_rating?: number | null;
  answer_quality_rating?: number | null;
  resume_summary?: string | null;
  experience_level?: string | null;
  needs_scoring: boolean;
  schedule_interview_email_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  job?: Job;
}

export interface CreateCandidateInput {
  job_id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  linkedin_url?: string | null;
  resume_url: string;
  application_answers?: ApplicationAnswer[];
}

export interface UpdateCandidateInput {
  status?: CandidateStatus;
  fit_score?: number | null;
  resume_rating?: number | null;
  answer_quality_rating?: number | null;
  resume_summary?: string | null;
  experience_level?: string | null;
  needs_scoring?: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface JobsListResponse {
  jobs: Job[];
  total: number;
}

export interface CandidatesListResponse {
  candidates: Candidate[];
  total: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================
// Filter Types
// ============================================

export interface JobFilters {
  status?: JobStatus;
  employment_type?: EmploymentType;
  search?: string;
}

export interface CandidateFilters {
  job_id?: string;
  status?: CandidateStatus;
  min_fit_score?: number;
  max_fit_score?: number;
  search?: string;
}
