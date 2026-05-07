import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Rankea</span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/termos" className="text-sm text-gray-500 hover:text-gray-700">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-sm text-gray-500 hover:text-gray-700">
              Política de Privacidade
            </Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-700">
              Preços
            </Link>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Rankea. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
