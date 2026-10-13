import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

interface MfaCodeBoxesProps {
  value: string[];
  onChange: (index: number, val: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  authStatus: 'idle' | 'loading' | 'success' | 'error';
  disabled?: boolean;
  label?: string;
  subLabel?: React.ReactNode;
  errorMessage?: string | null;
}

export const MfaCodeBoxes: React.FC<MfaCodeBoxesProps> = ({
  value,
  onChange,
  onKeyDown,
  inputRefs,
  authStatus,
  disabled = false,
  label = 'Enter 6-Digit Passkey',
  subLabel,
  errorMessage
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Group into two trios for clean visual cadence: [0, 1, 2] and [3, 4, 5]
  const firstTrio = [0, 1, 2];
  const secondTrio = [3, 4, 5];

  const enteredCount = value.filter(Boolean).length;

  const renderInputBox = (idx: number) => {
    const digit = value[idx] || '';
    const isFocused = focusedIndex === idx;
    const isError = authStatus === 'error';
    const isSuccess = authStatus === 'success';
    const isLoading = authStatus === 'loading';

    // State-based styling
    let borderAndRing = 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-750';

    if (isError) {
      borderAndRing = 'border-rose-500 bg-rose-950/30 text-rose-300 ring-2 ring-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
    } else if (isSuccess) {
      borderAndRing = 'border-emerald-500 bg-emerald-950/30 text-emerald-300 ring-2 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]';
    } else if (isLoading) {
      borderAndRing = 'border-sky-500/50 bg-slate-900/90 text-sky-200 ring-1 ring-sky-500/20';
    } else if (isFocused) {
      borderAndRing = 'border-slate-200 bg-slate-900 text-white ring-2 ring-white/15 shadow-[0_0_18px_rgba(255,255,255,0.08)] scale-[1.03]';
    } else if (digit) {
      borderAndRing = 'border-slate-600 bg-slate-900/90 text-white shadow-sm';
    }

    return (
      <div key={idx} className="relative">
        <input
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          value={digit}
          disabled={disabled || isLoading}
          onFocus={() => setFocusedIndex(idx)}
          onBlur={() => setFocusedIndex(null)}
          onChange={(e) => onChange(idx, e.target.value)}
          onKeyDown={(e) => onKeyDown(idx, e)}
          className={`w-10 sm:w-12 h-12 sm:h-14 rounded-xl border text-center font-mono text-xl sm:text-2xl font-bold tracking-tight transition-all duration-200 select-none focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${borderAndRing}`}
          aria-label={`Digit ${idx + 1}`}
        />

        {/* Empty focused pulsing caret indicator */}
        {isFocused && !digit && !isError && !isSuccess && (
          <span className="pointer-events-none absolute inset-x-0 bottom-2.5 mx-auto w-4 h-0.5 bg-white/70 rounded-full animate-pulse" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top Label & Contextual Sublabel */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        {subLabel && <div className="text-slate-400">{subLabel}</div>}
      </div>

      {/* Main Container with Shake and Success Animations */}
      <motion.div
        animate={
          authStatus === 'error'
            ? {
                x: [0, -9, 9, -7, 7, -4, 4, 0],
                transition: { duration: 0.45, ease: 'easeInOut' }
              }
            : authStatus === 'success'
            ? {
                scale: [1, 1.03, 1],
                transition: { duration: 0.35, ease: 'easeOut' }
              }
            : {}
        }
        className="flex items-center justify-center gap-1.5 sm:gap-2.5 py-1"
      >
        {/* Trio 1 (Digits 1, 2, 3) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {firstTrio.map((idx) => renderInputBox(idx))}
        </div>

        {/* Elegant Group Separator / Hyphen */}
        <div className="flex items-center justify-center px-0.5 sm:px-1">
          <div
            className={`w-2 sm:w-3 h-0.5 rounded-full transition-colors duration-200 ${
              authStatus === 'error'
                ? 'bg-rose-500/60'
                : authStatus === 'success'
                ? 'bg-emerald-500/60'
                : authStatus === 'loading'
                ? 'bg-sky-500/60 animate-pulse'
                : 'bg-slate-700/80'
            }`}
          />
        </div>

        {/* Trio 2 (Digits 4, 5, 6) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {secondTrio.map((idx) => renderInputBox(idx))}
        </div>
      </motion.div>

      {/* Reactive Visual Feedback Animation Banner */}
      <div className="min-h-[26px]">
        <AnimatePresence mode="wait">
          {authStatus === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center gap-1.5 text-xs text-sky-400 font-medium py-1 px-2.5 rounded-lg bg-sky-950/20 border border-sky-500/20"
            >
              <Loader2 size={13} className="animate-spin text-sky-400 shrink-0" />
              <span>Verifying authentication passkey...</span>
            </motion.div>
          )}

          {authStatus === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -3, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold py-1 px-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 shadow-sm"
            >
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Code verified · Authentication granted</span>
            </motion.div>
          )}

          {authStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -3, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center justify-center gap-1.5 text-xs text-rose-300 font-medium py-1 px-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 shadow-sm"
            >
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
              <span>{errorMessage || 'Invalid code · Please recheck and try again'}</span>
            </motion.div>
          )}

          {authStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between text-[11px] text-slate-400 px-1 py-0.5"
            >
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck size={12} className="text-slate-400" />
                <span>Single-use time-synced passkey</span>
              </span>
              <span className="font-mono text-slate-400">
                {enteredCount}/6 digits
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
