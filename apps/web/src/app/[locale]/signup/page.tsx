'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { registrarEvento } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { AuthLayoutSide } from '@/components/AuthLayoutSide';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { signup, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paidPlan, setPaidPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/subscription/session-info?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => {
        if (!info) return;
        if (info.email) setEmail(info.email);
        if (info.plan_id) setPaidPlan(info.plan_id);
      })
      .catch(() => {
        // silencioso: usuário ainda pode criar conta
      });
  }, [sessionId]);

  if (isAuthenticated) {
    router.push('/dashboard');
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
        {
          name,
          company: company || undefined,
          phone_number: phoneNumber || undefined,
          session_id: sessionId || undefined,
        }
      );

      registrarEvento('signup', { requer_confirmacao: requires_confirmation });

      if (requires_confirmation) {
        toast.success(t('auth.contaCriadaConfirmar'));
        router.push('/login');
      } else {
        toast.success(t('auth.contaCriada'));
        router.push('/onboarding');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AuthLayoutSide />
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

            <h2 className="text-2xl font-bold text-gray-900">{t('auth.criarConta')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('auth.criarContaSub')}</p>

            {paidPlan && (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p className="font-medium">{t('auth.pagamentoConfirmado')}</p>
                <p className="mt-1 text-emerald-700">{t('cadastro.mesmoEmail')}</p>
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <Input
                label={t('auth.nome')}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder={t('auth.nomePlaceholder')}
              />

              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('auth.emailPlaceholder')}
              />

              <Input
                label={t('auth.empresa')}
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="organization"
                placeholder={t('auth.empresaPlaceholder')}
              />

              <Input
                label={t('auth.telefone')}
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoComplete="tel"
                placeholder={t('auth.telefonePlaceholder')}
              />

              <Input
                label={t('auth.senha')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder={t('auth.senhaMinima')}
              />

              <Input
                label={t('auth.confirmarSenha')}
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                autoComplete="new-password"
                placeholder={t('auth.repitaSenha')}
              />

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                size="lg"
                isLoading={isLoading}
              >{t('auth.criarConta')}</Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Já tem conta?{' '}
              <Link
                href="/login"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >{t('auth.entrar')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
