import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export type OfflineBannerProps = {
  className?: string;
};

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ className }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        'w-full bg-[hsl(var(--health-warn))]/10 text-amber-900 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-medium',
        className
      )}
    >
      <WifiOff className="w-4 h-4 text-amber-800 shrink-0" />
      <span>Sin conexión — los cambios se guardan en el teléfono</span>
    </div>
  );
};
