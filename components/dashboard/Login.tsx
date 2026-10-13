/**
 * File: /components/dashboard/Login.tsx
 * Purpose: Enterprise Authenticator App (TOTP RFC 6238) administrator console.
 * Supports Google Authenticator, Microsoft Authenticator, 1Password, Apple Passwords, Authy, and Bitwarden.
 * Gated by out-of-band email verification for first-time provisioning.
 * Hardened Security: Public unauthenticated re-scan removed; emergency backup recovery keys provided.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  KeyRound, 
  ShieldCheck, 
  Activity, 
  Fingerprint,
  QrCode,
  Copy,
  Check,
  Smartphone,
  Lock,
  Send,
  Download,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { MfaCodeBoxes } from './MfaCodeBoxes';

interface LoginProps {
  onLoginSuccess: () => void;
  onReturnToPortfolio?: () => void;
}

type AuthStep = 'email' | 'email_otp' | 'totp_setup' | 'totp_verify' | 'recovery_code';

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onReturnToPortfolio }) => {
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Authentication Steps:
  // 1. 'email' -> Check identity in ACL
  // 2. 'email_otp' -> Enter 6-digit email OTP (first-time provisioning only)
  // 3. 'totp_setup' -> Scan QR code & save emergency recovery keys
  // 4. 'totp_verify' -> Returning operator enters 6-digit Authenticator app code
  // 5. 'recovery_code' -> Emergency single-use recovery code if phone is lost
  const [step, setStep] = useState<AuthStep>('email');

  // Form Fields
  const [email, setEmail] = useState('');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');

  // TOTP QR & Setup data
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [isCopiedRecovery, setIsCopiedRecovery] = useState(false);

  // 6-digit OTP state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email resend cooldown (1 minute = 60s)
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [hasResentEmail, setHasResentEmail] = useState<boolean>(false);

  // 30-second TOTP visual cycle timer
  const [secondsInWindow, setSecondsInWindow] = useState<number>(() => 30 - (Math.floor(Date.now() / 1000) % 30));

  // Check if session is already active or if user was timed out
  useEffect(() => {
    const logoutReason = sessionStorage.getItem('admin_logout_reason');
    if (logoutReason === 'inactivity') {
      setInfoMessage('Your administrator session was automatically closed due to inactivity for security protection. Please authenticate again.');
      sessionStorage.removeItem('admin_logout_reason');
      supabase.auth.signOut().catch(() => {});
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        onLoginSuccess();
      }
    });
  }, [onLoginSuccess]);

  // Handle email resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle 30-second TOTP pulse countdown
  useEffect(() => {
    if (step !== 'totp_verify' && step !== 'totp_setup') return;

    const timer = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const remaining = 30 - (nowSec % 30);
      setSecondsInWindow(remaining === 0 ? 30 : remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Auto-focus first input field when entering an OTP step
  useEffect(() => {
    if (step === 'email_otp' || step === 'totp_setup' || step === 'totp_verify') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  /**
   * Step 1: Submit email to check ACL and determine flow
   */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setAuthStatus('loading');
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/auth/initiate-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.requiresEmailVerification) {
          // First-time setup: Must verify email OTP first
          setStep('email_otp');
          setResendCooldown(60); // Available after 1 minute (60 seconds)
          setHasResentEmail(false);
          setInfoMessage(`A 6-digit verification code was sent to ${cleanEmail}. Enter it below to authorize setting up your Authenticator App.`);
        } else {
          // Already paired: Proceed straight to Authenticator app challenge
          setStep('totp_verify');
        }
        setAuthStatus('idle');
        setOtp(['', '', '', '', '', '']);
      } else {
        setErrorMessage(data.error || 'Failed to initialize Authenticator verification. Please verify that your email is authorized.');
        setAuthStatus('error');
      }
    } catch (err: any) {
      console.error('TOTP initiation error:', err);
      setErrorMessage(err.message || 'Network error while contacting security gateway.');
      setAuthStatus('error');
    }
  };

  /**
   * Step 2: Core Email OTP verification logic
   */
  const executeVerifyEmailOtp = async (codeToVerify: string) => {
    const cleanCode = (codeToVerify || '').trim();
    if (cleanCode.length !== 6) return;

    setAuthStatus('loading');
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/verify-email-for-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid email verification code.');
      }

      // Email verified! Display green success feedback briefly
      setAuthStatus('success');
      setErrorMessage(null);

      setTimeout(() => {
        setQrCodeDataUrl(data.qrCode || null);
        setManualKey(data.manualKey || null);
        setRecoveryCodes(data.recoveryCodes || []);
        setStep('totp_setup');
        setOtp(['', '', '', '', '', '']);
        setAuthStatus('idle');
        setInfoMessage('Email verified! Scan this QR code and save your emergency recovery keys offline.');
      }, 650);
    } catch (err: any) {
      console.error('Email OTP verification failed:', err);
      setErrorMessage(err.message || 'Email verification failed. Please recheck your code.');
      setAuthStatus('error');
      setTimeout(() => {
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }, 750);
    }
  };

  /**
   * Step 3: Core Authenticator App TOTP verification logic
   */
  const executeVerifyTotp = async (codeToVerify: string) => {
    const cleanCode = (codeToVerify || '').trim();
    if (cleanCode.length !== 6) return;

    setAuthStatus('loading');
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const verifyRes = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Invalid Authenticator code.');
      }

      // Complete session establishment using returned magiclink token
      if (verifyData.token_hash) {
        const { error: sessionErr } = await supabase.auth.verifyOtp({
          token_hash: verifyData.token_hash,
          type: 'magiclink'
        });

        if (sessionErr) {
          throw new Error(`Session establishment failed: ${sessionErr.message}`);
        }
      }

      setAuthStatus('success');
      setErrorMessage(null);

      setTimeout(() => {
        onLoginSuccess();
      }, 650);
    } catch (err: any) {
      console.error('Authenticator verification failed:', err);
      setErrorMessage(err.message || 'Authentication failed. Please verify the code in your Authenticator App.');
      setAuthStatus('error');
      setTimeout(() => {
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }, 750);
    }
  };

  /**
   * Step 4: Emergency Recovery Code Submission
   */
  const handleRecoveryCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = recoveryCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter an emergency recovery code.');
      return;
    }

    setAuthStatus('loading');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-recovery-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), recoveryCode: cleanCode })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid emergency recovery code.');
      }

      if (data.token_hash) {
        const { error: sessionErr } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: 'magiclink'
        });

        if (sessionErr) {
          throw new Error(`Session establishment failed: ${sessionErr.message}`);
        }
      }

      setAuthStatus('success');
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Recovery authentication failed.');
      setAuthStatus('error');
    }
  };

  /**
   * Handle OTP digit inputs with auto-advance and automatic instant validation
   */
  const handleOtpChange = (index: number, value: string) => {
    if (authStatus === 'loading') return;

    if (authStatus === 'error') {
      setAuthStatus('idle');
      setErrorMessage(null);
    }

    const cleanVal = value.replace(/\D/g, '');

    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      const updated = [...otp];
      pastedDigits.forEach((char, i) => {
        if (i < 6) updated[i] = char;
      });
      setOtp(updated);

      const nextIndex = Math.min(pastedDigits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();

      if (pastedDigits.length === 6) {
        const fullCode = pastedDigits.join('');
        if (step === 'email_otp') {
          executeVerifyEmailOtp(fullCode);
        } else if (step === 'totp_setup' || step === 'totp_verify') {
          executeVerifyTotp(fullCode);
        }
      }
      return;
    }

    const updated = [...otp];
    updated[index] = cleanVal;
    setOtp(updated);

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const fullCode = updated.join('');
    if (fullCode.length === 6 && /^\d{6}$/.test(fullCode)) {
      if (step === 'email_otp') {
        executeVerifyEmailOtp(fullCode);
      } else if (step === 'totp_setup' || step === 'totp_verify') {
        executeVerifyTotp(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (authStatus === 'error') {
      setAuthStatus('idle');
      setErrorMessage(null);
    }

    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Resend email verification code (Allowed ONLY 1 time after 1-minute cooldown)
   */
  const handleResendEmailCode = async () => {
    if (resendCooldown > 0 || hasResentEmail || authStatus === 'loading') return;
    setAuthStatus('loading');
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/initiate-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, isResend: true })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend verification code.');
      }

      setHasResentEmail(true); // User can only click 1 time and no more after that
      setResendCooldown(0);
      setAuthStatus('idle');
      setInfoMessage(`A fresh verification code was sent to ${cleanEmail}. (Resend limit reached: 1/1 used)`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.');
      setAuthStatus('error');
    }
  };

  const handleCopyKey = () => {
    if (manualKey) {
      navigator.clipboard.writeText(manualKey);
      setIsCopiedKey(true);
      setTimeout(() => setIsCopiedKey(false), 2000);
    }
  };

  const handleCopyRecoveryCodes = () => {
    if (recoveryCodes.length > 0) {
      const text = `AEGIS ADMIN RECOVERY CODES (${email})\n====================================\n` + 
        recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') + 
        `\n\n* Each code can be used ONCE to recover console access if your authenticator device is lost.`;
      navigator.clipboard.writeText(text);
      setIsCopiedRecovery(true);
      setTimeout(() => setIsCopiedRecovery(false), 2500);
    }
  };

  const handleDownloadRecoveryCodes = () => {
    if (recoveryCodes.length > 0) {
      const content = `AEGIS ADMIN RECOVERY CODES\nAccount: ${email}\nGenerated: ${new Date().toISOString()}\n====================================\n\n` +
        recoveryCodes.map((c, i) => `[ ] ${i + 1}. ${c}`).join('\n') +
        `\n\nIMPORTANT SECURITY NOTICE:\n- Store these codes in a secure password manager or offline safe.\n- Each recovery code is single-use.\n- If you lose your phone, these codes allow immediate console recovery.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aegis-recovery-codes-${email.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetToEmailStep = () => {
    setStep('email');
    setOtp(['', '', '', '', '', '']);
    setRecoveryCodeInput('');
    setErrorMessage(null);
    setInfoMessage(null);
    setAuthStatus('idle');
    setResendCooldown(0);
    setHasResentEmail(false);
  };

  const handleReturnToPortfolio = () => {
    if (onReturnToPortfolio) {
      onReturnToPortfolio();
    } else {
      window.history.pushState(null, '', '/');
      window.location.hash = '';
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* Top Bar Navigation */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <button 
            type="button"
            onClick={handleReturnToPortfolio}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors group bg-transparent border-none cursor-pointer p-0"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Portfolio</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock size={13} className="text-slate-500" />
            <span className="text-[11px] sm:text-xs text-slate-400">Restricted Console</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Workspace */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md lg:max-w-4xl bg-slate-900/50 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden grid lg:grid-cols-12 transition-all">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            
            {/* Header Brand */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200 shadow-sm shrink-0">
                {step === 'email_otp' ? (
                  <Mail size={18} />
                ) : step === 'totp_setup' ? (
                  <QrCode size={18} />
                ) : step === 'recovery_code' ? (
                  <KeyRound size={18} />
                ) : step === 'totp_verify' ? (
                  <Smartphone size={18} />
                ) : (
                  <Shield size={18} />
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">
                  Angesh Chanderdip Portfolio
                </p>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {step === 'email_otp'
                    ? 'Verify Identity'
                    : step === 'totp_setup' 
                    ? 'Set Up Authenticator' 
                    : step === 'recovery_code'
                    ? 'Emergency Recovery'
                    : step === 'totp_verify' 
                    ? 'Two-Factor Authentication' 
                    : 'Administrator Access'}
                </h1>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              {step === 'email_otp' ? (
                <span>
                  A 6-digit verification code was sent to <strong className="text-slate-200 font-mono">{email}</strong>. Enter it to authorize initial device pairing.
                </span>
              ) : step === 'totp_setup' ? (
                <span>
                  Scan the QR code with your authenticator app and store your single-use backup recovery keys offline.
                </span>
              ) : step === 'recovery_code' ? (
                <span>
                  Enter one of your single-use emergency backup recovery keys to restore administrator console access for <strong className="text-slate-200 font-mono">{email}</strong>.
                </span>
              ) : step === 'totp_verify' ? (
                <span>
                  Enter the 6-digit code showing in your Authenticator App for <strong className="text-slate-200 font-mono">{email}</strong>.
                </span>
              ) : (
                'Secure access for authorized administrators. Enter your registered email to continue.'
              )}
            </p>

            {/* STEP 1: Operator Email Entry */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Administrator Email Address
                  </label>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <Mail size={16} />
                    </div>

                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      disabled={authStatus === 'loading'}
                      required
                      className="w-full h-11 bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/30 transition-colors font-mono"
                    />

                    {authStatus === 'loading' && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  type="submit"
                  disabled={authStatus === 'loading' || !email}
                  className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-1"
                >
                  {authStatus === 'loading' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Checking clearance...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {/* Error Banner */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 flex items-start gap-2.5 text-xs leading-relaxed"
                    >
                      <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            )}

            {/* STEP 2: EMAIL OTP GATE (Initial Device Setup Only) */}
            {step === 'email_otp' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  executeVerifyEmailOtp(otp.join(''));
                }} 
                className="flex flex-col gap-4"
              >
                <MfaCodeBoxes
                  value={otp}
                  onChange={handleOtpChange}
                  onKeyDown={handleOtpKeyDown}
                  inputRefs={otpInputRefs}
                  authStatus={authStatus}
                  errorMessage={errorMessage}
                  label="Enter 6-Digit Email Code"
                  subLabel={
                    <span className="text-[11px] text-slate-400">
                      Dispatched to <span className="text-slate-300 font-mono">{email}</span>
                    </span>
                  }
                />

                <div className="flex items-center justify-between text-xs">
                  {hasResentEmail ? (
                    <span className="text-slate-500 flex items-center gap-1.5 cursor-not-allowed select-none text-[11.5px]">
                      <Lock size={11} className="text-slate-500" />
                      <span>Resend limit reached (1/1 sent)</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendEmailCode}
                      disabled={resendCooldown > 0 || authStatus === 'loading'}
                      className="text-slate-400 hover:text-slate-200 disabled:text-slate-600 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send size={11} />
                      <span>
                        {resendCooldown > 0 
                          ? `Resend available in ${resendCooldown}s` 
                          : 'Resend email code (1 resend left)'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={resetToEmailStep}
                    className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Change email
                  </button>
                </div>

                {/* Spam / Junk Delivery Notice */}
                <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-3 text-[11.5px] text-slate-400 flex items-start gap-2 leading-relaxed">
                  <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Can&apos;t find the email?</strong> Check your <strong className="text-amber-300">Spam / Junk</strong> folder, or search for <span className="text-slate-200 font-mono">verification@angesh.jo3.org</span>.
                  </span>
                </div>

                <AnimatePresence>
                  {infoMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-200 flex items-start gap-2.5 text-xs leading-relaxed"
                    >
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{infoMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={authStatus === 'loading' || otp.join('').length !== 6}
                  className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-1"
                >
                  {authStatus === 'loading' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: TOTP SETUP (Pair QR Code & Offline Backup Recovery Codes) */}
            {step === 'totp_setup' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  executeVerifyTotp(otp.join(''));
                }} 
                className="flex flex-col gap-4"
              >
                {/* QR Code Container */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  {qrCodeDataUrl && (
                    <div className="bg-white p-2 rounded-xl shadow-md shrink-0">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="TOTP QR Code" 
                        className="w-32 h-32 sm:w-36 sm:h-36 block" 
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                      <Smartphone size={14} className="text-slate-400" />
                      Pairing Instructions
                    </span>
                    <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11.5px] leading-relaxed">
                      <li>Open <strong className="text-slate-200">Google Authenticator</strong>, <strong className="text-slate-200">1Password</strong>, or <strong className="text-slate-200">Microsoft Auth</strong>.</li>
                      <li>Scan this QR code with your camera.</li>
                      <li>Enter the generated 6-digit code below.</li>
                    </ol>

                    {manualKey && (
                      <div className="mt-1 pt-2 border-t border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Manual Key:</span>
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                          <code className="text-[11px] font-mono text-slate-300 truncate select-all">{manualKey}</code>
                          <button
                            type="button"
                            onClick={handleCopyKey}
                            className="text-slate-400 hover:text-white p-1 ml-auto transition-colors cursor-pointer"
                            title="Copy Key"
                          >
                            {isCopiedKey ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Recovery Codes Box */}
                {recoveryCodes.length > 0 && (
                  <div className="bg-slate-950/70 border border-amber-500/20 rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5">
                        <KeyRound size={13} className="text-amber-400" />
                        Save Emergency Recovery Codes (Offline)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyRecoveryCodes}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {isCopiedRecovery ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{isCopiedRecovery ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadRecoveryCodes}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Download size={11} />
                          <span>.txt</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      Each key is single-use and provides account recovery if your device is unavailable.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                      {recoveryCodes.map((c, i) => (
                        <div key={i} className="text-center font-mono text-xs text-slate-200 font-medium py-1 px-1.5 bg-slate-950/80 rounded border border-slate-800/80 select-all">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6-Digit OTP Input Grid */}
                <MfaCodeBoxes
                  value={otp}
                  onChange={handleOtpChange}
                  onKeyDown={handleOtpKeyDown}
                  inputRefs={otpInputRefs}
                  authStatus={authStatus}
                  errorMessage={errorMessage}
                  label="Confirm 6-digit code from authenticator app"
                  subLabel={
                    <span className="text-[11px] font-mono text-slate-400">
                      RFC 6238 TOTP
                    </span>
                  }
                />

                <button
                  type="submit"
                  disabled={authStatus === 'loading' || otp.join('').length !== 6}
                  className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-1"
                >
                  {authStatus === 'loading' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Linking device...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup & Sign In</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 4: TOTP VERIFY (Standard Challenge for Paired Operators) */}
            {step === 'totp_verify' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  executeVerifyTotp(otp.join(''));
                }} 
                className="flex flex-col gap-4"
              >
                <MfaCodeBoxes
                  value={otp}
                  onChange={handleOtpChange}
                  onKeyDown={handleOtpKeyDown}
                  inputRefs={otpInputRefs}
                  authStatus={authStatus}
                  errorMessage={errorMessage}
                  label="6-Digit Authenticator Code"
                  subLabel={
                    <span className="text-[11px] font-mono text-slate-400">
                      Window: {secondsInWindow}s
                    </span>
                  }
                />

                {/* Fallback to Recovery Key */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('recovery_code');
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound size={12} />
                    <span>Lost device? Use emergency key</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetToEmailStep}
                    className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Change email
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={authStatus === 'loading' || otp.join('').length !== 6}
                  className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-1"
                >
                  {authStatus === 'loading' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Access Console</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 5: EMERGENCY RECOVERY CODE VERIFICATION */}
            {step === 'recovery_code' && (
              <form onSubmit={handleRecoveryCodeSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>Emergency Single-Use Recovery Key</span>
                    <span className="text-[10px] text-slate-400 font-mono">Format: XXXX-XXXX</span>
                  </label>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <KeyRound size={16} />
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. 7A4B-9E2D"
                      value={recoveryCodeInput}
                      onChange={(e) => {
                        setRecoveryCodeInput(e.target.value.toUpperCase());
                        setErrorMessage(null);
                      }}
                      disabled={authStatus === 'loading'}
                      required
                      autoFocus
                      className="w-full h-11 bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-colors font-mono tracking-wider"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Enter one of the emergency backup keys generated during enrollment. Once verified, this key is permanently invalidated.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('totp_verify');
                      setErrorMessage(null);
                    }}
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={12} />
                    <span>Back to 6-digit code</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetToEmailStep}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Change email
                  </button>
                </div>

                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 flex items-start gap-2.5 text-xs leading-relaxed"
                    >
                      <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={authStatus === 'loading' || !recoveryCodeInput.trim()}
                  className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-1"
                >
                  {authStatus === 'loading' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Validating key...</span>
                    </>
                  ) : (
                    <>
                      <span>Redeem Key & Access Console</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-slate-400" />
                <span>Zero-Trust Architecture</span>
              </span>
              <span>RFC 6238 Standard</span>
            </div>

          </div>

          {/* Right Column: Production-Grade Security Specifications Panel */}
          <div className="hidden lg:flex lg:col-span-5 bg-slate-950/80 border-l border-slate-800 p-8 sm:p-10 flex-col justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Access Governance
              </p>
              <h2 className="text-base font-bold text-white mt-1 mb-2">
                Multi-Factor Security Specifications
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Hardware-bound cryptographic identity verification is required for all administrative sessions.
              </p>

              <div className="flex flex-col gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-200 shrink-0 mt-0.5">
                    <Smartphone size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Hardware-Bound TOTP</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">Compatible with Google Authenticator, Microsoft Authenticator, 1Password, and Apple Passwords.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-200 shrink-0 mt-0.5">
                    <Lock size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Anti-Downgrade Protection</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">Device binding eliminates email interception vectors. Resetting devices requires authenticated in-console authorization.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-200 shrink-0 mt-0.5">
                    <KeyRound size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Offline Redundancy</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">Eight single-use emergency backup keys hashed using SHA-256 for deterministic recovery if a physical phone is lost.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Authentication attempts are cryptographically validated and permanently recorded in the immutable audit ledger.
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950/50">
        <p>
          &copy; {new Date().getFullYear()} Angesh Chanderdip · All rights reserved
        </p>
      </footer>

    </div>
  );
};

export default Login;
