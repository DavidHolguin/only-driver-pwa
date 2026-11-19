import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type EmptyStateProps = {
  icon: LucideIcon;
  titulo: string;
  detalle?: string;
  accion?: ReactNode;
  className?: string;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  titulo,
  detalle,
  accion,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-center text-muted-foreground/60">
        <Icon className="w-12 h-12 stroke-[1.5]" />
      </div>
      <div className="space-y-1 max-w-xs">
        <h3 className="text-base font-semibold text-foreground">{titulo}</h3>
        {detalle && (
          <p className="text-sm text-muted-foreground">{detalle}</p>
        )}
      </div>
      {accion && <div className="pt-2">{accion}</div>}
    </div>
  );
};
