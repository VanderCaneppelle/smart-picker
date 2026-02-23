'use client';

import Link from 'next/link';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

/**
 * Painel esquerdo verde (informativo) usado em login, signup, forgot-password e reset-password.
 */
export function AuthLayoutSide() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
      <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 max-w-lg">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">Rankea</span>
        </Link>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
              Contrate com inteligência.
            </h1>
            <p className="mt-4 text-emerald-100 text-lg">
              Publique vagas, receba candidatos e deixe a IA ranquear os melhores.
              Menos tempo triando, mais tempo escolhendo.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              'Ranking automático por fit com a vaga',
              'Resumos e notas gerados por IA',
              'Um lugar para todas as vagas e candidatos',
              'Notificações por e-mail a cada nova aplicação',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                </span>
                <span className="text-emerald-50">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-emerald-200/80">
          Candidatos não precisam criar conta. Só você gerencia tudo.
        </p>
      </div>
    </div>
  );
}
