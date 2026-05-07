'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Rocket,
  PartyPopper,
} from 'lucide-react';
import { useOnboarding, ONBOARDING_STEPS, type OnboardingStepId } from '@/contexts/OnboardingContext';

const STEP_LABELS: Record<OnboardingStepId, string> = {
  profile: 'Completar perfil',
  settings: 'Configurar perfil público',
  'create-job': 'Criar primeira vaga',
  'add-questions': 'Adicionar perguntas à vaga',
  'ia-config': 'Configurar avaliação por IA',
  'share-job': 'Compartilhar vaga',
  'review-candidates': 'Analisar candidatos',
};

const STEP_HREF: Partial<Record<OnboardingStepId, string>> = {
  profile: '/perfil',
  settings: '/settings/public-profile',
  'create-job': '/jobs/new',
  'add-questions': '/jobs',
  'ia-config': '/jobs',
  'share-job': '/jobs',
  'review-candidates': '/jobs',
};

export function OnboardingChecklist() {
  const {
    state,
    completedCount,
    totalSteps,
    isStepCompleted,
    completeStep,
    dismissOnboarding,
    startTour,
    resetOnboarding,
  } = useOnboarding();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  if (state.dismissed) return null;

  const percent = Math.round((completedCount / totalSteps) * 100);
  const allDone = completedCount >= totalSteps;

  const handleStartTour = (index: number, id: OnboardingStepId) => {
    if (isStepCompleted(id)) return;
    const href = STEP_HREF[id];
    if (href) router.push(href);
    startTour(index);
  };

  const handleToggleManual = (id: OnboardingStepId) => {
    if (!isStepCompleted(id)) {
      completeStep(id);
    }
  };

  // Completion state
  if (allDone) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
        <div className="px-5 py-5 flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shrink-0">
            <PartyPopper className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base">Tudo pronto!</p>
            <p className="text-sm text-gray-500 mt-1">
              Você completou todos os primeiros passos. Agora é só focar nos candidatos.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => { resetOnboarding(); router.push('/perfil'); }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reiniciar tutorial
            </button>
            <button
              type="button"
              onClick={dismissOnboarding}
              className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Dispensar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shrink-0">
          <Rocket className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Primeiros passos</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {completedCount} de {totalSteps} concluídos · {percent}%
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); dismissOnboarding(); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), dismissOnboarding())}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Ocultar checklist"
          >
            <X className="h-3.5 w-3.5" />
          </div>
          {collapsed ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronUp className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {!collapsed && (
        <>
          {/* Progress bar */}
          <div className="px-5 pb-1">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="px-4 py-2 space-y-0.5">
            {ONBOARDING_STEPS.map((step, i) => {
              const done = isStepCompleted(step.id);
              return (
                <div
                  key={step.id}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    done ? 'opacity-50' : 'hover:bg-emerald-50 group'
                  }`}
                >
                  {/* Clickable checkbox — marks done manually */}
                  <button
                    type="button"
                    aria-label={done ? 'Concluído' : 'Marcar como concluído'}
                    onClick={() => handleToggleManual(step.id)}
                    disabled={done}
                    className={`shrink-0 ${done ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {done
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <Circle className="h-4 w-4 text-gray-300 group-hover:text-emerald-400 transition-colors" />
                    }
                  </button>

                  {/* Label + "Iniciar" — starts the tour */}
                  <button
                    type="button"
                    onClick={() => handleStartTour(i, step.id)}
                    disabled={done}
                    className={`flex-1 flex items-center gap-2 text-left ${done ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className={`text-sm flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-emerald-800'}`}>
                      {STEP_LABELS[step.id]}
                    </span>
                    {!done && (
                      <span className="text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium shrink-0">
                        Iniciar →
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { resetOnboarding(); router.push('/perfil'); }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reiniciar tutorial
            </button>
            <button
              type="button"
              onClick={() => { startTour(0); router.push('/perfil'); }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              Iniciar guia →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
