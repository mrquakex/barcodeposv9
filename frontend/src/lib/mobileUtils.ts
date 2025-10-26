/**
 * Mobile Optimization Utilities
 * Desktop görünümüne dokunmadan mobil optimize etmek için helper functions
 */

import { clsx, type ClassValue } from 'clsx';

/**
 * Mobil vs Desktop için responsive class generator
 * @param mobileClasses - Mobil için classes
 * @param desktopClasses - Desktop için classes (md: prefix ekler)
 */
export const responsiveClass = (mobileClasses: string, desktopClasses: string): string => {
  const desktopWithPrefix = desktopClasses.split(' ').map(cls => `md:${cls}`).join(' ');
  return `${mobileClasses} ${desktopWithPrefix}`;
};

/**
 * Touch-friendly button sizes
 * Mobilde minimum 44x44px (Apple), 48x48px (Google) önerisi
 */
export const touchSizes = {
  sm: responsiveClass('h-12 px-4 text-base', 'h-10 px-3 text-sm'), // Mobil: 48px, Desktop: 40px
  md: responsiveClass('h-14 px-6 text-lg', 'h-12 px-4 text-base'), // Mobil: 56px, Desktop: 48px
  lg: responsiveClass('h-16 px-8 text-xl', 'h-14 px-6 text-lg'), // Mobil: 64px, Desktop: 56px
  xl: responsiveClass('h-20 px-10 text-2xl', 'h-16 px-8 text-xl'), // Mobil: 80px, Desktop: 64px
  icon: responsiveClass('w-12 h-12', 'w-10 h-10'), // Icon buttons
  iconLg: responsiveClass('w-14 h-14', 'w-12 h-12'), // Large icon buttons
};

/**
 * Responsive grid columns
 */
export const responsiveGrid = {
  '1-2': 'grid-cols-1 md:grid-cols-2', // Mobil: 1, Desktop: 2
  '1-3': 'grid-cols-1 md:grid-cols-3', // Mobil: 1, Desktop: 3
  '1-4': 'grid-cols-1 md:grid-cols-4', // Mobil: 1, Desktop: 4
  '2-3': 'grid-cols-2 md:grid-cols-3', // Mobil: 2, Desktop: 3
  '2-4': 'grid-cols-2 md:grid-cols-4', // Mobil: 2, Desktop: 4
  '1-2-3': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3', // Mobil: 1, Tablet: 2, Desktop: 3
  '1-2-4': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4', // Mobil: 1, Tablet: 2, Desktop: 4
};

/**
 * Responsive padding/spacing
 */
export const responsivePadding = {
  sm: responsiveClass('p-3', 'p-4'),
  md: responsiveClass('p-4', 'p-6'),
  lg: responsiveClass('p-6', 'p-8'),
};

/**
 * Responsive text sizes
 */
export const responsiveText = {
  xs: responsiveClass('text-xs', 'text-xs'),
  sm: responsiveClass('text-sm', 'text-sm'),
  base: responsiveClass('text-base', 'text-base'),
  lg: responsiveClass('text-lg', 'text-xl'),
  xl: responsiveClass('text-xl', 'text-2xl'),
  '2xl': responsiveClass('text-2xl', 'text-3xl'),
  '3xl': responsiveClass('text-3xl', 'text-4xl'),
  '4xl': responsiveClass('text-3xl', 'text-5xl'),
};

/**
 * Hide on mobile, show on desktop
 */
export const hideOnMobile = 'hidden md:block';

/**
 * Show on mobile, hide on desktop
 */
export const showOnMobile = 'md:hidden';

/**
 * Responsive modal/dialog
 * Mobilde full screen, desktop'ta centered
 */
export const responsiveModal = {
  overlay: 'fixed inset-0 bg-black/50 z-50',
  container: 'fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
  content: 'h-full w-full md:h-auto md:w-auto md:max-w-2xl md:rounded-2xl overflow-hidden',
};

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Touch-friendly table → card view
 * Mobilde card, desktop'ta table
 */
export const responsiveTableCard = {
  container: 'block md:hidden', // Card view container (mobile only)
  table: 'hidden md:table', // Table (desktop only)
  card: 'border-2 rounded-xl p-4 bg-white dark:bg-slate-800 shadow-md space-y-3',
  cardRow: 'flex justify-between items-center text-sm',
  cardLabel: 'font-semibold text-slate-600 dark:text-slate-400',
  cardValue: 'font-bold text-slate-900 dark:text-white',
};

/**
 * Responsive flex direction
 */
export const responsiveFlex = {
  col: 'flex-col md:flex-row', // Mobil: column, Desktop: row
  row: 'flex-row', // Her zaman row (değiştirme)
};

/**
 * Responsive gap
 */
export const responsiveGap = {
  sm: responsiveClass('gap-2', 'gap-3'),
  md: responsiveClass('gap-3', 'gap-4'),
  lg: responsiveClass('gap-4', 'gap-6'),
};

/**
 * Input keyboard types for mobile
 */
export const inputTypes = {
  numeric: { type: 'text' as const, inputMode: 'numeric' as const },
  decimal: { type: 'text' as const, inputMode: 'decimal' as const },
  tel: { type: 'tel' as const, inputMode: 'tel' as const },
  email: { type: 'email' as const, inputMode: 'email' as const },
  text: { type: 'text' as const, inputMode: 'text' as const },
};

export default {
  responsiveClass,
  touchSizes,
  responsiveGrid,
  responsivePadding,
  responsiveText,
  hideOnMobile,
  showOnMobile,
  responsiveModal,
  isMobile,
  responsiveTableCard,
  responsiveFlex,
  responsiveGap,
  inputTypes,
};

