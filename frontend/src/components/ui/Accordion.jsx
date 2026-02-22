import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Accordion({ title, badge, defaultOpen = false, actions, children, className }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/80 hover:bg-gray-100/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronDown
            className={cn(
              'h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
          <span className="font-semibold text-gray-900 truncate">{title}</span>
          {badge != null && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {badge}
            </span>
          )}
        </div>

        {/* Action buttons (stop propagation so clicking them doesn't toggle) */}
        {actions && (
          <div className="flex items-center gap-2 ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </button>

      {/* Body */}
      <div
        className={cn(
          'transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="border-t border-gray-100">{children}</div>
      </div>
    </div>
  );
}
