import React from 'react';

/**
 * Loading Skeleton Components
 * Beautiful skeleton loaders for better UX during loading states
 */

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] rounded ${className}`}
       style={{ animation: 'shimmer 2s infinite linear' }} />
);

export const MessageSkeleton: React.FC = () => (
  <div className="flex justify-start mb-10">
    <div className="flex max-w-[85%] flex-row items-start gap-6">
      {/* Avatar skeleton */}
      <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />

      <div className="flex flex-col gap-2 w-full">
        {/* Message bubble skeleton */}
        <div className="bg-black/60 p-8 rounded-[2rem] rounded-tl-sm border border-white/10 space-y-3 min-w-[400px]">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  </div>
);

export const SessionSkeleton: React.FC = () => (
  <div className="bg-black/40 border border-white/5 rounded-2xl p-6 animate-pulse">
    <div className="flex items-center gap-3 mb-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-5 w-32" />
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <div className="flex gap-2 mt-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
);

export const RegistryItemSkeleton: React.FC = () => (
  <div className="bg-black/40 border border-white/5 rounded-2xl p-6 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-4/5 mb-3" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/5 animate-pulse">
    <Skeleton className="h-4 w-24 mb-3" />
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-3 w-32" />
  </div>
);

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-emerald-500 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

export const LoadingDots: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex space-x-2 ${className}`}>
    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export const FileUploadLoader: React.FC<{ filename: string; progress?: number }> = ({
  filename,
  progress = 0
}) => (
  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 mb-2">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-emerald-400 truncate max-w-[200px]">{filename}</span>
      <span className="text-xs text-emerald-300">{progress}%</span>
    </div>
    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 bg-black/40 rounded-xl">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/5" />
      </div>
    ))}
  </div>
);

// Add shimmer animation to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
document.head.appendChild(style);
