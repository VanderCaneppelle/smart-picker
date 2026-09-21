'use client';

import Link from 'next/link';
import { PublicPageHeader } from '@/components/PublicPageHeader';

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicPageHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: setembro de 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-0 mb-3">1. Introdução</h2>
            <p>
              Estamos comprometidos com a proteção dos seus dados pessoais e com o cumprimento da Lei Geral de
              Proteção de Dados (LGPD - Lei nº 13.709/2018). Esta política descreve como coletamos, usamos,
              armazenamos e protegemos as informações dos candidatos e dos recrutadores que utilizam a plataforma
              Rankea.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Nosso Papel no Tratamento de Dados</h2>
            <p>
              Para os dados de <strong>candidatos</strong>, o Rankea atua majoritariamente como{' '}
              <strong>operador</strong>: processamos os dados por conta e sob instrução do recrutador responsável
              pela vaga, que é o agente que decide a quem oferecer, entrevistar ou contratar. Para a{' '}
              <strong>avaliação por inteligência artificial</strong>, que é uma funcionalidade definida e
              disponibilizada por nós, atuamos como <strong>controlador</strong> quanto à forma como esse
              tratamento específico é realizado (ver seção 5). Para os dados de{' '}
              <strong>recrutadores e clientes</strong> (cadastro, faturamento), o Rankea atua como controlador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Dados que Coletamos</h2>
            <p><strong>De candidatos:</strong> nome, e-mail, telefone, URL do LinkedIn, currículo (arquivo) e
              respostas às perguntas do formulário da vaga. A base legal é o seu consentimento, dado no momento
              da candidatura.</p>
            <p><strong>De recrutadores e clientes:</strong> nome, e-mail, empresa e informações de cadastro. Dados
              de pagamento (ex.: número de cartão) são coletados e processados diretamente pelo Stripe, nosso
              processador de pagamentos — não temos acesso nem armazenamos esses dados. A base legal é a execução
              do contrato de prestação de serviço.</p>
            <p><strong>Dados de navegação:</strong> coletamos dados de uso e comportamento na Plataforma (páginas
              acessadas, cliques, gravações de sessão) por meio da ferramenta Microsoft Clarity, com base no
              nosso legítimo interesse em entender e melhorar a experiência de uso. Veja a seção 6 para mais
              detalhes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Finalidade e Uso dos Dados</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Processo seletivo da vaga:</strong> seus dados são utilizados pelo recrutador responsável
                pela vaga para análise e gestão da candidatura, incluindo a avaliação por IA descrita na seção 5.
              </li>
              <li>
                <strong>Armazenamento para futuras oportunidades:</strong> com o seu consentimento (conforme
                indicado no formulário de candidatura), os dados poderão ser armazenados para que o recrutador
                responsável pela vaga possa considerá-lo em futuras oportunidades, dentro do mesmo contexto
                contratante, salvo pedido de exclusão.
              </li>
              <li>
                <strong>Operação e cobrança da conta do recrutador:</strong> dados de cadastro e pagamento são
                usados para prover o serviço, processar cobranças e comunicar informações relevantes sobre a
                conta.
              </li>
              <li>
                <strong>Segurança e prevenção a fraude:</strong> podemos usar dados de uso para detectar tentativas
                de manipulação da Plataforma, incluindo tentativas de manipular a avaliação por IA.
              </li>
            </ul>
          </section>

          <section className="rounded-xl bg-amber-50 border border-amber-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900 mt-0 mb-3">
              5. Uso de Inteligência Artificial e Decisões Automatizadas
            </h2>
            <p>
              Para gerar notas, resumos e sugestões sobre candidatos, enviamos o conteúdo do currículo e das
              respostas de candidatura a provedores de inteligência artificial de terceiros (atualmente, a
              OpenAI), o que pode envolver transferência internacional de dados. Essa transferência é feita com
              base em contratos que exigem padrões de proteção de dados compatíveis com a LGPD, e o conteúdo
              enviado é utilizado apenas para gerar a avaliação, não para treinar modelos de terceiros.
            </p>
            <p className="mb-0">
              Você tem o direito de solicitar a <strong>revisão humana</strong> de qualquer decisão tomada
              unicamente com base em tratamento automatizado que afete seus interesses, nos termos do art. 20 da
              LGPD, além de solicitar informações claras sobre os critérios utilizados na avaliação. Para isso,
              utilize os canais indicados na seção 10.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Cookies e Tecnologias de Rastreamento</h2>
            <p>
              Utilizamos o <strong>Microsoft Clarity</strong> para registrar cliques, rolagem e, quando
              aplicável, gravações de sessão de uso da Plataforma, com o objetivo de entender e melhorar a
              experiência do usuário. Essa ferramenta pode definir cookies e coletar dados de uso do dispositivo.
              Não utilizamos esses dados para decisões sobre candidaturas. Você pode gerenciar ou bloquear
              cookies nas configurações do seu navegador; isso pode afetar algumas funcionalidades da Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              7. Compartilhamento de Dados e Operadores Subcontratados
            </h2>
            <p>
              Não vendemos dados pessoais. Compartilhamos dados apenas com prestadores de serviço que nos
              auxiliam a operar a Plataforma, sob obrigações contratuais de confidencialidade e proteção de
              dados, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase</strong> — hospedagem de banco de dados e autenticação;</li>
              <li><strong>OpenAI</strong> — avaliação de candidatos por inteligência artificial (seção 5);</li>
              <li><strong>Resend</strong> — envio de e-mails transacionais;</li>
              <li><strong>Stripe</strong> — processamento de pagamentos;</li>
              <li><strong>Vercel e Railway</strong> — hospedagem da aplicação.</li>
            </ul>
            <p>
              Alguns desses prestadores podem processar dados fora do Brasil. Nesses casos, exigimos garantias
              contratuais de proteção de dados compatíveis com a LGPD. Podemos também divulgar dados quando
              exigido por lei, ordem judicial ou autoridade competente.
            </p>
          </section>

          <section className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900 mt-0 mb-3">8. Quem Acessa os Seus Dados</h2>
            <p className="mb-0">
              <strong>Os dados do candidato são visíveis apenas ao recrutador responsável pela vaga</strong> à qual
              você se candidatou. Não compartilhamos seus dados com outros recrutadores, terceiros não envolvidos
              no processo seletivo nem com o público em geral, exceto os operadores subcontratados listados na
              seção 7. O acesso é restrito e controlado pela plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Seus Direitos (LGPD)</h2>
            <p>
              Nos termos da LGPD, você tem direito a: confirmação da existência de tratamento; acesso aos dados;
              correção de dados incompletos ou desatualizados; anonimização, bloqueio ou eliminação de dados
              desnecessários; portabilidade; informação sobre compartilhamento; revogação do consentimento;{' '}
              <strong>exclusão dos dados tratados com base no consentimento</strong>; e revisão de decisões
              automatizadas (seção 5). Você também pode apresentar reclamação à Autoridade Nacional de Proteção
              de Dados (ANPD).
            </p>
            <p>
              Para solicitar a exclusão dos seus dados, utilize a página{' '}
              <Link href="/solicitar-exclusao" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Solicitar exclusão de dados
              </Link>
              , informando o e-mail utilizado na(s) candidatura(s). O pedido será analisado e atendido conforme a
              legislação, podendo ser mantidos apenas os dados cuja retenção seja permitida ou exigida por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Segurança, Retenção e Menores de Idade</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado,
              alteração, divulgação ou destruição. Os dados são mantidos pelo tempo necessário às finalidades
              descritas nesta Política ou conforme exigido por lei. Em caso de incidente de segurança que possa
              acarretar risco relevante aos titulares, comunicaremos a ANPD e os titulares afetados nos prazos e
              formas previstos na LGPD.
            </p>
            <p>
              A Plataforma não é destinada a menores de 18 anos. Se você acredita que uma pessoa menor de idade
              nos forneceu dados pessoais, entre em contato pelos canais abaixo para que possamos avaliar a
              exclusão.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade. Alterações relevantes serão comunicadas por meio da
              Plataforma ou por e-mail. A continuação do uso após as alterações entrarem em vigor constitui
              aceitação da nova versão.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">12. Identificação, Contato e Encarregado (DPO)</h2>
            <p>
              A plataforma <strong>Rankea</strong> é operada por{' '}
              <strong>T &amp; V Consultoria em Tecnologia da Informação LTDA</strong> (nome fantasia{' '}
              <strong>TC IT Consultancy</strong>), CNPJ nº <strong>45.679.027/0001-90</strong>, com sede na Av.
              Prefeito Osmar Cunha, 416, Sala 1108, Edifício Empresarial Koerich Rio Branco, Centro,
              Florianópolis/SC, CEP 88.015-100.
            </p>
            <p>
              Para dúvidas, solicitação de exclusão ou exercício de outros direitos sobre seus dados, escreva
              para{' '}
              <a
                href="mailto:contato@rankea.com.br"
                className="text-emerald-600 hover:text-emerald-700 font-medium underline"
              >
                contato@rankea.com.br
              </a>{' '}
              ou utilize a página{' '}
              <Link href="/solicitar-exclusao" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                Solicitar exclusão de dados
              </Link>
              , que contém instruções detalhadas.
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
