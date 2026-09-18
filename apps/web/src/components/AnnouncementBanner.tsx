'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { apiClient, type RecruiterAnnouncement } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'rankea.dismissedAnnouncements';

/**
 * O "fechar" é por navegador (localStorage), não por usuário no banco. É aviso
 * operacional, não mensagem individual: se a pessoa trocar de máquina e vir de novo,
 * o custo é baixo perto de uma tabela de leitura por usuário. Guardamos o id, então
 * um aviso novo sempre aparece mesmo que os anteriores tenham sido fechados.
 */
function lerFechados(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function salvarFechado(id: string) {
  try {
    const atuais = lerFechados();
    if (atuais.includes(id)) return;
    // Mantém só os 50 últimos para o valor não crescer sem limite.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...atuais, id].slice(-50)));
  } catch {
    // Navegador com storage bloqueado: o aviso volta na próxima visita, e tudo bem.
  }
}

const LEVEL_STYLE: Record<string, string> = {
  info: 'border-gray-200 bg-white',
  success: 'border-emerald-200 bg-emerald-50',
  warning: 'border-amber-200 bg-amber-50',
};

export default function AnnouncementBanner() {
  const t = useTranslations();
  const { isLoading } = useAuth();
  const [items, setItems] = useState<RecruiterAnnouncement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(lerFechados());
  }, []);

  // Espera o AuthContext restaurar a sessão. O efeito do filho roda antes do efeito do
  // pai, então sem isto a chamada sai sem token, volta 401 e o aviso some sem aviso.
  useEffect(() => {
    if (isLoading) return;
    apiClient
      .getMyAnnouncements()
      .then((res) => setItems(res.data))
      .catch((err) => {
        // Aviso é acessório: o portal segue normal. Mas não engolimos a causa.
        console.warn('[AnnouncementBanner] não consegui carregar os avisos:', err);
      });
  }, [isLoading]);

  const visiveis = items.filter((a) => !dismissed.includes(a.id));
  if (visiveis.length === 0) return null;

  const fechar = (id: string) => {
    salvarFechado(id);
    setDismissed((d) => [...d, id]);
  };

  return (
    <div className="mb-4 space-y-2">
      {visiveis.map((a) => (
        <div
          key={a.id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${LEVEL_STYLE[a.level] || LEVEL_STYLE.info}`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{a.title}</p>
            <p className="mt-0.5 whitespace-pre-line text-[13px] text-gray-600">{a.body}</p>
          </div>
          {a.dismissible && (
            <button
              type="button"
              onClick={() => fechar(a.id)}
              aria-label={t('comum.fecharAviso')}
              className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
