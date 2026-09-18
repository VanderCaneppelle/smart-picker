'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Input, Loading } from '@/components/ui';
import { AuthLayoutSide } from '@/components/AuthLayoutSide';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, ApiError } from '@/lib/api-client';
import { useTranslations } from 'next-intl';

/**
 * Primeiro acesso de quem foi criado pelo dono da conta: a senha veio por e-mail e
 * precisa ser trocada antes de qualquer outra coisa.
 *
 * Fica fora do grupo (dashboard) de propósito. O layout do painel busca assinatura,
 * limites e avisos no mount, e todas essas chamadas voltam 403 enquanto a senha está
 * pendente. Aqui não tem nada disso para falhar.
 *
 * A troca em si é da API (/api/auth/change-password), e não de supabase.auth no
 * cliente: trocar a senha e desligar a flag precisam ser a mesma operação.
 */
export default function TrocarSenhaPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isLoading, isAuthenticated, mustChangePassword, refreshUser } = useAuth();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Esperar isLoading virar false é obrigatório: o AuthProvider só chama
    // apiClient.setToken dentro de um efeito assíncrono, e o efeito do filho roda
    // antes do efeito do pai. Sem esta espera, a tela decidiria o redirect antes de
    // existir sessão.
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!mustChangePassword) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, mustChangePassword, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      toast.error(t('autenticacao.senhasNaoCoincidem'));
      return;
    }
    if (password.length < 8) {
      toast.error(t('senha.minimo8'));
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.changePassword({ new_password: password });
      // Recarrega o usuário antes de sair da tela: é o refreshUser que desliga o
      // mustChangePassword no contexto e solta o resto do app.
      await refreshUser();
      toast.success(t('senha.trocada'));
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.data?.code === 'password_reused') {
        toast.error(t('senha.reutilizada'));
      } else {
        toast.error(err instanceof Error ? err.message : t('senha.minimo8'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !isAuthenticated || !mustChangePassword) {
    return <Loading fullScreen text={t('comum.carregando')} />;
  }

  return (
    <div className="min-h-screen flex">
      <AuthLayoutSide />
      <div className="w-full lg:w-1/2 flex flex-col bg-white">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-12 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden mb-8 flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">{t('senha.trocarTitulo')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('senha.trocarSubtitulo')}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <Input
                label={t('senha.novaSenha')}
                type="password"
                name="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label={t('senha.confirmarSenha')}
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" isLoading={isSaving}>
                {isSaving ? t('senha.salvando') : t('senha.salvar')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
