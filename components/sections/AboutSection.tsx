import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Section from '../layout/Section';
import { useI18n } from '../../hooks/useI18n';
import { 
  ShieldCheck, Fingerprint, Terminal, Network,
  Cloud, Shield, ShieldAlert, Users, Settings, 
  Server, TerminalSquare, FileUp, MonitorPlay, Code, 
  Cpu, Github, Box, Database, Code2, FileJson, 
  Triangle, Activity
} from 'lucide-react';

const TOOLS = [
  { name: 'Cisco', theSvg: 'cisco', hasDark: true, icon: Network },
  { name: 'Microsoft Azure', localImg: '/assets/aboutme/azure.png', icon: Cloud },
  { name: 'Tanium', localLight: '/assets/aboutme/Tanium - dark.png', localDark: '/assets/aboutme/Tanium - white.png', icon: Shield },
  { name: 'BeyondTrust', localLight: '/assets/aboutme/BeyondTrust - dark.avif', localDark: '/assets/aboutme/BeyondTrust - white.avif', icon: ShieldCheck },
  { name: 'Active Directory', localImg: '/assets/aboutme/ActiveDirectory.png', icon: Users },
  { name: 'GPO', theSvg: 'windows', icon: Settings },
  { name: 'Windows Server', theSvg: 'windows', icon: Server },
  { name: 'PuTTY', localImg: '/assets/aboutme/putty.png', icon: TerminalSquare },
  { name: 'WinSCP', localImg: '/assets/aboutme/WinSCP_Logo.png', icon: FileUp },
  { name: 'MobaXterm', localImg: '/assets/aboutme/mobaxterm.png', icon: MonitorPlay },
  { name: 'Wireshark', localImg: '/assets/aboutme/wireshark.png', icon: Network },
  { name: 'Atlassian Confluence', localImg: '/assets/aboutme/atlassian-confluence.png', icon: Users },
  { name: 'Python', theSvg: 'python', icon: Code },
  { name: 'Linux', theSvg: 'linux', icon: Cpu },
  { name: 'GitHub', theSvg: 'github', hasDark: true, icon: Github },
  { name: 'Docker', theSvg: 'docker', icon: Box },
  { name: 'PostgreSQL', theSvg: 'postgresql', icon: Database },
  { name: 'React', theSvg: 'react', hasDark: true, icon: Code2 },
  { name: 'TypeScript', theSvg: 'typescript', icon: FileJson },
  { name: 'Vercel', localLight: '/assets/aboutme/vercel-logotype-dark.png', localDark: '/assets/aboutme/vercel-logotype-light.png', imgClass: 'scale-[0.8] origin-center', icon: Triangle },
  { name: 'Supabase', theSvg: 'supabase', icon: Database },
  { name: 'Splunk', theSvg: 'splunk', imgClass: 'dark:invert scale-[2.1] md:scale-[2.64] origin-center mx-4', icon: Activity },
  { name: 'CrowdStrike', theSvg: 'crowdstrike', imgClass: 'dark:invert dark:hue-rotate-180', icon: ShieldAlert },
];

