'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Globe, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiClient, type RecruiterSettings } from '@/lib/api-client';
import { normalizeSlug, validateSlug } from '@/lib/slug';
import { Button, Loading } from '@/components/ui';
import BrandingFields from './BrandingFields';
import EmailPersonalizationFields from './EmailPersonalizationFields';

export default function PublicProfileForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<RecruiterSettings | null>(null);

  // Public page
  const [slug, setSlug] = useState('');
  const [slugAvailability, setSlugAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'current'>('idle');
  const [slugError, setSlugError] = useState('');
  const [publicPageEnabled, setPublicPageEnabled] = useState(false);

  // Branding
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Email
  const [senderName, setSenderName] = useState('');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [emailSignature, setEmailSignature] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalSlug = useRef<string | null>(null);

  useEffect(() => {
    apiClient
      .getRecruiterSettings()
      .then((data) => {
        setSettings(data);
        setSlug(data.public_slug || '');
        originalSlug.current = data.public_slug;
        setPublicPageEnabled(data.public_page_enabled);
        setDisplayName(data.public_display_name || '');
        setHeadline(data.public_headline || '');
        setLogoUrl(data.public_logo_url || '');
        setBrandColor(data.brand_color || '');
        setLinkedinUrl(data.public_linkedin_url || '');
        setSenderName(data.email_sender_name || '');
        setReplyToEmail(data.reply_to_email || '');
        setEmailSignature(data.email_signature || '');

        if (data.public_slug) setSlugAvailability('current');
      })
      .catch(() => toast.error('Erro ao carregar configurações'))
      .finally(() => setIsLoading(false));
  }, []);

  const checkSlug = useCallback(async (value: string) => {
    if (value === originalSlug.current) {
      setSlugAvailability('current');
      setSlugError('');
      return;
    }

    const validation = validateSlug(value);
    if (!validation.valid) {
      setSlugAvailability('invalid');
      setSlugError(validation.error!);
      return;
    }

    setSlugAvailability('checking');
    try {
      const result = await apiClient.checkSlugAvailability(value);
      if (result.available) {
        setSlugAvailability('available');
        setSlugError('');
      } else {
        setSlugAvailability('taken');
        setSlugError(result.reason || 'Este slug já está em uso');
      }
    } catch {
      setSlugAvailability('idle');
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!slug) {
      setSlugAvailability('idle');
      setSlugError('');
      return;
    }

    const normalized = normalizeSlug(slug);
    if (normalized !== slug) {
      setSlug(normalized);
      return;
    }

    debounceRef.current = setTimeout(() => checkSlug(normalized), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug, checkSlug]);

  const handleTogglePublicPage = (enabled: boolean) => {
    if (enabled && !slug) {
      toast.error('Defina um slug antes de ativar a página pública');
      return;
    }
    setPublicPageEnabled(enabled);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {};

      if (slug && slug !== originalSlug.current) {
        if (slugAvailability !== 'available') {
          toast.error('Verifique a disponibilidade do slug');
          setIsSaving(false);
          return;
        }
        payload.public_slug = slug;
      }

      payload.public_page_enabled = publicPageEnabled;
      payload.public_display_name = displayName.trim() || null;
      payload.public_headline = headline.trim() || null;
      payload.public_logo_url = logoUrl || null;
      payload.brand_color = brandColor && /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : null;
      payload.public_linkedin_url = linkedinUrl.trim() || null;
      payload.email_sender_name = senderName.trim() || null;
      payload.reply_to_email = replyToEmail.trim() || null;
      payload.email_signature = emailSignature.trim() || null;

      const updated = await apiClient.updateRecruiterSettings(payload as Partial<RecruiterSettings>);
      setSettings(updated);
      setPublicPageEnabled(updated.public_page_enabled);
      originalSlug.current = updated.public_slug;
      if (updated.public_slug) setSlugAvailability('current');
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading text="Carregando configurações..." />;
  if (!settings) return <div className="text-center py-12 text-gray-500">Erro ao carregar configurações.</div>;

  const slugOk = slugAvailability === 'available' || slugAvailability === 'current';

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Public Page Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Página pública</h2>
            <p className="text-sm text-gray-500">Configure seu perfil público de recrutador</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Ativar página pública</p>
              <p className="text-xs text-gray-500 mt-0.5">Candidatos poderão ver suas vagas abertas</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={publicPageEnabled}
              onClick={() => handleTogglePublicPage(!publicPageEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                publicPageEnabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  publicPageEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da página pública
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
                  slugAvailability === 'available' || slugAvailability === 'current'
                    ? 'border-emerald-500 focus:ring-emerald-500'
                    : slugAvailability === 'taken' || slugAvailability === 'invalid'
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-emerald-500'
                }`}
              />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-sm min-h-[20px]">
              {slugAvailability === 'checking' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                  <span className="text-gray-500">Verificando...</span>
                </>
              )}
              {slugAvailability === 'available' && (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Disponível!</span>
                </>
              )}
              {slugAvailability === 'current' && (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Seu slug atual</span>
                </>
              )}
              {(slugAvailability === 'taken' || slugAvailability === 'invalid') && (
                <>
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-600">{slugError}</span>
                </>
              )}
            </div>
          </div>

          {/* Preview link */}
          {slug && slugOk && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-mono">
                https://rankea.ai/r/{slug}
              </span>
              {publicPageEnabled && (
                <a
                  href={`/r/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Abrir <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Branding Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <BrandingFields
          displayName={displayName}
          headline={headline}
          logoUrl={logoUrl}
          brandColor={brandColor}
          linkedinUrl={linkedinUrl}
          onDisplayNameChange={setDisplayName}
          onHeadlineChange={setHeadline}
          onLogoUrlChange={setLogoUrl}
          onBrandColorChange={setBrandColor}
          onLinkedinUrlChange={setLinkedinUrl}
        />
      </section>

      {/* Email Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <EmailPersonalizationFields
          senderName={senderName}
          replyToEmail={replyToEmail}
          signature={emailSignature}
          onSenderNameChange={setSenderName}
          onReplyToEmailChange={setReplyToEmail}
          onSignatureChange={setEmailSignature}
        />
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
        >
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
