'use client';

import React, { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Candidate } from '@hunter/core';
import CandidateKanbanCard from './CandidateKanbanCard';

interface CandidatesKanbanColumnProps {
  status: string;
  title: string;
  candidates: Candidate[];
  headerColorClass?: string;
  onCardClick?: (candidate: Candidate) => void;
}

function CandidatesKanbanColumn({
  status,
  title,
  candidates,
  headerColorClass = 'bg-gray-50',
  onCardClick,
}: CandidatesKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] rounded-xl border transition-colors
        ${isOver ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'}
      `}
    >
      <div className={`px-3 py-2.5 rounded-t-xl border-b border-gray-200 ${headerColorClass}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <span className="text-xs font-medium text-gray-400 bg-white/70 px-2 py-0.5 rounded-full">
            {candidates.length}
          </span>
        </div>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        {candidates.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">Nenhum candidato</p>
        )}
        {candidates.map((candidate) => (
          <CandidateKanbanCard
            key={candidate.id}
            candidate={candidate}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(CandidatesKanbanColumn);
