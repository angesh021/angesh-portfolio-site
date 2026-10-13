import React, { useState, useMemo } from 'react';
// FIX: Import Variants to correctly type framer-motion variants object.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Mail, Linkedin, UserSquare, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { getContent } from '../../lib/contentService';
import { AnalyticsTracker } from '../../lib/analyticsTracker';

const getVCard = (contactInfo: any) => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:Angesh Chanderdip
N:Chanderdip;Angesh;;;
EMAIL;TYPE=INTERNET:${contactInfo?.email || ''}
URL;TYPE=linkedin:${contactInfo?.linkedin || ''}
URL;TYPE=github:${contactInfo?.github || ''}
ROLE:Cybersecurity Engineer
END:VCARD`;
    const blob = new Blob([vCard], { type: "text/vcard;charset=utf-8" });
    return URL.createObjectURL(blob);
};

const channels = [
  { id: 'email', icon: Mail, titleKey: 'channel_email' },
  { id: 'linkedin', icon: Linkedin, titleKey: 'channel_linkedin' },
  { id: 'vcard', icon: UserSquare, titleKey: 'channel_vcard' }
];

const ContactChannelSelector: React.FC = () => {
  const { language, t } = useI18n();
  const personalData = useMemo(() => getContent('personal', language) || {}, [language]);
  const contactInfo = personalData.contactInfo || {};

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (contactInfo.email) {
      navigator.clipboard.writeText(contactInfo.email);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  // FIX: Added Variants type to fix type inference issue with 'ease' property.
  const contentVariants: Variants = {
    collapsed: { opacity: 0, height: 0 },
    open: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }
    }
  };

  return (
    <div className="contact-channels-container">
      {channels.map(({ id, icon: Icon, titleKey }) => {
        const isExpanded = id === expandedId;
        const title = t(titleKey) || titleKey;
        return (
          <div key={id} className="channel-item">
            <motion.button
              type="button"
              initial={false}
              onClick={() => setExpandedId(isExpanded ? null : id)}
              className="channel-header"
              aria-expanded={isExpanded}
              aria-controls={`channel-content-${id}`}
            >
              <Icon size={20} className="channel-header-icon" />
              <span>{title}</span>
              <motion.div
                className="channel-header-chevron"
                animate={{ rotate: isExpanded ? 180 : 0 }}
              >
                <ChevronDown size={20} />
              </motion.div>
            </motion.button>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.section
                  id={`channel-content-${id}`}
                  key="content"
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={contentVariants}
                  className="channel-content"
                >
                  <div className="channel-content-inner">
                    {id === 'email' && (
                      <>
                        <p className="channel-info-text">{contactInfo.email}</p>
                        <button onClick={(e) => { handleCopy(); AnalyticsTracker.trackEngagementEvent('email_click', 'contact_copy'); }} className="channel-action-button">
                           {isCopied ? <Check size={16} /> : <Copy size={16} />}
                           <span>{isCopied ? (t('channel_copied') || 'Copied!') : (t('channel_copy') || 'Copy Address')}</span>
                        </button>
                        <a href={`mailto:${contactInfo.email}`} onClick={() => AnalyticsTracker.trackEngagementEvent('email_click', 'contact_mailto')} className="channel-action-button">
                           <ExternalLink size={16} />
                           <span>{t('channel_open_mail') || 'Open Mail App'}</span>
                        </a>
                      </>
                    )}
                    {id === 'linkedin' && (
                       <a href={contactInfo.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => AnalyticsTracker.trackEngagementEvent('linkedin_click', 'contact_channel')} className="channel-action-button">
                           <ExternalLink size={16} />
                           <span>{t('channel_view_profile') || 'View Profile'}</span>
                       </a>
                    )}
                     {id === 'vcard' && (
                       <a href={getVCard(contactInfo)} download="Angesh_Chanderdip.vcf" onClick={() => AnalyticsTracker.trackEngagementEvent('resume_download', 'vcard')} className="channel-action-button">
                           <UserSquare size={16} />
                           <span>{t('channel_download_contact') || 'Download Contact'}</span>
                       </a>
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default ContactChannelSelector;