'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Users,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Loading } from '@/components/ui';

interface DashboardStats {
  openJobs: number;
  totalJobs: number;
  totalCandidates: number;
  avgCandidatesPerJob: number;
  avgDaysJobOpen: number;
  shortlistedCount: number;
  jobsWithCandidates: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getDashboardStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <Loading text="Carregando..." />;
  }

  const s = stats || {
    openJobs: 0,
    totalJobs: 0,
    totalCandidates: 0,
    avgCandidatesPerJob: 0,
    avgDaysJobOpen: 0,
    shortlistedCount: 0,
    jobsWithCandidates: 0,
  };

  const cards = [
    {
      title: 'Vagas abertas',
      value: s.openJobs,
      subtitle: `de ${s.totalJobs} vagas no total`,
      icon: Briefcase,
      href: '/jobs?status=active',
      color: 'emerald',
    },
    {
      title: 'Total de candidatos',
      value: s.totalCandidates,
      subtitle: 'em todas as vagas',
      icon: Users,
      href: '/candidatos-salvos',
      color: 'blue',
    },
    {
      title: 'Média de candidatos por vaga',
      value: s.avgCandidatesPerJob.toFixed(1),
      subtitle: s.totalJobs ? 'candidatos por vaga' : 'crie vagas para ver a média',
      icon: BarChart3,
      color: 'violet',
    },
    {
      title: 'Tempo médio da vaga em aberto',
      value: s.avgDaysJobOpen,
      subtitle: 'dias (vagas ativas)',
      icon: Clock,
      color: 'amber',
    },
    {
      title: 'Candidatos shortlist',
      value: s.shortlistedCount,
      subtitle: 'selecionados para próxima etapa',
      icon: Target,
      href: '/candidatos-salvos?status=shortlisted',
      color: 'teal',
    },
  ];

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  const iconBgClasses: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
    teal: 'bg-teal-100 text-teal-600',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral das suas vagas e candidatos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const color = card.color || 'emerald';
          const content = (
            <div
              className={`rounded-xl border p-5 ${colorClasses[color]} ${
                card.href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
              }`}
              onClick={() => card.href && router.push(card.href)}
              onKeyDown={(e) => card.href && e.key === 'Enter' && router.push(card.href)}
              role={card.href ? 'button' : undefined}
              tabIndex={card.href ? 0 : undefined}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{card.title}</p>
                  <p className="mt-1 text-2xl font-bold">{card.value}</p>
                  <p className="mt-0.5 text-xs opacity-80">{card.subtitle}</p>
                </div>
                <div className={`rounded-lg p-2 ${iconBgClasses[color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
          return <div key={card.title}>{content}</div>;
        })}
      </div>
    </div>
  );
}
