import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption<T extends string | number = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AdminDropdownProps<T extends string | number = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  headerTitle?: string;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  align?: 'left' | 'right';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  dropUp?: boolean;
  id?: string;
}

/**
 * Standardized Admin Dashboard Dropdown component mirroring the "Last 30 Days"
 * sleek dark cybernetic aesthetic with rotating chevron, glowing accent dot,
 * and high-contrast backdrop blur styling.
 */
export function AdminDropdown<T extends string | number = string | number>({
  value,
  onChange,
  options,
  placeholder,
  headerTitle,
  title,
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  align = 'left',
  size = 'md',
  fullWidth = false,
  dropUp = false,
  id,
}: AdminDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keep highlighted index in sync when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, value, options]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder || String(value);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        const target = options[highlightedIndex];
        if (!target.disabled) {
          onChange(target.value);
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  // Size specific stylings matching "Last 30 Days" button
  const heightClass = size === 'sm' ? 'h-7 px-2.5 text-[11px] rounded-lg' : 'h-9 px-3 sm:px-3.5 text-xs rounded-xl';

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`}
      id={id}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        title={title}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`w-full ${heightClass} bg-[#141719] border border-[#1F2225] hover:border-zinc-700 font-semibold text-zinc-300 hover:text-white flex items-center justify-between gap-2 outline-none cursor-pointer select-none transition-all ${
          isOpen ? 'border-[#26F0C4]/40 text-white ring-1 ring-[#26F0C4]/20' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${buttonClassName}`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon && <span className="shrink-0 flex items-center">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0 flex items-center">{selectedOption.icon}</span>}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          size={size === 'sm' ? 10 : 11}
          className={`transition-transform duration-200 text-zinc-500 shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute ${dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} z-50 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${fullWidth ? 'w-full min-w-full' : 'min-w-[150px] w-max max-w-xs'} bg-[#111315]/98 backdrop-blur-xl border border-[#1F2225] rounded-xl shadow-2xl p-1.5 text-left text-xs font-mono transition-all animate-in fade-in-0 zoom-in-95 ${menuClassName}`}
        >
          {headerTitle && (
            <span className="block text-[9px] font-bold text-[#8B929A] px-2.5 py-1 uppercase tracking-wider border-b border-[#1F2225]/40 mb-1.5 select-none">
              {headerTitle}
            </span>
          )}

          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full ${size === 'sm' ? 'h-7 text-[11px]' : 'h-8 text-xs'} px-2.5 rounded-lg text-left transition-colors font-medium border-none cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-[#26F0C4]/10 text-[#26F0C4]'
                      : isHighlighted
                      ? 'bg-white/5 text-white'
                      : 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
                  } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-[10px] text-zinc-500 font-normal">({option.sublabel})</span>
                    )}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 bg-[#26F0C4] rounded-full shrink-0 shadow-[0_0_6px_#26F0C4]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDropdown;
