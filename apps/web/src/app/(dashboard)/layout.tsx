'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui';
import { TrendingUp, LogOut, Briefcase, PlusCircle, LayoutDashboard, Users, User, ChevronDown, Menu, X, Settings } from 'lucide-react';

const statusFilterOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Ativa' },
  { value: 'closed', label: 'Fechada' },
  { value: 'on_hold', label: 'Pausada' },
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
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <Loading fullScreen text="Carregando..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Suspense fallback={<Loading fullScreen text="Carregando..." />}>
      <DashboardLayoutContent pathname={pathname} user={user} onLogout={logout}>
        {children}
      </DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({
  pathname,
  user,
  onLogout,
  children,
}: {
  pathname: string | null;
  user: { email?: string } | null;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vagasExpanded, setVagasExpanded] = useState(() => pathname === '/jobs' || (pathname?.startsWith('/jobs/') && pathname !== '/jobs/new'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const currentStatus = searchParams.get('status') ?? '';
  const isJobsPage = pathname === '/jobs' || (pathname?.startsWith('/jobs/') && pathname !== '/jobs/new');

  const jobsHref = (status?: string) => {
    const p = new URLSearchParams(searchParams?.toString() ?? '');
    if (status !== undefined) (status ? p.set('status', status) : p.delete('status'));
    const q = p.toString();
    return `/jobs${q ? `?${q}` : ''}`;
  };

  useEffect(() => {
    if (isJobsPage) setVagasExpanded(true);
  }, [isJobsPage]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    onLogout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/jobs') return pathname === '/jobs' || (pathname?.startsWith('/jobs/') && pathname !== '/jobs/new');
    if (href === '/jobs/new') return pathname === '/jobs/new';
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/candidatos-salvos') return pathname === '/candidatos-salvos';
    if (href === '/perfil') return pathname === '/perfil';
    if (href === '/settings/public-profile') return pathname === '/settings/public-profile';
    return pathname === href;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar: altura da tela, rodapé (Perfil/Config/Sair) fixo */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:h-screen lg:sticky lg:top-0 lg:flex-shrink-0 bg-white border-r border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 h-16 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Rankea</span>
        </Link>

        <nav className="flex-1 flex flex-col min-h-0 py-4 px-3">
          <div className="flex-1 overflow-y-auto min-h-0 space-y-0.5">
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
                            href={jobsHref(value)}
                            className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
                              currentStatus === value
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
          </div>
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-0.5 flex-shrink-0 bg-white">
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
            <Link
              href="/settings/public-profile"
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/settings/public-profile')
                  ? 'bg-emerald-600 text-white border-l-2 border-l-emerald-700 -ml-px pl-[11px]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings className={`h-5 w-5 flex-shrink-0 ${isActive('/settings/public-profile') ? 'text-white' : 'text-gray-500'}`} />
              Configurações
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
        {/* Top bar: logo + hamburger (mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Rankea</span>
          </Link>
          <div className="relative" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Mobile menu panel */}
            {mobileMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                  aria-label="Fechar menu"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl z-50 flex flex-col lg:hidden transform transition-transform duration-200 ease-out translate-x-0">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Menu</span>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-3 text-sm text-gray-500 truncate border-b border-gray-100">
                    {user?.email}
                  </div>
                  <nav className="flex-1 overflow-auto py-4 px-3 space-y-1">
                    <Link
                      href="/jobs/new"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-200 font-medium"
                    >
                      <PlusCircle className="h-5 w-5" />
                      + Criar vaga
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                        isActive('/dashboard') ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <Link
                      href="/jobs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                        isActive('/jobs') ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Briefcase className="h-5 w-5" />
                      Vagas
                    </Link>
                    <Link
                      href="/candidatos-salvos"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                        isActive('/candidatos-salvos') ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      Candidatos Salvos
                    </Link>
                    <div className="pt-4 mt-4 border-t border-gray-200 space-y-1">
                      <Link
                        href="/perfil"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                          isActive('/perfil') ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <User className="h-5 w-5" />
                        Perfil
                      </Link>
                      <Link
                        href="/settings/public-profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                          isActive('/settings/public-profile') ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Settings className="h-5 w-5" />
                        Configurações
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="h-5 w-5" />
                        Sair
                      </button>
                    </div>
                  </nav>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
