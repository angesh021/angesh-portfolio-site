import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Define the shape of settings
interface AppSettings {
  skipBootSequence: boolean;
  showCrtLines: boolean;
  showFirewallGlow: boolean;
  showGlitchEffect: boolean;
  highContrastMode: boolean;
  zoomedMode: boolean;
  effectIntensity: number;
  activeBgId: string;
}

// Default settings
const defaultSettings: AppSettings = {
  skipBootSequence: true,
  showCrtLines: true,
  showFirewallGlow: true,
  showGlitchEffect: true,
  highContrastMode: false,
  zoomedMode: false,
  effectIntensity: 1,
  activeBgId: 'premium_matte',
};

// Helper to get settings from localStorage
const getStoredSettings = (): AppSettings => {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  try {
    const stored = localStorage.getItem('appSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration from stealth to premium_matte as default
      if (parsed.activeBgId === 'stealth' && !localStorage.getItem('user_explicit_bg')) {
          parsed.activeBgId = 'premium_matte';
      }
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse settings from localStorage', e);
  }
  return defaultSettings;
};

interface SettingsContextType extends AppSettings {
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  toggleSetting: (key: keyof AppSettings) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);

  useEffect(() => {
    // Apply classes to body/html based on settings
    document.documentElement.classList.toggle('high-contrast', settings.highContrastMode);
    document.documentElement.classList.toggle('zoomed-mode', settings.zoomedMode);
    document.body.classList.toggle('crt-lines-disabled', !settings.showCrtLines);
    document.body.classList.toggle('firewall-glow-disabled', !settings.showFirewallGlow);
    document.body.classList.toggle('glitch-effect-disabled', !settings.showGlitchEffect);
    document.documentElement.style.setProperty('--dash-effect-intensity', String(settings.effectIntensity));


    // Save to localStorage
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  const setSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (key === 'activeBgId') {
        localStorage.setItem('user_explicit_bg', 'true');
    }
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const toggleSetting = useCallback((key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetSettings = useCallback(() => {
    // Clear all related localStorage items
    localStorage.removeItem('appSettings');
    localStorage.removeItem('theme');
    localStorage.removeItem('accentColor');
    localStorage.removeItem('uniformTheme');
    localStorage.removeItem('user_explicit_bg');
    // Force a reload to apply all default settings cleanly
    window.location.reload();
  }, []);

  const value = { ...settings, setSetting, toggleSetting, resetSettings };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};