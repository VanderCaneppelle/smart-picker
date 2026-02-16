'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ExternalLink, Mail, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button, Badge, Select, Loading, EmptyState, SortIcon } from '@/components/ui';
import type { Candidate, CandidateStatus } from '@hunter/core';

interface CandidatesTableProps {
  jobId: string;
}

const statusOptions = [
  { value: '', label: 'All (excl. rejected)' },
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'schedule_interview', label: 'Schedule Interview' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const statusUpdateOptions = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'schedule_interview', label: 'Schedule Interview' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
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
    case 'rejected':
      return 'danger';
    case 'hired':
      return 'success';
    default:
      return 'default';
  }
};

type SortField = 'fit_score' | 'resume_rating' | 'answer_quality_rating';
type SortDirection = 'asc' | 'desc';

export default function CandidatesTable({ jobId }: CandidatesTableProps) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('fit_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getJobCandidates(jobId);
      setCandidates(data.candidates);
    } catch (error) {
      toast.error('Failed to load candidates');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleStatusChange = async (candidateId: string, newStatus: CandidateStatus) => {
    try {
      await apiClient.updateCandidate(candidateId, { status: newStatus });
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
      );
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedCandidates = useMemo(() => {
    let result = [...candidates];

    // Filter by status
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    } else {
      // Exclude rejected by default
      result = result.filter((c) => c.status !== 'rejected');
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[sortField] ?? -1;
      const bValue = b[sortField] ?? -1;

      if (aValue === bValue) return 0;
      if (aValue === -1) return 1;
      if (bValue === -1) return -1;

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [candidates, statusFilter, sortField, sortDirection]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: candidates.filter((c) => c.status !== 'rejected').length,
      new: 0,
      reviewing: 0,
      schedule_interview: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    };

    candidates.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });

    return counts;
  }, [candidates]);

  if (isLoading) {
    return <Loading text="Loading candidates..." />;
  }

  if (candidates.length === 0) {
    return (
      <EmptyState
        title="No candidates yet"
        description="Share your job posting to start receiving applications"
      />
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <Select
          options={statusOptions.map((opt) => ({
            ...opt,
            label: `${opt.label} (${opt.value ? statusCounts[opt.value] || 0 : statusCounts.all})`,
          }))}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-64"
        />
        <span className="text-sm text-gray-500">
          {filteredAndSortedCandidates.length} candidates
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LinkedIn
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resume
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('resume_rating')}
                >
                  <div className="flex items-center gap-1">
                    Resume Rating
                    <SortIcon
                      direction={sortField === 'resume_rating' ? sortDirection : null}
                    />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('answer_quality_rating')}
                >
                  <div className="flex items-center gap-1">
                    Answer Quality
                    <SortIcon
                      direction={sortField === 'answer_quality_rating' ? sortDirection : null}
                    />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fit_score')}
                >
                  <div className="flex items-center gap-1">
                    Fit Score
                    <SortIcon
                      direction={sortField === 'fit_score' ? sortDirection : null}
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{candidate.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`mailto:${candidate.email}`}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {candidate.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {candidate.linkedin_url ? (
                      <a
                        href={candidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {candidate.resume_rating !== null && candidate.resume_rating !== undefined ? (
                      <span className="font-medium">{candidate.resume_rating}/5</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {candidate.answer_quality_rating !== null && candidate.answer_quality_rating !== undefined ? (
                      <span className="font-medium">{candidate.answer_quality_rating}/5</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {candidate.fit_score !== null && candidate.fit_score !== undefined ? (
                      <span
                        className={`font-medium ${
                          candidate.fit_score >= 80
                            ? 'text-green-600'
                            : candidate.fit_score >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {candidate.fit_score}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={candidate.status}
                      onChange={(e) =>
                        handleStatusChange(candidate.id, e.target.value as CandidateStatus)
                      }
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusUpdateOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/candidates/${candidate.id}`)}
                      leftIcon={<Eye className="h-4 w-4" />}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
