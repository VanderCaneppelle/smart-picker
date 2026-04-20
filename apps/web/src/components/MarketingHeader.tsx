import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export function MarketingHeader() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Rankea</span>
          </Link>

          <div className="hidden items-center gap-6 sm:flex">
            <Link
              href="/#como-funciona"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Como funciona
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Preços
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              FAQ
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-emerald-700 hover:to-teal-700"
            >
              Teste grátis
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:hidden">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Teste grátis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
