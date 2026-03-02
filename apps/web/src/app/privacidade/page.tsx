'use client';

import Link from 'next/link';
import { PublicPageHeader } from '@/components/PublicPageHeader';

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicPageHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: março de 2025</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Introdução</h2>
            <p>
              O Rankea está comprometido com a proteção dos seus dados pessoais e com o cumprimento da Lei Geral
              de Proteção de Dados (LGPD - Lei nº 13.709/2018). Esta política descreve como coletamos, usamos,
              armazenamos e protegemos as informações dos candidatos e dos recrutadores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Dados que Coletamos (Candidatos)</h2>
            <p>
              Coletamos os dados que você informa ao se candidatar: nome, e-mail, telefone, URL do LinkedIn,
              currículo (arquivo) e respostas às perguntas do formulário da vaga. O tratamento tem como base
              legal o seu consentimento, dado no momento da candidatura.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Finalidade e Uso dos Dados</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Processo seletivo da vaga:</strong> seus dados são utilizados pelo recrutador responsável
                pela vaga para análise e gestão da candidatura.
              </li>
              <li>
                <strong>Armazenamento para futuras oportunidades:</strong> com o seu consentimento (conforme indicado
                no formulário de candidatura), os dados poderão ser armazenados para que o recrutador responsável
                pela vaga possa considerá-lo em futuras oportunidades, dentro do mesmo contexto contratante,
                salvo pedido de exclusão.
              </li>
            </ul>
          </section>

          <section className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900 mt-0 mb-3">4. Quem Acessa os Seus Dados</h2>
            <p className="mb-0">
              <strong>Os dados do candidato são visíveis apenas ao recrutador responsável pela vaga</strong> à qual
              você se candidatou. Não compartilhamos seus dados com outros recrutadores, terceiros não envolvidos
              no processo seletivo nem com o público em geral. O acesso é restrito e controlado pela plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Direito à Exclusão (LGPD)</h2>
            <p>
              Você pode <strong>solicitar a exclusão dos seus dados pessoais</strong> a qualquer momento, nos termos
              da LGPD. Para isso, utilize o canal indicado na página{' '}
              <Link href="/solicitar-exclusao" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Solicitar exclusão de dados
              </Link>
              , informando o e-mail utilizado na(s) candidatura(s). O pedido será analisado e atendido conforme
              a legislação, podendo ser mantidos apenas os dados cuja retenção seja permitida por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Outros Direitos (LGPD)</h2>
            <p>
              Além da exclusão, você tem direito a confirmação da existência de tratamento, acesso aos dados,
              correção de dados incompletos ou desatualizados, portabilidade, revogação do consentimento e
              informação sobre compartilhamento. Para exercer esses direitos, entre em contato pelo mesmo
              canal de solicitação de exclusão.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Segurança e Retenção</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado,
              alteração, divulgação ou destruição. Os dados são mantidos pelo tempo necessário às finalidades
              descritas ou conforme exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade. Alterações relevantes serão comunicadas por meio
              da Plataforma ou por e-mail. A continuação do uso após as alterações constitui aceitação da nova versão.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Contato e Encarregado (DPO)</h2>
            <p>
              Para dúvidas, solicitação de exclusão ou exercício de outros direitos sobre seus dados, utilize a
              página{' '}
              <Link href="/solicitar-exclusao" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Solicitar exclusão de dados
              </Link>
              , que contém o canal de contato e as instruções necessárias.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
          <Link href="/termos" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Termos de Uso
          </Link>
          <Link href="/solicitar-exclusao" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Solicitar exclusão de dados
          </Link>
          <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
