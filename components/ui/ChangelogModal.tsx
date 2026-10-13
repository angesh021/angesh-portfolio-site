import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCommit, PlusCircle, Wrench, Zap } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { getContent } from '../../lib/contentService';

interface ChangelogModalProps {
  onClose: () => void;
}

const changeTypeIcons = {
  Added: <PlusCircle size={16} className="text-green-400" />,
  Improved: <Zap size={16} className="text-blue-400" />,
  Fixed: <Wrench size={16} className="text-yellow-400" />,
};

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  const { language } = useI18n();
  const personalData = useMemo(() => getContent('personal', language) || {}, [language]);
  const changelogData = personalData.changelogData || [];
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="changelog-modal-container" aria-modal="true" role="dialog">
      <motion.div
        className="changelog-modal-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        ref={modalRef}
        className="changelog-modal-panel"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="changelog-header">
          <h2 className="changelog-title">
            <GitCommit size={20} />
            <span>System Changelog</span>
          </h2>
          <button onClick={onClose} className="changelog-close-btn" aria-label="Close changelog">
            <X size={20} />
          </button>
        </div>
        <div className="changelog-content">
          {changelogData.map((versionLog) => (
            <div key={versionLog.version} className="changelog-version-block">
              <div className="changelog-version-header">
                <h3 className="changelog-version-number">Version {versionLog.version}</h3>
                <span className="changelog-version-date">{versionLog.date}</span>
              </div>
              <ul className="changelog-list">
                {versionLog.changes.map((change, index) => (
                  <li key={index} className="changelog-item">
                    {changeTypeIcons[change.type as keyof typeof changeTypeIcons]}
                    <span>{change.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ChangelogModal;
