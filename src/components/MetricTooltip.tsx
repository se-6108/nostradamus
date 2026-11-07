import React from 'react';
import { HelpCircle } from 'lucide-react';

interface MetricTooltipProps {
  label: React.ReactNode;
  title?: string;
  laymanExplanation: string;
  practicalGuide?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  showIcon?: boolean;
}

/**
 * Interactive Hover Tooltip that translates Quantitative Metrics into Plain Everyday Language (Bahasa Awam)
 */
export function MetricTooltip({
  label,
  title,
  laymanExplanation,
  practicalGuide,
  align = 'left',
  className = '',
  showIcon = true
}: MetricTooltipProps) {
  const alignClass =
    align === 'right'
      ? 'right-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0';

  return (
    <span
      className={`relative inline-flex items-center gap-1 group cursor-help border-b border-dotted border-neutral-400/70 hover:border-[#F59E0B] transition-colors ${className}`}
    >
      <span>{label}</span>
      {showIcon && (
        <HelpCircle className="w-3 h-3 text-[#D97706] bb-amber opacity-80 group-hover:opacity-100 shrink-0" />
      )}

      {/* Hover Popover Card */}
      <span
        role="tooltip"
        className={`pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 absolute top-full mt-2 w-72 sm:w-80 p-3 rounded-xs shadow-xl border border-[#F59E0B]/60 bg-[#111315] text-[#F9FAFB] text-left font-normal normal-case tracking-normal leading-relaxed ${alignClass}`}
      >
        {title && (
          <span className="block text-[11px] font-bold text-[#FBBF24] uppercase tracking-wider mb-1">
            {title}
          </span>
        )}
        <span className="block text-xs text-neutral-100 font-medium">
          <strong className="text-[#34D399]">Definisi : </strong>
          {laymanExplanation}
        </span>
        {practicalGuide && (
          <span className="block text-[11px] text-neutral-300 mt-1.5 pt-1.5 border-t border-neutral-700">
            <strong className="text-[#38BDF8]">Cara Baca: </strong>
            {practicalGuide}
          </span>
        )}
      </span>
    </span>
  );
}
