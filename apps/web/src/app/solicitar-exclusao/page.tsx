'use client';

import Link from 'next/link';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { FileQuestion, Mail } from 'lucide-react';

const DEFAULT_PRIVACY_EMAIL = 'contato@rankea.com.br';

export default function SolicitarExclusaoPage() {
  const contactEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? DEFAULT_PRIVACY_EMAIL;

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicPageHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FileQuestion className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitar exclusão de dados</h1>
            <p className="text-gray-600 text-sm">LGPD - Lei Geral de Proteção de Dados</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <p className="text-gray-700">
            Conforme nossa{' '}
            <Link href="/privacidade" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
              Política de Privacidade
            </Link>
            , você tem direito a solicitar a exclusão dos seus dados pessoais a qualquer momento.
          </p>

          <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Como solicitar
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Envie um e-mail para o endereço abaixo.</li>
              <li>Use o mesmo <strong>e-mail</strong> com o qual você se candidatou à(s) vaga(s).</li>
              <li>No assunto, indique: <strong>&quot;Solicitação de exclusão de dados - LGPD&quot;</strong>.</li>
              <li>No corpo da mensagem, confirme que deseja a exclusão dos seus dados cadastrais e de candidaturas na plataforma Rankea.</li>
            </ol>
            <p className="mt-4 text-sm text-gray-600">
              Analisaremos seu pedido e responderemos em até o prazo previsto na LGPD, podendo solicitar
              informações adicionais para garantir que a solicitação é do titular dos dados.
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
            <p className="text-sm font-medium text-gray-700 mb-2">E-mail para solicitação:</p>
            <a
              href={`mailto:${contactEmail}?subject=Solicitação de exclusão de dados - LGPD`}
              className="text-lg font-semibold text-emerald-700 hover:text-emerald-800 break-all"
            >
              {contactEmail}
            </a>
          </div>

          <p className="text-sm text-gray-500">
            Para outras dúvidas sobre privacidade ou exercício de direitos (acesso, correção, portabilidade,
            revogação do consentimento), utilize o mesmo canal informando o tipo de solicitação.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/privacidade" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Política de Privacidade
          </Link>
          <Link href="/termos" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Termos de Uso
          </Link>
          <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
