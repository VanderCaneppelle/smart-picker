'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    router.push('/jobs');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { requires_confirmation } = await signup(
        email,
        password,
        passwordConfirmation,
        { name, company: company || undefined, phone_number: phoneNumber || undefined }
      );

      if (requires_confirmation) {
        toast.success(
          'Conta criada! Confira seu e-mail para confirmar.'
        );
        router.push('/login');
      } else {
        toast.success('Conta criada com sucesso!');
        router.push('/jobs');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: conteúdo chamativo */}
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

      {/* Right: formulário */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-12 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden mb-8 flex justify-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Rankea</span>
              </Link>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Criar conta
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Preencha os dados para começar a publicar vagas
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Nome completo"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Seu nome"
              />

              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="voce@exemplo.com"
              />

              <Input
                label="Empresa"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="organization"
                placeholder="Nome da empresa (opcional)"
              />

              <Input
                label="Telefone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoComplete="tel"
                placeholder="(00) 00000-0000"
              />

              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
              />

              <Input
                label="Confirmar senha"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repita sua senha"
              />

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                size="lg"
                isLoading={isLoading}
              >
                Criar conta
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Já tem conta?{' '}
              <Link
                href="/login"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
