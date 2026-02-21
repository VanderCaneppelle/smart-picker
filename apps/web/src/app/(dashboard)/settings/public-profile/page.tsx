'use client';

import PublicProfileForm from '@/components/settings/PublicProfileForm';

export default function PublicProfileSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Perfil público</h1>
        <p className="text-gray-600 mt-1">
          Configure sua página pública, branding e personalização de e-mails
        </p>
      </div>

      <PublicProfileForm />
    </div>
  );
}
