'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { AuthLayoutSide } from '@/components/AuthLayoutSide';
import { TrendingUp } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao entrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AuthLayoutSide />
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
            <h2 className="text-2xl font-bold text-gray-900">Entrar</h2>
            <p className="mt-1 text-sm text-gray-500">
              Acesse sua conta para gerenciar suas vagas
            </p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Sua senha"
              />
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-500"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                size="lg"
                isLoading={isLoading}
              >
                Entrar
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Não tem conta?{' '}
              <Link
                href="/signup"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
