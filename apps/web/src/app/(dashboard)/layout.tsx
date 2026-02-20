'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui';
import { TrendingUp, LogOut, Briefcase, PlusCircle, LayoutDashboard, Users, User, ChevronDown } from 'lucide-react';

const statusFilterOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Ativa' },
  { value: 'closed', label: 'Fechada' },
  { value: 'on_hold', label: 'Pausada' },
];

const typeFilterOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'full_time', label: 'Tempo integral' },
  { value: 'part_time', label: 'Meio período' },
  { value: 'contract', label: 'Contrato' },
  { value: 'internship', label: 'Estágio' },
  { value: 'freelance', label: 'Freelance' },
];

const mainNavItems = [
  { href: '/jobs/new', label: 'Criar vaga', icon: PlusCircle, primary: true },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Vagas', icon: Briefcase },
  { href: '/candidatos-salvos', label: 'Candidatos Salvos', icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [vagasExpanded, setVagasExpanded] = useState(() => pathname === '/jobs' || (pathname?.startsWith('/jobs/') && pathname !== '/jobs/new'));
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const currentStatus = searchParams.get('status') ?? '';
  const currentType = searchParams.get('employment_type') ?? '';
  const isJobsPage = pathname === '/jobs' || (pathname?.startsWith('/jobs/') && pathname !== '/jobs/new');

  const jobsHref = (status?: string, employmentType?: string) => {
    const p = new URLSearchParams(searchParams?.toString() ?? '');
    if (status !== undefined) (status ? p.set('status', status) : p.delete('status'));
    if (employmentType !== undefined) (employmentType ? p.set('employment_type', employmentType) : p.delete('employment_type'));
    const q = p.toString();
    return `/jobs${q ? `?${q}` : ''}`;
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isJobsPage) setVagasExpanded(true);
  }, [isJobsPage]);

  if (isLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/jobs') return pathname === '/jobs' || (pathname?.startsWith('/jobs/') && pathname !== '/jobs/new');
    if (href === '/jobs/new') return pathname === '/jobs/new';
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/candidatos-salvos') return pathname === '/candidatos-salvos';
    if (href === '/perfil') return pathname === '/perfil';
    return pathname === href;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:flex-shrink-0 bg-white border-r border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 h-16 border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Rankea</span>
        </Link>

        <nav className="flex-1 py-4 px-3 flex flex-col">
          <div className="space-y-0.5 mb-3 pb-3 border-b border-gray-100">
            {mainNavItems.slice(0, 1).map(({ href, label, icon: Icon, primary }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    primary
                      ? active
                        ? 'bg-emerald-600 text-white border-l-2 border-l-emerald-700 -ml-px pl-[11px]'
                        : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300'
                      : active
                        ? 'bg-emerald-600 text-white border-l-2 border-l-emerald-700 -ml-px pl-[11px]'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      active ? 'text-white' : primary ? 'text-emerald-600' : 'text-gray-500'
                    }`}
                  />
                  {primary ? `+ ${label}` : label}
                </Link>
              );
            })}
          </div>
          <div className="space-y-0.5">
            {mainNavItems.slice(1).map(({ href, label, icon: Icon, primary }) => {
              if (href === '/jobs') {
                const active = isActive(href);
                return (
                  <div key={href}>
                    <button
                      type="button"
                      onClick={() => setVagasExpanded((v) => !v)}
                      className={`relative flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors active:scale-[0.98] ${
                        active
                          ? 'bg-emerald-600 text-white border-l-2 border-l-emerald-700 -ml-px pl-[11px]'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Briefcase className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
                        {label}
                      </span>
                      <span
                        className={`inline-flex flex-shrink-0 transition-transform duration-200 ease-out ${
                          vagasExpanded ? 'rotate-0' : '-rotate-90'
                        }`}
                      >
                        <ChevronDown className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-500'}`} />
                      </span>
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                        vagasExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="mt-0.5 ml-2 pl-4 border-l border-gray-200 space-y-0.5">
                        <p className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                        {statusFilterOptions.map(({ value, label: optLabel }) => (
                          <Link
                            key={value || 'status-all'}
                            href={jobsHref(value, currentType)}
                            className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
                              currentStatus === value
                                ? 'bg-emerald-50 text-emerald-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            {optLabel}
                          </Link>
                        ))}
                        <p className="px-2 pt-2 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</p>
                        {typeFilterOptions.map(({ value, label: optLabel }) => (
                          <Link
                            key={value || 'type-all'}
                            href={jobsHref(currentStatus, value)}
                            className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
                              currentType === value
                                ? 'bg-emerald-50 text-emerald-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            {optLabel}
                          </Link>
                        ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    primary
                      ? active
                        ? 'bg-emerald-600 text-white border-l-2 border-l-emerald-700 -ml-px pl-[11px]'
                        : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300'
                      : active
                        ? 'bg-emerald-600 text-white border-l-2 border-l-emerald-700 -ml-px pl-[11px]'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      active ? 'text-white' : primary ? 'text-emerald-600' : 'text-gray-500'
                    }`}
                  />
                  {primary ? `+ ${label}` : label}
                </Link>
              );
            })}
          </div>
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-0.5">
            <Link
              href="/perfil"
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/perfil')
                  ? 'bg-emerald-600 text-white border-l-2 border-l-emerald-700 -ml-px pl-[11px]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <User className={`h-5 w-5 flex-shrink-0 ${isActive('/perfil') ? 'text-white' : 'text-gray-500'}`} />
              Perfil
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5 text-gray-500" />
              Sair
            </button>
          </div>
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar: user info (mobile shows logo + user) */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Rankea</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-600 truncate max-w-[180px]">
            {user?.email}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
