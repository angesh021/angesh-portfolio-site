import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Lock, FileText, Cpu, CheckCircle2, Globe, Cookie, Eye } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms' | 'ai' | 'cookies';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'privacy' }) => {
  const { language } = useI18n();
  const isFr = language === 'fr';
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'ai' | 'cookies'>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-3xl max-h-[85vh] bg-[#0A0D14] border border-primary/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0E121C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono tracking-tight">
                {isFr ? 'Mentions Légales & Confidentialité' : 'Legal & Privacy Disclosures'}
              </h2>
              <p className="text-[11px] text-gray-400 font-mono">
                {isFr ? 'Conformité RGPD, PIPEDA, Loi 25 & Normes de Cybersécurité' : 'GDPR, PIPEDA, Quebec Law 25 & Cybersecurity Governance'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-white/5 bg-[#090C14] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Lock size={13} />
            <span>{isFr ? 'Confidentialité (RGPD)' : 'Privacy Policy'}</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'ai'
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Cpu size={13} />
            <span>{isFr ? 'Transparence IA (EU AI Act)' : 'AI Disclosures'}</span>
          </button>
          <button
            onClick={() => setActiveTab('cookies')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'cookies'
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Cookie size={13} />
            <span>{isFr ? 'Témoins & Stockage' : 'Cookies & Storage'}</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'terms'
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <FileText size={13} />
            <span>{isFr ? 'Conditions & Droits' : 'Terms & IP'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-300 font-sans leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <CheckCircle2 size={14} />
                  {isFr ? '1. Responsable du Traitement' : '1. Data Controller'}
                </h3>
                <p>
                  {isFr
                    ? 'Le responsable du traitement des données pour ce site portfolio personnel est Angesh Chanderdip, Ingénieur en Cybersécurité (Montréal, QC, Canada). Pour toute question relative à vos données ou pour exercer vos droits, contactez :'
                    : 'The data controller responsible for this personal engineering portfolio is Angesh Chanderdip, Cybersecurity Engineer (Montreal, QC, Canada). For data protection inquiries or exercising rights, contact:'}
                </p>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-[11px] text-primary">
                  Email: angesh021@gmail.com
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <CheckCircle2 size={14} />
                  {isFr ? '2. Données Collectées & Finalités' : '2. Data Collected & Purposes'}
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                  <li>
                    <strong className="text-white">{isFr ? 'Formulaire de Contact :' : 'Contact Form:'}</strong>{' '}
                    {isFr
                      ? 'Nom, adresse courriel, objet et message. Ces informations sont exclusivement utilisées pour répondre à vos demandes professionnelles.'
                      : 'Name, email address, subject, and message. Collected solely to review and respond to incoming professional inquiries.'}
                  </li>
                  <li>
                    <strong className="text-white">{isFr ? 'Télémétrie & Sécurité (Privacy-First) :' : 'Telemetry & Performance (Privacy-by-Design):'}</strong>{' '}
                    {isFr
                      ? 'Temps de chargement des pages, métriques Web Vitals (LCP, CLS, FID), famille de navigateur et identifiant de session haché non réversible. Les adresses IP brutes ne sont jamais enregistrées.'
                      : 'Page render latency, Core Web Vitals, device category, browser family, and a cryptographically pseudonymous session hash. Raw IP addresses are never permanently retained.'}
                  </li>
                  <li>
                    <strong className="text-white">{isFr ? 'Assistant IA Aegis :' : 'Aegis AI Assistant:'}</strong>{' '}
                    {isFr
                      ? 'Les questions posées sont transmises à l’API Google Gemini pour générer des réponses en temps réel basées sur les projets du portfolio.'
                      : 'User queries are processed via Google Gemini API solely to generate real-time portfolio responses. No personal profile files are shared.'}
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <CheckCircle2 size={14} />
                  {isFr ? '3. Base Juridique (RGPD, PIPEDA, Loi 25 Québec)' : '3. Legal Basis for Processing'}
                </h3>
                <p>
                  {isFr
                    ? 'Le traitement repose sur votre consentement explicite lors de l’envoi d’un message ou d’une interaction avec le clavardoir IA, et sur l’intérêt légitime (sécurité des systèmes, détection des cyberattaques et diagnostics de performance).'
                    : 'Processing is grounded in explicit user consent when submitting a contact request or engaging with the AI chatbot, and legitimate interest for web infrastructure security, brute-force mitigation, and performance monitoring.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <CheckCircle2 size={14} />
                  {isFr ? '4. Sous-traitants & Hébergement Cloud' : '4. Sub-processors & Infrastructure'}
                </h3>
                <p>
                  {isFr
                    ? 'Les services suivants sont employés sous accords de traitement conformes :'
                    : 'The application operates utilizing modern, enterprise-tier cloud infrastructure providers:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-white font-semibold">Vercel Inc.</span> (Hébergement & Edge)
                  </div>
                  <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-white font-semibold">Supabase Inc.</span> (PostgreSQL & Auth)
                  </div>
                  <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-white font-semibold">Google Cloud</span> (API Gemini 2.5 Flash)
                  </div>
                  <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-white font-semibold">Resend Inc.</span> (Routage courriel transactionnel)
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <CheckCircle2 size={14} />
                  {isFr ? '5. Vos Droits' : '5. Your Rights'}
                </h3>
                <p>
                  {isFr
                    ? 'Conformément au RGPD, à la Loi 25 (Québec) et à la PIPEDA (Canada), vous bénéficiez d’un droit d’accès, de rectification et d’effacement ("droit à l’oubli") de vos données de contact. Transmettez simplement votre demande à angesh021@gmail.com.'
                    : 'Under GDPR, PIPEDA, and Quebec Law 25, you hold rights to access, correct, or request total deletion of your contact data records. Simply email your request to angesh021@gmail.com for immediate fulfillment.'}
                </p>
              </section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <Cpu size={14} />
                  {isFr ? 'Conformité à la Loi Européenne sur l’IA (EU AI Act - Art. 50)' : 'EU Artificial Intelligence Act Transparency (Art. 50)'}
                </h3>
                <p>
                  {isFr
                    ? 'L’assistant "Aegis" présent sur ce site est un système d’intelligence artificielle générative conçu pour assister les visiteurs dans l’exploration des compétences, réalisations et projets d’Angesh Chanderdip.'
                    : 'The interactive assistant "Aegis" integrated into this website is an AI-powered conversational agent engineered to answer questions regarding Angesh Chanderdip\'s cybersecurity projects, certifications, and experience.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <CheckCircle2 size={14} />
                  {isFr ? 'Transparence & Limites' : 'Transparency & Grounding Boundaries'}
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                  <li>
                    {isFr
                      ? 'Les réponses sont générées de manière synthétique à partir de données factuelles du portfolio (Retrieval-Augmented Generation).'
                      : 'Responses are synthetically generated using contextual grounding from verified portfolio projects and credentials.'}
                  </li>
                  <li>
                    {isFr
                      ? 'L’assistant ne prend aucune décision automatisée ayant des effets juridiques ou significatifs sur les personnes.'
                      : 'The AI assistant performs zero automated decision-making or legal profiling.'}
                  </li>
                  <li>
                    {isFr
                      ? 'Les conversations peuvent être auditées sous forme anonymisée pour détecter les tentatives d’injection de prompts ou d’attaques adverses (sécurité applicative).'
                      : 'Interactions may be monitored in anonymized security audit logs to defend against prompt injection and adversarial attacks.'}
                  </li>
                </ul>
              </section>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <Cookie size={14} />
                  {isFr ? 'Politique Zéro Traceur Publicitaire' : 'Zero Advertising Trackers Policy'}
                </h3>
                <p>
                  {isFr
                    ? 'Ce site respecte la directive ePrivacy européenne et ne dépose AUCUN témoin (cookie) publicitaire, pixel de pistage tiers (Facebook Pixel, Google Ads) ou outil de profilage commercial.'
                    : 'This application rigorously adheres to the European ePrivacy Directive. It employs ZERO third-party advertising cookies, zero retargeting pixels (e.g., Facebook, Google Ads), and zero cross-domain behavioral fingerprinting.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <CheckCircle2 size={14} />
                  {isFr ? 'Stockage Local Strictement Fonctionnel' : 'Strictly Necessary Local Storage'}
                </h3>
                <p>
                  {isFr
                    ? 'Seules des variables de configuration locales indispensables au bon fonctionnement de l’interface sont conservées dans le navigateur (localStorage) :'
                    : 'Only strictly necessary user preferences are preserved client-side in browser localStorage:'}
                </p>
                <div className="space-y-1.5 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-primary">language</span>
                    <span className="text-gray-400">{isFr ? 'Choix de langue (fr/en)' : 'User language preference'}</span>
                  </div>
                  <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-primary">theme</span>
                    <span className="text-gray-400">{isFr ? 'Préférence de contraste sombre' : 'Dark theme preference'}</span>
                  </div>
                  <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-primary">aegis_tts</span>
                    <span className="text-gray-400">{isFr ? 'État de synthèse vocale' : 'Voice audio toggle state'}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 pt-1">
                  {isFr
                    ? 'Conformément au considérant 25 de la directive ePrivacy, ces éléments purement fonctionnels ne nécessitent aucun bandeau intrusif d’acceptation.'
                    : 'In compliance with Recital 25 of the ePrivacy Directive, strictly functional local storage does not require an intrusive blocking cookie consent wall.'}
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <FileText size={14} />
                  {isFr ? 'Propriété Intellectuelle' : 'Intellectual Property & Licensing'}
                </h3>
                <p>
                  {isFr
                    ? 'Tous les contenus rédactionnels, études de cas techniques, schémas d’architecture et créations visuelles de ce portfolio sont la propriété intellectuelle exclusive d’Angesh Chanderdip, protégés par les lois internationales sur le droit d’auteur.'
                    : 'All original case study write-ups, architecture diagrams, written technical analyses, and branding published on this portfolio are the exclusive intellectual property of Angesh Chanderdip.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <Globe size={14} />
                  {isFr ? 'Accessibilité Numérique (WCAG 2.1 AA)' : 'Digital Accessibility Commitment'}
                </h3>
                <p>
                  {isFr
                    ? 'Ce site applique les normes d’accessibilité WCAG 2.1 niveau AA et ADA Title III : contrastes de couleurs vérifiés, navigation complète au clavier, typographies adaptables et balisage ARIA pour lecteurs d’écran.'
                    : 'This application is engineered in alignment with WCAG 2.1 Level AA and ADA Title III accessibility standards, providing verified color contrast, full keyboard navigation, screen reader ARIA landmarks, and responsive viewport sizing.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 text-primary">
                  <CheckCircle2 size={14} />
                  {isFr ? 'Législation Applicable' : 'Governing Law & Jurisdiction'}
                </h3>
                <p>
                  {isFr
                    ? 'L’utilisation de ce site est régie par les lois en vigueur dans la province de Québec et les lois fédérales applicables du Canada.'
                    : 'The operation and terms of this portfolio are governed by the laws of the Province of Quebec and the federal laws of Canada applicable therein.'}
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-[#0E121C]">
          <span className="text-[11px] font-mono text-gray-400">
            {isFr ? 'Dernière mise à jour : Septembre 2026' : 'Last Updated: September 2026'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 font-mono text-xs font-semibold transition-all cursor-pointer"
          >
            {isFr ? 'Fermer' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LegalModal;
