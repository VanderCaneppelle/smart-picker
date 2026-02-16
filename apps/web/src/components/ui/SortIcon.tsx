'use client';

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortIconProps {
  direction: 'asc' | 'desc' | null;
  className?: string;
}

const SortIcon = ({ direction, className = '' }: SortIconProps) => {
  if (direction === 'asc') {
    return <ArrowUp className={`h-4 w-4 ${className}`} />;
  }
  if (direction === 'desc') {
    return <ArrowDown className={`h-4 w-4 ${className}`} />;
  }
  return <ArrowUpDown className={`h-4 w-4 text-gray-400 ${className}`} />;
};

export default SortIcon;
