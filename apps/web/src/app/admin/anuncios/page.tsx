'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient, type AdminAnnouncement } from '@/lib/api-client';
import PageHeader from '../PageHeader';

const LEVELS = [
  { value: 'info', label: 'Informação' },
  { value: 'success', label: 'Novidade' },
  { value: 'warning', label: 'Atenção' },
];

const LEVEL_STYLE: Record<string, string> = {
  info: 'border-gray-200 bg-gray-50 text-gray-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [level, setLevel] = useState('info');
  const [dismissible, setDismissible] = useState(true);
  const [endsAt, setEndsAt] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminAnnouncements();
      setItems(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Preencha título e mensagem.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.createAnnouncement({
        title,
        body,
        level,
        dismissible,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      });
      setTitle('');
      setBody('');
      setLevel('info');
      setEndsAt('');
      setDismissible(true);
      toast.success('Aviso publicado.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao publicar');
    } finally {
      setSaving(false);
    }
  };

  const alternar = async (a: AdminAnnouncement) => {
    try {
      await apiClient.updateAnnouncement(a.id, { active: !a.active });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  };

  const remover = async (a: AdminAnnouncement) => {
    if (!window.confirm(`Apagar o aviso "${a.title}"? Isso não volta.`)) return;
    try {
      await apiClient.deleteAnnouncement(a.id);
      toast.success('Aviso apagado.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao apagar');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Avisos"
        description="Mensagens exibidas no topo do portal do recrutador"
      />
      <form onSubmit={criar} className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
          Novo aviso
        </h2>
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            maxLength={120}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mensagem que o recrutador vai ler"
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-[13px]">
              <span className="mb-1 block font-medium text-gray-700">Tipo</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[13px]">
              <span className="mb-1 block font-medium text-gray-700">Some em (opcional)</span>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 pb-2 text-[13px] text-gray-700">
              <input
                type="checkbox"
                checked={dismissible}
                onChange={(e) => setDismissible(e.target.checked)}
                className="rounded border-gray-300"
              />
              Recrutador pode fechar
            </label>
            <button
              type="submit"
              disabled={saving}
              className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-[15px] font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </form>

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
          Avisos
        </h2>
        {loading && <p className="text-sm text-gray-500">Carregando...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-500">Nenhum aviso criado ainda.</p>
        )}
        <div className="space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border p-4 ${a.active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${LEVEL_STYLE[a.level] || LEVEL_STYLE.info}`}
                    >
                      {LEVELS.find((l) => l.value === a.level)?.label || a.level}
                    </span>
                    {!a.active && (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                        Pausado
                      </span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-[13px] text-gray-600">{a.body}</p>
                  <p className="mt-2 text-[12px] text-gray-400">
                    Criado em {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    {a.ends_at && ` · some em ${new Date(a.ends_at).toLocaleDateString('pt-BR')}`}
                    {!a.dismissible && ' · não pode ser fechado'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alternar(a)}
                    className="rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {a.active ? 'Pausar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(a)}
                    className="rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-50"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
