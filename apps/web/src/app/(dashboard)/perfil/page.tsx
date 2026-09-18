'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Button, Input, Loading } from '@/components/ui';
import { LanguageSetting } from '@/components/settings/LanguageSetting';
import { useTranslations } from 'next-intl';

interface RecruiterProfile {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export default function PerfilPage() {
  const t = useTranslations();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    apiClient
      .getRecruiterProfile()
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setCompany(data.company || '');
        setPhoneNumber(data.phone_number || '');
      })
      .catch(() => {
        toast.error(t('perfil.erroCarregar'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = await apiClient.updateRecruiterProfile({
        name: name.trim(),
        company: company.trim() || null,
        phone_number: phoneNumber.trim() || null,
      });
      setProfile(updated);
      toast.success(t('perfil.atualizado'));
    } catch {
      toast.error(t('perfil.erroAtualizar'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading text={t('perfil.carregando')} />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-gray-500">{t('perfil.naoCarregou')}</div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('perfil.titulo')}</h1>
        <p className="text-gray-600 mt-1">{t('perfil.subtitulo')}</p>
      </div>

      <div className="mb-6">
        <LanguageSetting />
      </div>

      <div className="mb-6">
        <Link
          href="/settings/subscription"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <span>{t('perfil.gerenciarAssinatura')}</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <Input
          label={t('perfil.email')}
          type="email"
          value={profile.email}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500 -mt-4">{t('perfil.emailFixo')}</p>

        <Input
          label={t('perfil.nome')}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={t('perfil.nomePlaceholder')}
        />

        <Input
          label={t('perfil.empresa')}
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={t('perfil.empresaPlaceholder')}
        />

        <Input
          label={t('perfil.telefone')}
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t('perfil.telefonePlaceholder')}
        />

        <Button
          type="submit"
          isLoading={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
        >{t('perfil.salvar')}</Button>
      </form>
    </div>
  );
}
