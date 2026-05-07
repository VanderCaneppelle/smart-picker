'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useOnboarding, ONBOARDING_STEPS } from '@/contexts/OnboardingContext';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPos {
  top: number;
  left: number;
}

const TOOLTIP_W = 320;
const PAD = 12;
const SPOT_PAD = 10;

export function OnboardingTour() {
  const { state, activeTourStepData, nextTourStep, prevTourStep, skipTour } = useOnboarding();
  const router = useRouter();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  const step = activeTourStepData;
  const stepIndex = state.activeTourStep;

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

  // Re-measure on step change (with small delay for page renders)
  useEffect(() => {
    setReady(false);
    setTargetRect(null);
    if (!step) return;

    const t1 = setTimeout(() => { measureTarget(); setReady(true); }, 150);
    const t2 = setTimeout(measureTarget, 600);
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [step, measureTarget]);

  // Calculate tooltip position relative to spotlight
  useEffect(() => {
    if (!step || !tooltipRef.current) return;
    const th = tooltipRef.current.offsetHeight || 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!targetRect) {
      // Centered fallback
      setTooltipPos({
        top: Math.max(PAD, (vh - th) / 2),
        left: Math.max(PAD, (vw - TOOLTIP_W) / 2),
      });
      return;
    }

    const cx = targetRect.left + targetRect.width / 2;
    const cy = targetRect.top + targetRect.height / 2;
    const sr = { // spotlight rect
      top: targetRect.top - SPOT_PAD,
      left: targetRect.left - SPOT_PAD,
      right: targetRect.left + targetRect.width + SPOT_PAD,
      bottom: targetRect.top + targetRect.height + SPOT_PAD,
    };

    let top = 0;
    let left = 0;

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
      case 'top':
      default:
        top = clamp(sr.top - th - 12, PAD, vh - th - PAD);
        left = clamp(cx - TOOLTIP_W / 2, PAD, vw - TOOLTIP_W - PAD);
    }

    setTooltipPos({ top, left });
  }, [targetRect, step, ready]);

  if (!step || stepIndex === null) return null;

  const total = ONBOARDING_STEPS.length;
  const spot = targetRect
    ? {
        x: targetRect.left - SPOT_PAD,
        y: targetRect.top - SPOT_PAD,
        w: targetRect.width + SPOT_PAD * 2,
        h: targetRect.height + SPOT_PAD * 2,
      }
    : null;

  const handleNext = () => {
    if (step.href && !targetRect) {
      router.push(step.href);
    }
    nextTourStep();
  };

  return (
    <>
      {/* SVG dark overlay with optional spotlight cutout */}
      <svg
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1000,
          pointerEvents: spot ? 'none' : 'auto',
        }}
        onClick={spot ? undefined : skipTour}
      >
        <defs>
          <mask id="onb-mask">
            <rect width="100%" height="100%" fill="white" />
            {spot && (
              <rect x={spot.x} y={spot.y} width={spot.w} height={spot.h} rx="10" fill="black" />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={spot ? 'rgba(0,0,0,0.52)' : 'rgba(0,0,0,0.15)'}
          mask={spot ? 'url(#onb-mask)' : undefined}
        />
        {/* Spotlight ring */}
        {spot && (
          <rect
            x={spot.x}
            y={spot.y}
            width={spot.w}
            height={spot.h}
            rx="10"
            fill="none"
            stroke="rgba(16,185,129,0.7)"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_W,
          zIndex: 1001,
        }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-100">
              Primeiros passos · {stepIndex + 1}/{total}
            </p>
            <h3 className="text-white font-bold text-base mt-0.5 leading-snug">{step.title}</h3>
          </div>
          <button
            type="button"
            onClick={skipTour}
            aria-label="Fechar tutorial"
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/15 transition-colors shrink-0 mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? 'w-5 bg-emerald-500'
                    : i < stepIndex
                    ? 'w-1.5 bg-emerald-300'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={skipTour}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Pular tutorial
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={prevTourStep}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              {stepIndex === total - 1 ? 'Concluir' : step.actionLabel}
              {stepIndex < total - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
