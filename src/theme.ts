import { Platform, type ViewStyle } from 'react-native';

export type Finish = 'light' | 'dark';

const shared = {
  desk: '#2f2620',
  deskHi: '#3d3129',
  lcdBg: '#1b1408',
  lcdGlow: '#ffb21a',
  lcdDim: '#4a3510',
  keyRed: '#a83a2c',
  keyRedEdge: '#6b2219',
  keyAmber: '#d4782a',
  keyAmberEdge: '#8b4a14',
  keyInkLight: '#f6eddc',
  paper: '#fbf8ef',
  paperShade: '#ece5d3',
  ink: '#2b2723',
  inkRed: '#b02a1e',
  inkFaint: '#8a8174',
  stampBold: '#6d655a',
  dash: '#cfc6b2',
  voidInk: '#8d857a',
  voidNeg: '#c27a70',
  railLabel: '#cdbd9f',
};

/** Casing palettes; the paper stays white on both finishes. */
const finishes = {
  light: {
    casing: '#d8cbb0',
    casingHi: '#e3d7be',
    casingLo: '#cbbd9f',
    casingEdge: '#b3a383',
    casingInk: '#5b4d3c',
    casingSub: '#85765f',
    note: '#5d5142',
    panel: '#efe4cc',
    keyCream: '#f1e9d8',
    keyCreamEdge: '#b9ad94',
    keyCreamHi: 'rgba(255,255,255,0.7)',
    keyInk: '#2a241d',
    keyBrown: '#6a5644',
    keyBrownEdge: '#3e3127',
    lcdBezel: '#3b3127',
    slotA: '#2a221b',
    slotB: '#4b3f33',
  },
  dark: {
    casing: '#252527',
    casingHi: '#323235',
    casingLo: '#1b1b1d',
    casingEdge: '#0c0c0d',
    casingInk: '#d6d2ca',
    casingSub: '#8f8b84',
    note: '#b9b4aa',
    panel: '#303034',
    keyCream: '#3b3b40',
    keyCreamEdge: '#121214',
    keyCreamHi: 'rgba(255,255,255,0.12)',
    keyInk: '#f3f0e9',
    keyBrown: '#58585f',
    keyBrownEdge: '#1e1e21',
    lcdBezel: '#101011',
    slotA: '#050505',
    slotB: '#1e1e20',
  },
};

export type Theme = typeof shared & (typeof finishes)['light'];

export function themeFor(finish: Finish): Theme {
  return { ...shared, ...finishes[finish] };
}

export const fonts = {
  lcd: 'VT323_400Regular',
  tape: 'CourierPrime_400Regular',
  tapeBold: 'CourierPrime_700Bold',
  key: 'Archivo_800ExtraBold',
  keyBold: 'Archivo_700Bold',
  keySemi: 'Archivo_600SemiBold',
};

/**
 * A CSS gradient background. React Native takes `experimental_backgroundImage`; react-native-web
 * passes styles through as CSS, where the property is `background-image`.
 */
export function gradient(css: string): ViewStyle {
  return (Platform.OS === 'web' ? { backgroundImage: css } : { experimental_backgroundImage: css }) as ViewStyle;
}
