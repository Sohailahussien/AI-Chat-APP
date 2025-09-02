'use client';

import Image from 'next/image';

interface CubiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'button';
  showText?: boolean;
  className?: string;
  variant?: 'icon' | 'text-only';
}

export default function CubiLogo({ size = 'md', showText = true, className = '', variant = 'icon' }: CubiLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    button: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    button: 'text-xl'
  };

  // Text-only variant
  if (variant === 'text-only') {
    return (
      <div className={`flex items-center ${className}`}>
        <span className={`font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent ${textSizes[size as keyof typeof textSizes]} whitespace-nowrap`}>
          Cubi
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${showText ? 'space-x-2' : ''} ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size as keyof typeof sizeClasses]} flex-shrink-0 flex items-center justify-center mx-auto`}>
        <Image
          src="/logo.png"
          alt="Cubi AI Logo"
          width={180}
          height={180}
          className="w-full h-full object-contain"
          priority
          style={{ background: 'transparent' }}
        />
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent ${textSizes[size as keyof typeof textSizes]} whitespace-nowrap`}>
          Cubi
        </span>
      )}
    </div>
  );
} 