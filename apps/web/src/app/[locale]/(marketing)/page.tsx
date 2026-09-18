'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Zap,
  Target,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight,
  Shield,
  Star,
  ChevronDown,
  FileText,
  Inbox,
  ListOrdered,
  Mail,
  Rocket,
  Crown,
  Building2,
  Check,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PLANS, TRIAL_DURATION_DAYS, TRIAL_MAX_ACTIVE_JOBS } from '@/lib/subscription';
import { usePlanoTraduzido } from '@/lib/plan-i18n';

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof PLANS)[number];
  index: number;
}) {
  const t = useTranslations();
  const tp = usePlanoTraduzido();
  const Icon = index === 0 ? Rocket : index === 1 ? Crown : Building2;
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl bg-white p-8 ${
        plan.highlighted
          ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
          : 'border border-gray-200'
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            {t('precos.maisPopular')}
          </span>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
          <Icon className="h-5 w-5 text-emerald-600" />
        </span>
        <h3 className="text-base font-semibold tracking-tight text-gray-900">{tp(plan).nome}</h3>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-gray-500">{tp(plan).descricao}</p>

      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-gray-900">{tp(plan).preco}</span>
        <span className="text-sm text-gray-500">{t('precos.porMes')}</span>
      </div>

      <div className="mb-6 h-px bg-gray-100" />

      <ul className="space-y-3 text-sm">
        {tp(plan).recursos.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
            </span>
            <span className="leading-relaxed text-gray-700">{feature}</span>
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
  const t = useTranslations();

  return (
    <>
      {/* Hero Section */}
      <section className="overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trial badge */}
            <div className="inline-flex items-stretch mb-8 text-[11px] font-semibold uppercase tracking-[0.15em]">
              <span className="px-3 py-1.5 text-emerald-700">
                {t('hero.selo.diasGratis', { dias: TRIAL_DURATION_DAYS })}
              </span>
              <span className="w-px bg-gray-200" aria-hidden="true" />
              <span className="px-3 py-1.5 text-gray-500">{t('hero.selo.semCartao')}</span>
            </div>

            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[3.75rem] font-semibold text-gray-900 leading-[1.05] mb-6 tracking-[-0.03em] text-balance">
              {t('hero.titulo')}{' '}
              <span className="text-gray-500">{t('hero.tituloDestaque')}</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-[38rem] mx-auto leading-relaxed text-pretty">
              {t('hero.subtitulo')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-[15px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors w-full sm:w-auto"
              >
                {t('hero.ctaPrimario', { dias: TRIAL_DURATION_DAYS })}
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-[15px] font-medium text-gray-900 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors w-full sm:w-auto"
              >
                {t('hero.ctaSecundario')}
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              {t('hero.apoio.vagas', { n: TRIAL_MAX_ACTIVE_JOBS })}
              <span className="mx-2 text-gray-300">·</span>
              {t('hero.apoio.candidatos')}
              <span className="mx-2 text-gray-300">·</span>
              {t('hero.apoio.semCartao')}
            </p>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl shadow-gray-900/10 max-w-5xl mx-auto border border-gray-800">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-700/60">
                <span className="text-sm font-medium text-gray-200">{t('hero.mockVaga')}</span>
                <span className="text-xs text-gray-500">{t('hero.mockResumo', { n: 5 })}</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Ana Silva', score: 94, status: t('mock.entrevista'), role: t('mock.cargo1') },
                  { name: 'Carlos Santos', score: 87, status: t('mock.aprovado'), role: t('mock.cargo2') },
                  { name: 'Maria Oliveira', score: 82, status: t('mock.revisao'), role: t('mock.cargo3') },
                  { name: 'João Pereira', score: 76, status: t('mock.novo'), role: t('mock.cargo4') },
                  { name: 'Fernanda Costa', score: 71, status: t('mock.novo'), role: t('mock.cargo5') },
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
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-200 font-medium text-sm">
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
                        candidate.status === t('mock.entrevista') ? 'bg-purple-500/20 text-purple-400' :
                        candidate.status === t('mock.aprovado') ? 'bg-emerald-500/20 text-emerald-400' :
                        candidate.status === t('mock.revisao') ? 'bg-blue-500/20 text-blue-400' :
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
            <span className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
              {t('features.rotulo')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('features.titulo')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('features.subtitulo')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: t('features.triagem.titulo'),
                description: t('features.triagem.texto'),
              },
              {
                icon: Target,
                title: t('features.ranking.titulo'),
                description: t('features.ranking.texto'),
              },
              {
                icon: Mail,
                title: t('features.emails.titulo'),
                description: t('features.emails.texto'),
              },
              {
                icon: BarChart3,
                title: t('features.metricas.titulo'),
                description: t('features.metricas.texto'),
              },
              {
                icon: Users,
                title: t('features.pipeline.titulo'),
                description: t('features.pipeline.texto'),
              },
              {
                icon: Shield,
                title: t('features.lgpd.titulo'),
                description: t('features.lgpd.texto'),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center mb-5">
                  <feature.icon className="h-[18px] w-[18px] text-gray-700" strokeWidth={1.75} />
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
            <span className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
              {t('comoFunciona.rotulo')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('comoFunciona.titulo')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('comoFunciona.subtitulo')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: t('comoFunciona.p1.titulo'),
                description: t('comoFunciona.p1.texto'),
                icon: FileText,
              },
              {
                step: '02',
                title: t('comoFunciona.p2.titulo'),
                description: t('comoFunciona.p2.texto'),
                icon: Inbox,
              },
              {
                step: '03',
                title: t('comoFunciona.p3.titulo'),
                description: t('comoFunciona.p3.texto'),
                icon: ListOrdered,
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                      <item.icon className="h-[18px] w-[18px] text-gray-700" strokeWidth={1.75} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 tabular-nums">
                      {t('comoFunciona.passo', { n: item.step })}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-6 lg:-right-8 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-[15px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              {t('comoFunciona.cta')}
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
                  <p className="text-emerald-200 text-sm">{t('depoimento.cargo')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-600">
              {t('precos.rotulo')}
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('precos.titulo')}
            </h2>
            <p className="text-base text-gray-600 sm:text-lg">
              {t('precos.subtitulo', { dias: TRIAL_DURATION_DAYS })}
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl items-stretch gap-6 md:grid-cols-3 lg:gap-8">
            {PLANS.filter((p) => !p.hidden).map((plan, i) => (
              <PricingCard key={plan.id} plan={plan} index={i} />
            ))}
          </div>

          <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t('precos.garantias.diasGratis', { dias: TRIAL_DURATION_DAYS })}
            </div>
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t('precos.garantias.semCartao')}
            </div>
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t('precos.garantias.cancele')}
            </div>
            <div className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              {t('precos.garantias.stripe')}
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              {t('precos.verComparacao')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('faq.titulo')}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            <FAQItem
              question={t('faq.q1.p')}
              answer={t('faq.q1.r', { vagas: TRIAL_MAX_ACTIVE_JOBS })}
            />
            <FAQItem
              question={t('faq.q2.p')}
              answer={t('faq.q2.r', { dias: TRIAL_DURATION_DAYS })}
            />
            <FAQItem
              question={t('faq.q3.p')}
              answer={t('faq.q3.r')}
            />
            <FAQItem
              question={t('faq.q4.p')}
              answer={t('faq.q4.r')}
            />
            <FAQItem
              question={t('faq.q5.p')}
              answer={t('faq.q5.r')}
            />
            <FAQItem
              question={t('faq.q6.p')}
              answer={t('faq.q6.r')}
            />
            <FAQItem
              question={t('faq.q7.p')}
              answer={t('faq.q7.r')}
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            {t('ctaFinal.titulo')}
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {t('ctaFinal.subtitulo')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-all shadow-lg w-full sm:w-auto"
            >
              {t('ctaFinal.cta', { dias: TRIAL_DURATION_DAYS })}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{t('ctaFinal.semCartao')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{t('ctaFinal.cancele')}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
