'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

export type OnboardingStepId =
  | 'profile'
  | 'create-job'
  | 'add-questions'
  | 'share-job'
  | 'review-candidates';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  targetId: string;
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  actionLabel: string;
  href?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete seu perfil',
    description: 'Comece configurando seu perfil e identidade como recrutador.',
    targetId: 'onb-nav-perfil',
    tooltipPosition: 'right',
    actionLabel: 'Ir para Perfil',
    href: '/perfil',
  },
  {
    id: 'create-job',
    title: 'Crie sua primeira vaga',
    description: 'Crie sua primeira vaga para começar a receber candidatos.',
    targetId: 'onb-nav-criar-vaga',
    tooltipPosition: 'right',
    actionLabel: 'Criar Vaga',
    href: '/jobs/new',
  },
  {
    id: 'add-questions',
    title: 'Configure as perguntas',
    description: 'Adicione perguntas estratégicas para automatizar sua triagem de candidatos.',
    targetId: 'onb-job-questions',
    tooltipPosition: 'top',
    actionLabel: 'Entendi',
    href: '/jobs',
  },
  {
    id: 'share-job',
    title: 'Compartilhe sua vaga',
    description: 'Compartilhe este link para começar a receber candidatos.',
    targetId: 'onb-job-share',
    tooltipPosition: 'bottom',
    actionLabel: 'Continuar',
    href: '/jobs',
  },
  {
    id: 'review-candidates',
    title: 'Acompanhe os candidatos',
    description: 'Organize seu processo seletivo movendo candidatos entre as etapas do Kanban.',
    targetId: 'onb-candidates-kanban',
    tooltipPosition: 'top',
    actionLabel: 'Concluir!',
    href: '/jobs',
  },
];

interface OnboardingState {
  completedSteps: OnboardingStepId[];
  dismissed: boolean;
  activeTourStep: number | null;
  hasStarted: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  isStepCompleted: (stepId: OnboardingStepId) => boolean;
  completeStep: (stepId: OnboardingStepId) => void;
  startTour: (fromStep?: number) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  dismissOnboarding: () => void;
  resetOnboarding: () => void;
  completedCount: number;
  totalSteps: number;
  activeTourStepData: OnboardingStep | null;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

function storageKey(userId: string) {
  return `rankea_onboarding_${userId}`;
}

function loadState(userId: string): OnboardingState & { _isNew: boolean } {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return { ...JSON.parse(raw), _isNew: false };
  } catch {}
  return {
    completedSteps: [],
    dismissed: false,
    activeTourStep: null,
    hasStarted: false,
    _isNew: true,
  };
}

function persist(userId: string, state: OnboardingState) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {}
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    completedSteps: [],
    dismissed: false,
    activeTourStep: null,
    hasStarted: false,
  });

  // Load from localStorage and auto-start for new users
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const saved = loadState(user.id);
    const { _isNew, ...base } = saved;

    if (_isNew) {
      // First ever access — start tour
      const fresh: OnboardingState = { ...base, hasStarted: true, activeTourStep: 0 };
      setState(fresh);
      persist(user.id, fresh);
    } else {
      setState({ ...base, activeTourStep: null }); // never restore mid-tour on page load
    }
  }, [isAuthenticated, user?.id]);

  // Auto-detect completed steps from API data
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const detect = async () => {
      const [profileRes, jobsRes] = await Promise.allSettled([
        apiClient.getRecruiterProfile(),
        apiClient.getJobs(),
      ]);

      const auto: OnboardingStepId[] = [];

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value;
        if (p.name && p.company) auto.push('profile');
      }

      if (jobsRes.status === 'fulfilled') {
        const jobs = jobsRes.value.jobs;
        if (jobs.length > 0) {
          auto.push('create-job');
          if (jobs.some((j) => j.application_questions && j.application_questions.length > 0)) {
            auto.push('add-questions');
          }
          const totalCandidates = jobs.reduce((n, j) => n + (j._count?.candidates ?? 0), 0);
          if (totalCandidates > 0) {
            auto.push('share-job');
            auto.push('review-candidates');
          }
        }
      }

      if (auto.length === 0) return;

      setState((prev) => {
        const merged = Array.from(new Set([...prev.completedSteps, ...auto])) as OnboardingStepId[];
        if (merged.length === prev.completedSteps.length) return prev;
        const next = { ...prev, completedSteps: merged };
        persist(user.id!, next);
        return next;
      });
    };

    detect().catch(() => {});
  }, [isAuthenticated, user?.id]);

  const update = useCallback(
    (fn: (prev: OnboardingState) => OnboardingState) => {
      setState((prev) => {
        const next = fn(prev);
        if (user?.id) persist(user.id, next);
        return next;
      });
    },
    [user?.id],
  );

  const isStepCompleted = useCallback(
    (id: OnboardingStepId) => state.completedSteps.includes(id),
    [state.completedSteps],
  );

  const completeStep = useCallback(
    (id: OnboardingStepId) => {
      update((prev) => {
        if (prev.completedSteps.includes(id)) return prev;
        return { ...prev, completedSteps: [...prev.completedSteps, id] };
      });
    },
    [update],
  );

  const startTour = useCallback(
    (fromStep = 0) => update((p) => ({ ...p, activeTourStep: fromStep })),
    [update],
  );

  const nextTourStep = useCallback(() => {
    update((prev) => {
      if (prev.activeTourStep === null) return prev;
      const next = prev.activeTourStep + 1;
      if (next >= ONBOARDING_STEPS.length) return { ...prev, activeTourStep: null };
      return { ...prev, activeTourStep: next };
    });
  }, [update]);

  const prevTourStep = useCallback(() => {
    update((prev) => {
      if (!prev.activeTourStep) return prev;
      return { ...prev, activeTourStep: prev.activeTourStep - 1 };
    });
  }, [update]);

  const skipTour = useCallback(
    () => update((p) => ({ ...p, activeTourStep: null })),
    [update],
  );

  const dismissOnboarding = useCallback(
    () => update((p) => ({ ...p, dismissed: true, activeTourStep: null })),
    [update],
  );

  const resetOnboarding = useCallback(() => {
    update(() => ({
      completedSteps: [],
      dismissed: false,
      activeTourStep: 0,
      hasStarted: true,
    }));
  }, [update]);

  const completedCount = state.completedSteps.length;
  const totalSteps = ONBOARDING_STEPS.length;
  const activeTourStepData =
    state.activeTourStep !== null ? (ONBOARDING_STEPS[state.activeTourStep] ?? null) : null;

  const value = useMemo<OnboardingContextType>(
    () => ({
      state,
      isStepCompleted,
      completeStep,
      startTour,
      nextTourStep,
      prevTourStep,
      skipTour,
      dismissOnboarding,
      resetOnboarding,
      completedCount,
      totalSteps,
      activeTourStepData,
    }),
    [
      state,
      isStepCompleted,
      completeStep,
      startTour,
      nextTourStep,
      prevTourStep,
      skipTour,
      dismissOnboarding,
      resetOnboarding,
      completedCount,
      totalSteps,
      activeTourStepData,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
