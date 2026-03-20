'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Briefcase,
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Target,
  Award,
  Lightbulb,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Brain,
  Star,
  ChevronDown,
} from 'lucide-react';
import { apiClient, type DashboardStatsResponse } from '@/lib/api-client';
import { Loading } from '@/components/ui';
import type { Job } from '@hunter/core';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get('job_id');
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | 'all'>(initialJobId ?? 'all');
  const [isJobMenuOpen, setIsJobMenuOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const jobFilterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    apiClient
      .getDashboardStats(selectedJobId === 'all' ? undefined : selectedJobId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedJobId]);

  useEffect(() => {
    const sub = searchParams.get('subscription');
    if (sub === 'success') {
      toast.success('Assinatura ativada com sucesso! Bem-vindo ao Rankea.');
      router.replace('/dashboard', { scroll: false });
    } else if (sub === 'canceled') {
      toast.info('Assinatura cancelada. Você pode assinar a qualquer momento.');
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getJobs()
      .then((res) => {
        if (!cancelled) setJobs(res.jobs);
      })
      .catch((err) => {
        console.error('Failed to load jobs for dashboard filter', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!jobFilterRef.current) return;
      if (!jobFilterRef.current.contains(e.target as Node)) {
        setIsJobMenuOpen(false);
      }
    }
    if (isJobMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isJobMenuOpen]);

  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) => job.title.toLowerCase().includes(q));
  }, [jobs, jobSearch]);

  if (isLoading) {
    return <Loading text="Carregando dashboard..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Erro ao carregar dados do dashboard.</p>
      </div>
    );
  }

  const { overview, intelligence, performance, insights } = data;
  const funnelMax = Math.max(...performance.funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-8">
      {/* Header + filtro de vaga */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Visão completa do seu processo de recrutamento
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Vaga</span>
          <div className="relative" ref={jobFilterRef}>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 px-3 py-1.5 text-sm text-gray-900 shadow-sm hover:border-emerald-500 hover:text-emerald-700 hover:bg-white transition-colors"
              onClick={() => {
                setIsJobMenuOpen((open) => !open);
              }}
              aria-haspopup="listbox"
              aria-expanded={isJobMenuOpen}
            >
              <span className="truncate max-w-[220px]">
                {selectedJobId === 'all'
                  ? 'Todas as vagas'
                  : jobs.find((j) => j.id === selectedJobId)?.title || 'Selecionar vaga'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <div
              className={`absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 max-h-80 overflow-hidden z-20 transform transition-all duration-150 ${
                isJobMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
              }`}
            >
              {/* Search input */}
              <div className="px-3 pt-3 pb-2 border-b border-gray-100">
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Buscar vaga por título..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="py-1 text-sm max-h-52 overflow-y-auto">
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-emerald-50 ${
                    selectedJobId === 'all' ? 'text-emerald-700 font-semibold' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    setSelectedJobId('all');
                    setJobSearch('');
                    try {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('job_id');
                      router.replace(`${url.pathname}${url.search}`, { scroll: false });
                    } catch {
                      // ignore
                    }
                    setIsJobMenuOpen(false);
                  }}
                >
                  <span>Todas as vagas</span>
                </button>
                {filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-emerald-50 ${
                      selectedJobId === job.id
                        ? 'text-emerald-700 font-semibold'
                        : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setJobSearch('');
                      try {
                        const url = new URL(window.location.href);
                        url.searchParams.set('job_id', job.id);
                        router.replace(`${url.pathname}${url.search}`, { scroll: false });
                      } catch {
                        // ignore
                      }
                      setIsJobMenuOpen(false);
                    }}
                  >
                    <span className="truncate max-w-[210px]">{job.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ SEÇÃO 1: VISÃO GERAL ============ */}
      <section>
        <SectionHeader icon={BarChart3} title="Visão Geral" color="emerald" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <MetricCard
            title="Vagas ativas"
            value={overview.openJobs}
            subtitle={`de ${overview.totalJobs} no total`}
            icon={Briefcase}
            color="emerald"
            onClick={() => router.push('/jobs?status=active')}
          />
          <MetricCard
            title="Candidatos ativos"
            value={overview.activeCandidates}
            subtitle={`${overview.totalCandidates} no total`}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Em entrevista"
            value={overview.interviewCount}
            subtitle="agendados ou em andamento"
            icon={UserCheck}
            color="violet"
          />
          <MetricCard
            title="Ações pendentes"
            value={overview.pendingReview + overview.staleJobsCount}
            subtitle={`${overview.pendingReview} revisões · ${overview.staleJobsCount} vagas paradas`}
            icon={Clock}
            color="amber"
            pulse={overview.pendingReview > 0}
          />
        </div>

        {/* Vagas paradas (detalhe quando houver) */}
        {overview.staleJobs.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {overview.staleJobs.map((j) => (
              <div
                key={j.id}
                onClick={() => router.push(`/jobs/${j.id}`)}
                className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 cursor-pointer hover:bg-orange-100 transition-colors"
              >
                <Clock className="h-4 w-4 text-orange-600 shrink-0" />
                <span className="text-sm text-orange-800 truncate">
                  <strong>{j.title}</strong> — sem candidatos há +14 dias
                </span>
                <ChevronRight className="h-4 w-4 text-orange-400 ml-auto shrink-0" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ SEÇÃO 2: INTELIGÊNCIA E AUTOMAÇÃO ============ */}
      <section>
        <SectionHeader icon={Brain} title="Inteligência & Automação" color="violet" badge="IA" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <MetricCard
            title="Filtrados automaticamente"
            value={`${intelligence.autoFilteredPercent}%`}
            subtitle={`${intelligence.eliminatedCount} candidatos eliminados`}
            icon={ShieldAlert}
            color="red"
          />
          <MetricCard
            title="Com alerta para revisão"
            value={`${intelligence.flaggedForReviewPercent}%`}
            subtitle={`${intelligence.warningCount} com alertas`}
            icon={AlertTriangle}
            color="amber"
          />
          <MetricCard
            title="Score médio global"
            value={`${intelligence.avgGlobalScore}%`}
            subtitle="fit score médio de todos"
            icon={TrendingUp}
            color="teal"
          />
          <MetricCard
            title="Melhor score atual"
            value={`${intelligence.bestScore}%`}
            subtitle="candidato com maior nota"
            icon={Award}
            color="emerald"
            highlight={intelligence.bestScore >= 85}
          />
        </div>

        {/* Score by job + top criteria */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Average score per job */}
          {intelligence.avgScorePerJob.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-violet-500" />
                Score médio por vaga
              </h3>
              <div className="space-y-3">
                {intelligence.avgScorePerJob.map((job) => (
                  <div key={job.jobId} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{job.title}</p>
                      <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            job.avgScore >= 70
                              ? 'bg-emerald-500'
                              : job.avgScore >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-400'
                          }`}
                          style={{ width: `${job.avgScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">{job.avgScore}%</span>
                    <span className="text-xs text-gray-400 w-16 text-right">{job.candidateCount} cand.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top elimination criteria */}
          {intelligence.topCriteria.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Critérios mais recorrentes de eliminação
              </h3>
              <div className="space-y-3">
                {intelligence.topCriteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{c.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {c.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============ SEÇÃO 3: PERFORMANCE DO PROCESSO ============ */}
      <section>
        <SectionHeader icon={Target} title="Performance do Processo" color="blue" />

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Funnel visual */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Funil de conversão</h3>
            <div className="space-y-3">
              {performance.funnel.map((step, i) => {
                const pct = funnelMax > 0 ? (step.count / funnelMax) * 100 : 0;
                const colors = [
                  'bg-blue-500',
                  'bg-violet-500',
                  'bg-amber-500',
                  'bg-emerald-500',
                  'bg-teal-500',
                ];
                return (
                  <div key={step.stage} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24 text-right shrink-0">{step.stage}</span>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full rounded-lg ${colors[i % colors.length]} transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                        {step.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time metrics + alerts */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Tempo médio</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Até validação</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {performance.avgDaysToValidation}
                    <span className="text-sm font-normal text-gray-500 ml-1">dias</span>
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Até contratação</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {performance.avgDaysToHire}
                    <span className="text-sm font-normal text-gray-500 ml-1">dias</span>
                  </p>
                </div>
              </div>
            </div>

            {performance.lowConversionJobs.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Baixa conversão
                </h3>
                <div className="space-y-2">
                  {performance.lowConversionJobs.map((j) => (
                    <div
                      key={j.id}
                      onClick={() => router.push(`/jobs/${j.id}`)}
                      className="flex items-center gap-2 text-sm text-red-800 cursor-pointer hover:underline"
                    >
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="truncate">{j.title}</span>
                      <span className="text-xs text-red-500 ml-auto shrink-0">{j.totalCandidates} cand.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 4: INSIGHTS DA SEMANA ============ */}
      <section>
        <SectionHeader icon={Lightbulb} title="Insights da Semana" color="amber" />

        <div className="mt-4 space-y-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-amber-300 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---- Subcomponents ----

function SectionHeader({
  icon: Icon,
  title,
  color,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  badge?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-100',
    violet: 'text-violet-600 bg-violet-100',
    blue: 'text-blue-600 bg-blue-100',
    amber: 'text-amber-600 bg-amber-100',
  };
  const cls = colorMap[color] || colorMap.emerald;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {badge && (
        <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-600 text-white px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick,
  pulse,
  highlight,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
  pulse?: boolean;
  highlight?: boolean;
}) {
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200',
    blue: 'bg-blue-50 border-blue-200',
    violet: 'bg-violet-50 border-violet-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
    teal: 'bg-teal-50 border-teal-200',
  };
  const iconBgMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    teal: 'bg-teal-100 text-teal-600',
  };
  const textMap: Record<string, string> = {
    emerald: 'text-emerald-900',
    blue: 'text-blue-900',
    violet: 'text-violet-900',
    amber: 'text-amber-900',
    red: 'text-red-900',
    teal: 'text-teal-900',
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border p-5 transition-all ${bgMap[color] || bgMap.emerald} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${highlight ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
    >
      {pulse && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
      )}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={`text-sm font-medium opacity-80 ${textMap[color]}`}>{title}</p>
          <p className={`mt-1 text-3xl font-bold ${textMap[color]}`}>{value}</p>
          <p className={`mt-0.5 text-xs opacity-70 ${textMap[color]}`}>{subtitle}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${iconBgMap[color] || iconBgMap.emerald}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
