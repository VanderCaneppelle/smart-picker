'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Share2, Copy, Eye, MapPin, Briefcase, Users, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button, Badge, SearchFilter, Loading, EmptyState } from '@/components/ui';
import type { Job, JobStatus, EmploymentType } from '@hunter/core';

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
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const statusFilter = searchParams.get('status') ?? '';
  const typeFilter = searchParams.get('employment_type') ?? '';

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vagas</h1>
        <p className="text-gray-600 mt-1">Gerencie suas vagas de emprego</p>
      </div>

      {/* Busca (filtros de status e tipo ficam no menu Vagas na sidebar) */}
      <div className="mb-6">
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Buscar vagas..."
          className="max-w-md"
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
