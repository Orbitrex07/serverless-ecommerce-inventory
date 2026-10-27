import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect'
}) => {
  const variantClasses = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4'
  };

  return (
    <div
      className={`animate-shimmer bg-[#EFEFEA] ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};
