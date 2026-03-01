'use client';

import Link from 'next/link';
import { PublicPageHeader } from '@/components/PublicPageHeader';

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicPageHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: março de 2025</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma Rankea (&quot;Plataforma&quot;), você concorda com estes Termos de Uso.
              Se não concordar com qualquer parte destes termos, não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Descrição do Serviço</h2>
            <p>
              O Rankea é uma plataforma que conecta recrutadores e candidatos, permitindo a publicação de vagas,
              envio de candidaturas e gestão de processos seletivos com apoio de ferramentas de avaliação.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Uso por Candidatos</h2>
            <p>
              Ao se candidatar a uma vaga pela Plataforma, você declara que as informações fornecidas são verdadeiras
              e que concorda com a nossa{' '}
              <Link href="/privacidade" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Política de Privacidade
              </Link>
              , incluindo o armazenamento e o uso dos seus dados para a vaga em questão e, quando aplicável,
              para futuras oportunidades, conforme nela descrito.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Uso por Recrutadores</h2>
            <p>
              Recrutadores são responsáveis pelo conteúdo das vagas publicadas e pelo tratamento dos dados dos
              candidatos em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e com
              nossa Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Propriedade Intelectual</h2>
            <p>
              O conteúdo da Plataforma (marcas, textos, layout, software) é de propriedade do Rankea ou de seus
              licenciadores e está protegido por leis de propriedade intelectual. O uso não autorizado é vedado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Limitação de Responsabilidade</h2>
            <p>
              A Plataforma é oferecida &quot;como está&quot;. Não nos responsabilizamos por decisões de contratação ou
              não contratação, por falhas de terceiros ou por danos indiretos decorrentes do uso dos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Alterações</h2>
            <p>
              Podemos alterar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por meio
              da Plataforma ou por e-mail. O uso continuado após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Lei e Foro</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será submetida
              ao foro da comarca do domicílio do usuário, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Contato</h2>
            <p>
              Dúvidas sobre estes Termos podem ser enviadas para o contato disponível em nossa{' '}
              <Link href="/privacidade" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
          <Link
            href="/privacidade"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Política de Privacidade
          </Link>
          <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
