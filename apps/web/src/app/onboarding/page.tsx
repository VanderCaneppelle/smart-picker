'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Loading } from '@/components/ui';
import PublicSlugStep from '@/components/onboarding/PublicSlugStep';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [checkingSlug, setCheckingSlug] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    apiClient
      .getRecruiterProfile()
      .then((profile) => {
        if (profile.public_slug) {
          router.push('/dashboard');
        } else {
          setCheckingSlug(false);
        }
      })
      .catch(() => {
        setCheckingSlug(false);
      });
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || checkingSlug) {
    return <Loading fullScreen text="Carregando..." />;
  }

  return <PublicSlugStep />;
}
