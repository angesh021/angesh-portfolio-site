/**
 * File: App.tsx
 * Author: Angesh Chanderdip 
 * Purpose: Roots the single page portfolio context with conditional layout managers, state containment, and security boundaries.
 * Responsibilities:
 *   - Orchestrates primary routing via HTML5 hashchange listener hooks
 *   - Bundles dependency injection structures (Theme, Settings, Localization)
 *   - Manages interactive presentation flows (Bootloader, Portfolio, Protected Client Console, 404 Interceptor)
 * Dependencies: React, Framer Motion, Providers, Hook suites, Custom layout sections
 * Notes: Ensures smooth overscroll dynamics and strict layout boundaries.
 * Changelog:
 *   - Added robust route integrity checking with matching list of accepted anchors to route abnormal hash targets directly to Error404Page.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Providers
import { ThemeProvider } from './hooks/useTheme';
import { I18nProvider, useI18n } from './hooks/useI18n';
import { SettingsProvider } from './hooks/useSettings';
import { StreakProvider } from './hooks/useStreak';

// Hooks
import { useActiveSection } from './hooks/useActiveSection';
import { useOverscrollBounce } from './hooks/useOverscrollBounce';
import { useStreak } from './hooks/useStreak';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Sections
import HeroSection from './components/sections/HeroSection';
import AboutSection from './components/sections/AboutSection';
import ExperienceSection from './components/sections/ExperienceSection';
import ProjectsSection from './components/sections/ProjectsSection';
import EducationSection from './components/sections/EducationSection';
import ContactSection from './components/sections/ContactSection';

// UI Effects
import CRTEffect from './components/ui/CRTEffect';
import SystemBootloader from './components/ui/SystemBootloader';
import IntroLoader from './components/ui/IntroLoader';
import ScrollingStoryBackground from './components/ui/MatrixBackground';
import BackToTopButton from './components/ui/BackToTopButton';
import { PortfolioAssistant } from './components/assistant/PortfolioAssistant';

// New Dashboard Components
import { SkeletonScreen, SkeletonDashboard } from './components/ui/Skeleton';
import Login from './components/dashboard/Login';
import Dashboard from './components/dashboard/Dashboard';
import Error404Page from './components/ui/Error404Page';
import { SecurityService } from './lib/security/SecurityService';
import { AnalyticsTracker } from './lib/analyticsTracker';
import { supabase } from './lib/supabase';
import { SEOEngine } from './components/seo/SEOEngine';

// Styles
import './styles/global.css';
import './styles/ui-effects.css';
import './styles/header.css';
import './styles/hero-section.css';
import './styles/about-section.css';
import './styles/experience-section.css';
import './styles/education-section.css';
import './styles/projects-section.css';
import './styles/contact-section.css';
import './styles/footer.css';
import './styles/resume-downloader.css';
import './styles/dashboard.css';

/**
 * Component: AppContent
 * Purpose: Renders the active portfolio experience with high-fidelity visual layout trees.
 * Main responsibilities:
 *   - Integrates CRT styling overlays and active cyber background grids
 *   - Handles custom scroll restoration triggers for active navigation elements
 * Props:
 *   - isBooting: boolean (determines if boot loader is actively blocking display elements)
 *   - onBootComplete: () => void (callback executing state advance inside parents)
 * State:
 *   - Uses reactive custom overscroll and section tracking modules
 * Side Effects:
 *   - Updates document title dynamically based on active scrolling window element
 *   - Handles viewport height corrections upon boot completion safely
 */
