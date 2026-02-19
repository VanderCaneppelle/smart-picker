'use client';

import Link from 'next/link';
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
  Shield
} from 'lucide-react';

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
            <div className="flex items-center gap-4">
              {/* Links de login/signup ocultos por enquanto */}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Seleção simples,{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                decisão inteligente
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Reduza o tempo de triagem e aumente a precisão da sua seleção com ranking automatizado por IA.
            </p>
            {/* CTAs removidos temporariamente */}
          </div>

          {/* Hero Visual */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 shadow-2xl max-w-5xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="space-y-4">
                {/* Mock candidate rows */}
                {[
                  { name: 'Ana Silva', score: 94, status: 'Entrevista' },
                  { name: 'Carlos Santos', score: 87, status: 'Revisão' },
                  { name: 'Maria Oliveira', score: 82, status: 'Novo' },
                  { name: 'João Pereira', score: 76, status: 'Novo' },
                ].map((candidate, i) => (
                  <div 
                    key={i} 
                    className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                        {candidate.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{candidate.name}</p>
                        <p className="text-gray-400 text-sm">Desenvolvedor Full Stack</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-gray-400 text-xs mb-1">Fit Score</p>
                        <p className={`text-lg font-bold ${
                          candidate.score >= 90 ? 'text-emerald-400' : 
                          candidate.score >= 80 ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {candidate.score}%
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        candidate.status === 'Entrevista' ? 'bg-purple-500/20 text-purple-400' :
                        candidate.status === 'Revisão' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
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

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Por que usar o Rankea?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ferramentas inteligentes para consultores de RH que valorizam seu tempo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Triagem Automática',
                description: 'IA analisa currículos e respostas, gerando scores de compatibilidade em segundos.',
                color: 'emerald'
              },
              {
                icon: Target,
                title: 'Ranking Inteligente',
                description: 'Candidatos ordenados por fit score. Foque nos melhores, não perca tempo com os demais.',
                color: 'blue'
              },
              {
                icon: Clock,
                title: 'Economize Tempo',
                description: 'Reduza horas de análise manual para minutos. Mais produtividade, menos burocracia.',
                color: 'purple'
              },
              {
                icon: BarChart3,
                title: 'Métricas Claras',
                description: 'Scores de currículo, qualidade de respostas e nível de experiência em um só lugar.',
                color: 'orange'
              },
              {
                icon: Users,
                title: 'Gestão Simplificada',
                description: 'Acompanhe candidatos por status: novo, revisão, entrevista, contratado.',
                color: 'pink'
              },
              {
                icon: Shield,
                title: 'Dados Seguros',
                description: 'Seus dados e dos candidatos protegidos com criptografia e boas práticas.',
                color: 'teal'
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                  feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                  feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  feature.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  feature.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                  'bg-teal-100 text-teal-600'
                }`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Em 3 passos simples você tem candidatos rankeados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Crie a vaga',
                description: 'Descreva a posição, requisitos e adicione perguntas personalizadas para os candidatos.'
              },
              {
                step: '02',
                title: 'Receba candidaturas',
                description: 'Compartilhe o link da vaga. Candidatos aplicam com currículo e respondem suas perguntas.'
              },
              {
                step: '03',
                title: 'Veja o ranking',
                description: 'A IA analisa cada candidato e gera um ranking automático. Você decide com confiança.'
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-7xl font-bold text-gray-100 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                    <ArrowRight className="h-8 w-8 text-gray-200" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Feito para consultores de RH independentes
          </h2>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-12">
            Sem contratos longos, sem burocracia. Comece a usar hoje e veja resultados imediatos.
          </p>

          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { value: '80%', label: 'menos tempo em triagem' },
              { value: '3x', label: 'mais candidatos analisados' },
              { value: '100%', label: 'decisões baseadas em dados' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl sm:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-emerald-100">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Pronto para ranquear com inteligência?
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Em breve você poderá criar sua conta e começar a usar o Rankea.
          </p>
          <p className="text-gray-500">
            Estamos preparando tudo para você. Fique ligado!
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Rankea</span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Rankea. Todos os direitos reservados.
            </p>
            {/* Links removidos temporariamente */}
          </div>
        </div>
      </footer>
    </div>
  );
}
