'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Candidate, CandidateStatus } from '@hunter/core';
import CandidatesKanbanColumn from './CandidatesKanbanColumn';
import CandidateKanbanCard from './CandidateKanbanCard';
import CandidateDrawer from './CandidateDrawer';

const MAIN_COLUMNS: { status: CandidateStatus; title: string; headerColor: string }[] = [
  { status: 'new', title: 'Novos', headerColor: 'bg-gray-50' },
  { status: 'reviewing', title: 'Em Análise', headerColor: 'bg-blue-50' },
  { status: 'shortlisted', title: 'Pré-selecionados', headerColor: 'bg-purple-50' },
  { status: 'schedule_interview', title: 'Agendar Entrevista', headerColor: 'bg-orange-50' },
  { status: 'hired', title: 'Contratados', headerColor: 'bg-green-50' },
];

const SECONDARY_COLUMNS: { status: CandidateStatus; title: string; headerColor: string }[] = [
  { status: 'flagged', title: 'Flagged', headerColor: 'bg-red-50' },
  { status: 'rejected', title: 'Rejeitados', headerColor: 'bg-neutral-100' },
];

const ALL_STATUSES = [...MAIN_COLUMNS, ...SECONDARY_COLUMNS].map((c) => c.status);

interface CandidatesKanbanBoardProps {
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
}

export default function CandidatesKanbanBoard({
  candidates,
  setCandidates,
}: CandidatesKanbanBoardProps) {
  const [activeDragCandidate, setActiveDragCandidate] = useState<Candidate | null>(null);
  const [showEliminated, setShowEliminated] = useState(false);
  const [drawerCandidateId, setDrawerCandidateId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const grouped = useMemo(() => {
    const map: Record<string, Candidate[]> = {};
    for (const s of ALL_STATUSES) map[s] = [];
    for (const c of candidates) {
      if (map[c.status]) map[c.status].push(c);
    }
    return map;
  }, [candidates]);

  const drawerCandidate = useMemo(
    () => (drawerCandidateId ? candidates.find((c) => c.id === drawerCandidateId) ?? null : null),
    [candidates, drawerCandidateId],
  );

  const handleStatusChange = useCallback(
    async (candidateId: string, newStatus: CandidateStatus) => {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (!candidate || candidate.status === newStatus) return;

      const oldStatus = candidate.status;

      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c)),
      );

      try {
        await apiClient.updateCandidate(candidateId, { status: newStatus });
        toast.success('Status atualizado');
      } catch {
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, status: oldStatus } : c)),
        );
        toast.error('Falha ao atualizar status');
      }
    },
    [candidates, setCandidates],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const candidate = event.active.data.current?.candidate as Candidate | undefined;
    if (candidate) setActiveDragCandidate(candidate);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragCandidate(null);
      const { active, over } = event;
      if (!over) return;
      handleStatusChange(active.id as string, over.id as CandidateStatus);
    },
    [handleStatusChange],
  );

  const handleCardClick = useCallback((candidate: Candidate) => {
    setDrawerCandidateId(candidate.id);
  }, []);

  const visibleColumns = showEliminated
    ? [...MAIN_COLUMNS, ...SECONDARY_COLUMNS]
    : MAIN_COLUMNS;

  return (
    <>
      {/* Toggle to show eliminated candidates */}
      <div className="flex items-center justify-end mb-3">
        <label className="flex items-center gap-2.5 text-sm text-gray-600 select-none cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={showEliminated}
            onClick={() => setShowEliminated((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors
              ${showEliminated ? 'bg-blue-600' : 'bg-gray-200'}
            `}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform
                ${showEliminated ? 'translate-x-[18px]' : 'translate-x-[2px]'}
              `}
            />
          </button>
          Exibir candidatos eliminados
        </label>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {visibleColumns.map((col) => (
            <CandidatesKanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              candidates={grouped[col.status]}
              headerColorClass={col.headerColor}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragCandidate ? (
            <CandidateKanbanCard candidate={activeDragCandidate} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Drawer */}
      {drawerCandidate && (
        <CandidateDrawer
          candidate={drawerCandidate}
          onClose={() => setDrawerCandidateId(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}