const BrandLogos = () => (
  <>
    {TOOLS.map((tool, idx) => {
      const Icon = tool.icon;
      const excludeTitle = ['crowdstrike', 'vercel', 'cisco', 'tanium', 'splunk', 'active directory', 'beyondtrust'].includes(tool.name.toLowerCase());
      return (
        <div 
          key={idx} 
          className="group flex items-center gap-3 opacity-80 hover:opacity-100 transition-all duration-300 transform-gpu hover:scale-110 active:scale-95 hover:drop-shadow-[0_0_12px_rgba(27,156,166,0.2)] dark:hover:drop-shadow-[0_0_12px_rgba(100,255,218,0.2)] pointer-events-auto select-none cursor-pointer"
          title={tool.name}
        >
          <div className="flex items-center justify-center h-12 md:h-14 select-none transition-transform duration-300 transform-gpu group-hover:scale-105">
            {tool.localLight && tool.localDark ? (
              <>
                <img 
                  src={tool.localLight} 
                  alt={tool.name} 
                  className={`h-7 md:h-9 w-auto object-contain dark:hidden pointer-events-none select-none transition-all duration-300 group-hover:brightness-110 ${tool.imgClass || ''}`}
                  draggable="false"
                  onContextMenu={(e) => e.preventDefault()}
                />
                <img 
                  src={tool.localDark} 
                  alt={tool.name} 
                  className={`h-7 md:h-9 w-auto object-contain hidden dark:block pointer-events-none select-none transition-all duration-300 group-hover:brightness-125 ${tool.imgClass || ''}`}
                  draggable="false"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </>
            ) : tool.localImg ? (
              <img 
                src={tool.localImg} 
                alt={tool.name} 
                className={`h-7 md:h-9 w-auto object-contain pointer-events-none select-none transition-all duration-300 group-hover:brightness-110 group-hover:contrast-110 ${tool.imgClass || ''}`}
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : tool.theSvg ? (
              tool.hasDark ? (
                <>
                  <img 
                    src={`https://thesvg.org/icons/${tool.theSvg}/default.svg`} 
                    alt={tool.name} 
                    className={`h-7 md:h-9 w-auto object-contain dark:hidden pointer-events-none select-none transition-all duration-300 group-hover:brightness-110 ${tool.imgClass || ''}`}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <img 
                    src={`https://thesvg.org/icons/${tool.theSvg}/dark.svg`} 
                    alt={tool.name} 
                    className={`h-7 md:h-9 w-auto object-contain hidden dark:block pointer-events-none select-none transition-all duration-300 group-hover:brightness-125 ${tool.imgClass || ''}`}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </>
              ) : (
                  <img 
                    src={`https://thesvg.org/icons/${tool.theSvg}/default.svg`} 
                    alt={tool.name} 
                    className={`h-7 md:h-9 w-auto object-contain pointer-events-none select-none transition-all duration-300 group-hover:brightness-110 ${tool.imgClass || ''}`}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                  />
              )
            ) : (
              <Icon className="h-7 w-7 text-[#1b9ca6] dark:text-[#64ffda] pointer-events-none select-none transition-all duration-300 group-hover:scale-105" strokeWidth={1.5} />
            )}
          </div>
          {!excludeTitle && (
            <span className="font-mono text-sm md:text-base font-semibold tracking-wide text-white dark:text-[#64ffda] whitespace-nowrap select-none transition-colors duration-300 group-hover:text-white dark:group-hover:text-white">
              {tool.name}
            </span>
          )}
        </div>
      );
    })}
  </>
);

/**
 * The About section component customized for Cybersecurity and Network Access Control.
 * It provides a premium mission banner with enterprise technology partners/protocols
 * and showcases elite defensive services in an interactive layout.
 *
 * @returns {JSX.Element} The About section.
 */
const AboutSection: React.FC = () => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  // Animation variants
  const cardContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      }
    }
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 110,
        damping: 15
      }
    }
  };

  return (
    <Section id="about" title={t('about_title')}>
      <div className="space-y-16">
        
        {/* TOP SECTION: Mission Banner Card */}
        <motion.div
          className="rounded-[2.5rem] p-8 md:p-12 lg:p-14 bg-gradient-to-br from-[#1c92a2] via-[#1b9ca6] to-[#126e7b] dark:from-[#112240] dark:via-[#152e54] dark:to-[#0a192f] border border-[#1b9ca6]/20 dark:border-[#64ffda]/10 shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Decorative subtle background highlights */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 dark:bg-[#64ffda]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 dark:bg-[#64ffda]/5 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

          {/* Mission Content */}
          <div className="relative z-10 max-w-5xl">
            <motion.h3 
              className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight text-white dark:text-[#64ffda] leading-tight md:leading-snug text-left mb-12 sm:mb-16 font-sans select-none"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {t('about_mission') || "My mission is to assist enterprises and startups in architecting robust, identity-driven security frameworks and automation that guarantee secure network access and protect critical infrastructure with absolute trust."}
            </motion.h3>

            {/* Infinite Brand Logos Carousel */}
            <motion.div 
              className="pt-6 border-t border-white/10 dark:border-white/5 relative overflow-hidden w-full"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={() => setIsHovered(true)}
              onTouchEnd={() => setIsHovered(false)}
              onTouchCancel={() => setIsHovered(false)}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              
              <motion.div 
                className="flex items-center w-max cursor-pointer"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                  duration: isHovered ? 85 : 25,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                <div className="flex items-center gap-x-12 sm:gap-x-16 pr-12 sm:pr-16">
                  <BrandLogos />
                </div>
                <div className="flex items-center gap-x-12 sm:gap-x-16 pr-12 sm:pr-16">
                  <BrandLogos />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* BOTTOM SECTION: Interactive Service Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-start">
          
          {/* Left Side: Dynamic Sticky Header */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <motion.h3 
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-light-text dark:text-dark-text leading-[1.08] text-left uppercase lg:max-w-xs"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {t('about_assist_title') || "How Can I Protect You?"}
            </motion.h3>
          </div>

          {/* Right Side: Services Grid of Cards */}
          <motion.div 
            className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6"
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {/* 01: Network Access Control (NAC) */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="p-6 md:p-8 rounded-3xl bg-white/45 dark:bg-[#112240]/45 border border-light-border/70 dark:border-dark-card/60 backdrop-blur shadow-sm hover:shadow-lg hover:border-[#1b9ca6]/45 dark:hover:border-[#64ffda]/30 transition-all duration-300 flex flex-col justify-between min-h-[200px]"
            >
              {/* Card Top: Icon and Content */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-100/60 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <p className="text-[12px] md:text-[13px] leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                  {t('service_ui_desc') || "I design, deploy, and manage advanced Cisco ISE and RADIUS/TACACS+ systems, securing wired, wireless, and VPN access through granular, context-aware user policies."}
                </p>
              </div>
              {/* Card Bottom: Service Name and Index */}
              <div className="flex items-end justify-between mt-8">
                <h4 className="font-bold text-base md:text-lg text-light-text dark:text-dark-text tracking-tight">
                  {t('service_ui_title') || "Network Access Control"}
                </h4>
                <span className="font-mono text-xs md:text-sm tracking-widest text-light-text-secondary/40 dark:text-dark-text-secondary/35 font-semibold">
                  01
                </span>
              </div>
            </motion.div>

            {/* 02: Endpoint Security & Zero-Trust */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="p-6 md:p-8 rounded-3xl bg-white/45 dark:bg-[#112240]/45 border border-light-border/70 dark:border-dark-card/60 backdrop-blur shadow-sm hover:shadow-lg hover:border-[#1b9ca6]/45 dark:hover:border-[#64ffda]/30 transition-all duration-300 flex flex-col justify-between min-h-[200px]"
            >
              {/* Card Top: Icon and Content */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/25 border border-blue-100/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <Fingerprint size={22} />
                </div>
                <p className="text-[12px] md:text-[13px] leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                  {t('service_dev_desc') || "I implement comprehensive device profiling, posture-compliance assessments, and modern agent configurations, keeping unauthorized or non-compliant devices off critical layers."}
                </p>
              </div>
              {/* Card Bottom: Service Name and Index */}
              <div className="flex items-end justify-between mt-8">
                <h4 className="font-bold text-base md:text-lg text-light-text dark:text-dark-text tracking-tight">
                  {t('service_dev_title') || "Endpoint Security & Zero-Trust"}
                </h4>
                <span className="font-mono text-xs md:text-sm tracking-widest text-light-text-secondary/40 dark:text-dark-text-secondary/35 font-semibold">
                  02
                </span>
              </div>
            </motion.div>

            {/* 03: Security Automation & SecOps */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="p-6 md:p-8 rounded-3xl bg-white/45 dark:bg-[#112240]/45 border border-light-border/70 dark:border-dark-card/60 backdrop-blur shadow-sm hover:shadow-lg hover:border-[#1b9ca6]/45 dark:hover:border-[#64ffda]/30 transition-all duration-300 flex flex-col justify-between min-h-[200px]"
            >
              {/* Card Top: Icon and Content */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-50 dark:bg-purple-950/25 border border-purple-100/60 dark:border-purple-900/40 text-purple-600 dark:text-purple-400 flex-shrink-0">
                  <Terminal size={22} strokeWidth={2.5} />
                </div>
                <p className="text-[12px] md:text-[13px] leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                  {t('service_graphic_desc') || "I develop robust automation scripts and playbooks leveraging Python, PowerShell, and bash to speed up threat detection, automate policy edits, and reduce human operational error."}
                </p>
              </div>
              {/* Card Bottom: Service Name and Index */}
              <div className="flex items-end justify-between mt-8">
                <h4 className="font-bold text-base md:text-lg text-light-text dark:text-dark-text tracking-tight">
                  {t('service_graphic_title') || "Security Automation & SecOps"}
                </h4>
                <span className="font-mono text-xs md:text-sm tracking-widest text-light-text-secondary/40 dark:text-dark-text-secondary/35 font-semibold">
                  03
                </span>
              </div>
            </motion.div>

            {/* 04: Defensive Architecture */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="p-6 md:p-8 rounded-3xl bg-white/45 dark:bg-[#112240]/45 border border-light-border/70 dark:border-dark-card/60 backdrop-blur shadow-sm hover:shadow-lg hover:border-[#1b9ca6]/45 dark:hover:border-[#64ffda]/30 transition-all duration-300 flex flex-col justify-between min-h-[200px]"
            >
              {/* Card Top: Icon and Content */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/25 border border-teal-100/60 dark:border-teal-900/40 text-teal-600 dark:text-teal-400 flex-shrink-0">
                  <Network size={22} />
                </div>
                <p className="text-[12px] md:text-[13px] leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                  {t('service_branding_desc') || "I architect micro-segmented networks, perform detailed threat modeling, and review ingress/egress points to safeguard high-value servers and data repositories from persistent attacks."}
                </p>
              </div>
              {/* Card Bottom: Service Name and Index */}
              <div className="flex items-end justify-between mt-8">
                <h4 className="font-bold text-base md:text-lg text-light-text dark:text-dark-text tracking-tight">
                  {t('service_branding_title') || "Defensive Architecture"}
                </h4>
                <span className="font-mono text-xs md:text-sm tracking-widest text-light-text-secondary/40 dark:text-dark-text-secondary/35 font-semibold">
                  04
                </span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </Section>
  );
};

export default AboutSection;
