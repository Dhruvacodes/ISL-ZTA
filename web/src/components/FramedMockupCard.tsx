import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FramedMockupCardProps {
  children: React.ReactNode;
  caption: string;
  subcaption?: string;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
  activeVariant?: number;
  totalVariants?: number;
}

export const FramedMockupCard: React.FC<FramedMockupCardProps> = ({
  children,
  caption,
  subcaption,
  onPrev,
  onNext,
  className = '',
  activeVariant,
  totalVariants,
}) => {
  return (
    <div className={`relative flex flex-col group ${className}`}>
      {/* Outer blurred iridescent glow aura */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/15 via-purple-500/20 to-pink-500/15 opacity-75 blur-xl group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Signature pastel gradient outer frame hairline border */}
      <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-b from-indigo-300/35 via-purple-300/20 to-pink-300/25 shadow-2xl">
        {/* Inner near-black solid panel */}
        <div className="rounded-[calc(1rem-1px)] bg-[#0B0B11]/95 backdrop-blur-xl p-5 md:p-6 text-gray-100 overflow-hidden border border-white/5">
          {children}
        </div>
      </div>

      {/* Caption row with left/right arrows */}
      <div className="mt-3 flex items-center justify-between px-2 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80 animate-pulse" />
          <span className="font-medium text-gray-300 tracking-wide">{caption}</span>
          {subcaption && <span className="text-gray-500 hidden sm:inline">• {subcaption}</span>}
        </div>

        {(onPrev || onNext) && (
          <div className="flex items-center space-x-1">
            {activeVariant !== undefined && totalVariants !== undefined && (
              <span className="text-[11px] text-gray-500 mr-2 font-mono">
                {activeVariant + 1} / {totalVariants}
              </span>
            )}
            <button
              onClick={onPrev}
              disabled={!onPrev}
              aria-label="Previous view"
              className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={onNext}
              disabled={!onNext}
              aria-label="Next view"
              className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
