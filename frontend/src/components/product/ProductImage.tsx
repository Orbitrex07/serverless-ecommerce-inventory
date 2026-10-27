import React, { useState } from 'react';
import { Headphones, Keyboard, Armchair, Monitor, Zap, Box } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  productId: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  productId,
  className = '',
  aspectRatio = 'square'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-[4/3]',
    portrait: 'aspect-[3/4]',
    auto: 'h-full w-full'
  };

  // Distinct stylized vector fallbacks for known catalogue items
  const renderFallbackIcon = () => {
    switch (productId) {
      case 'prod-101':
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center text-blue-600">
            <Headphones className="w-16 h-16 stroke-[1.25] mb-2" />
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">AuraFlow Acoustic</span>
          </div>
        );
      case 'prod-102':
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center text-indigo-600">
            <Keyboard className="w-16 h-16 stroke-[1.25] mb-2" />
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">KeyForge 75% CNC</span>
          </div>
        );
      case 'prod-103':
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center text-emerald-600">
            <Armchair className="w-16 h-16 stroke-[1.25] mb-2" />
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">ErgoPro High-Back</span>
          </div>
        );
      case 'prod-104':
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center text-amber-600">
            <Monitor className="w-16 h-16 stroke-[1.25] mb-2" />
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">UltraView 4K UHD</span>
          </div>
        );
      case 'prod-105':
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center text-rose-600">
            <Zap className="w-16 h-16 stroke-[1.25] mb-2" />
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">SpeedCharge 100W GaN</span>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-500">
            <Box className="w-16 h-16 stroke-[1.25] mb-2" />
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">Hardware & Gear</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-[#F2F1EB] rounded-xl flex items-center justify-center ${aspectClasses[aspectRatio]} ${className}`}
    >
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-shimmer bg-[#ECEAE3] z-0" />
      )}

      {/* Fallback Display if image errored */}
      {hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F5F4EE] to-[#E9E7E0]">
          {renderFallbackIcon()}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
