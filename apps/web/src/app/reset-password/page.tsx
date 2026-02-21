'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Input } from '@/components/ui';
import { AuthLayoutSide } from '@/components/AuthLayoutSide';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash) {
      setError('Link inválido ou expirado. Solicite um novo link de recuperação.');
      return;
    }
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const type = params.get('type');
    if (type !== 'recovery' || !access_token || !refresh_token) {
      setError('Link inválido ou expirado. Solicite um novo link de recuperação.');
      return;
    }
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(() => {
        setSessionReady(true);
        window.history.replaceState(null, '', window.location.pathname);
      })
      .catch(() => setError('Falha ao validar o link. Solicite um novo.'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (!supabase) {
      toast.error('Configuração indisponível.');
      return;
    }
    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      toast.success('Senha alterada com sucesso. Faça login.');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao alterar senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const rightContent = (
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
        <h2 className="text-2xl font-bold text-gray-900">Nova senha</h2>
        <p className="mt-1 text-sm text-gray-500">
          Digite e confirme sua nova senha.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Nova senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
          />
          <Input
            label="Confirmar senha"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Repita a senha"
          />
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
            size="lg"
            isLoading={isLoading}
          >
            Redefinir senha
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen flex">
        <AuthLayoutSide />
        <div className="w-full lg:w-1/2 flex flex-col bg-white">
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-12 lg:px-14">
            <div className="mx-auto w-full max-w-md text-center">
              <div className="lg:hidden mb-8 flex justify-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Rankea</span>
                </Link>
              </div>
              <p className="text-gray-600">{error}</p>
              <Link
                href="/forgot-password"
                className="mt-4 inline-block font-medium text-emerald-600 hover:text-emerald-500"
              >
                Solicitar novo link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex">
        <AuthLayoutSide />
        <div className="w-full lg:w-1/2 flex flex-col bg-white items-center justify-center px-6">
          <p className="text-gray-600">Validando link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AuthLayoutSide />
      <div className="w-full lg:w-1/2 flex flex-col bg-white">
        {rightContent}
      </div>
    </div>
  );
}
