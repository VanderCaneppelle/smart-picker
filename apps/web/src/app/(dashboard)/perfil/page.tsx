'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Button, Input, Loading } from '@/components/ui';

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
        toast.error('Erro ao carregar perfil');
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
      toast.success('Perfil atualizado com sucesso');
    } catch {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading text="Carregando perfil..." />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-gray-500">
        Não foi possível carregar seu perfil.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-600 mt-1">Suas informações de recrutador</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <Input
          label="E-mail"
          type="email"
          value={profile.email}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500 -mt-4">
          O e-mail é definido na sua conta e não pode ser alterado aqui.
        </p>

        <Input
          label="Nome completo"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Seu nome"
        />

        <Input
          label="Empresa"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Nome da empresa"
        />

        <Input
          label="Telefone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="(00) 00000-0000"
        />

        <Button
          type="submit"
          isLoading={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
        >
          Salvar alterações
        </Button>
      </form>
    </div>
  );
}
