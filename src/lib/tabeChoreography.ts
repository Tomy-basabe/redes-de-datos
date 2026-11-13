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
    // 1. TCP vs UDP: Azul Cupertino & Cian
    primaryRgb: '0, 113, 227',
    secondaryRgb: '2, 132, 199',
    accentHex: '#0071e3',
    badgeBg: 'rgba(0, 113, 227, 0.10)',
    badgeBorder: 'rgba(0, 113, 227, 0.25)',
    badgeText: '#0369a1'
  },
  2: {
    // 2. Puertos, Multiplexación & 5-Tupla: Violeta & Índigo
    primaryRgb: '124, 58, 237',
    secondaryRgb: '79, 70, 229',
    accentHex: '#7c3aed',
    badgeBg: 'rgba(124, 58, 237, 0.10)',
    badgeBorder: 'rgba(124, 58, 237, 0.25)',
    badgeText: '#6d28d9'
  },
  3: {
    // 3. 3-Way Handshake y RST: Esmeralda & Cian
    primaryRgb: '5, 150, 105',
    secondaryRgb: '2, 132, 199',
    accentHex: '#059669',
    badgeBg: 'rgba(5, 150, 105, 0.10)',
    badgeBorder: 'rgba(5, 150, 105, 0.25)',
    badgeText: '#047857'
  },
  4: {
    // 4. 4-Way Teardown: Rosa Carmesí & Púrpura
    primaryRgb: '225, 29, 72',
    secondaryRgb: '147, 51, 234',
    accentHex: '#e11d48',
    badgeBg: 'rgba(225, 29, 72, 0.10)',
    badgeBorder: 'rgba(225, 29, 72, 0.25)',
    badgeText: '#be123c'
  },
  5: {
    // 5. Congestión y Flujo: Naranja & Azul
    primaryRgb: '234, 88, 12',
    secondaryRgb: '2, 132, 199',
    accentHex: '#ea580c',
    badgeBg: 'rgba(234, 88, 12, 0.10)',
    badgeBorder: 'rgba(234, 88, 12, 0.25)',
    badgeText: '#c2410c'
  },
  6: {
    // 6. Checksum TCP (Andrés): Ámbar & Azul
    primaryRgb: '217, 119, 6',
    secondaryRgb: '2, 132, 199',
    accentHex: '#d97706',
    badgeBg: 'rgba(217, 119, 6, 0.10)',
    badgeBorder: 'rgba(217, 119, 6, 0.25)',
    badgeText: '#b45309'
  },
  7: {
    // 7. ¡FIN! Concierto de Cierre: Fucsia & Ámbar Dorado
    primaryRgb: '219, 39, 119',
    secondaryRgb: '217, 119, 6',
    accentHex: '#db2777',
    badgeBg: 'rgba(219, 39, 119, 0.10)',
    badgeBorder: 'rgba(219, 39, 119, 0.25)',
    badgeText: '#be185d'
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
