'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button, Input, Loading, Modal, Badge } from '@/components/ui';
import { apiClient, ApiError, type TeamResponse } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { getPlanById, type PlanId } from '@/lib/subscription';
import { AlertTriangle, KeyRound, Mail, Trash2, UserPlus } from 'lucide-react';

export default function EquipePage() {
  const t = useTranslations();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, isOwner, user } = useAuth();

  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [acaoEmCurso, setAcaoEmCurso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setTeam(await apiClient.getTeam());
    } catch (err) {
      // 403 owner_only: membro que digitou a URL na mão. Manda para o painel em vez
      // de mostrar erro, porque para ele esta tela simplesmente não existe.
      if (err instanceof ApiError && err.status === 403) {
        router.replace('/dashboard');
        return;
      }
      toast.error(t('equipe.erroCarregar'));
    } finally {
      setIsLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    // Espera o AuthContext terminar antes de chamar a API: o token só é registrado
    // no apiClient dentro de um efeito assíncrono do provider, e o efeito do filho
    // roda primeiro. Sem esta guarda a requisição sai sem Authorization e volta 401.
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (!isOwner) {
      router.replace('/dashboard');
      return;
    }
    carregar();
  }, [authLoading, isAuthenticated, isOwner, carregar, router]);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiClient.createTeamMember({
        name: nome.trim(),
        email: email.trim(),
      });

      if (res.invite_email_sent) {
        toast.success(t('equipe.criado', { email: res.member.email }));
      } else {
        // O acesso existe, mas a senha não chegou em ninguém. Aviso longo de
        // propósito: sem gerar outra senha, esse usuário não entra.
        toast.warning(t('equipe.criadoSemEmail'), { duration: 10000 });
      }

      setModalAberto(false);
      setNome('');
      setEmail('');
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('equipe.erroCarregar'));
    } finally {
      setIsSaving(false);
    }
  };

  const remover = async (id: string, nomeMembro: string) => {
    if (!confirm(t('equipe.removerConfirma', { nome: nomeMembro }))) return;
    setAcaoEmCurso(id);
    try {
      await apiClient.removeTeamMember(id);
      toast.success(t('equipe.removido'));
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('equipe.erroCarregar'));
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const reenviar = async (id: string, emailMembro: string) => {
    setAcaoEmCurso(id);
    try {
      const res = await apiClient.resendTeamInvite(id);
      if (res.invite_email_sent) {
        toast.success(t('equipe.reenviado', { email: emailMembro }));
      } else {
        toast.warning(t('equipe.criadoSemEmail'), { duration: 10000 });
      }
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('equipe.erroCarregar'));
    } finally {
      setAcaoEmCurso(null);
    }
  };

  if (authLoading || isLoading) {
    return <Loading text={t('comum.carregando')} />;
  }

  if (!team) {
    return <div className="text-center py-12 text-gray-500">{t('equipe.erroCarregar')}</div>;
  }

  const { seats } = team;
  const plano = getPlanById(seats.plan as PlanId | null);
  const emTrial = seats.status === 'trialing';
  const temBloqueado = team.members.some((m) => m.seat_blocked);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('equipe.titulo')}</h1>
          <p className="text-gray-600 mt-1">{t('equipe.subtitulo')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {t('equipe.assentos', { usados: seats.used, limite: seats.limit })}
          </span>
          <Button
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setModalAberto(true)}
            disabled={!seats.canInvite}
          >
            {t('equipe.adicionar')}
          </Button>
        </div>
      </div>

      {!seats.canInvite && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p>
              {emTrial
                ? t('equipe.limiteTrial')
                : t('equipe.limiteAtingido', {
                    plano: plano?.name ?? '-',
                    limite: seats.limit,
                  })}
            </p>
            <Link
              href="/dashboard/upgrade"
              className="mt-2 inline-block font-medium underline underline-offset-2"
            >
              {t('equipe.verPlanos')}
            </Link>
          </div>
        </div>
      )}

      {temBloqueado && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{t('equipe.avisoBloqueados')}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <LinhaUsuario
          nome={team.owner.name}
          email={team.owner.email}
          etiqueta={t('equipe.dono')}
          etiquetaCor="blue"
          sufixo={team.owner.id === user?.id ? t('equipe.voce') : null}
        />

        {team.members.map((m) => (
          <LinhaUsuario
            key={m.id}
            nome={m.name}
            email={m.email}
            etiqueta={t('equipe.membro')}
            etiquetaCor="gray"
            sufixo={m.id === user?.id ? t('equipe.voce') : null}
            avisos={[
              m.seat_blocked ? { texto: t('equipe.bloqueado'), cor: 'red' as const } : null,
              m.must_change_password
                ? { texto: t('equipe.senhaPendente'), cor: 'amber' as const }
                : null,
              !m.invite_email_sent_at
                ? { texto: t('equipe.convitePendente'), cor: 'amber' as const }
                : null,
            ]}
            acoes={
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  isLoading={acaoEmCurso === m.id}
                  onClick={() => reenviar(m.id, m.email)}
                >
                  {t('equipe.reenviar')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  isLoading={acaoEmCurso === m.id}
                  onClick={() => remover(m.id, m.name)}
                  className="text-red-600 hover:bg-red-50"
                >
                  {t('equipe.remover')}
                </Button>
              </div>
            }
          />
        ))}

        {team.members.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-500">{t('equipe.vazio')}</p>
        )}
      </div>

      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={t('equipe.adicionar')}
      >
        <form onSubmit={criar} className="space-y-4">
          <Input
            label={t('equipe.nome')}
            placeholder={t('equipe.nomePlaceholder')}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <Input
            label={t('equipe.email')}
            type="email"
            placeholder={t('equipe.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <p className="flex items-start gap-2 text-sm text-gray-500">
            <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {t('equipe.subtitulo')}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalAberto(false)}>
              {t('equipe.cancelar')}
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {isSaving ? t('equipe.adicionando') : t('equipe.criar')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

type CorAviso = 'red' | 'amber';

function LinhaUsuario({
  nome,
  email,
  etiqueta,
  etiquetaCor,
  sufixo,
  avisos = [],
  acoes,
}: {
  nome: string;
  email: string;
  etiqueta: string;
  etiquetaCor: 'blue' | 'gray';
  sufixo?: string | null;
  avisos?: ({ texto: string; cor: CorAviso } | null)[];
  acoes?: React.ReactNode;
}) {
  const cores: Record<CorAviso, string> = {
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900">{nome}</span>
          {sufixo && <span className="text-sm text-gray-400">({sufixo})</span>}
          <Badge variant={etiquetaCor === 'blue' ? 'info' : 'default'}>{etiqueta}</Badge>
        </div>
        <p className="text-sm text-gray-500 truncate">{email}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {avisos
            .filter((a): a is { texto: string; cor: CorAviso } => a !== null)
            .map((a) => (
              <span
                key={a.texto}
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${cores[a.cor]}`}
              >
                {a.texto}
              </span>
            ))}
        </div>
      </div>
      {acoes}
    </div>
  );
}
