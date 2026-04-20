'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Zap,
  Target,
  Clock,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Star,
  ChevronDown,
  Gift,
  Rocket,
  Crown,
  Building2,
  Check,
  Play,
  CreditCard,
} from 'lucide-react';
import { PLANS, TRIAL_DURATION_DAYS, TRIAL_MAX_ACTIVE_JOBS } from '@/lib/subscription';

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof PLANS)[number];
  index: number;
}) {
  return (
    <div
      className={`relative rounded-2xl p-8 ${
        plan.highlighted
          ? 'bg-white ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/10 scale-105'
          : 'bg-white border border-gray-200 shadow-sm'
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
            Mais popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {index === 0 && <Rocket className="h-5 w-5 text-emerald-600" />}
          {index === 1 && <Crown className="h-5 w-5 text-emerald-600" />}
          {index === 2 && <Building2 className="h-5 w-5 text-emerald-600" />}
          <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        </div>
        <p className="text-sm text-gray-500">{plan.description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">{plan.priceLabel}</span>
        <span className="text-gray-500 ml-1">/mês</span>
      </div>
      <ul className="space-y-3">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        type="button"
        className="flex items-center justify-between w-full py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base font-medium text-gray-900">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="pb-5 text-gray-600 text-sm leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Rankea</span>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <a href="#como-funciona" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                Como funciona
              </a>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                Preços
              </Link>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                FAQ
              </a>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all"
              >
                Teste grátis
              </Link>
            </div>
            <div className="sm:hidden flex items-center gap-3">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                Teste grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trial badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
              <Gift className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                {TRIAL_DURATION_DAYS} dias grátis — sem cartão de crédito
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              Pare de perder tempo triando currículos.{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Deixe a IA ranquear.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Publique sua vaga, receba candidatos e a IA gera um ranking automático
              com score de compatibilidade. Você decide com dados, não com intuição.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Experimentar {TRIAL_DURATION_DAYS} dias grátis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all w-full sm:w-auto"
              >
                <Play className="h-4 w-4" />
                Ver como funciona
              </a>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{TRIAL_MAX_ACTIVE_JOBS} vaga ativa grátis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Candidatos ilimitados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                <span>Sem cartão</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-5xl mx-auto border border-gray-700/50">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-500 font-mono">rankea.ai — Desenvolvedor Full Stack Senior</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Ana Silva', score: 94, status: 'Entrevista', role: 'Desenvolvedor Full Stack' },
                  { name: 'Carlos Santos', score: 87, status: 'Aprovado', role: 'Eng. de Software Senior' },
                  { name: 'Maria Oliveira', score: 82, status: 'Em revisão', role: 'Full Stack Developer' },
                  { name: 'João Pereira', score: 76, status: 'Novo', role: 'Desenvolvedor Backend' },
                  { name: 'Fernanda Costa', score: 71, status: 'Novo', role: 'Software Engineer' },
                ].map((candidate, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-4 flex items-center justify-between transition-all ${
                      i === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex w-6 text-center text-xs font-mono text-gray-500">
                        #{i + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                        {candidate.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{candidate.name}</p>
                        <p className="text-gray-400 text-xs">{candidate.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Fit Score</p>
                        <div className="flex items-center gap-2">
                          <div className="hidden sm:block w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                candidate.score >= 90 ? 'bg-emerald-400' :
                                candidate.score >= 80 ? 'bg-yellow-400' : 'bg-gray-400'
                              }`}
                              style={{ width: `${candidate.score}%` }}
                            />
                          </div>
                          <p className={`text-base font-bold tabular-nums ${
                            candidate.score >= 90 ? 'text-emerald-400' :
                            candidate.score >= 80 ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                            {candidate.score}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        candidate.status === 'Entrevista' ? 'bg-purple-500/20 text-purple-400' :
                        candidate.status === 'Aprovado' ? 'bg-emerald-500/20 text-emerald-400' :
                        candidate.status === 'Em revisão' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-600/30 text-gray-400'
                      }`}>
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Numbers */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '80%', label: 'menos tempo em triagem' },
              { value: '3x', label: 'mais candidatos analisados' },
              { value: '< 2min', label: 'para publicar uma vaga' },
              { value: '100%', label: 'decisões baseadas em dados' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Funcionalidades
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa para contratar melhor
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ferramentas inteligentes para consultores de RH que valorizam seu tempo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Triagem Automática',
                description: 'IA analisa currículos e respostas, gerando scores de compatibilidade em segundos.',
                iconColor: 'text-amber-600',
                bg: 'bg-amber-50',
              },
              {
                icon: Target,
                title: 'Ranking Inteligente',
                description: 'Candidatos ordenados por fit score. Foque nos melhores, ignore o ruído.',
                iconColor: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                icon: Clock,
                title: 'Economize Tempo',
                description: 'Reduza horas de análise manual para minutos. Mais produtividade, zero burocracia.',
                iconColor: 'text-purple-600',
                bg: 'bg-purple-50',
              },
              {
                icon: BarChart3,
                title: 'Métricas Claras',
                description: 'Scores de currículo, qualidade de respostas e nível de experiência em um painel.',
                iconColor: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                icon: Users,
                title: 'Pipeline Visual',
                description: 'Acompanhe candidatos por etapa: novo, revisão, entrevista, contratado. Kanban ou lista.',
                iconColor: 'text-pink-600',
                bg: 'bg-pink-50',
              },
              {
                icon: Shield,
                title: 'LGPD Compliant',
                description: 'Consentimento rastreado, exclusão sob demanda, dados protegidos e criptografados.',
                iconColor: 'text-teal-600',
                bg: 'bg-teal-50',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-4">
              <ArrowRight className="h-3.5 w-3.5" />
              Passo a passo
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              3 passos para ranquear candidatos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Da publicação à decisão em minutos, não dias
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Crie sua vaga',
                description: 'Descreva a posição, requisitos e adicione perguntas personalizadas. Publique com um link compartilhável.',
                icon: '📋',
              },
              {
                step: '02',
                title: 'Receba candidaturas',
                description: 'Candidatos aplicam com currículo e respondem suas perguntas. Sem cadastro necessário para eles.',
                icon: '📥',
              },
              {
                step: '03',
                title: 'Veja o ranking',
                description: 'A IA analisa cada candidato e gera um ranking automático com fit score. Você decide com confiança.',
                icon: '🏆',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Passo {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-6 lg:-right-8 -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-emerald-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
            >
              Criar minha primeira vaga grátis
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed mb-8">
                &ldquo;Antes eu passava 3 horas por vaga analisando currículos. Com o Rankea,
                em 10 minutos eu já sei quem chamar para entrevista. É como ter um assistente
                dedicado que nunca erra.&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  M
                </div>
                <div>
                  <p className="font-semibold">Marina Souza</p>
                  <p className="text-emerald-200 text-sm">Consultora de RH Independente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-4">
              <CreditCard className="h-3.5 w-3.5" />
              Preços
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Planos simples, sem surpresas
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comece com {TRIAL_DURATION_DAYS} dias grátis. {TRIAL_MAX_ACTIVE_JOBS} vaga ativa, candidatos ilimitados, sem cartão de crédito.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {PLANS.filter((p) => !p.hidden).map((plan, i) => (
              <PricingCard key={plan.id} plan={plan} index={i} />
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all"
            >
              Ver todos os planos
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perguntas frequentes
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            <FAQItem
              question="O que está incluso no teste grátis?"
              answer="Você pode criar 1 vaga ativa, receber candidatos ilimitados e ter acesso completo ao ranking por IA. Sem cartão de crédito, sem compromisso."
            />
            <FAQItem
              question="Preciso de cartão de crédito para começar?"
              answer="Não. O teste grátis de 30 dias não requer cartão de crédito. Você só precisa de um e-mail para criar sua conta."
            />
            <FAQItem
              question="O que acontece quando o teste grátis acaba?"
              answer="Você ainda consegue acessar sua conta e ver seus dados. Para continuar publicando vagas e usando o ranking por IA, basta escolher um plano."
            />
            <FAQItem
              question="Posso trocar de plano depois?"
              answer="Sim! Você pode fazer upgrade ou downgrade a qualquer momento. A cobrança é ajustada proporcionalmente."
            />
            <FAQItem
              question="Os candidatos precisam criar conta?"
              answer="Não. Os candidatos aplicam diretamente pelo link da vaga, sem precisar criar conta. Eles enviam currículo e respondem suas perguntas."
            />
            <FAQItem
              question="Meus dados estão seguros?"
              answer="Sim. Usamos criptografia, seguimos a LGPD e todos os dados são armazenados em servidores seguros. Candidatos podem solicitar exclusão a qualquer momento."
            />
            <FAQItem
              question="Como funciona o ranking por IA?"
              answer="Nossa IA analisa o currículo, as respostas às perguntas da vaga e gera um Fit Score de 0 a 100. Quanto maior o score, mais compatível o candidato é com a vaga."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Pronto para contratar com inteligência?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Junte-se a recrutadores que estão economizando horas de triagem
            com ranking automatizado por IA.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-all shadow-lg w-full sm:w-auto"
            >
              Começar {TRIAL_DURATION_DAYS} dias grátis
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Rankea</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/termos" className="text-gray-500 hover:text-gray-700 text-sm">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="text-gray-500 hover:text-gray-700 text-sm">
                Política de Privacidade
              </Link>
              <Link href="/pricing" className="text-gray-500 hover:text-gray-700 text-sm">
                Preços
              </Link>
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Rankea. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
