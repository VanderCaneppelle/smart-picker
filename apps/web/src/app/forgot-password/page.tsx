'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button, Input } from '@/components/ui';
import { AuthLayoutSide } from '@/components/AuthLayoutSide';
import { TrendingUp, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error('Configuração indisponível. Tente mais tarde.');
      return;
    }
    setIsLoading(true);
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Se o e-mail existir, você receberá um link para redefinir a senha.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao enviar. Tente novamente.');
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
            <h2 className="text-2xl font-bold text-gray-900">Recuperar senha</h2>
            <p className="mt-1 text-sm text-gray-500">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            {sent ? (
              <div className="mt-8 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                <Mail className="mx-auto h-10 w-10 text-emerald-600 mb-3" />
                <p className="text-gray-700 text-sm">
                  Verifique sua caixa de entrada (e o spam). O link expira em 1 hora.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-500"
                >
                  Voltar para o login
                </Link>
              </div>
            ) : (
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
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                  size="lg"
                  isLoading={isLoading}
                >
                  Enviar link de recuperação
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-gray-600">
              Lembrou a senha?{' '}
              <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
