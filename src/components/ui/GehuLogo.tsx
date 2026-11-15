import { useState } from 'react';

interface GehuLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Official Graphic Era Hill University (GEHU) Logo Component
 * Renders the untouched uploaded university emblem from /gehu-logo.png
 * inside a clean white frame preserving its original aspect ratio.
 */
export function GehuLogo({ size = 'md', className = '' }: GehuLogoProps) {
  const [missingFile, setMissingFile] = useState(false);

  const sizeClasses =
    size === 'sm' ? 'h-9 w-auto' : size === 'lg' ? 'h-16 w-auto' : 'h-11 w-auto';

  if (missingFile) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shrink-0 ${className}`}
        title="Place official logo at public/gehu-logo.png"
      >
        <span className="font-display text-xs font-bold tracking-tight text-slate-900 whitespace-nowrap">
          GEHU
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center bg-white rounded-lg p-1 shrink-0 ${className}`}
    >
      <img
        src="/gehu-logo.png"
        alt="Graphic Era Hill University Official Logo"
        onError={() => setMissingFile(true)}
        className={`${sizeClasses} max-w-full object-contain block`}
      />
    </div>
  );
}
