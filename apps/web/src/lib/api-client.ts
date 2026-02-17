import type {
  Job,
  Candidate,
  CreateJobInput,
  UpdateJobInput,
  CreateCandidateInput,
  UpdateCandidateInput,
  JobsListResponse,
  CandidatesListResponse,
  JobFilters,
  CandidateFilters,
} from '@hunter/core';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Jobs
  async getJobs(filters?: JobFilters): Promise<JobsListResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.employment_type) params.set('employment_type', filters.employment_type);
    if (filters?.search) params.set('search', filters.search);

    const query = params.toString();
    return this.request<JobsListResponse>(`/jobs${query ? `?${query}` : ''}`);
  }

  async getJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async createJob(data: CreateJobInput): Promise<Job> {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJob(id: string, data: UpdateJobInput): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteJob(id: string): Promise<void> {
    await this.request(`/jobs/${id}`, { method: 'DELETE' });
  }

  async duplicateJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/duplicate`, { method: 'POST' });
  }

  async getJobCandidates(jobId: string): Promise<CandidatesListResponse> {
    return this.request<CandidatesListResponse>(`/jobs/${jobId}/candidates`);
  }

  // Candidates
  async getCandidates(filters?: CandidateFilters): Promise<CandidatesListResponse> {
    const params = new URLSearchParams();
    if (filters?.job_id) params.set('job_id', filters.job_id);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.min_fit_score !== undefined) params.set('min_fit_score', String(filters.min_fit_score));
    if (filters?.max_fit_score !== undefined) params.set('max_fit_score', String(filters.max_fit_score));
    if (filters?.search) params.set('search', filters.search);

    const query = params.toString();
    return this.request<CandidatesListResponse>(`/candidates${query ? `?${query}` : ''}`);
  }

  async getCandidate(id: string): Promise<Candidate> {
    return this.request<Candidate>(`/candidates/${id}`);
  }

  async createCandidate(data: CreateCandidateInput): Promise<Candidate> {
    return this.request<Candidate>('/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCandidate(id: string, data: UpdateCandidateInput): Promise<Candidate> {
    return this.request<Candidate>(`/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCandidate(id: string): Promise<void> {
    await this.request(`/candidates/${id}`, { method: 'DELETE' });
  }

  // Auth
  async login(email: string, password: string): Promise<{
    user: { id: string; email: string };
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(
    email: string,
    password: string,
    password_confirmation: string
  ): Promise<{
    user: { id: string; email: string };
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    requires_confirmation?: boolean;
    message?: string;
  }> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        password_confirmation,
      }),
    });
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async getCurrentUser(): Promise<{ user: { id: string; email: string } }> {
    return this.request('/auth/me');
  }

  // Upload
  async uploadFile(file: File, bucket = 'resumes'): Promise<{
    url: string;
    fileName: string;
    originalName: string;
    size: number;
    type: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Upload failed',
      }));
      throw new Error(error.message);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
