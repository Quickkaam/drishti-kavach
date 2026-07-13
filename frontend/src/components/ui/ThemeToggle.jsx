// ============================================
// Drishti Kavach — Theme Toggle Component
// Dark/Light mode toggle with cyber-noir styling
// ============================================

import React, { useState, useEffect } from 'react';

// Theme context
const ThemeContext = React.createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

/**
 * Theme provider component
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('drishti-kavach-theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    return 'dark'; // Default to dark mode for cyber-noir theme
  });

  // Toggle between dark and light themes
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('drishti-kavach-theme', newTheme);
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply theme-specific styles
    const styleId = 'theme-styles';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Theme-specific CSS variables
    const themeStyles = {
      dark: `
        :root[data-theme="dark"] {
          --bg-primary: #040c1a;
          --bg-secondary: #020408;
          --bg-card: rgba(4, 8, 16, 0.98);
          --text-primary: #ffffff;
          --text-secondary: #cccccc;
          --text-muted: #7a8290;
          --border-primary: rgba(0, 212, 255, 0.15);
          --border-secondary: rgba(0, 212, 255, 0.1);
          --accent-cyan: #00d4ff;
          --accent-gold: #f5b041;
          --accent-green: #00ff88;
          --accent-red: #ff3d3d;
          --accent-orange: #ff6b00;
          --glow-cyan: 0 0 12px rgba(0, 212, 255, 0.3);
          --glow-gold: 0 0 12px rgba(245, 176, 65, 0.3);
          --glow-red: 0 0 12px rgba(255, 61, 61, 0.3);
          --glow-green: 0 0 12px rgba(0, 255, 136, 0.3);
        }
        
        body {
          background: radial-gradient(ellipse at 50% 0%, var(--bg-primary) 0%, var(--bg-secondary) 60%);
          color: var(--text-primary);
          transition: background 0.3s ease;
        }
        
        /* Scanline effect for dark mode */
        .scanline-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.01) 2px, rgba(0,212,255,0.01) 4px);
          opacity: 0.3;
          z-index: 9999;
        }
      `,
      light: `
        :root[data-theme="light"] {
          --bg-primary: #f0f4f8;
          --bg-secondary: #ffffff;
          --bg-card: rgba(255, 255, 255, 0.95);
          --text-primary: #1a237e;
          --text-secondary: #3949ab;
          --text-muted: #5c6bc0;
          --border-primary: rgba(26, 35, 126, 0.15);
          --border-secondary: rgba(26, 35, 126, 0.1);
          --accent-cyan: #0066cc;
          --accent-gold: #b76e00;
          --accent-green: #00875a;
          --accent-red: #d32f2f;
          --accent-orange: #ff6b00;
          --glow-cyan: 0 0 12px rgba(0, 102, 204, 0.3);
          --glow-gold: 0 0 12px rgba(183, 110, 0, 0.3);
          --glow-red: 0 0 12px rgba(211, 47, 47, 0.3);
          --glow-green: 0 0 12px rgba(0, 135, 90, 0.3);
        }
        
        body {
          background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
          color: var(--text-primary);
          transition: background 0.3s ease;
        }
        
        /* Remove scanline effect for light mode */
        .scanline-overlay {
          display: none;
        }
      `,
    };
    
    styleElement.textContent = themeStyles[theme];
    
    // Apply custom scrollbar based on theme
    const scrollbarStyleId = 'theme-scrollbar';
    let scrollbarStyle = document.getElementById(scrollbarStyleId);
    
    if (!scrollbarStyle) {
      scrollbarStyle = document.createElement('style');
      scrollbarStyle.id = scrollbarStyleId;
      document.head.appendChild(scrollbarStyle);
    }
    
    scrollbarStyle.textContent = `
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      
      ::-webkit-scrollbar-track {
        background: ${theme === 'dark' ? '#020408' : '#e8eaf6'};
        border-radius: 5px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: ${theme === 'dark' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(26, 35, 126, 0.3)'};
        border-radius: 5px;
        border: 2px solid ${theme === 'dark' ? '#020408' : '#e8eaf6'};
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: ${theme === 'dark' ? 'rgba(0, 212, 255, 0.5)' : 'rgba(26, 35, 126, 0.5)'};
      }
    `;
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const handleSystemThemeChange = (e) => {
      // Only change if user hasn't set a preference
      if (!localStorage.getItem('drishti-kavach-theme')) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      
      {/* Scanline overlay for dark mode */}
      {theme === 'dark' && <div className="scanline-overlay" />}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 */
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme toggle button component
 */
export const ThemeToggleButton = ({ size = 'medium', showLabel = true }) => {
  const { theme, toggleTheme } = useTheme();
  
  const sizes = {
    small: { width: '32px', height: '32px', fontSize: '0.75rem' },
    medium: { width: '40px', height: '40px', fontSize: '0.875rem' },
    large: { width: '48px', height: '48px', fontSize: '1rem' },
  };
  
  const selectedSize = sizes[size] || sizes.medium;
  
  const buttonStyle = {
    width: selectedSize.width,
    height: selectedSize.height,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #040c1a, #020408)'
      : 'linear-gradient(135deg, #f0f4f8, #ffffff)',
    boxShadow: theme === 'dark'
      ? '0 0 12px rgba(0, 212, 255, 0.3), inset 0 0 12px rgba(0, 212, 255, 0.1)'
      : '0 0 12px rgba(26, 35, 126, 0.3), inset 0 0 12px rgba(26, 35, 126, 0.1)',
    color: theme === 'dark' ? '#00d4ff' : '#1a237e',
  };
  
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };
  
  const labelStyle = {
    fontSize: '0.75rem',
    color: theme === 'dark' ? '#cccccc' : '#3949ab',
    fontFamily: "'Orbitron', monospace",
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={toggleTheme}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(180deg)';
          e.currentTarget.style.boxShadow = theme === 'dark'
            ? '0 0 20px rgba(0, 212, 255, 0.5), inset 0 0 20px rgba(0, 212, 255, 0.2)'
            : '0 0 20px rgba(26, 35, 126, 0.5), inset 0 0 20px rgba(26, 35, 126, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = theme === 'dark'
            ? '0 0 12px rgba(0, 212, 255, 0.3), inset 0 0 12px rgba(0, 212, 255, 0.1)'
            : '0 0 12px rgba(26, 35, 126, 0.3), inset 0 0 12px rgba(26, 35, 126, 0.1)';
        }}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {/* Theme icon */}
        <div style={{
          fontSize: selectedSize.fontSize,
          transition: 'transform 0.3s ease',
          transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)',
        }}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </div>
        
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme === 'dark'
            ? 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245,176,65,0.2) 0%, transparent 70%)',
          opacity: 0.5,
          animation: 'pulse-glow 2s infinite',
        }}/>
      </button>
      
      {showLabel && (
        <span style={labelStyle}>
          {theme === 'dark' ? 'DARK MODE' : 'LIGHT MODE'}
        </span>
      )}
      
      {/* Animation styles */}
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.7;
            }
          }
          
          @media (prefers-reduced-motion: reduce) {
            button {
              transition: none !important;
              animation: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

/**
 * Theme status indicator
 */
export const ThemeStatus = () => {
  const { theme } = useTheme();
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      background: theme === 'dark'
        ? 'rgba(4, 12, 26, 0.8)'
        : 'rgba(240, 244, 248, 0.8)',
      border: `1px solid ${theme === 'dark' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(26, 35, 126, 0.2)'}`,
      borderRadius: '0.25rem',
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: theme === 'dark' ? '#00d4ff' : '#f5b041',
        boxShadow: theme === 'dark' ? '0 0 8px #00d4ff' : '0 0 8px #f5b041',
        animation: 'pulse-low 2s infinite',
      }}/>
      <span style={{
        fontSize: '0.75rem',
        color: theme === 'dark' ? '#cccccc' : '#3949ab',
        fontFamily: "'Orbitron', monospace",
        letterSpacing: '0.05em',
      }}>
        {theme === 'dark' ? 'CYBER-NOIR' : 'LIGHT MODE'}
      </span>
    </div>
  );
};

/**
 * Theme-aware component wrapper
 */
export const ThemeAware = ({ children, dark, light }) => {
  const { theme } = useTheme();
  
  if (theme === 'dark') {
    return dark ? dark : children;
  } else {
    return light ? light : children;
  }
};

export default {
  ThemeProvider,
  useTheme,
  ThemeToggleButton,
  ThemeStatus,
  ThemeAware,
};