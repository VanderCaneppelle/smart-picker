'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Share2, ClipboardCopy, Users } from 'lucide-react';
import { useOnboarding, ONBOARDING_STEPS } from '@/contexts/OnboardingContext';

interface Rect { top: number; left: number; width: number; height: number }
interface Pos { top: number; left: number }

const TOOLTIP_W = 340;
const PAD = 12;
const SPOT_PAD = 10;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Mini mockup shown when share-job target isn't visible
function SharePreview() {
  return (
    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Share2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        <span className="text-xs font-semibold text-emerald-700">Link da vaga (exemplo)</span>
      </div>
      <div className="flex items-center gap-2 bg-white rounded-lg border border-emerald-200 px-3 py-2">
        <span className="text-xs text-gray-500 flex-1 truncate">rankea.ai/jobs/sua-vaga/apply</span>
        <div className="flex items-center gap-1 shrink-0 bg-emerald-100 rounded px-2 py-0.5">
          <ClipboardCopy className="h-3 w-3 text-emerald-600" />
          <span className="text-[10px] font-medium text-emerald-700">Copiar</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-emerald-600">
        Aparecerá em cada vaga criada, direto na listagem e na página da vaga.
      </p>
    </div>
  );
}

// Mini kanban preview shown when review-candidates target isn't visible
function KanbanPreview() {
  const cols = [
    { label: 'Novos', dot: 'bg-blue-400', bar: 'bg-blue-200', count: 2 },
    { label: 'Em Análise', dot: 'bg-violet-400', bar: 'bg-violet-200', count: 2 },
    { label: 'Entrevista', dot: 'bg-amber-400', bar: 'bg-amber-200', count: 1 },
    { label: 'Contratados', dot: 'bg-emerald-400', bar: 'bg-emerald-200', count: 1 },
    { label: 'Encerrados', dot: 'bg-gray-400', bar: 'bg-gray-200', count: 1 },
  ];
  return (
    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Users className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-600">Kanban de candidatos (exemplo)</span>
      </div>
      <div className="space-y-1.5">
        {cols.map((col) => (
          <div key={col.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
            <span className="text-[11px] text-gray-600 w-20 shrink-0">{col.label}</span>
            <div className="flex gap-1 flex-1">
              {Array.from({ length: col.count }).map((_, i) => (
                <div key={i} className={`h-4 flex-1 rounded ${col.bar} border border-gray-200`} />
              ))}
              {Array.from({ length: Math.max(0, 2 - col.count) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-4 flex-1 rounded border border-dashed border-gray-200" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] text-gray-500">
        Aparece assim que os candidatos começarem a se inscrever.
      </p>
    </div>
  );
}

export function OnboardingTour() {
  const { state, activeTourStepData, nextTourStep, prevTourStep, skipTour } = useOnboarding();
  const router = useRouter();
  const pathname = usePathname();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<Pos>({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  const step = activeTourStepData;
  const stepIndex = state.activeTourStep;

  // Navigate to the step's page when the step becomes active
  useEffect(() => {
    if (!step?.navigateTo || pathname === step.navigateTo) return;
    router.push(step.navigateTo);
  }, [step?.navigateTo, pathname, router]);

  const measureTarget = useCallback(() => {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(`[data-onboarding-id="${step.targetId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  // On step change: wait for page to render, then scroll + measure
  useEffect(() => {
    setReady(false);
    setTargetRect(null);
    if (!step) return;

    // Delay scroll so navigation (if any) has time to render the new page
    const tScroll = step.scrollToTarget ? setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-onboarding-id="${step.targetId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500) : undefined;

    const t1 = setTimeout(() => { measureTarget(); setReady(true); }, 400);
    const t2 = setTimeout(measureTarget, 900);
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      if (tScroll) clearTimeout(tScroll);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [step, measureTarget]);

  // Position tooltip near spotlight
  useEffect(() => {
    if (!step || !tooltipRef.current) return;
    const th = tooltipRef.current.offsetHeight || 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!targetRect) {
      setTooltipPos({ top: clamp((vh - th) / 2, PAD, vh - th - PAD), left: clamp((vw - TOOLTIP_W) / 2, PAD, vw - TOOLTIP_W - PAD) });
      return;
    }

    const cx = targetRect.left + targetRect.width / 2;
    const cy = targetRect.top + targetRect.height / 2;
    const sr = {
      top: targetRect.top - SPOT_PAD,
      left: targetRect.left - SPOT_PAD,
      right: targetRect.left + targetRect.width + SPOT_PAD,
      bottom: targetRect.top + targetRect.height + SPOT_PAD,
    };

    let top = 0, left = 0;
    switch (step.tooltipPosition) {
      case 'right':
        top = clamp(cy - th / 2, PAD, vh - th - PAD);
        left = clamp(sr.right + 12, PAD, vw - TOOLTIP_W - PAD);
        break;
      case 'left':
        top = clamp(cy - th / 2, PAD, vh - th - PAD);
        left = clamp(sr.left - TOOLTIP_W - 12, PAD, vw - TOOLTIP_W - PAD);
        break;
      case 'bottom':
        top = clamp(sr.bottom + 12, PAD, vh - th - PAD);
        left = clamp(cx - TOOLTIP_W / 2, PAD, vw - TOOLTIP_W - PAD);
        break;
      default: // top
        top = clamp(sr.top - th - 12, PAD, vh - th - PAD);
        left = clamp(cx - TOOLTIP_W / 2, PAD, vw - TOOLTIP_W - PAD);
    }
    setTooltipPos({ top, left });
  }, [targetRect, step, ready]);

  if (!step || stepIndex === null) return null;

  const total = ONBOARDING_STEPS.length;
  const spot = targetRect
    ? { x: targetRect.left - SPOT_PAD, y: targetRect.top - SPOT_PAD, w: targetRect.width + SPOT_PAD * 2, h: targetRect.height + SPOT_PAD * 2 }
    : null;

  const isLast = stepIndex === total - 1;

  // Preview cards for steps without a visible target
  const previewCard = !targetRect
    ? step.id === 'share-job' ? <SharePreview />
    : step.id === 'review-candidates' ? <KanbanPreview />
    : null
    : null;

  return (
    <>
      {/* SVG overlay with spotlight cutout */}
      <svg
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 1000, pointerEvents: spot ? 'none' : 'auto' }}
      >
        <defs>
          <mask id="onb-mask">
            <rect width="100%" height="100%" fill="white" />
            {spot && <rect x={spot.x} y={spot.y} width={spot.w} height={spot.h} rx="10" fill="black" />}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill={spot ? 'rgba(0,0,0,0.50)' : 'rgba(0,0,0,0.12)'}
          mask={spot ? 'url(#onb-mask)' : undefined}
        />
        {spot && (
          <rect x={spot.x} y={spot.y} width={spot.w} height={spot.h} rx="10"
            fill="none" stroke="rgba(16,185,129,0.75)" strokeWidth="2.5" />
        )}
      </svg>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{ position: 'fixed', top: tooltipPos.top, left: tooltipPos.left, width: TOOLTIP_W, zIndex: 1001 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-100">
              Primeiros passos · {stepIndex + 1}/{total}
            </p>
            <h3 className="text-white font-bold text-base mt-0.5 leading-snug">{step.title}</h3>
          </div>
          <button type="button" onClick={skipTour} aria-label="Fechar tutorial"
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/15 transition-colors shrink-0 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>

          {/* Preview card for steps without visible target */}
          {previewCard}

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIndex ? 'w-5 bg-emerald-500' : i < stepIndex ? 'w-1.5 bg-emerald-300' : 'w-1.5 bg-gray-200'
              }`} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-4 flex items-center justify-between gap-3">
          <button type="button" onClick={skipTour} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Pular tutorial
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button type="button" onClick={prevTourStep}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />Voltar
              </button>
            )}
            <button type="button" onClick={nextTourStep}
              className="flex items-center gap-1 px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
              {isLast ? 'Concluir' : step.actionLabel}
              {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
