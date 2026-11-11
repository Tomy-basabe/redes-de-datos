/**
 * T.A.B.E. UI CHOREOGRAPHY ENGINE (Apple / Linear / Notion standard)
 * Gestión centralizada de paletas cromáticas por sección, físicas de resorte y coreografía.
 */

export interface SectionTheme {
  primaryRgb: string;
  secondaryRgb: string;
  accentHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const SECTION_THEMES: Record<number, SectionTheme> = {
  1: {
    // 1. Intro L4: Cyan & Azul Cobalto
    primaryRgb: '34, 211, 238',
    secondaryRgb: '59, 130, 246',
    accentHex: '#22d3ee',
    badgeBg: 'rgba(34, 211, 238, 0.15)',
    badgeBorder: 'rgba(34, 211, 238, 0.35)',
    badgeText: '#67e8f9'
  },
  2: {
    // 2. TCP vs UDP: Cyan & Esmeralda
    primaryRgb: '56, 189, 248',
    secondaryRgb: '16, 185, 129',
    accentHex: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    badgeText: '#7dd3fc'
  },
  3: {
    // 3. Segmentación & RFC: Violeta & Índigo
    primaryRgb: '168, 85, 247',
    secondaryRgb: '99, 102, 241',
    accentHex: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    badgeText: '#d8b4fe'
  },
  4: {
    // 4. Ventana rwnd: Azul Eléctrico & Verde Neón
    primaryRgb: '14, 165, 233',
    secondaryRgb: '34, 197, 94',
    accentHex: '#0ea5e9',
    badgeBg: 'rgba(14, 165, 233, 0.15)',
    badgeBorder: 'rgba(14, 165, 233, 0.35)',
    badgeText: '#38bdf8'
  },
  5: {
    // 5. Checksum RFC 793/1071: Ámbar Dorado & Esmeralda
    primaryRgb: '245, 158, 11',
    secondaryRgb: '16, 185, 129',
    accentHex: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    badgeText: '#fcd34d'
  },
  6: {
    // 6. Congestión cwnd & Sierra: Naranja Fuego & Rosa Coral
    primaryRgb: '249, 115, 22',
    secondaryRgb: '244, 63, 94',
    accentHex: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    badgeBorder: 'rgba(249, 115, 22, 0.35)',
    badgeText: '#fdba74'
  },
  7: {
    // 7. 3-Way Handshake: Verde Neón & Cyan
    primaryRgb: '34, 197, 94',
    secondaryRgb: '6, 182, 212',
    accentHex: '#22c55e',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
    badgeBorder: 'rgba(34, 197, 94, 0.35)',
    badgeText: '#86efac'
  },
  8: {
    // 8. 4-Way Teardown: Rosa Neón & Púrpura
    primaryRgb: '244, 63, 94',
    secondaryRgb: '147, 51, 234',
    accentHex: '#f43f5e',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeBorder: 'rgba(244, 63, 94, 0.35)',
    badgeText: '#fda4af'
  },
  9: {
    // 9. Puertos & Doble Salto Nginx: Azul Zafiro & Ámbar
    primaryRgb: '59, 130, 246',
    secondaryRgb: '245, 158, 11',
    accentHex: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeBorder: 'rgba(59, 130, 246, 0.35)',
    badgeText: '#93c5fd'
  },
  10: {
    // 10. Topología TP1 Los Corralitos: Esmeralda Profundo & Oro
    primaryRgb: '16, 185, 129',
    secondaryRgb: '234, 179, 8',
    accentHex: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    badgeText: '#6ee7b7'
  }
};

/**
 * Aplica las variables CSS del tema cromático de la sección en el DOM raíz
 */
export function applySectionTheme(sectionId: number) {
  const theme = SECTION_THEMES[sectionId] || SECTION_THEMES[1];
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--section-accent-rgb', theme.primaryRgb);
    document.documentElement.style.setProperty('--section-secondary-rgb', theme.secondaryRgb);
  }
}

/**
 * Variantes Framer Motion con Curva Apple y Stagger
 */
export const tabeContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.03
    }
  }
};

export const tabeItemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

/**
 * Resorte elástico para píldoras de navegación (FLIP layoutId)
 */
export const tabeSpringPill = {
  type: 'spring' as const,
  stiffness: 440,
  damping: 32,
  mass: 0.8
};
