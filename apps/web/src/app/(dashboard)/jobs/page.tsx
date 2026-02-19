'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Share2, Copy, Eye, MapPin, Briefcase, Users, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button, Badge, SearchFilter, Select, Loading, EmptyState } from '@/components/ui';
import type { Job, JobStatus, EmploymentType } from '@hunter/core';

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Ativa' },
  { value: 'closed', label: 'Fechada' },
  { value: 'on_hold', label: 'Pausada' },
];

const employmentTypeOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'full_time', label: 'Tempo integral' },
  { value: 'part_time', label: 'Meio período' },
  { value: 'contract', label: 'Contrato' },
  { value: 'internship', label: 'Estágio' },
  { value: 'freelance', label: 'Freelance' },
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

const formatEmploymentType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getJobs({
        status: statusFilter as JobStatus | undefined,
        employment_type: typeFilter as EmploymentType | undefined,
        search: search || undefined,
      });
      setJobs(data.jobs);
    } catch (error) {
      toast.error('Failed to load jobs');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleShare = useCallback(async (job: Job) => {
    const url = `${window.location.origin}/jobs/${job.id}/apply`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    } catch {
      toast.error('Falha ao copiar link');
    }
  }, []);

  const handleDuplicate = useCallback(async (job: Job) => {
    try {
      const duplicated = await apiClient.duplicateJob(job.id);
      toast.success('Vaga duplicada com sucesso!');
      router.push(`/jobs/${duplicated.id}`);
    } catch (error) {
      toast.error('Falha ao duplicar vaga');
      console.error(error);
    }
  }, [router]);

  const filteredJobs = useMemo(() => jobs, [jobs]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vagas</h1>
          <p className="text-gray-600 mt-1">Gerencie suas vagas de emprego</p>
        </div>
        <Button
          onClick={() => router.push('/jobs/new')}
          leftIcon={<Plus className="h-4 w-4" />}
          className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
        >
          Criar Vaga
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Buscar vagas..."
          className="flex-1"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-40"
        />
        <Select
          options={employmentTypeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <Loading text="Carregando vagas..." />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          title="Nenhuma vaga encontrada"
          description={
            search || statusFilter || typeFilter
              ? 'Tente ajustar seus filtros'
              : 'Crie sua primeira vaga para começar'
          }
          action={
            !search && !statusFilter && !typeFilter
              ? {
                  label: 'Criar Vaga',
                  onClick: () => router.push('/jobs/new'),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{job.location}</span>
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(job.status)}>
                  {job.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Card Info */}
                <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  <span>{formatEmploymentType(job.employment_type)}</span>
                </div>
                {job.salary_range && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {job.salary_range}
                      {job.currency_code && ` ${job.currency_code}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{job._count?.candidates || 0} candidatos</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(job)}
                  title="Compartilhar"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(job)}
                  title="Duplicar"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  leftIcon={<Eye className="h-4 w-4" />}
                  className="ml-auto"
                >
                  Ver
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
