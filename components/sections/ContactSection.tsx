/**
 * File: /components/sections/ContactSection.tsx
 * Author: Angesh Chanderdip
 * Purpose: Full-featured Contact Form component with intensive anti-bot features, human-verification sliders, and custom Proof-of-Work puzzles.
 * Responsibilities:
 *   - Renders interactive feedback and support panels
 *   - Verifies user identities before outbound fetches via Security-as-a-Service bindings
 *   - Controls submission dynamics through state triggers and accessibility controls
 * Dependencies: React, Framer Motion, Lucide React, SecurityService
 * Notes: Seamless visual and behavior execution backed by organizational guidelines.
 * Changelog:
 *   - Consolidated local validation, timing heuristics, and honeypots to leverage SecurityService helper utilities.
 */

import React, {
  useState,
  FormEvent,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
// FIX: Import Variants to correctly type framer-motion variants object.
import {
  motion,
  AnimatePresence,
  Variants,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import {
  Send,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ChevronsUpDown,
  Trash2,
  X,
  Loader2,
  Sparkles,
  Shield,
  Fingerprint,
  Lock,
  Unlock,
  ChevronsRight,
} from "lucide-react";
import Section from "../layout/Section";
import { useI18n } from "../../hooks/useI18n";
import { useStreak } from "../../hooks/useStreak";
import { Translations } from "../../types";
import { useTypingAnimation } from "../../hooks/useTypingAnimation";
import { useProofOfWork } from "../../hooks/useProofOfWork";
import { SecurityService } from "../../lib/security/SecurityService";
import { AnalyticsTracker } from "../../lib/analyticsTracker";

type FormStatus =
  "idle" | "analyzing" | "securing" | "submitting" | "success" | "error";
const MAX_CHARS = 1000;
const MIN_CHARS = 10;
const MIN_SUBMIT_TIME_MS = 3500; // Slightly more restrictive timing

// --- Form State and Validation ---
interface FieldState {
  value: string;
  touched: boolean;
  error: string;
}

interface FormDataState {
  name: FieldState;
  email: FieldState;
  company: FieldState;
  website: FieldState; // Honeypot 1
  address: FieldState; // Honeypot 2 (secondary bot trap)
  subject: FieldState;
  message: FieldState;
}

const initialFieldState: FieldState = { value: "", touched: false, error: "" };

const initialFormState: FormDataState = {
  name: { ...initialFieldState },
  email: { ...initialFieldState },
  company: { ...initialFieldState },
  website: { ...initialFieldState }, // Honeypot 1
  address: { ...initialFieldState }, // Honeypot 2
  subject: { ...initialFieldState },
  message: { ...initialFieldState },
};

// --- Main Section Component ---
const ContactSection: React.FC = () => {
  const { t, language } = useI18n();
  const { addPoints } = useStreak();
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formData, setFormData] = useState<FormDataState>(initialFormState);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [shake, setShake] = useState(false);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [formLoadTime, setFormLoadTime] = useState(0);
  const [isHuman, setIsHuman] = useState(false);
  const [sliderSuccess, setSliderSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const dragX = useMotionValue(0);
  const progressWidth = useTransform(dragX, (val) => val + 18);
  const trackRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { solveChallenge } = useProofOfWork();

  const subjectOptions = [
    "Job Opportunity",
    "Meeting / Interview Schedule",
    "Collaboration Inquiry",
    "Technical Question",
    "General Feedback",
  ];

  useEffect(() => {
    setFormLoadTime(Date.now());

    const detectHuman = () => setIsHuman(true);
    window.addEventListener("mousemove", detectHuman, { once: true });
    window.addEventListener("touchstart", detectHuman, { once: true });
    window.addEventListener("keydown", detectHuman, { once: true });

    // Listen for custom prefill event from assistant or deep links
    const handlePrefillContact = (e: Event) => {
      const customEvent = e as CustomEvent<{
        subject?: string;
        message?: string;
        name?: string;
        email?: string;
      }>;
      const detail = customEvent.detail;
      if (detail) {
        setFormData(prev => ({
          ...prev,
          ...(detail.subject ? { subject: { value: detail.subject, touched: true, error: "" } } : {}),
          ...(detail.message ? { message: { value: detail.message, touched: true, error: "" } } : {}),
          ...(detail.name ? { name: { value: detail.name, touched: true, error: "" } } : {}),
          ...(detail.email ? { email: { value: detail.email, touched: true, error: "" } } : {}),
        }));
      }
      setIsHuman(true);
    };

    window.addEventListener("prefill-contact", handlePrefillContact);

    return () => {
      window.removeEventListener("mousemove", detectHuman);
      window.removeEventListener("touchstart", detectHuman);
      window.removeEventListener("keydown", detectHuman);
      window.removeEventListener("prefill-contact", handlePrefillContact);
    };
  }, []);

  // Set slider track width on measurement
  useEffect(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showFeedbackPanel]);

  const { typedText, startTyping, isTyping } = useTypingAnimation(() => {
    if (!hasGeneratedOnce) {
      setHasGeneratedOnce(true);
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  });

  useEffect(() => {
    if (isTyping) {
      setFormData((prev) => ({
        ...prev,
        message: {
          ...prev.message,
          value: typedText,
          error: validateField("message", typedText),
        },
      }));
    }
  }, [typedText, isTyping]);

  const validateField = useCallback(
    (name: keyof FormDataState, value: string): string => {
      switch (name) {
        case "name":
          return value.trim() ? "" : t("validation_name_required");
        case "email":
          if (!value.trim()) return t("validation_email_required");
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? ""
            : t("validation_email_invalid");
        case "subject":
          return value.trim() ? "" : t("validation_subject_required");
        case "company":
        case "website": // Honeypot 1
        case "address": // Honeypot 2
          return "";
        case "message":
          if (!value.trim()) return t("validation_message_required");
          if (value.length < MIN_CHARS)
            return t("validation_message_too_short");
          if (value.length > MAX_CHARS) return t("validation_message_too_long");
          return "";
        default:
          return "";
      }
    },
    [t],
  );

  const getStarterMessage = useCallback(() => {
    const nameValue = formData.name.value.trim();
    if (!nameValue) return "";

    const starterMessages = [
      "Hi Angesh,\n\nMy name is {name}{companyClause} and I'm reaching out regarding an interesting opportunity.",
      "Hello Angesh,\n\nI came across your portfolio and was impressed by your work. My name is {name}{companyClause} and I would like to connect about...",
      "Greetings Angesh,\n\nMy name is {name}{companyClause}. I'm writing to you today about...",
      "Dear Angesh,\n\nHope you're having a great week. My name is {name}{companyClause}, and I'd like to discuss a potential project.",
    ];

    const lastMessage = formData.message.value;
    let availableMessages = starterMessages.filter(
      (msg) => !lastMessage.includes(msg.split("\n")[0]),
    );
    if (availableMessages.length === 0) availableMessages = starterMessages;

    const randomIndex = Math.floor(Math.random() * availableMessages.length);
    const template = availableMessages[randomIndex];
    const company = formData.company.value.trim();
    const companyClause = company ? ` from ${company}` : "";

    return template
      .replace(/{name}/g, nameValue)
      .replace(/{companyClause}/g, companyClause);
  }, [formData.name.value, formData.company.value, formData.message.value]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.currentTarget;
    const fieldName = name as keyof FormDataState;
    setFormData((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error: prev[fieldName].touched ? validateField(fieldName, value) : "",
      },
    }));
    addPoints(3, 'type_message');
  };

  const handleInputBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.currentTarget;
    const fieldName = name as keyof FormDataState;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true,
        error: validateField(fieldName, value),
      },
    }));

    if (
      fieldName === "name" &&
      !isTyping &&
      formData.message.value === "" &&
      !hasGeneratedOnce
    ) {
      const nameIsValid = !validateField("name", value);
      if (nameIsValid) {
        const message = getStarterMessage();
        if (message) startTyping(message);
      }
    }
  };

  const handleSubjectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      subject: { value, touched: true, error: validateField("subject", value) },
    }));
  };

  const handleSubjectBlur = () => {
    setFormData((prev) => ({
      ...prev,
      subject: {
        ...prev.subject,
        touched: true,
        error: validateField("subject", prev.subject.value),
      },
    }));
  };

  const handleClearMessage = () => {
    setFormData((prev) => ({
      ...prev,
      message: { ...initialFieldState, value: "", touched: true },
    }));
    if (!hasGeneratedOnce) setHasGeneratedOnce(true);
    textareaRef.current?.focus();
  };

  const handleGenerateNewMessage = () => {
    if (isTyping) return;
    const message = getStarterMessage();
    if (message) {
      if (formData.message.value.length > 0) {
        setFormData((prev) => ({
          ...prev,
          message: { ...initialFieldState, value: "", touched: true },
        }));
      }
      startTyping(message);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const ignoredKeys = [
      "Shift",
      "Control",
      "Alt",
      "Meta",
      "CapsLock",
      "Tab",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Enter",
      "Escape",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "Insert",
      "Delete",
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6",
      "F7",
      "F8",
      "F9",
      "F10",
      "F11",
      "F12",
    ];
    if (!ignoredKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      // playTyping(); was here
    }
  };

  const isFormValid = useMemo(() => {
    return (Object.keys(formData) as Array<keyof FormDataState>).every(
      (name) => !validateField(name, formData[name].value),
    );
  }, [formData, validateField]);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    let isValid = true;
    const newState = { ...formData };
    (Object.keys(newState) as Array<keyof FormDataState>).forEach((key) => {
      const error = validateField(key, newState[key].value);
      newState[key] = { ...newState[key], touched: true, error };
      if (error) isValid = false;
    });
    setFormData(newState);

    if (!isValid) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // --- Security Check 1: Client-Side Anti-Spam Rate Limit ---
    const rateLimitReport = SecurityService.checkClientRateLimit(
      "portfolio_last_send",
      60000,
    );
    if (!rateLimitReport.isValid) {
      setErrorMsg(`Security Notice: ${rateLimitReport.reason}`);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      AnalyticsTracker.trackSecurityEvent(
        "rate_limit",
        `Form rate-limit trigger. Reason: ${rateLimitReport.reason}`,
      );
      return;
    }

    // --- Security Check 2: Visual Slider Verification ---
    if (!sliderSuccess) {
      setErrorMsg(
        "Security Checkpoint: Please drag the Fingerprint Slider below to verify human identity.",
      );
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setFormStatus("analyzing");
    await new Promise((resolve) => setTimeout(resolve, 500));

    // --- Security Check 3: Honeypots and heuristic timing traps ---
    const isCleanOfBots = SecurityService.validateHoneypots([
      formData.website.value,
      formData.address.value,
    ]);
    const timingReport = SecurityService.verifySubmissionTiming(
      formLoadTime,
      MIN_SUBMIT_TIME_MS,
    );

    if (!isCleanOfBots || !timingReport.isValid || !isHuman) {
      console.warn(
        `Trap triggered! Bot-like behavior detected. Honeypot check clean: ${isCleanOfBots}, Timing report valid: ${timingReport.isValid}, IsHuman: ${isHuman}`,
      );
      AnalyticsTracker.trackSecurityEvent(
        "suspicious_request",
        `Bot-like metrics matching: honeypot_clean=${isCleanOfBots}, timings_ok=${timingReport.isValid}, mouse_gesture_human=${isHuman}`,
      );
      // Pretend it was a success to burn their cycles/hide system defenses
      setFormStatus("success");
      setTimeout(() => setShowFeedbackPanel(true), 1500);
      return;
    }

    setFormStatus("securing");
    const challenge = `${formData.name.value}${formData.email.value}${Date.now()}`;
    const solved = await solveChallenge(challenge, 2);

    if (!solved) {
      console.error("Proof of work failed or timed out.");
      AnalyticsTracker.trackSecurityEvent(
        "invalid_methods",
        `Contact submission failed verification puzzle`,
      );
      setFormStatus("error");
      setTimeout(() => setShowFeedbackPanel(true), 1500);
      return;
    }

    setFormStatus("submitting");

    // Send payload to backend API (Resend route)
    const payload = {
      name: formData.name.value,
      email: formData.email.value,
      company: formData.company.value || "Not provided",
      subject: formData.subject.value,
      message: formData.message.value,
    };

    let submissionSuccess = false;

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.status === 200 && json.success) {
        setFormStatus("success");
        submissionSuccess = true;
        AnalyticsTracker.trackContactEvent(
          true,
          "Fingerprint Slider & PoW Passed",
        );
      } else {
        console.error(
          "Submission failed on backend:",
          json.error || json.message,
        );
        const errMsg = json.error || "A transport error occurred. Please try again.";
        setErrorMsg(errMsg);
        setFormStatus("error");
        AnalyticsTracker.trackContactEvent(
          false,
          `Server issue: ${json.error || "unknown status"}`,
        );
      }
    } catch (error) {
      console.error("An error occurred during fetch:", error);
      const errMsg = "System error while connecting to mail gateway.";
      setErrorMsg(errMsg);
      setFormStatus("error");
      AnalyticsTracker.trackContactEvent(false, "Network connection exception");
    }

    setTimeout(() => {
      setShowFeedbackPanel(true);
      if (submissionSuccess) {
        formRef.current?.reset();
        setFormData(initialFormState);
        setHasGeneratedOnce(false);
        setIsHuman(false);
        setSliderSuccess(false);
        localStorage.setItem("portfolio_last_send", Date.now().toString());
        setFormLoadTime(Date.now());
      }
    }, 1500);
  };

  const handleReset = () => {
    setShowFeedbackPanel(false);
    setErrorMsg("");
    setSliderSuccess(false);
    setTimeout(() => {
      setFormStatus("idle");
    }, 300);
  };

  // FIX: Add Variants type to fix type inference issues with transition properties.
  const formWrapperVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    idle: { width: "100%", backgroundColor: "#007aff" },
    analyzing: { width: "100%", backgroundColor: "#ff9f0a" },
    securing: { width: "100%", backgroundColor: "#ff9f0a" },
    submitting: {
      width: "44px",
      height: "44px",
      borderRadius: "22px",
      backgroundColor: "#007aff",
    },
    success: { width: "100%", backgroundColor: "#28c940" },
    error: { width: "100%", backgroundColor: "#ff5f57" },
  };

  return (
    <Section id="contact" title={t("contact_title")}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-28">
          <motion.div
            className="w-full flex flex-col gap-4 items-start text-left"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-light-text dark:text-dark-text leading-[1.08] uppercase font-sans lg:max-w-xs">
              {t("contact_subtitle").replace(/\n/g, " ")}
            </h3>

            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400/80 font-sans leading-relaxed">
              {t("contact_description")}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="lg:col-span-8 w-full"
        >
          <div className={`macos-window ${shake ? "shake" : ""}`}>
            <div className="macos-title-bar">
              <div className="macos-controls">
                <span className="macos-control close">
                  <span>&#10005;</span>
                </span>
                <span className="macos-control minimize">
                  <span>&ndash;</span>
                </span>
                <span className="macos-control maximize">
                  <span>&#9723;</span>
                </span>
              </div>
              <p className="macos-title">New Message</p>
            </div>

            <div className="macos-content">
              <AnimatePresence mode="wait">
                {!showFeedbackPanel ? (
                  <motion.div
                    key="form"
                    variants={formWrapperVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <form ref={formRef} onSubmit={handleFormSubmit} noValidate>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <FormInputField
                          field="name"
                          type="text"
                          label={t("contact_form_name")}
                          formData={formData}
                          onChange={handleInputChange}
                          onBlur={handleInputBlur}
                          onKeyDown={handleKeyDown}
                        />
                        <FormInputField
                          field="email"
                          type="email"
                          label={t("contact_form_email")}
                          formData={formData}
                          onChange={handleInputChange}
                          onBlur={handleInputBlur}
                          onKeyDown={handleKeyDown}
                        />
                      </div>
                      <FormInputField
                        field="company"
                        type="text"
                        label="Company (Optional)"
                        formData={formData}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                      />
                      {/* FIX: Add missing onKeyDown prop to resolve TypeScript error. */}
                      <FormInputField
                        field="website"
                        type="text"
                        label="Website"
                        formData={formData}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        isHoneypot={true}
                      />

                      <FormInputField
                        field="address"
                        type="text"
                        label="Address"
                        formData={formData}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        isHoneypot={true}
                      />

                      <MacOSSelect
                        label={t("contact_form_subject")}
                        options={subjectOptions}
                        value={formData.subject.value}
                        onChange={handleSubjectChange}
                        onBlur={handleSubjectBlur}
                        formData={formData}
                      />
                      <FormTextareaField
                        field="message"
                        label={t("contact_form_message")}
                        formData={formData}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        onClear={handleClearMessage}
                        onGenerate={handleGenerateNewMessage}
                        hasGeneratedOnce={hasGeneratedOnce}
                        isTyping={isTyping}
                        ref={textareaRef}
                      />

                      {/* Error Announcement Banner */}
                      <AnimatePresence>
                        {errorMsg && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 overflow-hidden"
                          >
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-500 dark:text-red-400 text-xs font-mono flex items-center gap-2">
                              <AlertCircle size={14} className="shrink-0" />
                              <span className="flex-1">{errorMsg}</span>
                              <button
                                type="button"
                                onClick={() => setErrorMsg("")}
                                className="hover:text-red-600 dark:hover:text-red-300 font-bold px-1 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Anti-Bot Human-Slider verification check */}
                      <div className="mb-6 p-4 rounded-xl border border-dashed border-neutral-250/25 dark:border-neutral-800/60 bg-neutral-50/10 dark:bg-neutral-900/40">
                        <div className="flex items-center justify-between mb-2 select-none">
                          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                            <Shield
                              size={12}
                              className={
                                sliderSuccess
                                  ? "text-green-500"
                                  : "text-cyan-500 animate-pulse"
                              }
                            />
                            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">
                              SEC_IDENTITY_CHECK
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500">
                            {sliderSuccess ? "PASSED" : "ID_REQUIRED"}
                          </span>
                        </div>

                        <div
                          ref={trackRef}
                          className="relative w-full h-[44px] rounded-lg bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/80 overflow-hidden flex items-center select-none"
                        >
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span
                              className={`text-[10px] font-mono tracking-wider font-semibold transition-all duration-300 ${sliderSuccess ? "text-green-500 font-bold scale-102" : "text-neutral-400 dark:text-neutral-500"}`}
                            >
                              {sliderSuccess
                                ? "HUMAN IDENTITY CONFIRMED"
                                : "SLIDE SECURE LOCK TO VERIFY"}
                            </span>
                          </div>

                          {/* High-Tech Laser Scanning Line (linear motion, no hand icon) */}
                          {!sliderSuccess && (
                            <div
                              className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-cyan-500/[0.12] to-transparent pointer-events-none laser-scan-line"
                            />
                          )}

                          {/* Dynamic Active Progress Fill */}
                          {!sliderSuccess && (
                            <motion.div
                              style={{ width: progressWidth }}
                              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/20 to-indigo-500/25 pointer-events-none border-r border-cyan-500/30"
                            />
                          )}

                          {!sliderSuccess ? (
                            <motion.div
                              drag="x"
                              dragConstraints={{
                                left: 0,
                                right: Math.max(0, trackWidth - 44),
                              }}
                              dragElastic={0.02}
                              onDragStart={() => setIsDragging(true)}
                              onDragEnd={() => {
                                setIsDragging(false);
                                if (dragX.get() > (trackWidth - 44) * 0.8) {
                                  setSliderSuccess(true);
                                  setErrorMsg("");
                                } else {
                                  animate(dragX, 0, {
                                    type: "spring",
                                    stiffness: 350,
                                    damping: 28,
                                  });
                                }
                              }}
                              style={{ x: dragX }}
                              className="absolute left-1 w-9 h-9 rounded bg-gradient-to-br from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 flex items-center justify-center cursor-ew-resize text-white shadow-md shadow-cyan-600/20 z-10 transition-colors duration-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isDragging ? (
                                <ChevronsRight
                                  size={16}
                                  className="animate-pulse"
                                />
                              ) : (
                                <Lock size={15} />
                              )}
                            </motion.div>
                          ) : (
                            <div className="absolute right-1 w-9 h-9 rounded bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-green-600/20">
                              <Unlock size={15} className="scale-110" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="macos-submit-container">
                        <AnimatePresence>
                          {(formStatus === "analyzing" ||
                            formStatus === "securing") && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ type: "spring" }}
                            >
                              <Shield
                                size={28}
                                className={`security-shield-icon ${formStatus === "securing" ? "pulsing" : ""}`}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <motion.button
                          type="submit"
                          disabled={formStatus !== "idle"}
                          className="macos-button"
                          variants={buttonVariants}
                          animate={formStatus}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                          whileHover={{
                            scale: formStatus === "idle" ? 1.03 : 1,
                          }}
                          whileTap={{ scale: formStatus === "idle" ? 0.98 : 1 }}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={formStatus}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: { delay: 0.2 },
                              }}
                              exit={{ opacity: 0, y: -10 }}
                              className="macos-button-content"
                            >
                              {formStatus === "idle" && (
                                <>
                                  <Send size={18} />
                                  <span>{t("contact_form_submit")}</span>
                                </>
                              )}
                              {formStatus === "analyzing" && (
                                <span>Analyzing...</span>
                              )}
                              {formStatus === "securing" && (
                                <span>Securing...</span>
                              )}
                              {formStatus === "submitting" && (
                                <Loader2 size={20} className="spinner" />
                              )}
                              {formStatus === "success" && (
                                <>
                                  <CheckCircle size={20} />
                                  <span>Sent!</span>
                                </>
                              )}
                              {formStatus === "error" && (
                                <>
                                  <X size={20} />
                                  <span>Failed</span>
                                </>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </motion.button>
                      </div>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono mt-3 text-center sm:text-right">
                        {language === 'fr' 
                          ? '🔒 Vos coordonnées sont uniquement traitées pour vous répondre (conformité RGPD / Loi 25).'
                          : '🔒 Your contact details are solely processed to respond to your inquiry (GDPR & Privacy compliant).'}
                      </p>
                    </form>
                  </motion.div>
                ) : (
                  <FeedbackPanel status={formStatus} onReset={handleReset} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

// --- Extracted Form Field Components ---

const FormInputField: React.FC<{
  field: keyof Omit<FormDataState, "message" | "subject">;
  type: string;
  label: string;
  formData: FormDataState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  isHoneypot?: boolean;
}> = ({
  field,
  type,
  label,
  formData,
  onChange,
  onBlur,
  onKeyDown,
  autoFocus = false,
  isHoneypot = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { value, touched, error } = formData[field];
  const id = `contact-${field}`;
  const isFloated = isFocused || value.length > 0;
  const hasError = touched && !!error;
  const hasSuccess =
    touched &&
    !error &&
    value.length > 0 &&
    field !== "company" &&
    field !== "website";

  if (isHoneypot) {
    return (
      <div className="honeypot-field" aria-hidden="true">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          name={field}
          type={type}
          value={value}
          onChange={onChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    );
  }

  return (
    <div className="form-field-container">
      <fieldset
        className={`macos-fieldset ${isFloated ? "floated" : ""} ${isFocused ? "is-focused" : ""} ${hasError ? "has-error" : ""}`}
      >
        <legend className="macos-legend">{label}</legend>
        <input
          id={id}
          name={field}
          type={type}
          required={field !== "company"}
          className="macos-input"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur(e);
          }}
          onKeyDown={onKeyDown}
          aria-invalid={hasError}
          aria-describedby={`${id}-error`}
          autoFocus={autoFocus}
        />
        <AnimatePresence>
          {hasSuccess && (
            <motion.div
              key="success"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="macos-validation-icon success"
            >
              <CheckCircle size={20} />
            </motion.div>
          )}
          {hasError && (
            <motion.div
              key="error"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="macos-validation-icon error"
            >
              <AlertCircle size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </fieldset>
      <div
        id={`${id}-error`}
        className="macos-error-message"
        aria-live="polite"
      >
        {hasError && <span>{error}</span>}
      </div>
    </div>
  );
};

const MacOSSelect: React.FC<{
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  formData: FormDataState;
}> = ({ label, options, value, onChange, onBlur, formData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const id = `contact-subject`;
  const { touched, error } = formData.subject;
  const isFloated = isOpen || isFocused || value.length > 0;
  const hasError = touched && !!error;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (isFocused) {
          setIsFocused(false);
          onBlur();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFocused, onBlur]);

  return (
    <div className="form-field-container" ref={wrapperRef}>
      <fieldset
        className={`macos-fieldset ${isFloated ? "floated" : ""} ${isFocused ? "is-focused" : ""} ${hasError ? "has-error" : ""}`}
      >
        <legend className="macos-legend">{label}</legend>
        <button
          id={id}
          type="button"
          className="macos-select-button"
          onClick={() => setIsOpen(!isOpen)}
          onFocus={() => setIsFocused(true)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate">{value || ""}</span>
          <ChevronsUpDown size={20} className="chevrons flex-shrink-0" />
        </button>
      </fieldset>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="macos-select-popover"
            role="listbox"
          >
            {options.map((option) => (
              <li
                key={option}
                className="macos-select-option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                  setIsFocused(false);
                  setTimeout(() => onBlur(), 0);
                }}
                role="option"
                aria-selected={value === option}
              >
                {option}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <div
        id={`${id}-error-message`}
        className="macos-error-message"
        aria-live="polite"
      >
        {touched && error && <span>{error}</span>}
      </div>
    </div>
  );
};

const FormTextareaField = React.forwardRef<
  HTMLTextAreaElement,
  {
    field: "message";
    label: string;
    formData: FormDataState;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onClear: () => void;
    onGenerate: () => void;
    hasGeneratedOnce: boolean;
    isTyping: boolean;
  }
>(
  (
    {
      field,
      label,
      formData,
      onChange,
      onBlur,
      onKeyDown,
      onClear,
      onGenerate,
      hasGeneratedOnce,
      isTyping,
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const { value, touched, error } = formData[field];
    const id = `contact-${field}`;
    const isFloated = isFocused || value.length > 0;
    const hasError = touched && !!error;
    const charsLeft = MAX_CHARS - value.length;
    const charCountClass =
      charsLeft < 0 ? "error" : charsLeft < MAX_CHARS * 0.2 ? "warn" : "";

    return (
      <div className="form-field-container">
        <fieldset
          className={`macos-fieldset is-textarea ${isFloated ? "floated" : ""} ${isFocused ? "is-focused" : ""} ${hasError ? "has-error" : ""}`}
        >
          <legend className="macos-legend">{label}</legend>
          <textarea
            ref={ref}
            id={id}
            name={field}
            required
            className="macos-input textarea"
            rows={5}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur(e);
            }}
            onKeyDown={onKeyDown}
            aria-invalid={hasError}
            aria-describedby={`${id}-error ${id}-counter`}
          />
          <div className="macos-textarea-footer">
            <div
              id={`${id}-counter`}
              className={`macos-char-counter ${charCountClass}`}
            >
              {charsLeft}
            </div>
            <div className="macos-footer-controls">
              <AnimatePresence>
                {((hasGeneratedOnce && !isTyping) ||
                  (value.length > 0 && !isTyping)) && (
                  <motion.div
                    className="tooltip"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <button
                      type="button"
                      onClick={onGenerate}
                      disabled={isTyping}
                      className="macos-footer-button generate"
                      aria-label="Generate a new message"
                    >
                      <Sparkles size={16} />
                    </button>
                    <span className="tooltip-text">Generate Message</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {value.length > 0 && !isTyping && (
                  <motion.div
                    className="tooltip"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <button
                      type="button"
                      onClick={onClear}
                      className="macos-footer-button delete"
                      aria-label="Clear message"
                    >
                      <Trash2 size={16} />
                    </button>
                    <span className="tooltip-text">Clear Message</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </fieldset>
        <div
          id={`${id}-error`}
          className="macos-error-message"
          aria-live="polite"
        >
          {touched && error && <span>{error}</span>}
        </div>
      </div>
    );
  },
);

const FeedbackPanel: React.FC<{ status: FormStatus; onReset: () => void }> = ({
  status,
  onReset,
}) => {
  const { t } = useI18n();
  const isSuccess = status === "success";

  const content = {
    icon: isSuccess ? (
      <CheckCircle size={48} className="form-feedback-icon text-green-500" />
    ) : (
      <AlertTriangle size={48} className="form-feedback-icon text-red-500" />
    ),
    title: t(isSuccess ? "contact_success_title" : "contact_error_title"),
    description: t(isSuccess ? "contact_success_desc" : "contact_error_desc"),
    buttonText: t(isSuccess ? "contact_send_another" : "contact_retry_button"),
    buttonClass: isSuccess ? "success" : "error",
  };

  return (
    <motion.div
      key="feedback"
      className="form-feedback-panel"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {content.icon}
      <h3 className={`form-feedback-title ${isSuccess ? "" : "text-red-500"}`}>
        {content.title}
      </h3>
      <p className="form-feedback-description">{content.description}</p>
      <button
        onClick={onReset}
        className={`form-feedback-button ${content.buttonClass}`}
      >
        <RefreshCw size={16} />
        <span>{content.buttonText}</span>
      </button>
    </motion.div>
  );
};

export default ContactSection;
