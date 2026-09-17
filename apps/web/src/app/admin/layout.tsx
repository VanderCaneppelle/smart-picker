'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

const NAV = [
  { href: '/admin', label: 'Visão geral' },
  { href: '/admin/recrutadores', label: 'Recrutadores' },
  { href: '/admin/assinaturas', label: 'Assinaturas' },
  { href: '/admin/anuncios', label: 'Avisos' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [state, setState] = useState<'checking' | 'allowed' | 'denied' | 'anonymous' | 'error'>(
    'checking'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Só perguntamos depois que o AuthContext terminou de restaurar a sessão. O efeito
  // do filho roda antes do efeito do pai no React, então sem esta espera a chamada sai
  // sem Authorization e o servidor responde como se a pessoa não tivesse acesso.
  useEffect(() => {
    if (isLoading) return;

    apiClient
      .getAdminOverview()
      .then(() => setState('allowed'))
      .catch((err) => {
        const status = err instanceof ApiError ? err.status : null;
        if (status === 401) {
          setState('anonymous');
          return;
        }
        if (status === 404) {
          setState('denied');
          return;
        }
        // Falha do servidor não é falta de permissão. Mostrar "não encontrada" aqui
        // esconde o erro real e manda a pessoa caçar problema no lugar errado.
        setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar o admin');
        setState('error');
      });
  }, [isLoading]);

  useEffect(() => {
    if (state === 'anonymous') {
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
    }
  }, [state, pathname]);

  if (state === 'checking' || state === 'anonymous') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-2xl font-semibold text-gray-900">Erro ao carregar o admin</p>
        <p className="max-w-md text-[13px] text-gray-500">{errorMessage}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-2xl font-semibold text-gray-900">Página não encontrada</p>
        {user?.email && (
          <p className="text-[13px] text-gray-500">
            Você está logado como <span className="font-medium text-gray-700">{user.email}</span>
          </p>
        )}
        <Link href="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 pt-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900">
              <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.25} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">Rankea</span>
            <span className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              Admin
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao portal
          </Link>
        </div>
        {/* Nav com sublinhado: mostra a seção atual sem competir com o conteúdo. */}
        <nav className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 sm:px-6">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`-mb-px whitespace-nowrap border-b-2 py-3 text-[13px] font-medium transition-colors ${
                  active
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
