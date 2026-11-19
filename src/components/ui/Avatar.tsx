import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export type AvatarProps = {
  nombre: string;
  size?: 'sm' | 'md' | 'lg';
  fotoUrl?: string;
  className?: string;
};

const sizeClasses = {
  sm: 'w-10 h-10 text-[14px]',
  md: 'w-14 h-14 text-[18px]',
  lg: 'w-20 h-20 text-[28px]',
};

function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function isValidOwnDomain(url?: string): boolean {
  if (!url) return false;
  // Solo fotos servidas por nosotros: bucket de evidencias o el sitio de la marca.
  try {
    const host = new URL(url, window.location.origin).hostname;
    return (
      host.endsWith('onlyhome.co') ||
      host.endsWith('prometheuslabs.com.co') ||
      host.includes('supabase.co')
    );
  } catch {
    return false;
  }
}

export const Avatar: React.FC<AvatarProps> = ({
  nombre,
  size = 'md',
  fotoUrl,
  className,
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(nombre);
  const canShowImage = Boolean(fotoUrl) && isValidOwnDomain(fotoUrl) && !imgError;

  return (
    <div
      role="img"
      aria-label={nombre || 'Avatar'}
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 overflow-hidden font-semibold select-none bg-primary/10 text-primary',
        sizeClasses[size],
        className
      )}
    >
      {canShowImage ? (
        <img
          src={fotoUrl}
          alt={nombre}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
