'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TrendingUp, CheckCircle, XCircle, Loader2, Globe, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { normalizeSlug, validateSlug } from '@/lib/slug';
import { Button } from '@/components/ui';

export default function PublicSlugStep() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [validationError, setValidationError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkAvailability = useCallback(async (value: string) => {
    const validation = validateSlug(value);
    if (!validation.valid) {
      setAvailability('invalid');
      setValidationError(validation.error!);
      return;
    }

    setAvailability('checking');
    try {
      const result = await apiClient.checkSlugAvailability(value);
      if (result.available) {
        setAvailability('available');
        setValidationError('');
      } else {
        setAvailability('taken');
        setValidationError(result.reason || 'Este slug já está em uso');
      }
    } catch {
      setAvailability('idle');
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!slug) {
      setAvailability('idle');
      setValidationError('');
      return;
    }

    const normalized = normalizeSlug(slug);
    if (normalized !== slug) {
      setSlug(normalized);
      return;
    }

    debounceRef.current = setTimeout(() => checkAvailability(normalized), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availability !== 'available') return;

    setIsSaving(true);
    try {
      await apiClient.updateRecruiterSettings({ public_slug: slug });
      toast.success('Slug configurado com sucesso!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar slug');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configure sua página pública</h1>
          <p className="text-gray-600 mt-2">
            Escolha um slug para sua página de recrutador. Candidatos poderão ver suas vagas abertas nessa página.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL da sua página pública <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-0">
                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm whitespace-nowrap">
                  rankea.ai/r/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="seu-slug"
                  className={`flex-1 px-3 py-2 border rounded-r-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    availability === 'available'
                      ? 'border-emerald-500 focus:ring-emerald-500'
                      : availability === 'taken' || availability === 'invalid'
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-sm min-h-[20px]">
                {availability === 'checking' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-gray-500">Verificando disponibilidade...</span>
                  </>
                )}
                {availability === 'available' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-600">Disponível!</span>
                  </>
                )}
                {(availability === 'taken' || availability === 'invalid') && (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">{validationError}</span>
                  </>
                )}
              </div>
            </div>

            {slug && availability === 'available' && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Preview da URL:</span>
                </div>
                <p className="mt-1 text-emerald-700 font-mono text-sm break-all">
                  https://rankea.ai/r/{slug}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                className="flex-1"
              >
                Pular por agora
              </Button>
              <Button
                type="submit"
                disabled={availability !== 'available'}
                isLoading={isSaving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continuar
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Você pode alterar isso depois em Configurações.
        </p>
      </div>
    </div>
  );
}
