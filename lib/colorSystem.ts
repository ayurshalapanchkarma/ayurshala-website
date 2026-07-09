/**
 * Ayurshala Color System
 * Warm Ayurvedic palette for consistent branding across Admin Console
 * 
 * Primary: Warm Gold/Orange (Healing, Warmth)
 * Secondary: Warm Greens (Growth, Balance)
 * Accent: Amber/Brown (Earth, Stability)
 * Neutral: Stone grays (Clarity, Simplicity)
 */

export const colorSystem = {
  // Primary Warm Colors
  primary: {
    light: '#ea580c', // Warm orange
    main: '#d97706',  // Amber
    dark: '#b45309',  // Dark amber
    pale: 'rgba(232, 98, 26, 0.1)', // Very light
    border: 'rgba(232, 98, 26, 0.18)', // Border tint
    shadow: 'rgba(232, 98, 26, 0.06)', // Shadow tint
  },

  // Secondary Green (Ayurvedic balance)
  secondary: {
    light: '#10b981', // Emerald light
    main: '#059669',  // Emerald
    dark: '#047857',  // Emerald dark
    pale: 'rgba(16, 185, 129, 0.1)',
  },

  // Accent Brown (Earth element)
  accent: {
    light: '#d97706', // Amber
    main: '#b45309',  // Brown
    dark: '#92400e',  // Dark brown
  },

  // Neutral Stones (Typography & UI)
  stone: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716b',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },

  // Glass Morphism (Semi-transparent base)
  glass: {
    light: 'rgba(255, 255, 255, 0.08)',
    lightBorder: '1px solid rgba(232, 98, 26, 0.18)',
    dark: 'rgba(15, 26, 18, 0.08)',
    darkBorder: '1px solid rgba(255, 255, 255, 0.12)',
  },

  // Status Colors
  status: {
    success: '#10b981', // Green
    warning: '#f59e0b', // Amber
    error: '#ef4444',   // Red
    info: '#3b82f6',    // Blue
  },

  // Semantic Colors
  semantic: {
    bg: {
      light: '#ffffff',
      dark: '#0f1a12',
    },
    text: {
      light: '#1c1917', // Stone-900
      dark: '#ffffff',
    },
    border: {
      light: 'rgba(232, 98, 26, 0.15)',
      dark: 'rgba(255, 255, 255, 0.12)',
    },
    hover: {
      light: 'rgba(232, 98, 26, 0.08)',
      dark: 'rgba(255, 255, 255, 0.08)',
    },
  },
}

/**
 * Glassmorphic Card Styling
 * Use for: Cards, Modals, Panels, Containers
 */
export const glassCard = {
  light: {
    background: 'rgba(255, 255, 255, 0.80)',
    border: 'rgba(232, 98, 26, 0.18)',
    backdrop: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
    shadow: '0 8px 32px rgba(232, 98, 26, 0.06)',
  },
  dark: {
    background: 'rgba(15, 26, 18, 0.65)',
    border: 'rgba(255, 255, 255, 0.12)',
    backdrop: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.20)',
  },
}

/**
 * Button Variants
 */
export const buttonVariants = {
  primary: {
    light: {
      bg: '#ea580c',
      text: '#ffffff',
      hover: '#d97706',
      active: '#b45309',
    },
    dark: {
      bg: '#d97706',
      text: '#ffffff',
      hover: '#ea580c',
      active: '#b45309',
    },
  },
  secondary: {
    light: {
      bg: 'rgba(232, 98, 26, 0.10)',
      text: '#ea580c',
      border: 'rgba(232, 98, 26, 0.20)',
      hover: 'rgba(232, 98, 26, 0.15)',
    },
    dark: {
      bg: 'rgba(255, 255, 255, 0.10)',
      text: '#fbbf24',
      border: 'rgba(255, 255, 255, 0.15)',
      hover: 'rgba(255, 255, 255, 0.15)',
    },
  },
  ghost: {
    light: {
      bg: 'transparent',
      text: '#ea580c',
      hover: 'rgba(232, 98, 26, 0.08)',
    },
    dark: {
      bg: 'transparent',
      text: '#fbbf24',
      hover: 'rgba(251, 191, 36, 0.10)',
    },
  },
}

/**
 * Input/Form Control Styling
 */
export const formControl = {
  light: {
    bg: '#ffffff',
    text: '#1c1917',
    border: 'rgba(232, 98, 26, 0.15)',
    placeholder: '#a8a29e',
    focus: 'rgba(232, 98, 26, 0.25)',
  },
  dark: {
    bg: 'rgba(15, 26, 18, 0.50)',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.15)',
    placeholder: '#78716b',
    focus: 'rgba(232, 98, 26, 0.30)',
  },
}

/**
 * Table Styling
 */
export const tableStyles = {
  headerBg: {
    light: 'rgba(232, 98, 26, 0.05)',
    dark: 'rgba(232, 98, 26, 0.10)',
  },
  rowHover: {
    light: 'rgba(232, 98, 26, 0.03)',
    dark: 'rgba(232, 98, 26, 0.05)',
  },
  border: {
    light: 'rgba(232, 98, 26, 0.10)',
    dark: 'rgba(255, 255, 255, 0.10)',
  },
}

/**
 * Badge/Tag Styling
 */
export const badgeColors = {
  success: { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669' },
  warning: { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706' },
  error: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626' },
  info: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb' },
  default: { bg: 'rgba(232, 98, 26, 0.1)', text: '#ea580c' },
}

/**
 * Sidebar Styling
 */
export const sidebar = {
  light: {
    bg: '#ffffff',
    text: '#44403c',
    textHover: '#ea580c',
    itemHover: 'rgba(232, 98, 26, 0.08)',
    itemActive: 'rgba(232, 98, 26, 0.15)',
    itemActiveBorder: '#ea580c',
  },
  dark: {
    bg: 'rgba(15, 26, 18, 0.40)',
    text: '#d6d3d1',
    textHover: '#fbbf24',
    itemHover: 'rgba(232, 98, 26, 0.10)',
    itemActive: 'rgba(232, 98, 26, 0.20)',
    itemActiveBorder: '#fbbf24',
  },
}
