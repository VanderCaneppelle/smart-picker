import { z } from 'zod';

// ============================================
// Enum Schemas
// ============================================

export const JobStatusSchema = z.enum(['draft', 'active', 'closed', 'on_hold']);

export const EmploymentTypeSchema = z.enum([
  'full_time',
  'part_time',
  'contract',
  'internship',
  'freelance',
]);

export const CandidateStatusSchema = z.enum([
  'new',
  'reviewing',
  'schedule_interview',
  'shortlisted',
  'rejected',
  'hired',
]);

export const CurrencySchema = z.enum([
  'USD',
  'EUR',
  'SAR',
  'AED',
  'KWD',
  'QAR',
  'BHD',
  'OMR',
  'INR',
  'GBP',
  'BRL',
]);

export const QuestionTypeSchema = z.enum([
  'text',
  'textarea',
  'select',
  'multiselect',
  'file',
]);

// ============================================
// Application Question Schemas
// ============================================

export const ApplicationQuestionSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(1, 'Question is required'),
  required: z.boolean(),
  type: QuestionTypeSchema,
  options: z.array(z.string()).optional(),
});

export const ApplicationAnswerSchema = z.object({
  question_id: z.string().uuid(),
  answer: z.string(),
});

// ============================================
// Job Schemas
// ============================================

export const CreateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  location: z.string().min(1, 'Location is required').max(200),
  employment_type: EmploymentTypeSchema,
  description: z.string().min(1, 'Description is required'),
  salary_range: z.string().max(100).nullable().optional(),
  currency_code: CurrencySchema.nullable().optional(),
  calendly_link: z.string().url().nullable().optional().or(z.literal('')),
  application_questions: z.array(ApplicationQuestionSchema).optional().default([]),
  interview_questions: z.string().nullable().optional(),
  status: JobStatusSchema.optional().default('draft'),
  resume_weight: z.number().min(1).max(10).optional().default(5),
  answers_weight: z.number().min(1).max(10).optional().default(5),
  scoring_instructions: z.string().nullable().optional(),
});

export const UpdateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(200).optional(),
  employment_type: EmploymentTypeSchema.optional(),
  description: z.string().min(1).optional(),
  salary_range: z.string().max(100).nullable().optional(),
  currency_code: CurrencySchema.nullable().optional(),
  calendly_link: z.string().url().nullable().optional().or(z.literal('')),
  application_questions: z.array(ApplicationQuestionSchema).optional(),
  interview_questions: z.string().nullable().optional(),
  status: JobStatusSchema.optional(),
  resume_weight: z.number().min(1).max(10).optional(),
  answers_weight: z.number().min(1).max(10).optional(),
  scoring_instructions: z.string().nullable().optional(),
});

// ============================================
// Candidate Schemas
// ============================================

export const CreateCandidateSchema = z.object({
  job_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email'),
  phone_number: z.string().max(50).nullable().optional(),
  linkedin_url: z.string().url().nullable().optional().or(z.literal('')),
  resume_url: z.string().url('Resume URL is required'),
  application_answers: z.array(ApplicationAnswerSchema).optional().default([]),
});

export const UpdateCandidateSchema = z.object({
  status: CandidateStatusSchema.optional(),
  fit_score: z.number().min(0).max(100).nullable().optional(),
  resume_rating: z.number().min(0).max(5).nullable().optional(),
  answer_quality_rating: z.number().min(0).max(5).nullable().optional(),
  resume_summary: z.string().nullable().optional(),
  experience_level: z.string().nullable().optional(),
  needs_scoring: z.boolean().optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignUpSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    password_confirmation: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required').max(200),
    company: z.string().max(200).optional().default(''),
    phone_number: z.string().max(50).optional().default(''),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

// ============================================
// Query Schemas
// ============================================

export const JobFiltersSchema = z.object({
  status: JobStatusSchema.optional(),
  employment_type: EmploymentTypeSchema.optional(),
  search: z.string().optional(),
});

export const CandidateFiltersSchema = z.object({
  job_id: z.string().uuid().optional(),
  status: CandidateStatusSchema.optional(),
  min_fit_score: z.coerce.number().min(0).max(100).optional(),
  max_fit_score: z.coerce.number().min(0).max(100).optional(),
  search: z.string().optional(),
});

// ============================================
// Type exports from schemas (with Schema suffix to avoid conflicts)
// ============================================

export type CreateJobSchemaType = z.infer<typeof CreateJobSchema>;
export type UpdateJobSchemaType = z.infer<typeof UpdateJobSchema>;
export type CreateCandidateSchemaType = z.infer<typeof CreateCandidateSchema>;
export type UpdateCandidateSchemaType = z.infer<typeof UpdateCandidateSchema>;
export type LoginSchemaType = z.infer<typeof LoginSchema>;
export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
export type JobFiltersSchemaType = z.infer<typeof JobFiltersSchema>;
export type CandidateFiltersSchemaType = z.infer<typeof CandidateFiltersSchema>;
