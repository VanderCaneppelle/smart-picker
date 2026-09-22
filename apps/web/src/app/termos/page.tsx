'use client';

import Link from 'next/link';
import { PublicPageHeader } from '@/components/PublicPageHeader';

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicPageHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: setembro de 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-0 mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a Plataforma, você declara ter no mínimo 18 anos (ou ser legalmente emancipado)
              e capacidade civil para contratar, e concorda integralmente com estes Termos de Uso e com nossa{' '}
              <Link href="/privacidade" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Política de Privacidade
              </Link>
              . Se não concordar com qualquer parte destes termos, não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Descrição do Serviço</h2>
            <p>
              O Rankea é uma plataforma de software como serviço (SaaS) que conecta recrutadores e candidatos,
              permitindo a publicação de vagas, o recebimento de candidaturas e a gestão de processos seletivos,
              com apoio de ferramentas de triagem e ranqueamento assistidas por inteligência artificial (IA).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Cadastro e Conta</h2>
            <p>
              Recrutadores que se cadastram na Plataforma são responsáveis por manter a confidencialidade de suas
              credenciais de acesso e por todas as atividades realizadas em sua conta. Informações de cadastro
              devem ser verdadeiras, completas e mantidas atualizadas. Podemos suspender ou encerrar contas que
              violem estes Termos, apresentem indícios de fraude, uso indevido ou atividade que coloque em risco
              a segurança da Plataforma ou de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Uso por Candidatos</h2>
            <p>
              Ao se candidatar a uma vaga pela Plataforma, você declara que as informações e documentos fornecidos
              (incluindo currículo e respostas) são verdadeiros e de sua autoria, e concorda com o tratamento dos
              seus dados pessoais conforme descrito em nossa{' '}
              <Link href="/privacidade" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Política de Privacidade
              </Link>
              . O envio de documentos ou informações falsas, de terceiros sem autorização, ou com conteúdo
              malicioso é vedado e pode resultar na exclusão da candidatura.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Uso por Recrutadores</h2>
            <p>
              Recrutadores são os únicos responsáveis pelo conteúdo das vagas publicadas, pela veracidade das
              informações divulgadas e pelas decisões de contratação, rejeição ou avanço de candidatos em suas
              vagas. Ao utilizar a Plataforma para tratar dados pessoais de candidatos, o recrutador atua como{' '}
              <strong>agente de tratamento</strong> nos termos da LGPD (Lei nº 13.709/2018) e se compromete a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>utilizar os dados dos candidatos exclusivamente para fins de recrutamento e seleção lícitos;</li>
              <li>
                não utilizar a Plataforma, incluindo suas ferramentas de IA, para fins discriminatórios ou
                contrários à legislação trabalhista e antidiscriminatória vigente;
              </li>
              <li>
                não publicar vagas ou conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de
                terceiros;
              </li>
              <li>
                cumprir a LGPD e demais normas aplicáveis ao tratamento de dados pessoais de candidatos sob sua
                responsabilidade.
              </li>
            </ul>
            <p className="mt-4">
              <strong>Envio de currículos pelo próprio recrutador.</strong> A Plataforma permite que o recrutador
              envie currículos que já estavam em poder dele, obtidos fora do formulário público da vaga. Nesse
              caso não há candidatura nem consentimento coletado por nós, e o recrutador declara que possui base
              legal para tratar aqueles dados e para submetê-los à avaliação por IA, respondendo integralmente
              por essa decisão. Currículos enviados dessa forma não recebem nenhuma comunicação automática da
              Plataforma: e-mails ao candidato só saem por ato deliberado do recrutador, como convidar para
              entrevista ou encerrar a participação.
            </p>
          </section>

          <section className="rounded-xl bg-amber-50 border border-amber-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900 mt-0 mb-3">
              6. Avaliação e Ranking por Inteligência Artificial
            </h2>
            <p>
              A Plataforma utiliza inteligência artificial para gerar notas, resumos e sugestões sobre candidatos
              com base no currículo e nas respostas fornecidas. Essas informações são{' '}
              <strong>ferramentas de apoio à decisão</strong> e não substituem o julgamento humano do recrutador.
            </p>
            <p className="mb-0">
              O Rankea não garante a exatidão, completude ou ausência de viés nas avaliações geradas por IA. A
              decisão final de avançar, entrevistar, contratar ou rejeitar qualquer candidato é de{' '}
              <strong>responsabilidade exclusiva do recrutador</strong>, que não deve utilizar a pontuação da IA
              como critério único ou determinante, especialmente quando isso puder resultar em discriminação
              ilegal. Candidatos têm direito a solicitar a revisão de decisões tomadas unicamente com base em
              tratamento automatizado, nos termos do art. 20 da LGPD, por meio dos canais indicados na nossa{' '}
              <Link href="/privacidade" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              7. Planos, Pagamento e Cancelamento
            </h2>
            <p>
              Novas contas de recrutador têm acesso a um período de teste gratuito, conforme indicado na
              Plataforma no momento do cadastro. Encerrado o teste, o uso continuado exige a contratação de um
              plano pago, com cobrança recorrente mensal processada por meio do Stripe.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>O cancelamento pode ser feito a qualquer momento pelo próprio painel do recrutador;</li>
              <li>
                o cancelamento interrompe cobranças futuras, mas <strong>não gera reembolso</strong> de valores já
                pagos referentes ao período de cobrança em curso;
              </li>
              <li>
                dados de pagamento (cartão de crédito) são processados diretamente pelo Stripe e não são
                armazenados pelo Rankea;
              </li>
              <li>
                podemos alterar os preços dos planos a qualquer momento, com aviso prévio razoável para
                assinaturas ativas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Propriedade Intelectual</h2>
            <p>
              O conteúdo da Plataforma (marca Rankea, textos, layout, software e sua documentação) é de
              propriedade da T &amp; V Consultoria em Tecnologia da Informação LTDA ou de seus licenciadores e é
              protegido por leis de propriedade intelectual. É vedada a cópia, engenharia reversa, extração
              massiva de dados (scraping) ou uso não autorizado da Plataforma ou de seu conteúdo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Indenização</h2>
            <p>
              O recrutador concorda em indenizar e isentar o Rankea de quaisquer reclamações, perdas, danos ou
              despesas (incluindo honorários advocatícios) decorrentes do uso indevido da Plataforma, de conteúdo
              publicado por ele, de violação destes Termos ou da legislação aplicável, incluindo reclamações de
              candidatos relacionadas a decisões de contratação tomadas pelo recrutador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Limitação de Responsabilidade</h2>
            <p>
              A Plataforma é oferecida &quot;como está&quot; e &quot;conforme disponível&quot;. Não garantimos resultados de
              contratação, veracidade de informações fornecidas por terceiros, nem disponibilidade ininterrupta
              do serviço. Não nos responsabilizamos por decisões de contratação ou não contratação tomadas por
              recrutadores, por falhas de serviços de terceiros integrados (ex.: provedores de IA, e-mail,
              pagamento e hospedagem) ou por danos indiretos, lucros cessantes ou perda de dados decorrentes do
              uso da Plataforma.
            </p>
            <p>
              Na máxima extensão permitida em lei, nossa responsabilidade total perante um recrutador, por
              qualquer causa relacionada à Plataforma, fica limitada ao valor efetivamente pago por esse
              recrutador nos 12 (doze) meses anteriores ao evento que originou a reclamação.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Suspensão e Rescisão</h2>
            <p>
              Podemos suspender ou encerrar o acesso de qualquer conta, a nosso critério, em caso de violação
              destes Termos, inadimplência, fraude ou risco à segurança da Plataforma ou de terceiros. O
              recrutador pode encerrar sua conta a qualquer momento; dados armazenados poderão ser mantidos pelo
              prazo necessário ao cumprimento de obrigações legais, conforme nossa{' '}
              <Link href="/privacidade" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">12. Alterações</h2>
            <p>
              Podemos alterar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por meio
              da Plataforma ou por e-mail com antecedência razoável. O uso continuado após as alterações entrarem
              em vigor constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">13. Lei e Foro</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da
              comarca de Florianópolis, Estado de Santa Catarina, para dirimir quaisquer controvérsias
              decorrentes destes Termos, com renúncia a qualquer outro, ressalvadas as disposições de ordem
              pública que determinem foro diverso em favor do consumidor ou titular de dados, quando aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">14. Identificação e Contato</h2>
            <p>
              A plataforma <strong>Rankea</strong> (&quot;Rankea&quot;, &quot;Plataforma&quot;, &quot;nós&quot;) é operada por{' '}
              <strong>T &amp; V Consultoria em Tecnologia da Informação LTDA</strong> (nome fantasia{' '}
              <strong>TC IT Consultancy</strong>), inscrita no CNPJ sob o nº{' '}
              <strong>45.679.027/0001-90</strong>, com sede na Av. Prefeito Osmar Cunha, 416, Sala 1108,
              Edifício Empresarial Koerich Rio Branco, Centro, Florianópolis/SC, CEP 88.015-100.
            </p>
            <p>
              Dúvidas sobre estes Termos podem ser enviadas para{' '}
              <a
                href="mailto:contato@rankea.com.br"
                className="text-emerald-600 hover:text-emerald-700 font-medium underline"
              >
                contato@rankea.com.br
              </a>
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
