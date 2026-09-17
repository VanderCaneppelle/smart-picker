'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

const OPCOES = [
  { valor: 'pt' as const, rotulo: 'Português (Brasil)' },
  { valor: 'en' as const, rotulo: 'English' },
];

/**
 * Uma preferência só, valendo para os três lugares. Separar "idioma da interface" de
 * "idioma dos e-mails" seria oferecer ao usuário uma decisão que ele não quer tomar,
 * e criaria o caso absurdo de painel em inglês mandando e-mail em português.
 */
export function LanguageSetting() {
  const t = useTranslations('app.idioma');
  const [locale, setLocale] = useState<'pt' | 'en'>('pt');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    apiClient
      .getRecruiterProfile()
      .then((p) => {
        const l = (p as { locale?: string }).locale;
        if (l === 'en' || l === 'pt') setLocale(l);
      })
      .catch(() => {});
  }, []);

  const trocar = async (novo: 'pt' | 'en') => {
    if (novo === locale || salvando) return;
    const anterior = locale;
    setLocale(novo);
    setSalvando(true);
    try {
      await apiClient.updateRecruiterProfile({ locale: novo });
      toast.success(t('salvo'));
      // Recarrega para a interface inteira assumir o idioma novo de uma vez.
      window.location.reload();
    } catch {
      setLocale(anterior);
      toast.error(t('erro'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-medium text-gray-900">{t('titulo')}</h3>
      <p className="mt-1 text-[13px] text-gray-500">{t('descricao')}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {OPCOES.map((o) => (
          <button
            key={o.valor}
            type="button"
            onClick={() => trocar(o.valor)}
            disabled={salvando}
            className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors disabled:opacity-60 ${
              locale === o.valor
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}