const AppContent: React.FC<{
  isBooting: boolean;
  onBootComplete: () => void;
}> = ({ isBooting, onBootComplete }) => {
  const { t } = useI18n();
  const { addPoints } = useStreak();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const overscrollY = useOverscrollBounce(mainContentRef);
  const [isIntroLoading, setIsIntroLoading] = useState(true);
  
  const sectionIds = ['hero', 'about', 'experience', 'projects', 'education', 'contact'];
  const activeSection = useActiveSection(sectionIds);

  // ========================================
  // Metadata & Title Synchronization
  // ========================================
  useEffect(() => {
    const sectionTitles: { [key: string]: string } = {
      hero: 'Angesh Chanderdip - Cybersecurity Portfolio',
      about: `${t('nav_about')} | Angesh Chanderdip`,
      experience: `${t('nav_experience')} | Angesh Chanderdip`,
      projects: `${t('nav_projects')} | Angesh Chanderdip`,
      education: `${t('nav_education')} | Angesh Chanderdip`,
      contact: `${t('nav_contact')} | Angesh Chanderdip`,
    };
    document.title = sectionTitles[activeSection] || 'Angesh Chanderdip - Cybersecurity Portfolio';
    
    if (activeSection) {
      AnalyticsTracker.trackSectionView(activeSection);
      addPoints(5, 'explore_section');
    }
  }, [activeSection, t, addPoints]);

  useEffect(() => {
    if (!activeSection) return;
    const interval = setInterval(() => {
      AnalyticsTracker.trackDwellTime(activeSection, 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSection]);

  // ========================================
  // viewport scroll reset routine
  // ========================================
  // This effect runs whenever the `isBooting` state changes.
  useEffect(() => {
    if (!isBooting) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [isBooting]);


  // Scroll lock and background mount prep during intro loader
  useEffect(() => {
    if (isIntroLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isIntroLoading]);

  if (isBooting) {
    return <SystemBootloader key="bootloader" onBootComplete={onBootComplete} />;
  }

  return (
    <div className="relative">
      <SEOEngine currentSection={activeSection} />
      {/* 
        The main application content is kept mounted at all times to perform 
        initial layout calculations, SVG compiling, and canvas rendering. 
        This completely removes the mount-lag/frame-drop when the loader finishes.
      */}
      <motion.div
        ref={mainContentRef}
        style={{ y: overscrollY }}
        initial={{ opacity: 0 }}
        animate={isIntroLoading ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
        className={isIntroLoading ? "pointer-events-none" : ""}
      >
        <ScrollingStoryBackground />
        <CRTEffect />
        
        <Header />
        
        <main id="main-content" className="flex flex-col">
          <HeroSection />
          <AboutSection />
          <ExperienceSection />
          <ProjectsSection />
          <EducationSection />
          <ContactSection />
        </main>
        
        <Footer />
        <BackToTopButton />
        <PortfolioAssistant />
      </motion.div>

      <AnimatePresence>
        {isIntroLoading && (
          <IntroLoader key="intro-loader" onComplete={() => setIsIntroLoading(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Component: AppContainer
 * Purpose: Holds core application routing states, loading states, and login session triggers.
 * Main responsibilities:
 *   - Intercepts hash routing boundaries
 *   - Verifies session tokens/flag variables keying local storage configurations
 * Props: None
 * State:
 *   - view: 'portfolio' | 'login' | 'dashboard' | '404'
 *   - isAuthenticated: boolean
 *   - isDataLoading: boolean
 *   - isBooting: boolean
 */
const AppContainer: React.FC = () => {
  // ========================================
  // State Management
  // ========================================
  const [view, setView] = useState('portfolio'); // portfolio, login, dashboard, 404
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);

  const verifyAdminAccess = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setView('dashboard');
      } else {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setView('login');
      }
    } catch (e) {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setView('login');
    }
  }, []);

  // Sync Supabase Auth session updates on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        if (window.location.hash.startsWith('#admin')) {
          verifyAdminAccess(session.access_token).finally(() => {
            setIsInitialAuthCheck(false);
          });
        } else {
          setIsInitialAuthCheck(false);
        }
      } else {
        if (window.location.hash.startsWith('#admin')) {
          setView('login');
        }
        setIsInitialAuthCheck(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session && window.location.hash.startsWith('#admin')) {
        verifyAdminAccess(session.access_token);
      } else if (!session && window.location.hash.startsWith('#admin')) {
        setView('login');
      } else if (!session && view === 'dashboard') {
        setView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, [view, verifyAdminAccess]);

  useEffect(() => {
    if (isInitialAuthCheck && window.location.hash.startsWith('#admin')) {
      return;
    }
    
    if (view === 'dashboard' || view === 'login') {
      if (!window.location.hash.startsWith('#admin')) {
        window.history.replaceState(null, '', '#admin');
      }
    } else if (view === 'portfolio') {
      if (window.location.hash.startsWith('#admin')) {
        window.history.replaceState(null, '', '#');
      }
    }
  }, [view, isInitialAuthCheck]);

  /**
   * Purpose: Inspects local persistent preferences to block or allow start sequence skips
   * @returns {boolean} Whether skip configuration is established in standard browser space
   */
  const shouldSkipBoot = () => {
    try {
      const stored = localStorage.getItem('appSettings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if ('skipBootSequence' in parsed) {
          return parsed.skipBootSequence;
        }
      }
    } catch (e) { /* ignore */ }
    return true;
  };
  const [isBooting, setIsBooting] = useState(!shouldSkipBoot());

  // ========================================
  // Security-Safe Router Verification
  // ========================================
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      const validSections = ['#hero', '#about', '#experience', '#projects', '#education', '#contact'];
      
      // All acceptable pathways in the application
      const validPaths = [
        '/',
        '/about',
        '/experience',
        '/projects',
        '/education',
        '/contact',
        '/projects/home-soc-lab',
        '/projects/aura-tic-tac-toe',
        '/projects/admin-dashboard',
        '/projects/enterprise-nac-lab',
        '/projects/hse-vaccination-security',
        '/projects/enterprise-network-lab'
      ];

      if (hash.startsWith('#admin')) {
        window.dispatchEvent(new Event('triggerAdminLogin'));
      } else if (hash && hash !== '#' && !validSections.includes(hash)) {
        setView('404');
      } else if (pathname && pathname !== '/' && !validPaths.includes(pathname)) {
        setView('404');
      } else {
        setView('portfolio');
      }
    };

    window.addEventListener('hashchange', handleHashChange, false);
    window.addEventListener('popstate', handleHashChange, false);
    
    // Don't run this initially if we're on #admin because the auth sync useEffect handles the initial session check.
    if (!window.location.hash.startsWith('#admin')) {
      handleHashChange();
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange, false);
      window.removeEventListener('popstate', handleHashChange, false);
    };
  }, []);
  
  // ========================================
  // Hidden Admin Trigger
  // ========================================
  const handleTriggerAdmin = useCallback(() => {
    setIsBooting(false); // Ensure bootloader doesn't run for admin route
    if (isAuthenticated) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          verifyAdminAccess(session.access_token);
        } else {
          setView('login');
        }
      });
    } else {
      setView('login');
    }
  }, [isAuthenticated, verifyAdminAccess]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleTriggerAdmin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('triggerAdminLogin', handleTriggerAdmin);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('triggerAdminLogin', handleTriggerAdmin);
    };
  }, [handleTriggerAdmin]);
  
  // ========================================
  // Body Class Synchronization 
  // ========================================
  useEffect(() => {
    const body = document.body;
    if (view === 'login' || view === 'dashboard') {
      body.classList.remove('portfolio-body');
      body.classList.add('dashboard-body');
    } else {
      body.classList.remove('dashboard-body');
      body.classList.add('portfolio-body');
    }
  }, [view]);

  // ========================================
  // Event Handlers (Secured session callbacks)
  // ========================================
  const handleLogout = useCallback(() => {
    supabase.auth.signOut().then(() => {
      setIsAuthenticated(false);
      window.location.hash = '';
      setView('login');
    });
  }, []);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        verifyAdminAccess(session.access_token);
      } else {
        setView('login');
      }
    });
  }, [verifyAdminAccess]);

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
  }, []);

  // ========================================
  // Rendering
  // ========================================
  const renderView = () => {
    if (isInitialAuthCheck && window.location.hash.startsWith('#admin')) {
      return <SkeletonDashboard />;
    }

    if (isDataLoading && !isBooting) {
        if (view === 'dashboard' && isAuthenticated) {
            return <SkeletonDashboard />;
        }
      return <SkeletonScreen />;
    }

    switch (view) {
      case 'login':
        return <Login onLoginSuccess={handleLogin} />;
      case 'dashboard':
        return <Dashboard onLogout={handleLogout} />;
      case '404':
        return <Error404Page onGoBack={() => { window.location.hash = ''; setView('portfolio'); }} />;
      case 'portfolio':
      default:
        return <AppContent isBooting={isBooting} onBootComplete={handleBootComplete} />;
    }
  };

  return renderView();
};


/**
 * Component: App
 * Purpose: Integrates primary Provider layers to build unified reactive hooks contexts.
 * Main responsibilities:
 *   - Resets state scroll-restoration guidelines
 *   - Wraps AppContainer into critical data contexts
 */
const App: React.FC = () => {
  useEffect(() => {
    if ('history' in window) {
      window.history.scrollRestoration = 'manual';
    }

    // Reset hash and scroll to top on reload/fresh load to start fresh, except for admin console
    const hash = window.location.hash;
    if (hash && !hash.startsWith('#admin')) {
      // Clear the hash in the browser address bar without triggering state changes
      try {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      } catch (e) {
        window.location.hash = '';
      }
    }

    // Force scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <ThemeProvider>
      <SettingsProvider>
        <I18nProvider>
          <StreakProvider>
            <AppContainer />
          </StreakProvider>
        </I18nProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;