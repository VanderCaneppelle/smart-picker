'use client';

import React, { memo, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { AlertTriangle } from 'lucide-react';
import type { Candidate } from '@hunter/core';

interface CandidateKanbanCardProps {
  candidate: Candidate;
  isDragOverlay?: boolean;
  onClick?: (candidate: Candidate) => void;
}

function fitScoreColor(score: number) {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

function CardContent({ candidate }: { candidate: Candidate }) {
  return (
    <>
      {/* Row 1: Name + Fit Score */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm text-gray-900 truncate">{candidate.name}</p>
        {candidate.fit_score != null ? (
          <span className={`text-lg font-bold leading-none shrink-0 ${fitScoreColor(candidate.fit_score)}`}>
            {candidate.fit_score}
          </span>
        ) : (
          <span className="text-sm text-gray-300 shrink-0">—</span>
        )}
      </div>

      {/* Row 2: Experience level */}
      {candidate.experience_level && (
        <span className="inline-block mt-1.5 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {candidate.experience_level}
        </span>
      )}

      {/* Row 3: Compact metrics */}
      {(candidate.resume_rating != null || candidate.answer_quality_rating != null) && (
        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
          {candidate.resume_rating != null && (
            <span>CV: <span className="font-medium text-gray-600">{candidate.resume_rating}/5</span></span>
          )}
          {candidate.resume_rating != null && candidate.answer_quality_rating != null && (
            <span className="text-gray-300">|</span>
          )}
          {candidate.answer_quality_rating != null && (
            <span>Resp: <span className="font-medium text-gray-600">{candidate.answer_quality_rating}/5</span></span>
          )}
        </div>
      )}
    </>
  );
}

function CandidateKanbanCard({ candidate, isDragOverlay, onClick }: CandidateKanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: candidate.id,
    data: { candidate },
  });

  const hadDragRef = useRef(false);

  useEffect(() => {
    if (isDragging) hadDragRef.current = true;
  }, [isDragging]);

  const handleClick = () => {
    if (hadDragRef.current) {
      hadDragRef.current = false;
      return;
    }
    onClick?.(candidate);
  };

  const isFlagged = candidate.status === 'flagged';

  if (isDragOverlay) {
    return (
      <div className="relative bg-white rounded-lg border border-blue-300 p-3 shadow-xl rotate-1 w-[264px]">
        <CardContent candidate={candidate} />
        {isFlagged && <FlaggedCornerBadge />}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      {...attributes}
      {...listeners}
      className={`relative bg-white rounded-lg border p-3
        cursor-grab active:cursor-grabbing
        shadow-sm hover:shadow-md transition-all duration-150
        ${isFlagged ? 'border-orange-300' : 'border-gray-200'}
        ${isDragging ? 'opacity-30' : ''}
      `}
    >
      <CardContent candidate={candidate} />
      {isFlagged && <FlaggedCornerBadge />}
    </div>
  );
}

function FlaggedCornerBadge() {
  return (
    <span className="absolute top-1.5 right-1.5 flex items-center justify-center h-5 w-5 rounded-full bg-red-100">
      <AlertTriangle className="h-3 w-3 text-red-600" />
    </span>
  );
}

export default memo(CandidateKanbanCard);
