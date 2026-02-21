'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Input } from '@/components/ui';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse hash from Supabase redirect and set session (type=recovery)
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
        // Remove hash from URL without reload
        window.history.replaceState(null, '', window.location.pathname);
      })
      .catch(() => {
        setError('Falha ao validar o link. Solicite um novo.');
      });
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Rankea</span>
          </Link>
          <p className="text-gray-600">{error}</p>
          <Link
            href="/forgot-password"
            className="inline-block font-medium text-emerald-600 hover:text-emerald-500"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Validando link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Rankea</span>
          </Link>
          <h2 className="mt-8 text-2xl font-bold text-gray-900">
            Nova senha
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite e confirme sua nova senha.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
