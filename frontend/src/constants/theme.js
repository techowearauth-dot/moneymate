import { COLORS, GRADIENTS as COLOR_GRADIENTS } from './colors';

const SHARED_TYPOGRAPHY = {
  fonts: {
    heading: 'Sora_700Bold',
    headingBold: 'Sora_800ExtraBold',
    headingSemi: 'Sora_600SemiBold',
    body: 'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium',
    bodySemiBold: 'DMSans_600SemiBold',
    bodyBold: 'DMSans_700Bold',
  },
  sizes: {
    display: 36,
    h1: 28,
    h2: 22,
    h3: 18,
    h4: 16,
    body: 15,
    small: 13,
    tiny: 11,
  },
};

const SHARED_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const SHARED_RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const LIGHT_THEME = {
  mode: 'light',
  colors: {
    ...COLORS,
  },
  gradients: COLOR_GRADIENTS,
  shadows: {
    soft: {
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 4,
    },
    medium: {
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.13,
      shadowRadius: 20,
      elevation: 7,
    },
    strong: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 12,
    },
  },
};

export const DARK_THEME = {
  mode: 'dark',
  colors: {
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryLight: '#1E1B4B',

    background: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#334155',

    border: '#334155',

    textPrimary: '#F8FAFF',
    textSecondary: '#94A3B8',
    textHint: '#64748B',

    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    white: '#FFFFFF',
    black: '#000000',

    disabled: '#334155',
  },
  gradients: COLOR_GRADIENTS,
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 4,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 7,
    },
    strong: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 28,
      elevation: 12,
    },
  },
};

// Shared exports
export const TYPOGRAPHY = SHARED_TYPOGRAPHY;
export const SPACING = SHARED_SPACING;
export const RADIUS = SHARED_RADIUS;
export const SHADOWS = LIGHT_THEME.shadows;
export const GRADIENTS = COLOR_GRADIENTS;

export const INPUT = {
  height: 54,
  borderRadius: 14,
  borderWidth: 1.5,
  paddingH: 16,
  iconSize: 18,
};

export const BUTTON = {
  heightLg: 56,
  heightMd: 48,
  heightSm: 38,
  radiusLg: 16,
  radiusMd: 12,
  radiusSm: 10,
  fontSize: 16,
  fontSmall: 14,
};

// Legacy re-export: allows files still importing COLORS from theme.js to work
export { COLORS };