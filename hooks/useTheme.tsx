import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnalyticsTracker } from '../lib/analyticsTracker';

type Theme = 'light' | 'dark';

// --- Color Conversion Helpers ---
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null;
}

// NEW: Luminance-based check for light colors, more accurate than HSL's lightness.
function isColorLight(hex: string): boolean {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5;
}


function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s: number, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        h /= 360;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


// --- Theme Context and Provider ---
export const accentColorOptions: Record<string, { name: string; dark: string; light: string; }> = {
  'neon-green': { name: 'Neon Green', dark: '#64ffda', light: '#00bfa5' },
  'cyber-pink': { name: 'Cyber Pink', dark: '#ff00c1', light: '#db2777' },
  'electric-blue': { name: 'Electric Blue', dark: '#00aeff', light: '#2563eb' },
  'quantum-cyan': { name: 'Quantum Cyan', dark: '#00f2ea', light: '#14b8a6' },
  'glitch-purple': { name: 'Glitch Purple', dark: '#da70d6', light: '#9333ea' },
  'warning-yellow': { name: 'Warning Yellow', dark: '#ffc300', light: '#f59e0b' },
  'data-orange': { name: 'Data Orange', dark: '#ff6b00', light: '#f97316' },
};


export type AccentColorName = keyof typeof accentColorOptions;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  accentColor: string;
  accentColorName: AccentColorName;
  setAccentColor: (colorName: AccentColorName) => void;
  uniformTheme: boolean;
  toggleUniformTheme: () => void;
  isAccentLight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as Theme) || 'dark';
    }
    return 'dark';
  });

  const [accentColorName, setAccentColorName] = useState<AccentColorName>(() => {
    if (typeof window !== 'undefined') {
      const savedAccent = localStorage.getItem('accentColor');
      // Ensure the saved color is a valid key, otherwise default.
      if (savedAccent && Object.keys(accentColorOptions).includes(savedAccent)) {
          return savedAccent as AccentColorName;
      }
    }
    return 'neon-green';
  });

  const [uniformTheme, setUniformTheme] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedUniform = localStorage.getItem('uniformTheme');
      return savedUniform ? JSON.parse(savedUniform) : false;
    }
    return false;
  });
  
  const [isAccentLight, setIsAccentLight] = useState(false);
  const accentColor = accentColorOptions[accentColorName][theme];

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Handle light/dark theme
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    // Handle accent color and derived colors
    const rgb = hexToRgb(accentColor);
    if (rgb) {
        // Set primary color variables
        root.style.setProperty('--color-primary', accentColor);
        root.style.setProperty('--color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        
        // Use luminance to check if color is light for high-contrast needs
        setIsAccentLight(isColorLight(accentColor));
        
        // Generate and set glitch effect colors using HSL for color theory
        const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const glitchHue1 = (h + 150) % 360;
        const glitchHue2 = (h + 210) % 360;
        
        const glitchS = Math.min(1, s + 0.1);
        const glitchL = Math.min(1, l + 0.05);

        const glitchColor1 = hslToHex(glitchHue1, glitchS, glitchL);
        const glitchColor2 = hslToHex(glitchHue2, glitchS, glitchL);
        
        root.style.setProperty('--color-glitch-1', glitchColor1);
        root.style.setProperty('--color-glitch-2', glitchColor2);
    }
    localStorage.setItem('accentColor', accentColorName);
    localStorage.setItem('uniformTheme', JSON.stringify(uniformTheme));

  }, [theme, accentColor, accentColorName, uniformTheme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'light' ? 'dark' : 'light';
      AnalyticsTracker.trackEngagementEvent('theme_toggle', nextTheme);
      return nextTheme;
    });
  };

  const setAccentColor = (colorName: AccentColorName) => {
    setAccentColorName(colorName);
    AnalyticsTracker.trackEngagementEvent('accent_toggle', colorName);
  };
  
  const toggleUniformTheme = () => {
    setUniformTheme(prev => !prev);
  };

  const value = { theme, toggleTheme, accentColor, accentColorName, setAccentColor, uniformTheme, toggleUniformTheme, isAccentLight };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
