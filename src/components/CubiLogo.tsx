'use client';

interface CubiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'icon' | 'text-only';
}

export default function CubiLogo({ size = 'md', showText = true, className = '', variant = 'icon' }: CubiLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  // Text-only variant
  if (variant === 'text-only') {
    return (
      <div className={`flex items-center ${className}`}>
        <span className={`font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent ${textSizes[size]} whitespace-nowrap`}>
          Cubi
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${showText ? 'space-x-2' : ''} ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg
          viewBox="0 0 60 60"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagonal Speech Bubble with proper tail */}
          <path
            d="M10 15 L20 10 L40 10 L50 15 L50 30 L40 35 L20 35 L10 30 Z M20 35 L30 42 L40 35"
            stroke="url(#blueGradient)"
            strokeWidth="2"
            fill="none"
          />
          
          {/* 3D Cube inside speech bubble - Centered and properly sized */}
          <g transform="translate(17, 14)">
            {/* Back face */}
            <path
              d="M2 2 L8 2 L8 8 L2 8 Z"
              stroke="url(#blueGradient)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Front face */}
            <path
              d="M5 0 L11 0 L11 6 L5 6 Z"
              stroke="url(#blueGradient)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Connecting lines */}
            <line x1="2" y1="2" x2="5" y2="0" stroke="url(#blueGradient)" strokeWidth="1.5" />
            <line x1="8" y1="2" x2="11" y2="0" stroke="url(#blueGradient)" strokeWidth="1.5" />
            <line x1="8" y1="8" x2="11" y2="6" stroke="url(#blueGradient)" strokeWidth="1.5" />
            <line x1="2" y1="8" x2="5" y2="6" stroke="url(#blueGradient)" strokeWidth="1.5" />
          </g>
          
          {/* Circuit board lines - More accurate positioning */}
          <g transform="translate(50, 10)">
            <line x1="0" y1="0" x2="6" y2="0" stroke="url(#blueGradient)" strokeWidth="2" />
            <circle cx="8" cy="0" r="1.5" fill="url(#blueGradient)" />
          </g>
          <g transform="translate(50, 20)">
            <line x1="0" y1="0" x2="6" y2="0" stroke="url(#blueGradient)" strokeWidth="2" />
            <circle cx="8" cy="0" r="1.5" fill="url(#blueGradient)" />
          </g>
          <g transform="translate(50, 30)">
            <line x1="0" y1="0" x2="6" y2="0" stroke="url(#blueGradient)" strokeWidth="2" />
            <circle cx="8" cy="0" r="1.5" fill="url(#blueGradient)" />
          </g>
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent ${textSizes[size]} whitespace-nowrap`}>
          Cubi
        </span>
      )}
    </div>
  );
} 