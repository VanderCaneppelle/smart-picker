'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Briefcase, Search } from 'lucide-react';

export interface JobItem {
  id: string;
  title: string;
  location: string;
  employment_type: string;
  salary_range: string | null;
  currency_code: string | null;
}

const EMPLOYMENT_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'full_time', label: 'Tempo integral' },
  { value: 'part_time', label: 'Meio período' },
  { value: 'contract', label: 'Contrato' },
  { value: 'internship', label: 'Estágio' },
  { value: 'freelance', label: 'Freelance' },
];

function formatEmploymentType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

interface JobListWithFiltersProps {
  jobs: JobItem[];
  brandColor: string;
}

export function JobListWithFilters({ jobs, brandColor }: JobListWithFiltersProps) {
  const [search, setSearch] = useState('');
  const [employmentType, setEmploymentType] = useState('');

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q)
      );
    }
    if (employmentType) {
      result = result.filter((j) => j.employment_type === employmentType);
    }
    return result;
  }, [jobs, search, employmentType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cargo ou localização"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 bg-gray-50/50"
          />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          >
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="space-y-3">
        {filteredJobs.length === 0 ? (
          <li className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
            Nenhuma vaga encontrada com os filtros aplicados.
          </li>
        ) : (
          filteredJobs.map((job) => (
            <li
              key={job.id}
              className="bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {job.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {formatEmploymentType(job.employment_type)}
                  </span>
                  {job.salary_range && (
                    <span className="text-gray-600">
                      {job.salary_range}
                      {job.currency_code ? ` ${job.currency_code}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href={`/jobs/${job.id}/apply`}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  Candidatar-se
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
