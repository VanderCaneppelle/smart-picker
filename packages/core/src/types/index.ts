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
  INTERVIEW: 'interview',
  IN_VALIDATION: 'in_validation',
  REJECTED: 'rejected',
  HIRED: 'hired',
} as const;

export type CandidateStatus = (typeof CandidateStatus)[keyof typeof CandidateStatus];

/**
 * Porta pela qual o candidato entrou. Não é detalhe de auditoria: as notas de quem
 * se candidatou e de quem foi importado vêm de bases de evidência diferentes (um tem
 * respostas do formulário, o outro só o currículo), e o recrutador precisa enxergar
 * isso para ler o ranking sem se enganar.
 */
export const CandidateSource = {
  /** Candidatou-se pelo link público. Único que dá consentimento e recebe e-mail. */
  FORM: 'form',
  /** O recrutador subiu o currículo pela tela da vaga. */
  IMPORT: 'import',
  /** Chegou por currículo encaminhado para o endereço da vaga. */
  EMAIL: 'email',
} as const;

export type CandidateSource = (typeof CandidateSource)[keyof typeof CandidateSource];

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
  NUMBER: 'number',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  YES_NO: 'yes_no',
  FILE: 'file',
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

// ============================================
// Application Questions
// ============================================

export interface EliminatoryCriteria {
  expected_answer?: string;
  accepted_values?: string[];
  range_min?: number;
  range_max?: number;
  tolerance_percent?: number;
}

export interface ApplicationQuestion {
  id: string;
  question: string;
  required: boolean;
  type: QuestionType;
  options?: string[];
  is_eliminatory?: boolean;
  eliminatory_criteria?: EliminatoryCriteria;
}

export interface ApplicationAnswer {
  question_id: string;
  answer: string;
}

// ============================================
// Job
// ============================================

export interface Job {
  /** Idioma da vaga: pt | en. Define a língua da página de candidatura. */
  locale?: string;
  id: string;
  title: string;
  location: string;
  employment_type: EmploymentType;
  description: string;
  salary_range?: string | null;
  currency_code?: Currency | null;
  show_salary_to_candidates?: boolean;
  calendly_link?: string | null;
  application_questions: ApplicationQuestion[];
  interview_questions?: string | null;
  status: JobStatus;
  resume_weight: number;
  answers_weight: number;
  scoring_instructions?: string | null;
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
  show_salary_to_candidates?: boolean;
  calendly_link?: string | null;
  application_questions?: ApplicationQuestion[];
  interview_questions?: string | null;
  status?: JobStatus;
  resume_weight?: number;
  answers_weight?: number;
  scoring_instructions?: string | null;
}

export interface UpdateJobInput {
  title?: string;
  location?: string;
  employment_type?: EmploymentType;
  description?: string;
  salary_range?: string | null;
  currency_code?: Currency | null;
  show_salary_to_candidates?: boolean;
  calendly_link?: string | null;
  application_questions?: ApplicationQuestion[];
  interview_questions?: string | null;
  status?: JobStatus;
  resume_weight?: number;
  answers_weight?: number;
  scoring_instructions?: string | null;
}

// ============================================
// Candidate
// ============================================

export type DisqualificationSeverity = 'eliminated' | 'warning';

export interface DisqualificationFlag {
  question_id: string;
  question_text: string;
  candidate_answer: string;
  severity: DisqualificationSeverity;
  reason: string;
}

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
  disqualification_flags?: DisqualificationFlag[] | null;
  flagged_reason?: string | null;
  schedule_interview_email_sent_at?: string | null;
  recruiter_notes?: string | null;
  source: CandidateSource;
  resume_sha256?: string | null;
  needs_review: boolean;
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
  /** LGPD: consentimento explícito (obrigatório). */
  consent_agreed: true;
  /** LGPD: versão dos termos/privacidade aceitos (auditoria). */
  consent_version?: string;
}

export interface UpdateCandidateInput {
  status?: CandidateStatus;
  /** Editáveis por causa do currículo importado, que nasce com dado provisório. */
  name?: string;
  email?: string;
  needs_review?: boolean;
  fit_score?: number | null;
  resume_rating?: number | null;
  answer_quality_rating?: number | null;
  resume_summary?: string | null;
  experience_level?: string | null;
  needs_scoring?: boolean;
  flagged_reason?: string | null;
  recruiter_notes?: string | null;
  /**
   * Instrução da chamada, não campo do candidato: move o candidato sem disparar o
   * e-mail que aquele status normalmente enviaria. Existe porque quem já falou com a
   * pessoa por fora quer organizar o quadro sem mandar mensagem de novo.
   */
  skip_email?: boolean;
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
  source?: CandidateSource;
}

// ============================================
// Ingestão de currículos (importação em lote)
// ============================================

/**
 * Contrato do núcleo de ingestão. Mora aqui, e não dentro da rota, porque a tela é só
 * a primeira porta de entrada: a segunda é o currículo encaminhado por e-mail para o
 * endereço da vaga, e uma terceira pode ser uma API pública. Cada porta é um adaptador
 * fino; a regra vive num lugar só.
 */
export type IngestSource = Extract<CandidateSource, 'import' | 'email'>;

/**
 * Motivo da recusa de um arquivo, legível por máquina. Nunca texto de tela: a tela
 * traduz para o idioma do recrutador e o adaptador de e-mail vai traduzir para o corpo
 * de uma resposta automática.
 */
export const RejectCode = {
  DUPLICATE_FILE: 'duplicate_file',
  UNSUPPORTED_TYPE: 'unsupported_type',
  TOO_LARGE: 'too_large',
  BATCH_LIMIT: 'batch_limit',
  MONTHLY_LIMIT: 'monthly_limit',
  SUBSCRIPTION_REQUIRED: 'subscription_required',
} as const;

export type RejectCode = (typeof RejectCode)[keyof typeof RejectCode];

/** Arquivo que JÁ está no bucket `resumes`. O núcleo nunca recebe bytes nem File. */
export interface IngestFile {
  storage_path: string;
  /** Nome original, usado como nome provisório do candidato até a IA extrair o real. */
  original_name: string;
  sha256: string;
  mime_type: string;
  size_bytes: number;
}

export interface IngestRejection {
  sha256: string;
  original_name: string;
  code: RejectCode;
}

export interface IngestResult {
  created: Array<{ candidate_id: string; sha256: string }>;
  rejected: IngestRejection[];
  queued: number;
}
