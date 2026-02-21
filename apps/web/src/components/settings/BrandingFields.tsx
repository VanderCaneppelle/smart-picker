'use client';

import { X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';

const COLOR_PRESETS = [
  { label: 'Esmeralda', value: '#059669' },
  { label: 'Azul', value: '#2563eb' },
  { label: 'Violeta', value: '#7c3aed' },
  { label: 'Rosa', value: '#db2777' },
  { label: 'Laranja', value: '#ea580c' },
  { label: 'Cinza', value: '#475569' },
];

interface BrandingFieldsProps {
  displayName: string;
  headline: string;
  logoUrl: string;
  brandColor: string;
  linkedinUrl: string;
  onDisplayNameChange: (v: string) => void;
  onHeadlineChange: (v: string) => void;
  onLogoUrlChange: (v: string) => void;
  onBrandColorChange: (v: string) => void;
  onLinkedinUrlChange: (v: string) => void;
}

export default function BrandingFields({
  displayName,
  headline,
  logoUrl,
  brandColor,
  onDisplayNameChange,
  onHeadlineChange,
  onLogoUrlChange,
  onBrandColorChange,
  linkedinUrl,
  onLinkedinUrlChange,
}: BrandingFieldsProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Envie um arquivo de imagem');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await apiClient.uploadFile(file, 'logos');
      onLogoUrlChange(result.url);
      toast.success('Logo enviado!');
    } catch {
      toast.error('Falha ao enviar logo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Branding</h3>

      <Input
        label="Nome de exibição"
        value={displayName}
        onChange={(e) => onDisplayNameChange(e.target.value)}
        placeholder="Ex: Vander Talent"
        helperText="Nome que aparece na página pública. Se vazio, usa seu nome ou empresa."
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Headline
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => onHeadlineChange(e.target.value.slice(0, 120))}
          placeholder="Uma frase curta sobre você ou sua empresa"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-400">{headline.length}/120 caracteres</p>
      </div>

      <Input
        label="LinkedIn"
        type="url"
        value={linkedinUrl}
        onChange={(e) => onLinkedinUrlChange(e.target.value)}
        placeholder="https://linkedin.com/company/sua-empresa"
        helperText="Link do perfil ou da empresa. Aparece na página pública para visitantes."
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
        {logoUrl ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <button
              type="button"
              onClick={() => onLogoUrlChange('')}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              Remover
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {isUploading ? (
                <div className="h-5 w-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">
                {isUploading ? 'Enviando...' : 'Enviar logo'}
              </span>
              <p className="text-xs text-gray-400">PNG, JPG ou SVG, máx. 2MB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cor da marca
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => onBrandColorChange(brandColor === value ? '' : value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                brandColor === value
                  ? 'border-gray-900 bg-gray-50 font-medium'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: value }}
              />
              {label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-gray-500">Ou HEX:</label>
          <input
            type="text"
            value={brandColor}
            onChange={(e) => onBrandColorChange(e.target.value)}
            placeholder="#059669"
            className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {brandColor && /^#[0-9a-fA-F]{6}$/.test(brandColor) && (
            <span
              className="w-6 h-6 rounded border border-gray-200"
              style={{ backgroundColor: brandColor }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
