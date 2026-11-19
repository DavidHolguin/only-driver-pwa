import React from 'react';
import { cn } from '../../lib/utils';

export type SkeletonProps = {
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn('bg-secondary animate-pulse rounded-xl', className)}
    />
  );
};
