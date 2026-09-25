import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { skillCategories } from '../../lib/data';
import type { Skill } from '../../types';
import { Target } from 'lucide-react';
import DataThroughputGraph from './DataThroughputGraph';
import ThreatFeedPanel from './ThreatFeedPanel';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';

interface SkillTarget extends Skill {
  categoryColor: string;
  targetCoords: { x: number; y: number };
  categoryName: string;
}

interface SkillProfilerProps {
    isScanning: boolean;
    onScanComplete: () => void;
}

// --- Helper Components ---

const Reticle: React.FC<{ color: string }> = ({ color }) => (
    <motion.svg
      viewBox="0 0 100 100"
      initial={{ scale: 0, opacity: 0, rotate: -90 }}
      animate={{ scale: 1, opacity: 1, rotate: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
      className="skill-profiler-reticle"
      style={{ ['--category-color' as any]: color }}
    >
        {/* Crosshairs */}
        <motion.line x1="50" y1="0" x2="50" y2="35" stroke={color} strokeWidth="2" />
        <motion.line x1="50" y1="100" x2="50" y2="65" stroke={color} strokeWidth="2" />
        <motion.line x1="0" y1="50" x2="35" y2="50" stroke={color} strokeWidth="2" />
        <motion.line x1="100" y1="50" x2="65" y2="50" stroke={color} strokeWidth="2" />
        
        {/* Rotating Outer Circle */}
        <motion.circle 
            cx="50" cy="50" r="40" 
            stroke={color} strokeWidth="2" fill="none" 
            strokeDasharray="20 231.2"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
    </motion.svg>
);


// --- Main Component ---

const SkillProfiler: React.FC<SkillProfilerProps> = ({ isScanning, onScanComplete }) => {
  const { t } = useI18n();
  const [hoveredSkill, setHoveredSkill] = useState<SkillTarget | null>(null);
  const [pinnedSkill, setPinnedSkill] = useState<SkillTarget | null>(null);
  const { uniformTheme, accentColor } = useTheme();
  const scanIntervalRef = useRef<number | null>(null);

  const skillTargets = useMemo<SkillTarget[]>(() => {
    const targets: SkillTarget[] = [];
    let index = 0;
    Object.entries(skillCategories).forEach(([categoryName, category]) => {
      category.skills.forEach(skill => {
        const x = (parseInt(skill.name.slice(0, 5), 36) % 70) + 15;
        const y = (index * 23 % 60) + 20;
        
        targets.push({
          ...skill,
          categoryColor: category.color,
          targetCoords: { x, y },
          categoryName,
        });
        index++;
      });
    });
    return targets;
  }, []);
  
  useEffect(() => {
    if (isScanning) {
      let scanIndex = 0;
      setHoveredSkill(null); // Clear hover state during scan

      // Clear any previous interval
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

      scanIntervalRef.current = window.setInterval(() => {
        setPinnedSkill(skillTargets[scanIndex]);
        scanIndex++;
        if (scanIndex >= skillTargets.length) {
          clearInterval(scanIntervalRef.current!);
          scanIntervalRef.current = null;
          onScanComplete();
          // Briefly show "Scan Complete" then clear
          setTimeout(() => setPinnedSkill(null), 2000);
        }
      }, 800); // Time per skill
    } else {
        // If scan is cancelled externally, clear interval
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
    }

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isScanning, onScanComplete, skillTargets]);


  const activeSkill = hoveredSkill || pinnedSkill;
  const displayColor = uniformTheme ? accentColor : activeSkill?.categoryColor;

  return (
    <div className="skill-profiler">
      <div className="skill-profiler-list" onMouseLeave={() => setHoveredSkill(null)}>
        {Object.entries(skillCategories).map(([categoryName, categoryData]) => (
          <div key={categoryName} className="mb-4">
            <h3
              className="skill-profiler-category-title"
              style={{ ['--category-color' as any]: uniformTheme ? accentColor : categoryData.color }}
            >
              {categoryName}
            </h3>
            <div className="space-y-1">
              {skillTargets
                .filter(st => st.categoryColor === categoryData.color)
                .map((skill) => {
                  const Icon = skill.icon;
                  return (
                    <button
                      key={skill.name}
                      onMouseEnter={() => !isScanning && setHoveredSkill(skill)}
                      onClick={() => !isScanning && setPinnedSkill(pinnedSkill?.name === skill.name ? null : skill)}
                      disabled={isScanning}
                      className={`skill-profiler-item ${pinnedSkill?.name === skill.name ? 'active' : ''}`}
                      style={{ ['--category-color' as any]: uniformTheme ? accentColor : skill.categoryColor }}
                      aria-label={`View details for ${skill.name}`}
                    >
                      <Icon className="skill-profiler-item-icon" />
                      <span className="skill-profiler-item-name">{skill.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="skill-profiler-display">
        <div className="skill-profiler-display-main">
          <AnimatePresence>
            {activeSkill && displayColor && (
              <motion.div
                  key={activeSkill.name}
                  layoutId="reticle"
                  className="absolute"
                  initial={false}
                  animate={{
                      top: `${activeSkill.targetCoords.y}%`,
                      left: `${activeSkill.targetCoords.x}%`,
                      translateX: '-50%',
                      translateY: '-50%',
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                  <Reticle color={displayColor} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
              {activeSkill && displayColor ? (
                  <motion.div
                      key={activeSkill.name}
                      className="skill-profiler-info"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                      exit={{ opacity: 0, y: 10 }}
                  >
                      <div className="skill-profiler-info-header">
                          <activeSkill.icon
                              className="skill-profiler-info-icon"
                              style={{ ['--category-color' as any]: displayColor }}
                          />
                          <h4
                              className="skill-profiler-info-name"
                              style={{ ['--category-color' as any]: displayColor }}
                          >
                              {activeSkill.name}
                          </h4>
                      </div>
                      <p className="skill-profiler-info-desc">{activeSkill.description}</p>
                      <DataThroughputGraph color={displayColor} isScanning={isScanning} />
                  </motion.div>
              ) : (
                  <div className="skill-profiler-placeholder">
                      <Target size={32} className="mb-4 opacity-20" />
                      <p className="skill-profiler-placeholder-text">
                        {isScanning ? (t('dash_sys_scan') || 'SYSTEM SCAN IN PROGRESS...') : (t('dash_hover_skill') || 'Hover or click a skill to profile.')}
                      </p>
                  </div>
              )}
          </AnimatePresence>
        </div>
        <ThreatFeedPanel activeSkill={activeSkill} />
      </div>
    </div>
  );
};

export default SkillProfiler;
