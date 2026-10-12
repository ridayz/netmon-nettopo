// Archify Theme System - Dark/Light Mode

export type ThemeMode = 'light' | 'dark';

export const archifyTheme = {
  light: {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#f093fb',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    canvas: '#fafbfc',
    gridDots: '#cbd5e1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      tertiary: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      warning: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
    }
  },
  dark: {
    primary: '#818cf8',
    secondary: '#a78bfa',
    accent: '#f9a8d4',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    shadow: 'rgba(0, 0, 0, 0.5)',
    canvas: '#1a1f2e',
    gridDots: '#334155',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      tertiary: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      warning: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
    }
  }
};

export const getTheme = (mode: ThemeMode) => archifyTheme[mode];
