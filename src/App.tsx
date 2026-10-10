/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  drawBurnedBackground,
  drawBurnedOverlayMask,
  drawBurnedBackgroundHD,
  drawBurnedOverlayMaskHD,
} from './utils/burnedTexture';
import { initPWA } from './utils/pwaSetup';

interface Point {
  x: number;
  y: number;
  width?: number;
}

interface FourierComponent {
  freq: number;
  amp: number;
  phase: number;
}

type VisualFX = 'classic' | 'neon' | 'fade' | 'ink';
type ExportAspect = '9:16' | '16:9' | '1:1';

const defaultCirclesMap: Record<string, number> = {
  cuadrado: 32,
  triangulo: 36,
  pentagono: 30,
  hexagono: 24,
  octagono: 20,
  rombo: 32,
  cruz: 48,
  estrella: 26,
  corazon: 22,
  dibujo: 80,
  svg_import: 180,
  img_import: 180,
};

const explanations: Record<string, { title: string; text: string }> = {
  cuadrado: {
    title: 'El Cuadrado y los Círculos Antagonistas',
    text: '<p>Un círculo es suave y continuo, mientras que un cuadrado tiene 4 vértices afilados de 90° y 4 lados planos.</p><ul><li><b>Cancelación de curvatura:</b> El primer círculo grande genera la base redonda. Los secundarios giran en direcciones opuestas para aplanar las paredes.</li><li><b>Frecuencias:</b> Compuesto predominantemente por armónicos impares (1, 3, 5, 7...).</li></ul>',
  },
  triangulo: {
    title: 'El Triángulo Equilátero y las Esquinas Agudas',
    text: '<p>Simetría de orden 3 con armónicos rápidos que frenan bruscamente en cada vértice de 60°.</p>',
  },
  pentagono: {
    title: 'El Pentágono Regular',
    text: '<p>Con ángulos más abiertos (108°), requiere menor esfuerzo de compensación armónica.</p>',
  },
  hexagono: {
    title: 'El Hexágono y la Simetría Par',
    text: '<p>Con ángulos de 120°, está sumamente cerca de la redondez natural de un círculo base.</p>',
  },
  octagono: {
    title: 'El Octágono',
    text: '<p>8 caras que se resuelven con pocos círculos de alta precisión.</p>',
  },
  rombo: {
    title: 'El Rombo',
    text: '<p>Puntas agudas en la vertical y ángulos obtusos en la horizontal.</p>',
  },
  cruz: {
    title: 'La Cruz Griega: Polígono Cóncavo',
    text: '<p>Requiere compensación de esquinas salientes (90°) y entrantes (270°).</p>',
  },
  estrella: {
    title: 'La Estrella de 5 Puntas',
    text: '<p>Ecuaciones armónicas continuas que fluyen con elegancia matemática.</p>',
  },
  corazon: {
    title: 'El Cardioide',
    text: '<p>Curva de referencia que combina cúspide inferior con hendidura superior.</p>',
  },
  dibujo: {
    title: 'Tu Trazo Personalizado',
    text: '<p>Cualquier trayectoria cerrada se convierte en epiciclos armónicos coordinados.</p>',
  },
  svg_import: {
    title: 'Silueta Vectorial SVG',
    text: '<p>Geometría importada y analizada mediante longitud de arco y muestreo paramétrico continuo.</p>',
  },
  img_import: {
    title: 'Silueta Raster Binarizada',
    text: '<p>Contorno extraído mediante algoritmo de seguimiento de bordes (Moore-Neighbor) y filtrado gaussiano.</p>',
  },
};

export type ThemeKey = 'dark' | 'light' | 'burned' | 'sunset' | 'matrix' | 'monochrome';

export interface ThemeColors {
  name: string;
  bg: string;
  circle: string;
  radius: string;
  dot: string;
  tracer: string;
  trail: string;
  axis: string;
  draft: string;
  snapGuide: string;
  isDarkBase: boolean;
  panel: string;
  text: string;
  subtext: string;
  border: string;
  btn: string;
  btnActive: string;
}

export const pal: Record<ThemeKey, ThemeColors> & {
  active: ThemeColors;
  setTheme: (key: ThemeKey) => void;
} = {
  dark: {
    name: 'Oscuro',
    bg: '#060911',
    circle: '#38bdf8',
    radius: '#0284c7',
    dot: '#67e8f9',
    tracer: '#f43f5e',
    trail: '#38bdf8',
    axis: '#1e293b',
    draft: '#f59e0b',
    snapGuide: '#22c55e',
    isDarkBase: true,
    panel: '#131b2e',
    text: '#f8fafc',
    subtext: '#94a3b8',
    border: '#1e293b',
    btn: '#0284c7',
    btnActive: '#e11d48',
  },
  light: {
    name: 'Claro',
    bg: '#ffffff',
    circle: '#0284c7',
    radius: '#0369a1',
    dot: '#0f172a',
    tracer: '#e11d48',
    trail: '#0284c7',
    axis: '#e2e8f0',
    draft: '#d97706',
    snapGuide: '#16a34a',
    isDarkBase: false,
    panel: '#ffffff',
    text: '#0f172a',
    subtext: '#64748b',
    border: '#e2e8f0',
    btn: '#0284c7',
    btnActive: '#e11d48',
  },
  burned: {
    name: 'Papel Quemado',
    bg: '#dfcaa5',
    circle: 'rgba(120, 80, 40, 0.22)',
    radius: 'rgba(140, 67, 10, 0.35)',
    dot: '#8c430a',
    tracer: '#ff5500',
    trail: '#2b1708',
    axis: 'rgba(140, 67, 10, 0.16)',
    draft: '#a04a0e',
    snapGuide: '#d9531e',
    isDarkBase: false,
    panel: '#ebdcc2',
    text: '#2b1708',
    subtext: '#7c4a27',
    border: '#c4ab84',
    btn: '#8c430a',
    btnActive: '#d9531e',
  },
  sunset: {
    name: 'Sunset',
    bg: '#180b22',
    circle: '#f97316',
    radius: '#ec4899',
    dot: '#fde047',
    tracer: '#ef4444',
    trail: '#fb923c',
    axis: '#3b1d54',
    draft: '#fbbf24',
    snapGuide: '#f43f5e',
    isDarkBase: true,
    panel: '#28133b',
    text: '#fef3c7',
    subtext: '#f472b6',
    border: '#4a1d6d',
    btn: '#ea580c',
    btnActive: '#f43f5e',
  },
  matrix: {
    name: 'Matrix',
    bg: '#030d06',
    circle: '#22c55e',
    radius: '#15803d',
    dot: '#86efac',
    tracer: '#4ade80',
    trail: '#10b981',
    axis: '#0f291e',
    draft: '#a3e635',
    snapGuide: '#34d399',
    isDarkBase: true,
    panel: '#091f0f',
    text: '#86efac',
    subtext: '#4ade80',
    border: '#14532d',
    btn: '#16a34a',
    btnActive: '#22c55e',
  },
  monochrome: {
    name: 'Monochrome',
    bg: '#09090b',
    circle: '#a1a1aa',
    radius: '#52525b',
    dot: '#ffffff',
    tracer: '#ffffff',
    trail: '#e4e4e7',
    axis: '#27272a',
    draft: '#d4d4d8',
    snapGuide: '#a1a1aa',
    isDarkBase: true,
    panel: '#18181b',
    text: '#fafafa',
    subtext: '#a1a1aa',
    border: '#27272a',
    btn: '#52525b',
    btnActive: '#d4d4d8',
  },
  active: {
    name: 'Claro',
    bg: '#ffffff',
    circle: '#0284c7',
    radius: '#0369a1',
    dot: '#0f172a',
    tracer: '#e11d48',
    trail: '#0284c7',
    axis: '#e2e8f0',
    draft: '#d97706',
    snapGuide: '#16a34a',
    isDarkBase: false,
    panel: '#ffffff',
    text: '#0f172a',
    subtext: '#64748b',
    border: '#e2e8f0',
    btn: '#0284c7',
    btnActive: '#e11d48',
  },
  setTheme(key: ThemeKey) {
    const target = pal[key];
    if (target) {
      Object.assign(pal.active, target);
    }
  },
};

export function parseToHex(color: string, fallback: string = '#000000'): string {
  if (!color) return fallback;
  if (color.startsWith('#')) {
    if (color.length === 4) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    return color.slice(0, 7);
  }
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbaMatch) {
    const r = Math.min(255, parseInt(rgbaMatch[1], 10)).toString(16).padStart(2, '0');
    const g = Math.min(255, parseInt(rgbaMatch[2], 10)).toString(16).padStart(2, '0');
    const b = Math.min(255, parseInt(rgbaMatch[3], 10)).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return fallback;
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = parseToHex(hex, '#000000');
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function parseColorRgba(color: string, defaultAlpha: number = 1): { r: number; g: number; b: number; a: number } {
  if (!color) return { r: 0, g: 0, b: 0, a: defaultAlpha };
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : defaultAlpha,
    };
  }
  const hex = parseToHex(color, '#000000');
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
    a: defaultAlpha,
  };
}

export function interpolateColor(color1: string, color2: string, progress: number): string {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0) return color1;
  if (p >= 1) return color2;
  const c1 = parseColorRgba(color1, 1);
  const c2 = parseColorRgba(color2, 1);
  const r = Math.round(c1.r + (c2.r - c1.r) * p);
  const g = Math.round(c1.g + (c2.g - c1.g) * p);
  const b = Math.round(c1.b + (c2.b - c1.b) * p);
  const a = +(c1.a + (c2.a - c1.a) * p).toFixed(3);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function connectContoursWithBridges(contours: Point[][]): Point[] {
  if (!contours || contours.length === 0) return [];
  const valid = contours.filter((c) => c && c.length >= 4);
  if (valid.length === 0) return [];
  if (valid.length === 1) return valid[0];

  // Sort descending by length so the primary/largest component is the base
  valid.sort((a, b) => b.length - a.length);

  let unified: Point[] = [...valid[0]];
  const remaining = valid.slice(1);

  while (remaining.length > 0) {
    let bestDistSq = Infinity;
    let bestUnifiedIdx = 0;
    let bestRemainingIdx = 0;
    let bestContourPtIdx = 0;

    const uStep = Math.max(1, Math.floor(unified.length / 150));
    for (let u = 0; u < unified.length; u += uStep) {
      const pu = unified[u];
      for (let r = 0; r < remaining.length; r++) {
        const c = remaining[r];
        const cStep = Math.max(1, Math.floor(c.length / 50));
        for (let cp = 0; cp < c.length; cp += cStep) {
          const pc = c[cp];
          const d2 = (pu.x - pc.x) ** 2 + (pu.y - pc.y) ** 2;
          if (d2 < bestDistSq) {
            bestDistSq = d2;
            bestUnifiedIdx = u;
            bestRemainingIdx = r;
            bestContourPtIdx = cp;
          }
        }
      }
    }

    const nextContour = remaining.splice(bestRemainingIdx, 1)[0];
    const pu = unified[bestUnifiedIdx];

    // Rotate nextContour so it starts and ends at bestContourPtIdx
    const rotatedNext: Point[] = [
      ...nextContour.slice(bestContourPtIdx),
      ...nextContour.slice(0, bestContourPtIdx),
      nextContour[bestContourPtIdx],
    ];

    const pc = rotatedNext[0];

    // Invisible return bridge: forward pu -> pc and backward pc -> pu
    const bridgeForward: Point[] = [];
    const bridgeBackward: Point[] = [];
    const bridgeSteps = 4;
    for (let s = 1; s <= bridgeSteps; s++) {
      const t = s / bridgeSteps;
      bridgeForward.push({
        x: pu.x + (pc.x - pu.x) * t,
        y: pu.y + (pc.y - pu.y) * t,
      });
    }
    for (let s = 1; s <= bridgeSteps; s++) {
      const t = s / bridgeSteps;
      bridgeBackward.push({
        x: pc.x + (pu.x - pc.x) * t,
        y: pc.y + (pu.y - pc.y) * t,
      });
    }

    unified.splice(bestUnifiedIdx + 1, 0, ...bridgeForward, ...rotatedNext, ...bridgeBackward);
  }

  return unified;
}

// Resampling strictly based on cumulative perimeter arc length (uniform spacing)
function resampleByArcLength(points: Point[], targetCount: number): Point[] {
  if (points.length < 2) return points;
  const cumLengths: number[] = [0];
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    cumLengths.push(cumLengths[cumLengths.length - 1] + dist);
  }
  const totalLength = cumLengths[cumLengths.length - 1];
  if (totalLength <= 0.0001) return points;

  const resampled: Point[] = [];
  let currentIdx = 0;

  for (let i = 0; i < targetCount; i++) {
    const targetDist = (i / targetCount) * totalLength;
    while (currentIdx < cumLengths.length - 2 && cumLengths[currentIdx + 1] < targetDist) {
      currentIdx++;
    }
    const d0 = cumLengths[currentIdx];
    const d1 = cumLengths[currentIdx + 1];
    const segLen = d1 - d0;
    const t = segLen > 0 ? (targetDist - d0) / segLen : 0;
    const p0 = points[currentIdx % points.length];
    const p1 = points[(currentIdx + 1) % points.length];
    resampled.push({
      x: p0.x + (p1.x - p0.x) * t,
      y: p0.y + (p1.y - p0.y) * t,
    });
  }
  return resampled;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // HD offscreen canvas for exports
  const hdCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent Trail & Bloom Layer offscreen canvases
  const bloomCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hdBloomCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('light');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [currentShapeKey, setCurrentShapeKey] = useState<string>('cuadrado');
  const [shapeCustomLabel, setShapeCustomLabel] = useState<string>('');
  const [maxCircles, setMaxCircles] = useState<number>(32);
  const [sliderMaxLimit, setSliderMaxLimit] = useState<number>(2000);
  const [speedSliderRaw, setSpeedSliderRaw] = useState<number>(33);
  const [speedDisplay, setSpeedDisplay] = useState<string>('1x');
  const [drawMode, setDrawMode] = useState<string>('none');
  const [mixedType, setMixedTypeState] = useState<'line' | 'curve'>('line');
  const [snapAngleEnabled, setSnapAngleEnabled] = useState<boolean>(true);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  // Advanced Features States
  const [visualFX, setVisualFX] = useState<VisualFX>('classic');
  const [bloomEnabled, setBloomEnabled] = useState<boolean>(true);
  const [shadowMode, setShadowMode] = useState<boolean>(false);

  // Custom Color Selection States
  const [customBg, setCustomBg] = useState<string>('#ffffff');
  const [customCircle, setCustomCircle] = useState<string>('#0284c7');
  const [customTrail, setCustomTrail] = useState<string>('#0284c7');
  const [useCustomColors, setUseCustomColors] = useState<boolean>(false);
  const [colorPanelOpen, setColorPanelOpen] = useState<boolean>(false);

  // Mobile Drawer Menu State
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Video Export Suite Modal
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportAspect, setExportAspect] = useState<ExportAspect>('9:16');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);

  // Info Modal
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<{ title: string; text: string }>({
    title: '',
    text: '',
  });

  // Animation & math state references for 60 FPS loop
  const stateRef = useRef({
    currentTheme: 'light' as ThemeKey,
    isDark: false,
    customBg: '#ffffff',
    customCircle: '#0284c7',
    customTrail: '#0284c7',
    useCustomColors: false,
    time: 0,
    path: [] as Point[],
    hdPath: [] as Point[],
    shadowPath: [] as Point[],
    hdShadowPath: [] as Point[],
    shadowMode: false as boolean,
    lapCount: 0,
    fourierRaw: [] as FourierComponent[],
    fourierFiltered: [] as FourierComponent[],
    maxCircles: 32,
    speed: 1.0,
    speedSliderRaw: 33,
    currentShapeKey: 'cuadrado',
    scale: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStart: { x: 0, y: 0 } as Point,
    isTracking: false,
    currentTipWorld: { x: 0, y: 0 } as Point,
    drawMode: 'none',
    isFreeDrawing: false,
    rawPoints: [] as Point[],
    anchorPoints: [] as Point[],
    curveStage: 0,
    curveP1: null as Point | null,
    curveP2: null as Point | null,
    mixedType: 'line' as 'line' | 'curve',
    mixedCurrentStart: null as Point | null,
    snapAngleEnabled: true,
    currentMouseWorld: { x: 0, y: 0 } as Point,
    lastTapTime: 0,
    initialTouchDist: null as number | null,
    visualFX: 'classic' as VisualFX,
    bloomEnabled: true as boolean,
    isRecordingWallpaper: false,
    mediaRecorder: null as MediaRecorder | null,
    recordedChunks: [] as Blob[],
    exportAspect: '9:16' as ExportAspect,
    recTotalFrames: 1200 as number,
    prevRecordTime: 0 as number,
    exportFraming: null as {
      isTracking: boolean;
      scale: number;
      panX: number;
      panY: number;
      bounds?: { minX: number; maxX: number; minY: number; maxY: number };
    } | null,
    prevVx: 0,
    prevVy: 0,
    themeTransitionProgress: 1.0,
    themeTransitionDuration: 600,
    themeTransitionStartTime: 0,
    fromThemeColors: null as ThemeColors | null,
    toThemeColors: null as ThemeColors | null,
    fromThemeKey: null as ThemeKey | null,
    toThemeKey: null as ThemeKey | null,
  });

  // Sync stateRef
  stateRef.current.currentTheme = currentTheme;
  stateRef.current.isDark = isDark;
  stateRef.current.maxCircles = maxCircles;
  stateRef.current.speedSliderRaw = speedSliderRaw;
  stateRef.current.currentShapeKey = currentShapeKey;
  stateRef.current.drawMode = drawMode;
  stateRef.current.mixedType = mixedType;
  stateRef.current.snapAngleEnabled = snapAngleEnabled;
  stateRef.current.isTracking = isTracking;
  stateRef.current.visualFX = visualFX;
  stateRef.current.bloomEnabled = bloomEnabled;
  stateRef.current.shadowMode = shadowMode;
  stateRef.current.exportAspect = exportAspect;
  stateRef.current.customBg = customBg;
  stateRef.current.customCircle = customCircle;
  stateRef.current.customTrail = customTrail;
  stateRef.current.useCustomColors = useCustomColors;

  const recomputeSpeed = useCallback(() => {
    const s = stateRef.current;
    if (s.speedSliderRaw === 0) {
      s.speed = 0;
      setSpeedDisplay('0x');
      return;
    }
    const zoomFactor = Math.max(1, s.scale);
    const minSpeed = 0.1 / zoomFactor;
    const maxSpeed = 3.0;
    const t = s.speedSliderRaw / 100;
    s.speed = minSpeed * Math.pow(maxSpeed / minSpeed, t);

    let displayStr = '';
    if (s.speed >= 0.01) displayStr = s.speed.toFixed(2) + 'x';
    else if (s.speed >= 0.001) displayStr = s.speed.toFixed(3) + 'x';
    else displayStr = s.speed.toFixed(4) + 'x';

    setSpeedDisplay(displayStr);
  }, []);

  const applyZoomStep = useCallback(
    (factor: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const s = stateRef.current;
      const newScale = Math.min(Math.max(s.scale * factor, 0.05), 1000);

      if (s.isTracking) {
        s.scale = newScale;
        s.panX = canvas.width / 2 - s.currentTipWorld.x * s.scale;
        s.panY = canvas.height / 2 - s.currentTipWorld.y * s.scale;
      } else {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        s.panX = cx - (cx - s.panX) * (newScale / s.scale);
        s.panY = cy - (cy - s.panY) * (newScale / s.scale);
        s.scale = newScale;
      }
      recomputeSpeed();
    },
    [recomputeSpeed]
  );

  const resetZoom = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    s.isTracking = false;
    setIsTracking(false);
    s.scale = 1.0;
    s.panX = canvas.width / 2;
    s.panY = canvas.height / 2;
    recomputeSpeed();
  }, [recomputeSpeed]);

  const toggleTracking = useCallback(() => {
    setIsTracking((prev) => {
      const next = !prev;
      stateRef.current.isTracking = next;
      return next;
    });
  }, []);

  const toggleShadowMode = useCallback(() => {
    setShadowMode((prev) => {
      const next = !prev;
      stateRef.current.shadowMode = next;
      if (!next) {
        stateRef.current.shadowPath = [];
        stateRef.current.hdShadowPath = [];
        stateRef.current.lapCount = 0;
      }
      return next;
    });
  }, []);

  const toggleSnap = useCallback(() => {
    setSnapAngleEnabled((prev) => {
      const next = !prev;
      stateRef.current.snapAngleEnabled = next;
      return next;
    });
  }, []);

  const applyTheme = useCallback((themeKey: ThemeKey) => {
    const t = pal[themeKey];
    if (!t) return;

    const s = stateRef.current;
    const oldThemeKey = s.currentTheme;
    const oldThemeColors = pal[oldThemeKey] ? { ...pal[oldThemeKey] } : { ...pal.active };

    // Set transition parameters if theme is changing
    if (oldThemeKey !== themeKey) {
      s.fromThemeColors = oldThemeColors;
      s.toThemeColors = { ...t };
      s.fromThemeKey = oldThemeKey;
      s.toThemeKey = themeKey;
      s.themeTransitionStartTime = performance.now();
      s.themeTransitionProgress = 0;
    }

    pal.setTheme(themeKey);
    setCurrentTheme(themeKey);
    setIsDark(t.isDarkBase);
    stateRef.current.currentTheme = themeKey;
    stateRef.current.isDark = t.isDarkBase;

    // Synchronize HTML body classes
    document.body.classList.remove(
      'dark',
      'theme-dark',
      'theme-light',
      'theme-burned',
      'theme-sunset',
      'theme-matrix',
      'theme-monochrome'
    );
    document.body.classList.add(`theme-${themeKey}`);
    if (t.isDarkBase) {
      document.body.classList.add('dark');
    }

    // Synchronize CSS custom properties dynamically
    const root = document.documentElement;
    root.style.setProperty('--bg', t.bg);
    root.style.setProperty('--panel', t.panel);
    root.style.setProperty('--canvas-bg', t.bg);
    root.style.setProperty('--text', t.text);
    root.style.setProperty('--subtext', t.subtext);
    root.style.setProperty('--border', t.border);
    root.style.setProperty('--btn', t.btn);
    root.style.setProperty('--btn-active', t.btnActive);
    root.style.setProperty('--modal-bg', t.panel);

    // If custom colors are not overridden, synchronize input swatches to the new theme
    if (!stateRef.current.useCustomColors) {
      const defBg = parseToHex(t.bg, '#ffffff');
      const defCircle = parseToHex(t.circle, '#0284c7');
      const defTrail = parseToHex(t.trail, '#0284c7');
      setCustomBg(defBg);
      setCustomCircle(defCircle);
      setCustomTrail(defTrail);
      stateRef.current.customBg = defBg;
      stateRef.current.customCircle = defCircle;
      stateRef.current.customTrail = defTrail;
    }
  }, []);

  const handleColorChange = useCallback((type: 'bg' | 'circle' | 'trail', hexValue: string) => {
    setUseCustomColors(true);
    stateRef.current.useCustomColors = true;
    if (type === 'bg') {
      setCustomBg(hexValue);
      stateRef.current.customBg = hexValue;
      document.documentElement.style.setProperty('--canvas-bg', hexValue);
    } else if (type === 'circle') {
      setCustomCircle(hexValue);
      stateRef.current.customCircle = hexValue;
    } else if (type === 'trail') {
      setCustomTrail(hexValue);
      stateRef.current.customTrail = hexValue;
    }
  }, []);

  const applyPresetPalette = useCallback((bg: string, circle: string, trail: string) => {
    setCustomBg(bg);
    setCustomCircle(circle);
    setCustomTrail(trail);
    setUseCustomColors(true);
    stateRef.current.customBg = bg;
    stateRef.current.customCircle = circle;
    stateRef.current.customTrail = trail;
    stateRef.current.useCustomColors = true;
    document.documentElement.style.setProperty('--canvas-bg', bg);
  }, []);

  const resetToThemeColors = useCallback(() => {
    const t = pal[currentTheme] || pal.active;
    const defBg = parseToHex(t.bg, '#ffffff');
    const defCircle = parseToHex(t.circle, '#0284c7');
    const defTrail = parseToHex(t.trail, '#0284c7');
    setCustomBg(defBg);
    setCustomCircle(defCircle);
    setCustomTrail(defTrail);
    setUseCustomColors(false);
    stateRef.current.customBg = defBg;
    stateRef.current.customCircle = defCircle;
    stateRef.current.customTrail = defTrail;
    stateRef.current.useCustomColors = false;
    document.documentElement.style.setProperty('--canvas-bg', t.bg);
  }, [currentTheme]);

  const toggleTheme = useCallback(() => {
    const s = stateRef.current;
    const nextTheme: ThemeKey = s.currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }, [applyTheme]);

  const toggleImmersiveMode = useCallback(() => {
    document.body.classList.toggle('immersive-mode');
    setTimeout(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (container && canvas) {
        const rect = container.getBoundingClientRect();
        const prevW = canvas.width;
        const prevH = canvas.height;
        canvas.width = rect.width;
        canvas.height = rect.height;
        if (prevW > 0 && prevH > 0) {
          stateRef.current.panX += (canvas.width - prevW) / 2;
          stateRef.current.panY += (canvas.height - prevH) / 2;
        }
      }
    }, 50);
  }, []);

  const openExplanation = useCallback(() => {
    const info =
      explanations[stateRef.current.currentShapeKey] || explanations.cuadrado;
    setModalData({ title: info.title, text: info.text });
    setInfoModalOpen(true);
  }, []);

  const applySnapAngle = (
    pOrigin: Point | null,
    pTarget: Point
  ): { point: Point; snapped: boolean; angleDeg: number } => {
    const s = stateRef.current;
    if (!s.snapAngleEnabled || !pOrigin) {
      return { point: pTarget, snapped: false, angleDeg: 0 };
    }
    const dx = pTarget.x - pOrigin.x;
    const dy = pTarget.y - pOrigin.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) return { point: pTarget, snapped: false, angleDeg: 0 };

    const angle = Math.atan2(dy, dx);
    const angleDeg = ((angle * 180) / Math.PI + 360) % 360;

    const snapInterval = 45;
    const nearestSnap = Math.round(angleDeg / snapInterval) * snapInterval;
    const diff = Math.abs(angleDeg - nearestSnap);

    if (diff <= 7 || Math.abs(diff - 360) <= 7) {
      const snapRad = (nearestSnap * Math.PI) / 180;
      return {
        point: {
          x: pOrigin.x + dist * Math.cos(snapRad),
          y: pOrigin.y + dist * Math.sin(snapRad),
        },
        snapped: true,
        angleDeg: nearestSnap % 360,
      };
    }
    return { point: pTarget, snapped: false, angleDeg: Math.round(angleDeg) };
  };

  const sampleBezier = (
    p0: Point,
    p1: Point,
    p2: Point,
    count = 25
  ): Point[] => {
    const pts: Point[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const x =
        (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
      const y =
        (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
      pts.push({ x, y });
    }
    return pts;
  };

  const sampleSegment = (p1: Point, p2: Point, count = 15): Point[] => {
    const pts: Point[] = [];
    for (let s = 0; s <= count; s++) {
      const t = s / count;
      pts.push({
        x: p1.x * (1 - t) + p2.x * t,
        y: p1.y * (1 - t) + p2.y * t,
      });
    }
    return pts;
  };

  const dftCentered = (points: Point[]): FourierComponent[] => {
    const N = points.length;
    const X: FourierComponent[] = [];
    const maxK = Math.min(1000, Math.floor(N / 2));
    const twoPiOverN = (2 * Math.PI) / N;

    for (let k = -maxK; k <= maxK; k++) {
      let re = 0;
      let im = 0;
      const factor = twoPiOverN * k;
      for (let n = 0; n < N; n++) {
        const phi = factor * n;
        re += points[n].x * Math.cos(phi) + points[n].y * Math.sin(phi);
        im += points[n].y * Math.cos(phi) - points[n].x * Math.sin(phi);
      }
      re /= N;
      im /= N;
      X.push({
        freq: k,
        amp: Math.sqrt(re * re + im * im),
        phase: Math.atan2(im, re),
      });
    }
    return X;
  };

  const compute = useCallback((points: Point[], targetPointsCount?: number) => {
    if (!points || points.length < 3) return;
    // High-density discrete sampling (1,200 to 2,000 points) for millimeter precision and fine corners
    const targetPoints = targetPointsCount
      ? targetPointsCount
      : Math.min(2000, Math.max(720, points.length >= 250 ? 1800 : 720));

    // True mathematical arc-length parameterization for uniform density
    const resampled = resampleByArcLength(points, targetPoints);

    const s = stateRef.current;
    const rawFourier = dftCentered(resampled);
    rawFourier.sort((a, b) => b.amp - a.amp);

    s.fourierRaw = rawFourier;
    s.fourierFiltered = rawFourier;
    s.time = 0;
    s.path = [];
    s.hdPath = [];
    s.shadowPath = [];
    s.hdShadowPath = [];
    s.lapCount = 0;
  }, []);

  const makePolygon = (
    sides: number,
    radius: number,
    startAngle = -Math.PI / 2
  ): Point[] => {
    const vertices: Point[] = [];
    for (let i = 0; i < sides; i++) {
      const a = startAngle + (i * 2 * Math.PI) / sides;
      vertices.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) });
    }
    const pts: Point[] = [];
    const segSteps = Math.floor(240 / sides);
    for (let i = 0; i < sides; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % sides];
      for (let s = 0; s < segSteps; s++) {
        const t = s / segSteps;
        pts.push({
          x: p1.x * (1 - t) + p2.x * t,
          y: p1.y * (1 - t) + p2.y * t,
        });
      }
    }
    return pts;
  };

  const exitDraw = useCallback(() => {
    const s = stateRef.current;
    s.drawMode = 'none';
    s.isFreeDrawing = false;
    s.shadowPath = [];
    s.hdShadowPath = [];
    s.lapCount = 0;
    setDrawMode('none');
  }, []);

  const setShape = useCallback(
    (type: string) => {
      if (!type) return;
      exitDraw();
      const s = stateRef.current;
      s.currentShapeKey = type;
      setCurrentShapeKey(type);

      const minNeeded = defaultCirclesMap[type] || 32;
      s.maxCircles = minNeeded;
      setMaxCircles(minNeeded);

      const canvas = canvasRef.current;
      const sz = canvas ? Math.min(canvas.width, canvas.height) * 0.3 : 180;
      let pts: Point[] = [];

      if (type === 'cuadrado') {
        pts = makePolygon(4, sz * 1.35, -Math.PI / 4);
      } else if (type === 'triangulo') {
        pts = makePolygon(3, sz * 1.35, -Math.PI / 2);
      } else if (type === 'pentagono') {
        pts = makePolygon(5, sz * 1.25, -Math.PI / 2);
      } else if (type === 'hexagono') {
        pts = makePolygon(6, sz * 1.2, 0);
      } else if (type === 'octagono') {
        pts = makePolygon(8, sz * 1.15, Math.PI / 8);
      } else if (type === 'rombo') {
        const v = [
          { x: 0, y: -sz * 1.4 },
          { x: sz * 0.9, y: 0 },
          { x: 0, y: sz * 1.4 },
          { x: -sz * 0.9, y: 0 },
        ];
        for (let i = 0; i < 4; i++) {
          const p1 = v[i],
            p2 = v[(i + 1) % 4];
          for (let st = 0; st < 50; st++) {
            pts.push({
              x: p1.x * (1 - st / 50) + p2.x * (st / 50),
              y: p1.y * (1 - st / 50) + p2.y * (st / 50),
            });
          }
        }
      } else if (type === 'cruz') {
        const w = sz * 0.45,
          h = sz * 1.25;
        const v = [
          { x: -w, y: -h },
          { x: w, y: -h },
          { x: w, y: -w },
          { x: h, y: -w },
          { x: h, y: w },
          { x: w, y: w },
          { x: w, y: h },
          { x: -w, y: h },
          { x: -w, y: w },
          { x: -h, y: w },
          { x: -h, y: -w },
          { x: -w, y: -w },
        ];
        for (let i = 0; i < v.length; i++) {
          const p1 = v[i],
            p2 = v[(i + 1) % v.length];
          for (let st = 0; st < 20; st++) {
            pts.push({
              x: p1.x * (1 - st / 20) + p2.x * (st / 20),
              y: p1.y * (1 - st / 20) + p2.y * (st / 20),
            });
          }
        }
      } else if (type === 'estrella') {
        for (let i = 0; i < 240; i++) {
          const a = (i / 240) * Math.PI * 2;
          const r = sz * (0.55 + 0.45 * Math.cos(5 * a));
          pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
        }
      } else if (type === 'corazon') {
        for (let i = 0; i < 240; i++) {
          const t = (i / 240) * Math.PI * 2;
          const x = 16 * Math.pow(Math.sin(t), 3);
          const y = -(
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t)
          );
          pts.push({ x: x * (sz / 16), y: y * (sz / 16) });
        }
      }

      compute(pts);
    },
    [compute, exitDraw]
  );

  // SVG & Raster Vectorization Processor (Multi-section / Disconnected contours support)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type.includes('svg');
    const fileName = file.name.replace(/\.[^/.]+$/, '');

    if (isSvg) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const svgContent = event.target?.result as string;
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgContent, 'image/svg+xml');

          // Append temporarily to DOM to measure lengths
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.left = '-99999px';
          container.style.top = '-99999px';
          container.style.visibility = 'hidden';
          container.innerHTML = svgContent;
          document.body.appendChild(container);

          const svgElem = container.querySelector('svg');
          if (!svgElem) {
            document.body.removeChild(container);
            alert('El archivo SVG no contiene elementos gráficos válidos.');
            return;
          }

          const contours: Point[][] = [];

          // 1. Process all <path> elements (splitting multi-subpath 'd' attributes with high precision)
          const pathElements = container.querySelectorAll('path');
          pathElements.forEach((pathEl) => {
            const d = pathEl.getAttribute('d') || '';
            // Split by moveto commands so each letter/island is isolated
            const subPaths = d.match(/[Mm][^Mm]+/g) || [d];
            subPaths.forEach((subD) => {
              const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              tempPath.setAttribute('d', subD);
              svgElem.appendChild(tempPath);
              if (typeof tempPath.getTotalLength === 'function') {
                const len = tempPath.getTotalLength();
                if (len > 2) {
                  // High internal sampling density: 1 point every ~1.2 units of arc length
                  const ptsCount = Math.min(600, Math.max(35, Math.floor(len * 1.4)));
                  const pts: Point[] = [];
                  for (let i = 0; i <= ptsCount; i++) {
                    const pt = tempPath.getPointAtLength((i / ptsCount) * len);
                    pts.push({ x: pt.x, y: pt.y });
                  }
                  if (pts.length >= 4) contours.push(pts);
                }
              }
              svgElem.removeChild(tempPath);
            });
          });

          // 2. Process <polygon> and <polyline> with fine segment resolution
          const polyElements = container.querySelectorAll('polygon, polyline');
          polyElements.forEach((polyEl) => {
            const pointsAttr = polyEl.getAttribute('points') || '';
            const coords = pointsAttr.trim().split(/[\s,]+/).map(Number);
            const pts: Point[] = [];
            for (let i = 0; i < coords.length - 1; i += 2) {
              if (!isNaN(coords[i]) && !isNaN(coords[i + 1])) {
                pts.push({ x: coords[i], y: coords[i + 1] });
              }
            }
            if (pts.length >= 3) {
              if (polyEl.tagName.toLowerCase() === 'polygon') {
                pts.push({ x: pts[0].x, y: pts[0].y });
              }
              const sampled: Point[] = [];
              for (let i = 0; i < pts.length - 1; i++) {
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                const steps = Math.max(4, Math.floor(dist * 1.4));
                for (let s = 0; s < steps; s++) {
                  sampled.push({
                    x: p1.x + (p2.x - p1.x) * (s / steps),
                    y: p1.y + (p2.y - p1.y) * (s / steps),
                  });
                }
              }
              if (sampled.length >= 4) contours.push(sampled);
            }
          });

          // 3. Process <circle> and <ellipse> with high smoothness
          const circleElements = container.querySelectorAll('circle, ellipse');
          circleElements.forEach((cEl) => {
            const cx = parseFloat(cEl.getAttribute('cx') || '0');
            const cy = parseFloat(cEl.getAttribute('cy') || '0');
            const r = parseFloat(cEl.getAttribute('r') || '0');
            const rx = parseFloat(cEl.getAttribute('rx') || String(r));
            const ry = parseFloat(cEl.getAttribute('ry') || String(r));
            if (rx > 0 && ry > 0) {
              const pts: Point[] = [];
              const steps = 120;
              for (let i = 0; i <= steps; i++) {
                const a = (i / steps) * Math.PI * 2;
                pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
              }
              contours.push(pts);
            }
          });

          // 4. Process <rect>
          const rectElements = container.querySelectorAll('rect');
          rectElements.forEach((rEl) => {
            const x = parseFloat(rEl.getAttribute('x') || '0');
            const y = parseFloat(rEl.getAttribute('y') || '0');
            const w = parseFloat(rEl.getAttribute('width') || '0');
            const h = parseFloat(rEl.getAttribute('height') || '0');
            if (w > 0 && h > 0) {
              const pts: Point[] = [];
              const stepsW = Math.max(8, Math.floor(w * 1.2));
              const stepsH = Math.max(8, Math.floor(h * 1.2));
              for (let i = 0; i < stepsW; i++) pts.push({ x: x + (w * i) / stepsW, y });
              for (let i = 0; i < stepsH; i++) pts.push({ x: x + w, y: y + (h * i) / stepsH });
              for (let i = 0; i < stepsW; i++) pts.push({ x: x + w - (w * i) / stepsW, y: y + h });
              for (let i = 0; i < stepsH; i++) pts.push({ x, y: y + h - (h * i) / stepsH });
              pts.push({ x, y });
              contours.push(pts);
            }
          });

          document.body.removeChild(container);

          if (contours.length === 0) {
            alert('No se encontraron elementos gráficos vectorizables en el archivo SVG.');
            return;
          }

          // Connect all disconnected sections/letters seamlessly with invisible bridges!
          const rawPts = connectContoursWithBridges(contours);

          // Center and normalize coordinates
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          rawPts.forEach((p) => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });

          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          const w = maxX - minX || 1;
          const h = maxY - minY || 1;
          const targetRadius = 180;
          const scaleFactor = (targetRadius * 2) / Math.max(w, h);

          const pts: Point[] = rawPts.map((p) => ({
            x: (p.x - cx) * scaleFactor,
            y: (p.y - cy) * scaleFactor,
          }));

          exitDraw();
          setCurrentShapeKey('svg_import');
          const elemSuffix = contours.length > 1 ? ` (${contours.length} elem)` : '';
          setShapeCustomLabel(`SVG: ${fileName.slice(0, 10)}${elemSuffix}`);
          stateRef.current.currentShapeKey = 'svg_import';

          // Dynamic circle slider bounds up to 2000 circles for razor-sharp fidelity
          setSliderMaxLimit(2000);
          const neededCircles = Math.min(Math.max(350, Math.floor(contours.length * 60 + 250)), 850);
          stateRef.current.maxCircles = neededCircles;
          setMaxCircles(neededCircles);
          compute(pts, 2000);
        } catch (err) {
          console.error(err);
          alert('Error procesando el archivo SVG.');
        }
      };
      reader.readAsText(file);
    } else {
      // High-precision raster image (PNG/JPG) vectorization with adaptive contrast & multi-contour bridge connectivity
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const auxCanvas = document.createElement('canvas');
            // High internal sampling scale: 360px max dimension for fine detail capture
            const maxDim = 360;
            const aspect = img.width / img.height;
            const w = aspect >= 1 ? maxDim : Math.round(maxDim * aspect);
            const h = aspect >= 1 ? Math.round(maxDim / aspect) : maxDim;
            auxCanvas.width = w;
            auxCanvas.height = h;

            const auxCtx = auxCanvas.getContext('2d');
            if (!auxCtx) return;
            auxCtx.fillStyle = '#ffffff';
            auxCtx.fillRect(0, 0, w, h);
            auxCtx.drawImage(img, 0, 0, w, h);

            const imgData = auxCtx.getImageData(0, 0, w, h);
            const data = imgData.data;

            // Adaptive contrast analysis & perimeter background detection
            let edgeLumSum = 0;
            let edgeCount = 0;
            for (let x = 0; x < w; x++) {
              for (const y of [0, h - 1]) {
                const idx = (y * w + x) * 4;
                edgeLumSum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                edgeCount++;
              }
            }
            for (let y = 0; y < h; y++) {
              for (const x of [0, w - 1]) {
                const idx = (y * w + x) * 4;
                edgeLumSum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                edgeCount++;
              }
            }
            const avgEdgeLum = edgeLumSum / edgeCount;
            const darkOnLight = avgEdgeLum > 128;
            const threshold = darkOnLight ? Math.max(115, avgEdgeLum - 35) : Math.min(140, avgEdgeLum + 35);

            const grid: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                grid[y][x] = darkOnLight ? lum < threshold : lum > threshold;
              }
            }

            // Detect all distinct closed contours (exterior boundaries and interior islands/holes)
            const visitedBorder: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));
            const contours: Point[][] = [];

            const dx = [0, 1, 1, 1, 0, -1, -1, -1];
            const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

            for (let y = 1; y < h - 1; y++) {
              for (let x = 1; x < w - 1; x++) {
                if (grid[y][x] && !visitedBorder[y][x]) {
                  const isEdge =
                    !grid[y - 1][x] || !grid[y + 1][x] || !grid[y][x - 1] || !grid[y][x + 1];
                  if (isEdge) {
                    const contour: Point[] = [];
                    let currX = x;
                    let currY = y;
                    let backtrackDir = 0;
                    let iterations = 0;
                    const maxIterations = 6000;

                    do {
                      contour.push({ x: currX, y: currY });
                      visitedBorder[currY][currX] = true;
                      let found = false;
                      for (let i = 0; i < 8; i++) {
                        const dir = (backtrackDir + i) % 8;
                        const nx = currX + dx[dir];
                        const ny = currY + dy[dir];
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h && grid[ny][nx]) {
                          currX = nx;
                          currY = ny;
                          backtrackDir = (dir + 5) % 8;
                          found = true;
                          break;
                        }
                      }
                      if (!found) break;
                      iterations++;
                    } while ((currX !== x || currY !== y) && iterations < maxIterations);

                    if (contour.length >= 12) {
                      // High-fidelity corner-preserving smoothing
                      const smoothed: Point[] = [];
                      for (let i = 0; i < contour.length; i++) {
                        const pPrev = contour[(i - 1 + contour.length) % contour.length];
                        const pCurr = contour[i];
                        const pNext = contour[(i + 1) % contour.length];

                        // Calculate corner angle to preserve sharp features
                        const v1x = pCurr.x - pPrev.x;
                        const v1y = pCurr.y - pPrev.y;
                        const v2x = pNext.x - pCurr.x;
                        const v2y = pNext.y - pCurr.y;
                        const dot = v1x * v2x + v1y * v2y;
                        const mag = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
                        const cosAngle = mag > 0 ? dot / mag : 1;

                        // If sharp corner (> 45° angle), preserve exact vertex point
                        if (cosAngle < 0.70) {
                          smoothed.push({ x: pCurr.x, y: pCurr.y });
                        } else {
                          smoothed.push({
                            x: pPrev.x * 0.25 + pCurr.x * 0.5 + pNext.x * 0.25,
                            y: pPrev.y * 0.25 + pCurr.y * 0.5 + pNext.y * 0.25,
                          });
                        }
                      }
                      contours.push(smoothed);
                    }
                  }
                }
              }
            }

            if (contours.length === 0) {
              alert('No se detectaron siluetas con suficiente contraste.');
              return;
            }

            // Connect all detected contour islands via bridges!
            const rawPts = connectContoursWithBridges(contours);

            // Center and scale
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            rawPts.forEach((p) => {
              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.y > maxY) maxY = p.y;
            });

            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;
            const rw = maxX - minX || 1;
            const rh = maxY - minY || 1;
            const targetRadius = 180;
            const scaleFactor = (targetRadius * 2) / Math.max(rw, rh);

            const pts: Point[] = rawPts.map((p) => ({
              x: (p.x - cx) * scaleFactor,
              y: (p.y - cy) * scaleFactor,
            }));

            exitDraw();
            setCurrentShapeKey('img_import');
            const elemSuffix = contours.length > 1 ? ` (${contours.length} elem)` : '';
            setShapeCustomLabel(`IMG: ${fileName.slice(0, 10)}${elemSuffix}`);
            stateRef.current.currentShapeKey = 'img_import';

            // Dynamic slider bounds up to 2000 circles
            setSliderMaxLimit(2000);
            const neededCircles = Math.min(Math.max(350, Math.floor(contours.length * 60 + 250)), 850);
            stateRef.current.maxCircles = neededCircles;
            setMaxCircles(neededCircles);
            compute(pts, 2000);
          } catch (err) {
            console.error(err);
            alert('Error vectorizando la imagen.');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }

    if (e.target) e.target.value = '';
  };

  const changeDrawMode = useCallback(
    (mode: string) => {
      if (mode === 'none') {
        exitDraw();
        return;
      }
      const s = stateRef.current;
      s.drawMode = mode;
      s.rawPoints = [];
      s.anchorPoints = [];
      s.curveStage = 0;
      s.curveP1 = null;
      s.curveP2 = null;
      s.mixedCurrentStart = null;
      s.fourierRaw = [];
      s.fourierFiltered = [];
      s.path = [];
      s.hdPath = [];
      setDrawMode(mode);

      if (mode === 'mixed') {
        s.mixedType = 'line';
        setMixedTypeState('line');
      }
    },
    [exitDraw]
  );

  const setMixedType = useCallback((type: 'line' | 'curve') => {
    const s = stateRef.current;
    s.mixedType = type;
    setMixedTypeState(type);
    s.curveStage = 0;
    s.curveP2 = null;
  }, []);

  const finishAssisted = useCallback(() => {
    const s = stateRef.current;
    if (s.drawMode === 'poly') {
      if (s.anchorPoints.length < 3) {
        alert('Marca al menos 3 vértices para cerrar la figura.');
        return;
      }
      const pts: Point[] = [];
      const closed = [...s.anchorPoints, s.anchorPoints[0]];
      for (let i = 0; i < closed.length - 1; i++) {
        const p1 = closed[i];
        const p2 = closed[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const steps = Math.max(10, Math.floor(dist / 3));
        for (let st = 0; st < steps; st++) {
          pts.push({
            x: p1.x + (p2.x - p1.x) * (st / steps),
            y: p1.y + (p2.y - p1.y) * (st / steps),
          });
        }
      }
      s.currentShapeKey = 'dibujo';
      setCurrentShapeKey('dibujo');
      s.maxCircles = defaultCirclesMap.dibujo;
      setMaxCircles(defaultCirclesMap.dibujo);
      exitDraw();
      compute(pts);
    } else if (s.drawMode === 'curve' || s.drawMode === 'mixed') {
      if (s.rawPoints.length < 10) {
        alert('Traza al menos una sección antes de procesar.');
        return;
      }
      const first = s.rawPoints[0];
      const last = s.rawPoints[s.rawPoints.length - 1];
      const dist = Math.hypot(first.x - last.x, first.y - last.y);
      const steps = Math.max(8, Math.floor(dist / 3));
      for (let st = 0; st <= steps; st++) {
        s.rawPoints.push({
          x: last.x + (first.x - last.x) * (st / steps),
          y: last.y + (first.y - last.y) * (st / steps),
        });
      }
      s.currentShapeKey = 'dibujo';
      setCurrentShapeKey('dibujo');
      s.maxCircles = defaultCirclesMap.dibujo;
      setMaxCircles(defaultCirclesMap.dibujo);
      const pts = [...s.rawPoints];
      exitDraw();
      compute(pts);
    }
  }, [compute, exitDraw]);

  // Calcula el encuadre inteligente para exportación HD (Caso A: Vista General / Centrado Completo)
  const computeSmartExportFraming = (
    fourier: FourierComponent[],
    maxCircles: number,
    targetWidth: number,
    targetHeight: number,
    paddingPercent: number = 0.12
  ) => {
    const total = Math.min(fourier.length, maxCircles);
    if (total === 0) {
      return {
        scale: 1,
        panX: targetWidth / 2,
        panY: targetHeight / 2,
        bounds: { minX: -150, maxX: 150, minY: -150, maxY: 150 },
      };
    }

    // Muestreo paramétrico de alta densidad en el ciclo [0, 2π]
    // Mide la caja delimitadora que abarca la trayectoria y la amplitud máxima de los círculos giratorios
    const SAMPLES = 480;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Abarcar el radio del círculo mayor para evitar cualquier recorte en el origen
    const maxRadius = total > 0 ? fourier[0].amp : 0;
    minX = Math.min(minX, -maxRadius);
    maxX = Math.max(maxX, maxRadius);
    minY = Math.min(minY, -maxRadius);
    maxY = Math.max(maxY, maxRadius);

    for (let s = 0; s < SAMPLES; s++) {
      const t = (s * 2 * Math.PI) / SAMPLES;
      let cx = 0;
      let cy = 0;

      for (let i = 0; i < total; i++) {
        const prevX = cx;
        const prevY = cy;
        const comp = fourier[i];
        const angle = comp.freq * t + comp.phase;
        const r = comp.amp;
        cx += r * Math.cos(angle);
        cy += r * Math.sin(angle);

        // Amplitud espacial del círculo i centrado en (prevX, prevY) con radio r
        if (prevX - r < minX) minX = prevX - r;
        if (prevX + r > maxX) maxX = prevX + r;
        if (prevY - r < minY) minY = prevY - r;
        if (prevY + r > maxY) maxY = prevY + r;
      }

      // Punta trazadora generatriz de la silueta completa
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
    }

    const boxW = Math.max(maxX - minX, 1);
    const boxH = Math.max(maxY - minY, 1);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // Margen de seguridad del 12% exacto según especificación
    const clampedPadding = Math.min(Math.max(paddingPercent, 0.10), 0.15);
    const usableW = targetWidth * (1 - clampedPadding);
    const usableH = targetHeight * (1 - clampedPadding);

    const scale = Math.min(usableW / boxW, usableH / boxH);

    // Centrado exacto del punto medio geométrico en (540, 960) para 1080x1920 (targetWidth/2, targetHeight/2)
    const panX = targetWidth / 2 - midX * scale;
    const panY = targetHeight / 2 - midY * scale;

    return {
      scale,
      panX,
      panY,
      bounds: { minX, maxX, minY, maxY },
    };
  };

  // Render HD / 4K Video Frame with active aspect ratio and effects
  const renderHDFrame = (c: ThemeColors) => {
    const hdCanvas = hdCanvasRef.current;
    const canvas = canvasRef.current;
    if (!hdCanvas || !canvas) return;
    const hdCtx = hdCanvas.getContext('2d');
    if (!hdCtx) return;

    // Suavizado vectorial de bordes y remates de calidad de estudio profesional
    hdCtx.imageSmoothingEnabled = true;
    hdCtx.imageSmoothingQuality = 'high';
    hdCtx.lineCap = 'round';
    hdCtx.lineJoin = 'round';

    const s = stateRef.current;
    const isBurned = s.currentTheme === 'burned';

    const bgCol = s.useCustomColors ? s.customBg : c.bg;
    const circleCol = s.useCustomColors ? s.customCircle : c.circle;
    const trailCol = s.useCustomColors ? s.customTrail : c.trail;

    if (isBurned && !s.useCustomColors) {
      drawBurnedBackgroundHD(hdCtx, hdCanvas.width, hdCanvas.height);
    } else {
      hdCtx.fillStyle = bgCol;
      hdCtx.fillRect(0, 0, hdCanvas.width, hdCanvas.height);
      if (isBurned && s.useCustomColors) {
        drawBurnedOverlayMaskHD(hdCtx, hdCanvas.width, hdCanvas.height);
      }
    }

    if (s.fourierFiltered.length === 0) return;

    const hdCenterX = hdCanvas.width / 2;
    const hdCenterY = hdCanvas.height / 2;
    const total = Math.min(s.fourierFiltered.length, s.maxCircles);

    // Calcular posición instantánea de la punta trazadora en el mundo
    let tipWorldX = 0;
    let tipWorldY = 0;
    for (let i = 0; i < total; i++) {
      const angle = s.fourierFiltered[i].freq * s.time + s.fourierFiltered[i].phase;
      tipWorldX += s.fourierFiltered[i].amp * Math.cos(angle);
      tipWorldY += s.fourierFiltered[i].amp * Math.sin(angle);
    }

    const isTrackingExport = s.exportFraming ? s.exportFraming.isTracking : s.isTracking;

    let hdEffectiveScale: number;
    let panHDX: number;
    let panHDY: number;

    if (!isTrackingExport) {
      // Caso A: Seguimiento DESACTIVADO (Modo Vista General / Centrado Completo)
      // Ajuste inteligente: toda la trayectoria y la amplitud máxima de los círculos
      // caben enteros con margen de seguridad del 12%, centrados en (540, 960).
      if (s.exportFraming && !s.exportFraming.isTracking) {
        hdEffectiveScale = s.exportFraming.scale;
        panHDX = s.exportFraming.panX;
        panHDY = s.exportFraming.panY;
      } else {
        const smart = computeSmartExportFraming(
          s.fourierFiltered,
          s.maxCircles,
          hdCanvas.width,
          hdCanvas.height,
          0.12
        );
        hdEffectiveScale = smart.scale;
        panHDX = smart.panX;
        panHDY = smart.panY;
      }
    } else {
      // Caso B: Seguimiento ACTIVADO (Modo Macro / Zoom de Usuario)
      // El video refleja exactamente el zoom y encuadre del usuario en pantalla,
      // escalando proporcionalmente al lienzo HD y siguiendo la punta trazadora en tiempo real.
      const hdScaleFactor =
        Math.min(hdCanvas.width, hdCanvas.height) /
        Math.min(canvas.width, canvas.height);
      hdEffectiveScale = s.scale * hdScaleFactor;
      panHDX = hdCenterX - tipWorldX * hdEffectiveScale;
      panHDY = hdCenterY - tipWorldY * hdEffectiveScale;
    }

    hdCtx.save();
    hdCtx.translate(panHDX, panHDY);
    hdCtx.scale(hdEffectiveScale, hdEffectiveScale);
    hdCtx.lineCap = 'round';
    hdCtx.lineJoin = 'round';

    // Ejes guía HD
    hdCtx.beginPath();
    hdCtx.strokeStyle = isBurned ? 'rgba(140, 67, 10, 0.14)' : c.axis;
    hdCtx.lineWidth = 1.8 / hdEffectiveScale;
    hdCtx.moveTo(-100000, 0);
    hdCtx.lineTo(100000, 0);
    hdCtx.moveTo(0, -100000);
    hdCtx.lineTo(0, 100000);
    hdCtx.stroke();

    const isNeon = s.visualFX === 'neon';
    const isFade = s.visualFX === 'fade';
    const isInk = s.visualFX === 'ink';

    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let vRefSum = 0;

    for (let i = 0; i < total; i++) {
      const prevx = x;
      const prevy = y;
      const freq = s.fourierFiltered[i].freq;
      const radius = s.fourierFiltered[i].amp;
      const phase = s.fourierFiltered[i].phase;
      const angle = freq * s.time + phase;

      x += radius * Math.cos(angle);
      y += radius * Math.sin(angle);

      vx += -freq * radius * Math.sin(angle);
      vy += freq * radius * Math.cos(angle);
      vRefSum += Math.abs(freq) * radius;

      // Círculo armónico ultra nítido HD
      hdCtx.beginPath();
      hdCtx.arc(prevx, prevy, radius, 0, Math.PI * 2);
      if (s.useCustomColors) {
        hdCtx.shadowBlur = isNeon ? 22 : 0;
        if (isNeon) hdCtx.shadowColor = circleCol;
        hdCtx.strokeStyle = circleCol;
        hdCtx.lineWidth = Math.max((isNeon ? 2.8 : isInk ? 1.8 : 2.4) / hdEffectiveScale, 0.0001);
      } else if (isBurned) {
        hdCtx.shadowBlur = 0;
        hdCtx.strokeStyle = 'rgba(120, 80, 40, 0.24)';
        hdCtx.lineWidth = Math.max(2.4 / hdEffectiveScale, 0.0001);
      } else if (isNeon) {
        hdCtx.shadowBlur = 22;
        hdCtx.shadowColor = c.isDarkBase ? '#00f0ff' : '#0284c7';
        hdCtx.strokeStyle = c.isDarkBase ? '#38bdf8' : '#0284c7';
        hdCtx.lineWidth = Math.max(2.8 / hdEffectiveScale, 0.0001);
      } else if (isInk) {
        hdCtx.shadowBlur = 0;
        hdCtx.strokeStyle = c.isDarkBase ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.20)';
        hdCtx.lineWidth = Math.max(1.8 / hdEffectiveScale, 0.0001);
      } else {
        hdCtx.shadowBlur = 0;
        hdCtx.strokeStyle = c.circle;
        hdCtx.lineWidth = Math.max(2.4 / hdEffectiveScale, 0.0001);
      }
      hdCtx.stroke();

      // Radio de transmisión
      hdCtx.beginPath();
      hdCtx.moveTo(prevx, prevy);
      hdCtx.lineTo(x, y);
      if (s.useCustomColors) {
        hdCtx.strokeStyle = circleCol;
        hdCtx.lineWidth = Math.max(2.4 / hdEffectiveScale, 0.0001);
      } else if (isBurned) {
        hdCtx.strokeStyle = 'rgba(140, 67, 10, 0.40)';
        hdCtx.lineWidth = Math.max(2.8 / hdEffectiveScale, 0.0001);
      } else {
        hdCtx.strokeStyle = isNeon ? '#38bdf8' : isInk ? (c.isDarkBase ? 'rgba(255, 255, 255, 0.35)' : 'rgba(15, 23, 42, 0.30)') : c.radius;
        hdCtx.lineWidth = Math.max((isInk ? 2.0 : 2.8) / hdEffectiveScale, 0.0001);
      }
      hdCtx.stroke();

      // Pivote
      hdCtx.beginPath();
      hdCtx.arc(prevx, prevy, 5.0 / hdEffectiveScale, 0, Math.PI * 2);
      if (s.useCustomColors) {
        hdCtx.fillStyle = circleCol;
      } else if (isBurned) {
        hdCtx.fillStyle = 'rgba(140, 67, 10, 0.45)';
      } else if (isNeon) {
        hdCtx.fillStyle = '#ffffff';
      } else if (isInk) {
        hdCtx.fillStyle = c.isDarkBase ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.3)';
      } else {
        hdCtx.fillStyle = c.dot;
      }
      hdCtx.fill();
    }

    // Calligraphic ink width based on pointer velocity
    const speedMag = Math.hypot(vx, vy);
    const v0 = Math.max(vRefSum / Math.max(total, 1), 12);
    // HD ink stroke thickness (scaled for HD canvas ~1080p/1920p)
    const hdInkWidth = 3.2 + 13.6 / (1 + Math.pow(speedMag / v0, 1.3));

    // Acumulación de trayectoria HD con integración temporal anti-facetado
    if (s.isRecordingWallpaper) {
      // Integración densa de sub-pasos temporales entre fotogramas para figuras complejas
      const subSteps = 3;
      const pTime = s.prevRecordTime !== undefined ? s.prevRecordTime : s.time;
      const cTime = s.time;
      for (let step = 1; step <= subSteps; step++) {
        const subT = pTime + (cTime - pTime) * (step / subSteps);
        let subX = 0;
        let subY = 0;
        for (let i = 0; i < total; i++) {
          const comp = s.fourierFiltered[i];
          const a = comp.freq * subT + comp.phase;
          subX += comp.amp * Math.cos(a);
          subY += comp.amp * Math.sin(a);
        }
        s.hdPath.unshift({ x: subX, y: subY, width: hdInkWidth });
      }
      s.prevRecordTime = cTime;
    } else {
      if (s.speed > 0 || s.hdPath.length === 0) {
        s.hdPath.unshift({ x, y, width: hdInkWidth });
      }
    }

    // Trazador final HD
    if (s.useCustomColors) {
      hdCtx.save();
      hdCtx.beginPath();
      hdCtx.arc(x, y, (isNeon ? 14 : 10) / hdEffectiveScale, 0, Math.PI * 2);
      hdCtx.shadowBlur = isNeon || isBurned ? 30 : 12;
      hdCtx.shadowColor = trailCol;
      hdCtx.fillStyle = trailCol;
      hdCtx.fill();
      hdCtx.restore();
    } else if (isBurned) {
      hdCtx.save();
      // Halo incandescente brasa viva exterior
      hdCtx.beginPath();
      hdCtx.arc(x, y, 16 / hdEffectiveScale, 0, Math.PI * 2);
      hdCtx.shadowBlur = 38;
      hdCtx.shadowColor = '#ff3b00';
      hdCtx.fillStyle = '#ff5500';
      hdCtx.fill();

      // Núcleo caliente blanco-amarillento de alta temperatura
      hdCtx.beginPath();
      hdCtx.arc(x, y, 7.5 / hdEffectiveScale, 0, Math.PI * 2);
      hdCtx.shadowBlur = 18;
      hdCtx.shadowColor = '#ffe600';
      hdCtx.fillStyle = '#fff9d6';
      hdCtx.fill();
      hdCtx.restore();
    } else {
      hdCtx.beginPath();
      const tracerRadius = isNeon ? 14 : isInk ? (hdInkWidth * 0.75) : 10;
      hdCtx.arc(x, y, tracerRadius / hdEffectiveScale, 0, Math.PI * 2);
      if (isNeon) {
        hdCtx.shadowBlur = 32;
        hdCtx.shadowColor = '#ff0055';
        hdCtx.fillStyle = '#ffffff';
      } else if (isInk) {
        hdCtx.shadowBlur = 0;
        hdCtx.fillStyle = c.isDarkBase ? '#f8fafc' : '#0f172a';
      } else {
        hdCtx.shadowBlur = 0;
        hdCtx.fillStyle = c.tracer;
      }
      hdCtx.fill();
    }

    // Capa de desenfoque gaussiano (Bloom) sobre canvas de estela HD
    if (s.bloomEnabled && hdBloomCanvasRef.current && s.hdPath.length > 1 && !isBurned) {
      const hdBloom = hdBloomCanvasRef.current;
      if (hdBloom.width !== hdCanvas.width || hdBloom.height !== hdCanvas.height) {
        hdBloom.width = hdCanvas.width;
        hdBloom.height = hdCanvas.height;
      }
      const hbCtx = hdBloom.getContext('2d');
      if (hbCtx) {
        hbCtx.clearRect(0, 0, hdBloom.width, hdBloom.height);
        hbCtx.save();
        hbCtx.translate(panHDX, panHDY);
        hbCtx.scale(hdEffectiveScale, hdEffectiveScale);
        hbCtx.lineCap = 'round';
        hbCtx.lineJoin = 'round';

        if (isFade) {
          const maxPts = s.hdPath.length;
          for (let i = 0; i < maxPts - 1; i++) {
            const factor = 1 - i / maxPts;
            hbCtx.beginPath();
            hbCtx.strokeStyle = `hsla(${(s.time * 60 + i * 2) % 360}, 100%, 65%, ${factor})`;
            hbCtx.lineWidth = Math.max((7 * factor) / hdEffectiveScale, 1.2 / hdEffectiveScale);
            hbCtx.moveTo(s.hdPath[i].x, s.hdPath[i].y);
            hbCtx.lineTo(s.hdPath[i + 1].x, s.hdPath[i + 1].y);
            hbCtx.stroke();
          }
        } else if (isInk) {
          hbCtx.strokeStyle = s.useCustomColors ? trailCol : c.trail;
          for (let i = 0; i < s.hdPath.length - 1; i++) {
            const p1 = s.hdPath[i];
            const p2 = s.hdPath[i + 1];
            const segWidth = (((p1.width ?? 6) + (p2.width ?? 6)) / 2) * 1.5;
            hbCtx.beginPath();
            hbCtx.lineWidth = segWidth / hdEffectiveScale;
            hbCtx.moveTo(p1.x, p1.y);
            hbCtx.lineTo(p2.x, p2.y);
            hbCtx.stroke();
          }
        } else {
          hbCtx.beginPath();
          hbCtx.strokeStyle = s.useCustomColors ? trailCol : (isNeon ? '#00f0ff' : c.trail);
          hbCtx.lineWidth = 7 / hdEffectiveScale;
          if (s.hdPath.length > 1) {
            hbCtx.moveTo(s.hdPath[0].x, s.hdPath[0].y);
            for (let i = 1; i < s.hdPath.length; i++) {
              hbCtx.lineTo(s.hdPath[i].x, s.hdPath[i].y);
            }
          }
          hbCtx.stroke();
        }
        hbCtx.restore();

        // Composicion de desenfoque gaussiano multicapa
        hdCtx.save();
        hdCtx.setTransform(1, 0, 0, 1, 0, 0);
        hdCtx.globalCompositeOperation = c.isDarkBase ? 'lighter' : 'multiply';
        hdCtx.filter = 'blur(28px)';
        hdCtx.drawImage(hdBloom, 0, 0);
        hdCtx.filter = 'blur(10px)';
        hdCtx.drawImage(hdBloom, 0, 0);
        hdCtx.filter = 'none';
        hdCtx.restore();
      }
    }

    // Capa de memoria estática (Sombra / Ghost trace) en exportación HD
    if (s.shadowMode && s.hdShadowPath.length > 1) {
      hdCtx.save();
      hdCtx.beginPath();
      hdCtx.lineCap = 'round';
      hdCtx.lineJoin = 'round';
      if (s.useCustomColors) {
        hdCtx.strokeStyle = hexToRgba(trailCol, 0.35);
        hdCtx.lineWidth = Math.max(4.2 / hdEffectiveScale, 1.2);
      } else if (isBurned) {
        hdCtx.strokeStyle = 'rgba(122, 62, 20, 0.45)';
        hdCtx.lineWidth = Math.max(4.5 / hdEffectiveScale, 1.2);
      } else {
        hdCtx.strokeStyle = c.isDarkBase
          ? 'rgba(148, 163, 184, 0.42)'
          : 'rgba(99, 102, 241, 0.32)';
        hdCtx.lineWidth = Math.max(4.2 / hdEffectiveScale, 1.2);
      }
      hdCtx.shadowBlur = 0;
      if (s.hdShadowPath.length > 1) {
        hdCtx.moveTo(s.hdShadowPath[0].x, s.hdShadowPath[0].y);
        for (let i = 1; i < s.hdShadowPath.length; i++) {
          hdCtx.lineTo(s.hdShadowPath[i].x, s.hdShadowPath[i].y);
        }
      }
      hdCtx.stroke();
      hdCtx.restore();
    }

    // Trayectoria continua HD con unión vectorial suave
    if (s.useCustomColors) {
      hdCtx.save();
      hdCtx.beginPath();
      hdCtx.lineCap = 'round';
      hdCtx.lineJoin = 'round';
      if (isBurned) {
        hdCtx.strokeStyle = trailCol;
        hdCtx.shadowBlur = 22;
        hdCtx.shadowColor = trailCol;
        hdCtx.lineWidth = 7.5 / hdEffectiveScale;
      } else if (isNeon) {
        hdCtx.shadowBlur = 26;
        hdCtx.shadowColor = trailCol;
        hdCtx.strokeStyle = trailCol;
        hdCtx.lineWidth = 5.6 / hdEffectiveScale;
      } else {
        hdCtx.shadowBlur = 0;
        hdCtx.strokeStyle = trailCol;
        hdCtx.lineWidth = 5.0 / hdEffectiveScale;
      }
      if (s.hdPath.length > 1) {
        hdCtx.moveTo(s.hdPath[0].x, s.hdPath[0].y);
        for (let i = 1; i < s.hdPath.length; i++) {
          hdCtx.lineTo(s.hdPath[i].x, s.hdPath[i].y);
        }
      }
      hdCtx.stroke();
      hdCtx.restore();
    } else if (isBurned) {
      // Efecto Pirograbado HD: Capa 1 halo térmico ámbar tostado continuo
      hdCtx.save();
      hdCtx.beginPath();
      hdCtx.strokeStyle = 'rgba(140, 67, 10, 0.70)';
      hdCtx.shadowBlur = 28;
      hdCtx.shadowColor = 'rgba(160, 74, 14, 0.85)';
      hdCtx.lineWidth = 14.0 / hdEffectiveScale;
      hdCtx.lineCap = 'round';
      hdCtx.lineJoin = 'round';
      if (s.hdPath.length > 1) {
        hdCtx.moveTo(s.hdPath[0].x, s.hdPath[0].y);
        for (let i = 1; i < s.hdPath.length; i++) {
          hdCtx.lineTo(s.hdPath[i].x, s.hdPath[i].y);
        }
      }
      hdCtx.stroke();

      // Capa 2: Surco profundo carbón chamuscado continuo
      hdCtx.beginPath();
      hdCtx.shadowBlur = 0;
      hdCtx.strokeStyle = '#2b1708';
      hdCtx.lineWidth = 5.6 / hdEffectiveScale;
      hdCtx.lineCap = 'round';
      hdCtx.lineJoin = 'round';
      if (s.hdPath.length > 1) {
        hdCtx.moveTo(s.hdPath[0].x, s.hdPath[0].y);
        for (let i = 1; i < s.hdPath.length; i++) {
          hdCtx.lineTo(s.hdPath[i].x, s.hdPath[i].y);
        }
      }
      hdCtx.stroke();
      hdCtx.restore();
    } else if (isFade) {
      const maxPts = s.hdPath.length;
      for (let i = 0; i < maxPts - 1; i++) {
        const factor = 1 - i / maxPts;
        hdCtx.beginPath();
        hdCtx.strokeStyle = `hsla(${(s.time * 60 + i * 2) % 360}, 100%, 60%, ${factor * 0.95})`;
        hdCtx.lineWidth = Math.max((5.5 * factor) / hdEffectiveScale, 0.8 / hdEffectiveScale);
        hdCtx.lineCap = 'round';
        hdCtx.lineJoin = 'round';
        hdCtx.moveTo(s.hdPath[i].x, s.hdPath[i].y);
        hdCtx.lineTo(s.hdPath[i + 1].x, s.hdPath[i + 1].y);
        hdCtx.stroke();
      }
    } else if (isInk) {
      const inkColor = c.isDarkBase ? '#f8fafc' : '#0f172a';
      hdCtx.strokeStyle = inkColor;
      hdCtx.lineCap = 'round';
      hdCtx.lineJoin = 'round';
      hdCtx.shadowBlur = 0;
      for (let i = 0; i < s.hdPath.length - 1; i++) {
        const p1 = s.hdPath[i];
        const p2 = s.hdPath[i + 1];
        const segWidth = ((p1.width ?? 6) + (p2.width ?? 6)) / 2;
        hdCtx.beginPath();
        hdCtx.lineWidth = (segWidth * 1.35) / hdEffectiveScale;
        hdCtx.moveTo(p1.x, p1.y);
        hdCtx.lineTo(p2.x, p2.y);
        hdCtx.stroke();
      }
    } else {
      hdCtx.beginPath();
      hdCtx.lineCap = 'round';
      hdCtx.lineJoin = 'round';
      if (s.shadowMode && s.hdShadowPath.length > 1) {
        hdCtx.shadowBlur = 24;
        hdCtx.shadowColor = c.isDarkBase ? '#00f5ff' : '#0284c7';
        hdCtx.strokeStyle = c.isDarkBase ? '#38bdf8' : '#0284c7';
        hdCtx.lineWidth = 6.0 / hdEffectiveScale;
      } else if (isNeon) {
        hdCtx.shadowBlur = 22;
        hdCtx.shadowColor = c.isDarkBase ? '#00f0ff' : '#0284c7';
        hdCtx.strokeStyle = c.isDarkBase ? '#38bdf8' : '#0284c7';
        hdCtx.lineWidth = 5.6 / hdEffectiveScale;
      } else {
        hdCtx.shadowBlur = 0;
        hdCtx.strokeStyle = c.trail;
        hdCtx.lineWidth = 5.0 / hdEffectiveScale;
      }
      if (s.hdPath.length > 1) {
        hdCtx.moveTo(s.hdPath[0].x, s.hdPath[0].y);
        for (let i = 1; i < s.hdPath.length; i++) {
          hdCtx.lineTo(s.hdPath[i].x, s.hdPath[i].y);
        }
      }
      hdCtx.stroke();
    }

    hdCtx.restore();

    if (isBurned) {
      drawBurnedOverlayMaskHD(hdCtx, hdCanvas.width, hdCanvas.height);
    }
  };

  // Start Sync Recording for 1 Complete Cycle (t from 0 to 2*PI)
  const startRecordingCycle = useCallback(() => {
    const s = stateRef.current;
    if (s.isRecordingWallpaper) return;

    const hdCanvas = hdCanvasRef.current;
    if (!hdCanvas) return;

    // Apply chosen resolution
    if (exportAspect === '9:16') {
      hdCanvas.width = 1080;
      hdCanvas.height = 1920;
    } else if (exportAspect === '16:9') {
      hdCanvas.width = 1920;
      hdCanvas.height = 1080;
    } else {
      // 1:1
      hdCanvas.width = 1080;
      hdCanvas.height = 1080;
    }

    if (!('captureStream' in hdCanvas) || !window.MediaRecorder) {
      alert('Tu navegador no soporta la grabación directa de video por stream.');
      return;
    }

    const stream = (hdCanvas as HTMLCanvasElement).captureStream(60);
    const codecs = [
      'video/mp4;codecs=avc1.640028',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp09.00.10.08',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp8',
      'video/webm',
    ];

    let mime = '';
    for (const cd of codecs) {
      if (MediaRecorder.isTypeSupported(cd)) {
        mime = cd;
        break;
      }
    }

    const recorderOptions: MediaRecorderOptions = {
      videoBitsPerSecond: 18000000, // 18 Mbps para nitidez absoluta sin artefactos de compresión
    };
    if (mime) {
      recorderOptions.mimeType = mime;
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, recorderOptions);
    } catch {
      try {
        recorder = new MediaRecorder(stream, { videoBitsPerSecond: 18000000 });
      } catch {
        recorder = new MediaRecorder(stream);
      }
    }

    s.recordedChunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) s.recordedChunks.push(e.data);
    };

    recorder.onstop = () => {
      const isMp4 = (recorder.mimeType || '').includes('mp4');
      const ext = isMp4 ? 'mp4' : 'webm';
      const blob = new Blob(s.recordedChunks, {
        type: recorder.mimeType || 'video/mp4',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const themeLabel = s.currentTheme || (s.isDark ? 'oscuro' : 'claro');
      const aspectLabel = exportAspect.replace(':', 'x');
      a.download = `fourier_${aspectLabel}_${s.currentShapeKey}_${s.visualFX}_${themeLabel}.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      s.isRecordingWallpaper = false;
      s.exportFraming = null;
      setIsRecording(false);
      setRecordProgress(0);
      setExportModalOpen(false);
      alert(`¡Video HD (${exportAspect}) descargado con sincronización de bucle perfecta!`);
    };

    // Sincronización idéntica y estricta de armónicos y estado matemático de pantalla
    s.maxCircles = maxCircles;
    const canvas = canvasRef.current;
    const scrW = canvas ? canvas.width : 400;
    const scrH = canvas ? canvas.height : 400;

    // Cantidad uniforme de fotogramas del bucle según complejidad (720 a 1,200 fotogramas)
    // para integración temporal suave y eliminación total del facetado poligonal
    const recFrames = Math.max(720, Math.min(1200, s.maxCircles >= 60 ? 1200 : 720));
    s.recTotalFrames = recFrames;
    s.prevRecordTime = 0;

    if (!s.isTracking) {
      // Caso A: Modo Vista General / Centrado Completo
      // Calcula la caja delimitadora que abarca la trayectoria y la amplitud máxima de los círculos
      // con margen de seguridad del 12% y centra el punto medio exactamente en (hdCanvas.width/2, hdCanvas.height/2)
      const smartFraming = computeSmartExportFraming(
        s.fourierFiltered,
        s.maxCircles,
        hdCanvas.width,
        hdCanvas.height,
        0.12
      );
      s.exportFraming = {
        isTracking: false,
        scale: smartFraming.scale,
        panX: smartFraming.panX,
        panY: smartFraming.panY,
        bounds: smartFraming.bounds,
      };
    } else {
      // Caso B: Seguimiento ACTIVADO (Modo Macro / Zoom de Usuario)
      // Transfiere el zoom del usuario (`scale`) escalando proporcionalmente al lienzo HD
      const hdScaleFactor = Math.min(hdCanvas.width, hdCanvas.height) / Math.min(scrW, scrH);
      s.exportFraming = {
        isTracking: true,
        scale: s.scale * hdScaleFactor,
        panX: hdCanvas.width / 2,
        panY: hdCanvas.height / 2,
      };
    }

    // Modo Sombra: Pre-calcular la huella fantasma completa si está activado
    // con alta densidad angular para reproducir fielmente curvas complejas desde el inicio
    if (s.shadowMode && s.fourierFiltered.length > 0) {
      const ghostPts: Point[] = [];
      const total = Math.min(s.fourierFiltered.length, s.maxCircles);
      const ghostSteps = Math.max(720, Math.min(1800, total * 2));
      for (let st = 0; st <= ghostSteps; st++) {
        const tVal = (st * 2 * Math.PI) / ghostSteps;
        let px = 0;
        let py = 0;
        for (let k = 0; k < total; k++) {
          const a = s.fourierFiltered[k].freq * tVal + s.fourierFiltered[k].phase;
          px += s.fourierFiltered[k].amp * Math.cos(a);
          py += s.fourierFiltered[k].amp * Math.sin(a);
        }
        ghostPts.push({ x: px, y: py });
      }
      s.hdShadowPath = ghostPts;
      if (s.shadowPath.length === 0) {
        s.shadowPath = ghostPts;
      }
    }

    // Reset exactly to t = 0 for perfect loop
    s.time = 0;
    s.prevRecordTime = 0;
    s.path = [];
    s.hdPath = [];
    s.isRecordingWallpaper = true;
    s.mediaRecorder = recorder;
    setIsRecording(true);
    setRecordProgress(0);

    recorder.start();
  }, [exportAspect, maxCircles]);

  const getCoords = (
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const touchEvt = 'touches' in e ? e.touches[0] : null;
    const clientX = touchEvt ? touchEvt.clientX : (e as MouseEvent).clientX;
    const clientY = touchEvt ? touchEvt.clientY : (e as MouseEvent).clientY;
    const s = stateRef.current;
    return {
      x: (clientX - r.left - s.panX) / s.scale,
      y: (clientY - r.top - s.panY) / s.scale,
    };
  };

  const handleAssistedClick = (p: Point) => {
    const s = stateRef.current;
    if (s.drawMode === 'poly') {
      const lastAnchor = s.anchorPoints[s.anchorPoints.length - 1];
      const snap = applySnapAngle(lastAnchor, p);
      s.anchorPoints.push(snap.point);
    } else if (s.drawMode === 'curve') {
      if (s.curveStage === 0) {
        s.curveP1 = p;
        s.curveStage = 1;
      } else if (s.curveStage === 1) {
        s.curveP2 = p;
        s.curveStage = 2;
      } else if (s.curveStage === 2) {
        if (s.curveP1 && s.curveP2) {
          const segment = sampleBezier(s.curveP1, p, s.curveP2, 25);
          s.rawPoints.push(...segment);
          s.curveP1 = s.curveP2;
          s.curveP2 = null;
          s.curveStage = 1;
        }
      }
    } else if (s.drawMode === 'mixed') {
      if (!s.mixedCurrentStart && s.rawPoints.length === 0) {
        s.mixedCurrentStart = p;
        s.rawPoints.push(p);
        return;
      }

      const startPt =
        s.mixedCurrentStart || s.rawPoints[s.rawPoints.length - 1];

      if (s.mixedType === 'line') {
        const snap = applySnapAngle(startPt, p);
        const segment = sampleSegment(startPt, snap.point, 18);
        s.rawPoints.push(...segment);
        s.mixedCurrentStart = snap.point;
      } else if (s.mixedType === 'curve') {
        if (s.curveStage === 0) {
          s.curveP2 = p;
          s.curveStage = 1;
        } else if (s.curveStage === 1) {
          if (s.curveP2) {
            const segment = sampleBezier(startPt, p, s.curveP2, 25);
            s.rawPoints.push(...segment);
            s.mixedCurrentStart = s.curveP2;
            s.curveP2 = null;
            s.curveStage = 0;
          }
        }
      }
    }
  };

  // Main canvas animation and Spectrogram drawing loop
  useEffect(() => {
    // Initialize silent PWA support on first load
    initPWA();

    // Setup HD canvas & bloom canvases
    const hd = document.createElement('canvas');
    hd.width = 1080;
    hd.height = 1920;
    hdCanvasRef.current = hd;

    const bloomCanvas = document.createElement('canvas');
    bloomCanvasRef.current = bloomCanvas;

    const hdBloom = document.createElement('canvas');
    hdBloomCanvasRef.current = hdBloom;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const prevW = canvas.width;
      const prevH = canvas.height;
      canvas.width = rect.width;
      canvas.height = rect.height;

      if (bloomCanvasRef.current) {
        bloomCanvasRef.current.width = canvas.width;
        bloomCanvasRef.current.height = canvas.height;
      }

      const s = stateRef.current;
      if (s.panX === 0 && s.panY === 0) {
        s.panX = canvas.width / 2;
        s.panY = canvas.height / 2;
      } else if (prevW > 0 && prevH > 0) {
        s.panX += (canvas.width - prevW) / 2;
        s.panY += (canvas.height - prevH) / 2;
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    recomputeSpeed();
    setShape('cuadrado');

    let animId: number;

    const animate = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const s = stateRef.current;

      // Update theme cross-fade transition progress (ease-out cubic)
      let transP = 1.0;
      if (s.themeTransitionProgress < 1.0 && s.fromThemeColors && s.toThemeColors) {
        const elapsed = performance.now() - s.themeTransitionStartTime;
        const rawP = Math.min(1.0, Math.max(0.0, elapsed / s.themeTransitionDuration));
        // Cubic ease-in-out curve for luxurious smooth fading
        transP = rawP < 0.5 ? 4 * rawP * rawP * rawP : 1 - Math.pow(-2 * rawP + 2, 3) / 2;
        s.themeTransitionProgress = rawP;
        if (rawP >= 1.0) {
          s.fromThemeColors = null;
          s.fromThemeKey = null;
        }
      }

      const c = pal[s.currentTheme] || pal.active;
      const isBurned = s.currentTheme === 'burned';
      const isNeon = s.visualFX === 'neon';
      const isFade = s.visualFX === 'fade';
      const isInk = s.visualFX === 'ink';

      // Compute base color values with smooth transition interpolation
      let bgCol = s.useCustomColors ? s.customBg : c.bg;
      let circleCol = s.useCustomColors ? s.customCircle : c.circle;
      let trailCol = s.useCustomColors ? s.customTrail : c.trail;

      if (!s.useCustomColors && s.fromThemeColors && s.toThemeColors && transP < 1.0) {
        bgCol = interpolateColor(s.fromThemeColors.bg, s.toThemeColors.bg, transP);
        circleCol = interpolateColor(s.fromThemeColors.circle, s.toThemeColors.circle, transP);
        trailCol = interpolateColor(s.fromThemeColors.trail, s.toThemeColors.trail, transP);
      }

      // 1. Smooth background cross-fade rendering
      if (!s.useCustomColors && s.fromThemeColors && transP < 1.0) {
        // We are transitioning between two themes
        const fromIsBurned = s.fromThemeKey === 'burned';
        const toIsBurned = s.toThemeKey === 'burned';

        if (fromIsBurned && !toIsBurned) {
          // Cross-fading FROM burned paper TO standard color
          ctx.fillStyle = s.toThemeColors?.bg || c.bg;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.globalAlpha = 1.0 - transP;
          drawBurnedBackground(ctx, canvas.width, canvas.height);
          ctx.restore();
        } else if (!fromIsBurned && toIsBurned) {
          // Cross-fading FROM standard color TO burned paper
          ctx.fillStyle = s.fromThemeColors.bg;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.globalAlpha = transP;
          drawBurnedBackground(ctx, canvas.width, canvas.height);
          ctx.restore();
        } else {
          // Cross-fading between standard colors
          ctx.fillStyle = bgCol;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (isBurned && !s.useCustomColors) {
        drawBurnedBackground(ctx, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = bgCol;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (isBurned && s.useCustomColors) {
          drawBurnedOverlayMask(ctx, canvas.width, canvas.height);
        }
      }

      if (s.isTracking && s.fourierFiltered.length > 0) {
        s.panX = canvas.width / 2 - s.currentTipWorld.x * s.scale;
        s.panY = canvas.height / 2 - s.currentTipWorld.y * s.scale;
      }

      ctx.save();
      ctx.translate(s.panX, s.panY);
      ctx.scale(s.scale, s.scale);

      ctx.beginPath();
      ctx.strokeStyle = isBurned ? 'rgba(140, 67, 10, 0.14)' : c.axis;
      ctx.lineWidth = 1 / s.scale;
      ctx.moveTo(-100000, 0);
      ctx.lineTo(100000, 0);
      ctx.moveTo(0, -100000);
      ctx.lineTo(0, 100000);
      ctx.stroke();

      if (s.drawMode !== 'none') {
        if (s.drawMode === 'free') {
          if (s.rawPoints.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = c.draft;
            ctx.lineWidth = 2.5 / s.scale;
            ctx.moveTo(s.rawPoints[0].x, s.rawPoints[0].y);
            for (let i = 1; i < s.rawPoints.length; i++) {
              ctx.lineTo(s.rawPoints[i].x, s.rawPoints[i].y);
            }
            ctx.stroke();
          }
        } else if (s.drawMode === 'poly') {
          if (s.anchorPoints.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = c.draft;
            ctx.lineWidth = 2.5 / s.scale;
            ctx.moveTo(s.anchorPoints[0].x, s.anchorPoints[0].y);
            for (let i = 1; i < s.anchorPoints.length; i++) {
              ctx.lineTo(s.anchorPoints[i].x, s.anchorPoints[i].y);
            }

            const lastAnchor = s.anchorPoints[s.anchorPoints.length - 1];
            const snap = applySnapAngle(lastAnchor, s.currentMouseWorld);
            const target = snap.point;
            ctx.lineTo(target.x, target.y);
            ctx.stroke();

            for (const p of s.anchorPoints) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4 / s.scale, 0, Math.PI * 2);
              ctx.fillStyle = c.draft;
              ctx.fill();
            }

            if (snap.snapped) {
              ctx.beginPath();
              ctx.arc(target.x, target.y, 6 / s.scale, 0, Math.PI * 2);
              ctx.strokeStyle = c.snapGuide;
              ctx.lineWidth = 2 / s.scale;
              ctx.stroke();

              ctx.font = `${Math.max(11 / s.scale, 3)}px sans-serif`;
              ctx.fillStyle = c.snapGuide;
              ctx.fillText(
                `${snap.angleDeg}°`,
                target.x + 8 / s.scale,
                target.y - 8 / s.scale
              );
            }
          }
        } else if (s.drawMode === 'curve') {
          if (s.rawPoints.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = c.draft;
            ctx.lineWidth = 2.5 / s.scale;
            ctx.moveTo(s.rawPoints[0].x, s.rawPoints[0].y);
            for (let i = 1; i < s.rawPoints.length; i++) {
              ctx.lineTo(s.rawPoints[i].x, s.rawPoints[i].y);
            }
            ctx.stroke();
          }

          if (s.curveStage === 1 && s.curveP1) {
            ctx.beginPath();
            ctx.strokeStyle = c.draft;
            ctx.lineWidth = 1.5 / s.scale;
            ctx.setLineDash([4 / s.scale, 4 / s.scale]);
            ctx.moveTo(s.curveP1.x, s.curveP1.y);
            ctx.lineTo(s.currentMouseWorld.x, s.currentMouseWorld.y);
            ctx.stroke();
            ctx.setLineDash([]);
          } else if (s.curveStage === 2 && s.curveP1 && s.curveP2) {
            const previewCurve = sampleBezier(
              s.curveP1,
              s.currentMouseWorld,
              s.curveP2,
              20
            );
            ctx.beginPath();
            ctx.strokeStyle = c.snapGuide;
            ctx.lineWidth = 2.5 / s.scale;
            ctx.moveTo(previewCurve[0].x, previewCurve[0].y);
            for (const p of previewCurve) ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        } else if (s.drawMode === 'mixed') {
          if (s.rawPoints.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = c.draft;
            ctx.lineWidth = 2.5 / s.scale;
            ctx.moveTo(s.rawPoints[0].x, s.rawPoints[0].y);
            for (let i = 1; i < s.rawPoints.length; i++) {
              ctx.lineTo(s.rawPoints[i].x, s.rawPoints[i].y);
            }
            ctx.stroke();
          }

          const origin =
            s.mixedCurrentStart ||
            (s.rawPoints.length > 0
              ? s.rawPoints[s.rawPoints.length - 1]
              : null);

          if (origin) {
            if (s.mixedType === 'line') {
              const snap = applySnapAngle(origin, s.currentMouseWorld);
              const target = snap.point;
              ctx.beginPath();
              ctx.strokeStyle = c.draft;
              ctx.lineWidth = 2 / s.scale;
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();

              if (snap.snapped) {
                ctx.beginPath();
                ctx.arc(target.x, target.y, 6 / s.scale, 0, Math.PI * 2);
                ctx.strokeStyle = c.snapGuide;
                ctx.lineWidth = 2 / s.scale;
                ctx.stroke();

                ctx.font = `${Math.max(11 / s.scale, 3)}px sans-serif`;
                ctx.fillStyle = c.snapGuide;
                ctx.fillText(
                  `${snap.angleDeg}°`,
                  target.x + 8 / s.scale,
                  target.y - 8 / s.scale
                );
              }
            } else if (s.mixedType === 'curve') {
              if (s.curveStage === 1 && s.curveP2) {
                const previewCurve = sampleBezier(
                  origin,
                  s.currentMouseWorld,
                  s.curveP2,
                  20
                );
                ctx.beginPath();
                ctx.strokeStyle = c.snapGuide;
                ctx.lineWidth = 2.5 / s.scale;
                ctx.moveTo(previewCurve[0].x, previewCurve[0].y);
                for (const p of previewCurve) ctx.lineTo(p.x, p.y);
                ctx.stroke();
              } else {
                ctx.beginPath();
                ctx.strokeStyle = c.draft;
                ctx.lineWidth = 1.5 / s.scale;
                ctx.setLineDash([4 / s.scale, 4 / s.scale]);
                ctx.moveTo(origin.x, origin.y);
                ctx.lineTo(s.currentMouseWorld.x, s.currentMouseWorld.y);
                ctx.stroke();
                ctx.setLineDash([]);
              }
            }
          }
        }
      } else if (s.fourierFiltered.length > 0) {
        let x = 0;
        let y = 0;
        let vx = 0;
        let vy = 0;
        let vRefSum = 0;
        const total = Math.min(s.fourierFiltered.length, s.maxCircles);

        for (let i = 0; i < total; i++) {
          const prevx = x;
          const prevy = y;
          const freq = s.fourierFiltered[i].freq;
          const radius = s.fourierFiltered[i].amp;
          const phase = s.fourierFiltered[i].phase;
          const angle = freq * s.time + phase;

          x += radius * Math.cos(angle);
          y += radius * Math.sin(angle);

          vx += -freq * radius * Math.sin(angle);
          vy += freq * radius * Math.cos(angle);
          vRefSum += Math.abs(freq) * radius;

          // Círculo armónico
          ctx.beginPath();
          ctx.arc(prevx, prevy, radius, 0, Math.PI * 2);
          if (s.useCustomColors) {
            ctx.shadowBlur = isNeon ? 16 : 0;
            if (isNeon) ctx.shadowColor = circleCol;
            ctx.strokeStyle = circleCol;
            ctx.lineWidth = Math.max((isNeon ? 0.8 : isInk ? 0.4 : 0.6) / s.scale, 0.0001);
          } else if (!s.useCustomColors && s.fromThemeColors && transP < 1.0) {
            ctx.shadowBlur = isNeon ? 16 * transP : 0;
            ctx.strokeStyle = circleCol;
            ctx.lineWidth = Math.max(0.6 / s.scale, 0.0001);
          } else if (isBurned) {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(120, 80, 40, 0.18)';
            ctx.lineWidth = Math.max(0.9 / s.scale, 0.0001);
          } else if (isNeon) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = c.isDarkBase ? '#00f0ff' : '#0284c7';
            ctx.strokeStyle = c.isDarkBase ? '#38bdf8' : '#0284c7';
            ctx.lineWidth = Math.max(0.6 / s.scale, 0.0001);
          } else if (isInk) {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = c.isDarkBase ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.14)';
            ctx.lineWidth = Math.max(0.4 / s.scale, 0.0001);
          } else {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = circleCol;
            ctx.lineWidth = Math.max(0.6 / s.scale, 0.0001);
          }
          ctx.stroke();

          // Radio
          ctx.beginPath();
          ctx.moveTo(prevx, prevy);
          ctx.lineTo(x, y);
          if (s.useCustomColors) {
            ctx.strokeStyle = circleCol;
            ctx.lineWidth = Math.max(0.8 / s.scale, 0.0001);
          } else if (!s.useCustomColors && s.fromThemeColors && transP < 1.0) {
            ctx.strokeStyle = circleCol;
            ctx.lineWidth = Math.max(0.8 / s.scale, 0.0001);
          } else if (isBurned) {
            ctx.strokeStyle = 'rgba(140, 67, 10, 0.32)';
            ctx.lineWidth = Math.max(1.1 / s.scale, 0.0001);
          } else {
            ctx.strokeStyle = isNeon ? '#38bdf8' : isInk ? (c.isDarkBase ? 'rgba(255, 255, 255, 0.24)' : 'rgba(15, 23, 42, 0.22)') : c.radius;
            ctx.lineWidth = Math.max((isInk ? 0.5 : 0.8) / s.scale, 0.0001);
          }
          ctx.stroke();

          // Pivote
          ctx.beginPath();
          ctx.arc(prevx, prevy, (isBurned ? 2.5 : 2.0) / s.scale, 0, Math.PI * 2);
          if (s.useCustomColors) {
            ctx.fillStyle = circleCol;
          } else if (!s.useCustomColors && s.fromThemeColors && transP < 1.0) {
            ctx.fillStyle = circleCol;
          } else if (isBurned) {
            ctx.fillStyle = 'rgba(140, 67, 10, 0.45)';
          } else if (isNeon) {
            ctx.fillStyle = '#ffffff';
          } else if (isInk) {
            ctx.fillStyle = c.isDarkBase ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.3)';
          } else {
            ctx.fillStyle = c.dot;
          }
          ctx.fill();
        }

        s.currentTipWorld = { x, y };

        // Calligraphic ink width based on pointer velocity
        const speedMag = Math.hypot(vx, vy);
        const v0 = Math.max(vRefSum / Math.max(total, 1), 12);
        // Calligraphic stroke: slow movements/vertices -> thick ink deposit (8.5px), fast movement -> fine stroke (1.6px)
        const inkWidth = 1.6 + 6.8 / (1 + Math.pow(speedMag / v0, 1.3));

        if (s.speed > 0 || s.path.length === 0) {
          s.path.unshift({ x, y, width: inkWidth });
        }

        // Trazador final
        if (s.useCustomColors) {
          ctx.save();
          ctx.beginPath();
          const tracerRadius = isNeon ? 6.5 : isInk ? (inkWidth * 0.75) : 5.0;
          ctx.arc(x, y, tracerRadius / s.scale, 0, Math.PI * 2);
          ctx.shadowBlur = isNeon || isBurned ? 20 : 6;
          ctx.shadowColor = trailCol;
          ctx.fillStyle = trailCol;
          ctx.fill();
          ctx.restore();
        } else if (isBurned) {
          ctx.save();
          // Halo exterior brasa ardiente incandescente
          ctx.beginPath();
          ctx.arc(x, y, 6.0 / s.scale, 0, Math.PI * 2);
          ctx.shadowBlur = 24;
          ctx.shadowColor = '#ff3b00';
          ctx.fillStyle = '#ff6200';
          ctx.fill();

          // Núcleo incandescente de calor
          ctx.beginPath();
          ctx.arc(x, y, 3.2 / s.scale, 0, Math.PI * 2);
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffe600';
          ctx.fillStyle = '#fff9d6';
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          const tracerRadius = isNeon ? 6.5 : isInk ? (inkWidth * 0.75) : 4.5;
          ctx.arc(x, y, tracerRadius / s.scale, 0, Math.PI * 2);
          if (isNeon) {
            ctx.shadowBlur = 24;
            ctx.shadowColor = '#ff0055';
            ctx.fillStyle = '#ffffff';
          } else if (isInk) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = c.isDarkBase ? '#f8fafc' : '#0f172a';
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = c.tracer;
          }
          ctx.fill();
        }

        // Capa de brillo Bloom gaussiano sobre canvas de estela persistente (excepto en papel quemado)
        if (s.bloomEnabled && bloomCanvasRef.current && s.path.length > 1 && !isBurned) {
          const bCanvas = bloomCanvasRef.current;
          if (bCanvas.width !== canvas.width || bCanvas.height !== canvas.height) {
            bCanvas.width = canvas.width;
            bCanvas.height = canvas.height;
          }
          const bCtx = bCanvas.getContext('2d');
          if (bCtx) {
            bCtx.clearRect(0, 0, bCanvas.width, bCanvas.height);
            bCtx.save();
            bCtx.translate(s.panX, s.panY);
            bCtx.scale(s.scale, s.scale);
            bCtx.lineCap = 'round';
            bCtx.lineJoin = 'round';

            if (isFade) {
              const maxPts = s.path.length;
              for (let i = 0; i < maxPts - 1; i++) {
                const factor = 1 - i / maxPts;
                bCtx.beginPath();
                bCtx.strokeStyle = `hsla(${(s.time * 60 + i * 2) % 360}, 100%, 65%, ${factor})`;
                bCtx.lineWidth = Math.max((4.5 * factor) / s.scale, 0.8 / s.scale);
                bCtx.moveTo(s.path[i].x, s.path[i].y);
                bCtx.lineTo(s.path[i + 1].x, s.path[i + 1].y);
                bCtx.stroke();
              }
            } else if (isInk) {
              bCtx.strokeStyle = s.useCustomColors ? trailCol : c.trail;
              for (let i = 0; i < s.path.length - 1; i++) {
                const p1 = s.path[i];
                const p2 = s.path[i + 1];
                const segWidth = (((p1.width ?? 3.5) + (p2.width ?? 3.5)) / 2) * 1.5;
                bCtx.beginPath();
                bCtx.lineWidth = segWidth / s.scale;
                bCtx.moveTo(p1.x, p1.y);
                bCtx.lineTo(p2.x, p2.y);
                bCtx.stroke();
              }
            } else {
              bCtx.beginPath();
              bCtx.strokeStyle = s.useCustomColors ? trailCol : (isNeon ? '#00f0ff' : c.trail);
              bCtx.lineWidth = 4 / s.scale;
              for (let i = 0; i < s.path.length - 1; i++) {
                bCtx.moveTo(s.path[i].x, s.path[i].y);
                bCtx.lineTo(s.path[i + 1].x, s.path[i + 1].y);
              }
              bCtx.stroke();
            }
            bCtx.restore();

            // Composicion de desenfoque gaussiano multicapa sobre el lienzo principal
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = c.isDarkBase ? 'lighter' : 'multiply';
            // Halo gaussiano amplio
            ctx.filter = 'blur(16px)';
            ctx.drawImage(bCanvas, 0, 0);
            // Nucleo brillante mas concentrado
            ctx.filter = 'blur(6px)';
            ctx.drawImage(bCanvas, 0, 0);
            ctx.filter = 'none';
            ctx.restore();
          }
        }

        // Capa estática de memoria / Modo Sombra (Ghost trace)
        if (s.shadowMode && s.shadowPath.length > 1) {
          ctx.save();
          ctx.beginPath();
          if (s.useCustomColors) {
            ctx.strokeStyle = hexToRgba(trailCol, 0.35);
            ctx.lineWidth = Math.max(2.0 / s.scale, 0.5);
          } else if (isBurned) {
            // En modo papel quemado: marca tostada previa fija
            ctx.strokeStyle = 'rgba(122, 62, 20, 0.45)';
            ctx.lineWidth = Math.max(2.4 / s.scale, 0.6);
          } else {
            ctx.strokeStyle = c.isDarkBase
              ? 'rgba(148, 163, 184, 0.35)'
              : 'rgba(99, 102, 241, 0.28)';
            ctx.lineWidth = Math.max(1.8 / s.scale, 0.5);
          }
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 0;
          if (s.shadowPath.length > 1) {
            ctx.moveTo(s.shadowPath[0].x, s.shadowPath[0].y);
            for (let i = 1; i < s.shadowPath.length; i++) {
              ctx.lineTo(s.shadowPath[i].x, s.shadowPath[i].y);
            }
          }
          ctx.stroke();
          ctx.restore();
        }

        // Trayectoria continua
        if (s.useCustomColors) {
          ctx.save();
          ctx.beginPath();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (isBurned) {
            ctx.strokeStyle = trailCol;
            ctx.shadowBlur = 12;
            ctx.shadowColor = trailCol;
            ctx.lineWidth = 4.2 / s.scale;
          } else if (isNeon) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = trailCol;
            ctx.strokeStyle = trailCol;
            ctx.lineWidth = 2.8 / s.scale;
          } else {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = trailCol;
            ctx.lineWidth = 2.5 / s.scale;
          }
          if (s.path.length > 1) {
            ctx.moveTo(s.path[0].x, s.path[0].y);
            for (let i = 1; i < s.path.length; i++) {
              ctx.lineTo(s.path[i].x, s.path[i].y);
            }
          }
          ctx.stroke();
          ctx.restore();
        } else if (isBurned) {
          // Efecto pirograbado térmico sobre papel/madera
          // Capa 1: Halo perimetral tostado ámbar con relieve térmico
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(140, 67, 10, 0.65)';
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(160, 74, 14, 0.75)';
          ctx.lineWidth = 5.2 / s.scale;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (s.path.length > 1) {
            ctx.moveTo(s.path[0].x, s.path[0].y);
            for (let i = 1; i < s.path.length; i++) {
              ctx.lineTo(s.path[i].x, s.path[i].y);
            }
          }
          ctx.stroke();

          // Capa 2: Surco interior carbón profundo / madera chamuscada
          ctx.beginPath();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#2b1708';
          ctx.lineWidth = 2.6 / s.scale;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (s.path.length > 1) {
            ctx.moveTo(s.path[0].x, s.path[0].y);
            for (let i = 1; i < s.path.length; i++) {
              ctx.lineTo(s.path[i].x, s.path[i].y);
            }
          }
          ctx.stroke();
          ctx.restore();
        } else if (isFade) {
          const maxPts = s.path.length;
          for (let i = 0; i < maxPts - 1; i++) {
            const factor = 1 - i / maxPts;
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${(s.time * 60 + i * 2) % 360}, 100%, 60%, ${factor * 0.95})`;
            ctx.lineWidth = Math.max((2.5 * factor) / s.scale, 0.4 / s.scale);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(s.path[i].x, s.path[i].y);
            ctx.lineTo(s.path[i + 1].x, s.path[i + 1].y);
            ctx.stroke();
          }
        } else if (isInk) {
          // Calligraphic Ink trail with variable thickness
          const inkColor = c.isDarkBase ? '#f8fafc' : '#0f172a';
          ctx.strokeStyle = inkColor;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 0;
          for (let i = 0; i < s.path.length - 1; i++) {
            const p1 = s.path[i];
            const p2 = s.path[i + 1];
            const segWidth = ((p1.width ?? 3.5) + (p2.width ?? 3.5)) / 2;
            ctx.beginPath();
            ctx.lineWidth = segWidth / s.scale;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (s.shadowMode && s.shadowPath.length > 1) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = c.isDarkBase ? '#00f5ff' : '#0284c7';
            ctx.strokeStyle = c.isDarkBase ? '#38bdf8' : '#0284c7';
            ctx.lineWidth = 3.6 / s.scale;
          } else if (isNeon) {
            ctx.shadowBlur = 16;
            ctx.shadowColor = c.isDarkBase ? '#00f0ff' : '#0284c7';
            ctx.strokeStyle = c.isDarkBase ? '#38bdf8' : '#0284c7';
            ctx.lineWidth = 2.5 / s.scale;
          } else {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = trailCol;
            ctx.lineWidth = 2.5 / s.scale;
          }
          if (s.path.length > 1) {
            ctx.moveTo(s.path[0].x, s.path[0].y);
            for (let i = 1; i < s.path.length; i++) {
              ctx.lineTo(s.path[i].x, s.path[i].y);
            }
          }
          ctx.stroke();
        }

        // HD rendering if export in progress
        if (s.isRecordingWallpaper) {
          renderHDFrame(c);
        }

        if (s.speed > 0 || s.isRecordingWallpaper) {
          // Tasa de avance angular uniforme sincronizada con los fotogramas del video (720 a 1,200 fotogramas)
          const totalFrames = s.recTotalFrames || 1200;
          const dt = s.isRecordingWallpaper
            ? (2 * Math.PI) / totalFrames
            : ((2 * Math.PI) / 300) * s.speed;
          s.time += dt;

          if (s.isRecordingWallpaper) {
            const progress = Math.min(Math.floor((s.time / (2 * Math.PI)) * 100), 100);
            setRecordProgress(progress);
          }

          if (s.time >= 2 * Math.PI) {
            if (
              s.isRecordingWallpaper &&
              s.mediaRecorder &&
              s.mediaRecorder.state === 'recording'
            ) {
              s.time = 2 * Math.PI;
              renderHDFrame(c);
              s.mediaRecorder.stop();
            }
            if (s.shadowMode) {
              s.lapCount = (s.lapCount || 0) + 1;
              if (s.shadowPath.length === 0 || s.path.length > s.shadowPath.length * 0.75) {
                s.shadowPath = [...s.path];
              }
              if (s.isRecordingWallpaper && (s.hdShadowPath.length === 0 || s.hdPath.length > s.hdShadowPath.length * 0.75)) {
                s.hdShadowPath = [...s.hdPath];
              }
            }
            s.time = 0;
            s.path = [];
            s.hdPath = [];
          }
        }
      }

      ctx.restore();

      if (!s.useCustomColors && s.fromThemeColors && transP < 1.0) {
        const fromIsBurned = s.fromThemeKey === 'burned';
        const toIsBurned = s.toThemeKey === 'burned';
        if (fromIsBurned && !toIsBurned) {
          drawBurnedOverlayMask(ctx, canvas.width, canvas.height, 0.35 * (1.0 - transP));
        } else if (!fromIsBurned && toIsBurned) {
          drawBurnedOverlayMask(ctx, canvas.width, canvas.height, 0.35 * transP);
        } else if (toIsBurned) {
          drawBurnedOverlayMask(ctx, canvas.width, canvas.height, 0.35);
        }
      } else if (isBurned) {
        drawBurnedOverlayMask(ctx, canvas.width, canvas.height, 0.35);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    // Native wheel handling
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      const r = canvas.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      const newScale = Math.min(Math.max(s.scale * factor, 0.05), 1000);

      if (s.isTracking) {
        s.scale = newScale;
        s.panX = canvas.width / 2 - s.currentTipWorld.x * s.scale;
        s.panY = canvas.height / 2 - s.currentTipWorld.y * s.scale;
      } else {
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        s.panX = mx - (mx - s.panX) * (newScale / s.scale);
        s.panY = my - (my - s.panY) * (newScale / s.scale);
        s.scale = newScale;
      }
      recomputeSpeed();
    };

    // Touch and mouse listeners
    const onTouchStart = (e: TouchEvent) => {
      const s = stateRef.current;
      const now = Date.now();
      if (e.touches.length === 1 && now - s.lastTapTime < 300) {
        if (s.drawMode === 'none') {
          toggleImmersiveMode();
          s.lastTapTime = 0;
          return;
        }
      }
      s.lastTapTime = now;

      if (e.touches.length === 2) {
        s.initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        return;
      }

      const p = getCoords(e);
      s.currentMouseWorld = p;

      if (s.drawMode === 'free') {
        s.isFreeDrawing = true;
        s.rawPoints = [p];
      } else if (s.drawMode !== 'none') {
        handleAssistedClick(p);
      } else {
        s.isPanning = true;
        s.panStart = {
          x: e.touches[0].clientX - s.panX,
          y: e.touches[0].clientY - s.panY,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;

      if (e.touches.length === 2 && s.initialTouchDist) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / s.initialTouchDist;
        s.initialTouchDist = dist;

        const newScale = Math.min(Math.max(s.scale * factor, 0.05), 1000);
        s.scale = newScale;
        if (s.isTracking) {
          s.panX = canvas.width / 2 - s.currentTipWorld.x * s.scale;
          s.panY = canvas.height / 2 - s.currentTipWorld.y * s.scale;
        }
        recomputeSpeed();
        return;
      }

      const p = getCoords(e);
      s.currentMouseWorld = p;

      if (s.isPanning && !s.isTracking) {
        s.panX = e.touches[0].clientX - s.panStart.x;
        s.panY = e.touches[0].clientY - s.panStart.y;
        return;
      }

      if (s.drawMode === 'free' && s.isFreeDrawing) {
        s.rawPoints.push(p);
      }
    };

    const onTouchEnd = () => {
      const s = stateRef.current;
      s.initialTouchDist = null;
      s.isPanning = false;

      if (s.drawMode === 'free' && s.isFreeDrawing) {
        s.isFreeDrawing = false;
        if (s.rawPoints.length > 5) {
          const pts = [...s.rawPoints];
          s.currentShapeKey = 'dibujo';
          setCurrentShapeKey('dibujo');
          s.maxCircles = defaultCirclesMap.dibujo;
          setMaxCircles(defaultCirclesMap.dibujo);
          exitDraw();
          compute(pts);
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const s = stateRef.current;
      if (e.button === 2) {
        if (s.isTracking) {
          s.isTracking = false;
          setIsTracking(false);
        }
        s.isPanning = true;
        s.panStart = { x: e.clientX - s.panX, y: e.clientY - s.panY };
        return;
      }

      const p = getCoords(e);
      s.currentMouseWorld = p;

      if (s.drawMode === 'free') {
        s.isFreeDrawing = true;
        s.rawPoints = [p];
      } else if (s.drawMode !== 'none') {
        handleAssistedClick(p);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const s = stateRef.current;
      const p = getCoords(e);
      s.currentMouseWorld = p;

      if (s.isPanning) {
        s.panX = e.clientX - s.panStart.x;
        s.panY = e.clientY - s.panStart.y;
        return;
      }
      if (s.drawMode === 'free' && s.isFreeDrawing) {
        s.rawPoints.push(p);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const s = stateRef.current;
      if (e.button === 2) {
        s.isPanning = false;
        return;
      }
      if (s.drawMode === 'free' && s.isFreeDrawing) {
        s.isFreeDrawing = false;
        if (s.rawPoints.length > 5) {
          const pts = [...s.rawPoints];
          s.currentShapeKey = 'dibujo';
          setCurrentShapeKey('dibujo');
          s.maxCircles = defaultCirclesMap.dibujo;
          setMaxCircles(defaultCirclesMap.dibujo);
          exitDraw();
          compute(pts);
        }
      }
    };

    const onDblClick = () => {
      if (stateRef.current.drawMode === 'none') {
        toggleImmersiveMode();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('contextmenu', onContextMenu);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [
    compute,
    exitDraw,
    recomputeSpeed,
    setShape,
    toggleImmersiveMode,
  ]);

  const updateCircles = (v: number) => {
    setMaxCircles(v);
    stateRef.current.maxCircles = v;
  };

  const onSpeedSlider = (v: number) => {
    setSpeedSliderRaw(v);
    stateRef.current.speedSliderRaw = v;
    recomputeSpeed();
  };

  return (
    <>
      <header id="appHeader">
        {/* Hidden file input for SVG and raster uploads */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".svg,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Fila 1: Título ultra compacto, selector de forma y botones de acción principal */}
        <div className="top-row">
          <div className="title-area">
            <h1>Fourier</h1>
            <select
              className="picker"
              id="shapeSelect"
              value={currentShapeKey}
              onChange={(e) => setShape(e.target.value)}
              title="Seleccionar figura geométrica o trazo"
            >
              <option value="cuadrado">Cuadrado</option>
              <option value="triangulo">Triángulo</option>
              <option value="pentagono">Pentágono</option>
              <option value="hexagono">Hexágono</option>
              <option value="octagono">Octágono</option>
              <option value="rombo">Rombo</option>
              <option value="cruz">Cruz</option>
              <option value="estrella">Estrella</option>
              <option value="corazon">Corazón</option>
              {currentShapeKey === 'dibujo' && (
                <option value="dibujo">✏️ Personalizado</option>
              )}
              {currentShapeKey === 'svg_import' && (
                <option value="svg_import">{shapeCustomLabel || 'SVG Import'}</option>
              )}
              {currentShapeKey === 'img_import' && (
                <option value="img_import">{shapeCustomLabel || 'IMG Import'}</option>
              )}
            </select>
          </div>

          <div className="header-btns">
            <button
              className={`color-btn ${colorPanelOpen ? 'active' : ''}`}
              title="Personalizar colores de fondo, círculos y trazado"
              onClick={() => setColorPanelOpen(!colorPanelOpen)}
            >
              🎨 {useCustomColors && <span className="badge-dot" title="Colores personalizados activos" />}
            </button>

            <button
              className={`shadow-btn ${shadowMode ? 'active' : ''}`}
              title="Modo Sombra: retiene la silueta estática tras completar la 1ª vuelta"
              onClick={toggleShadowMode}
            >
              👻 Sombra
            </button>

            <button
              className="menu-trigger-btn"
              title="Abrir menú de configuración y temas"
              onClick={() => setDrawerOpen(true)}
            >
              ⚙️ Menú
            </button>
          </div>
        </div>

        {/* Barra de Personalización de Colores (Fondo, Círculos, Trazado) */}
        {colorPanelOpen && (
          <div className="color-customizer-bar">
            <div className="color-pickers-group">
              <div className="color-item">
                <label htmlFor="colorBg">
                  <span className="color-icon">🖼️</span> Fondo:
                </label>
                <div className="color-input-wrap">
                  <input
                    type="color"
                    id="colorBg"
                    value={customBg}
                    onChange={(e) => handleColorChange('bg', e.target.value)}
                    title="Seleccionar color de fondo"
                  />
                  <span className="color-hex">{customBg.toUpperCase()}</span>
                </div>
              </div>

              <div className="color-item">
                <label htmlFor="colorCircle">
                  <span className="color-icon">⭕</span> Círculos:
                </label>
                <div className="color-input-wrap">
                  <input
                    type="color"
                    id="colorCircle"
                    value={customCircle}
                    onChange={(e) => handleColorChange('circle', e.target.value)}
                    title="Seleccionar color de los epiciclos y radios"
                  />
                  <span className="color-hex">{customCircle.toUpperCase()}</span>
                </div>
              </div>

              <div className="color-item">
                <label htmlFor="colorTrail">
                  <span className="color-icon">✒️</span> Trazado:
                </label>
                <div className="color-input-wrap">
                  <input
                    type="color"
                    id="colorTrail"
                    value={customTrail}
                    onChange={(e) => handleColorChange('trail', e.target.value)}
                    title="Seleccionar color de la línea trazada"
                  />
                  <span className="color-hex">{customTrail.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Presets rápidos */}
            <div className="color-presets">
              <span className="presets-label">Paletas:</span>
              <button
                type="button"
                className="preset-pill"
                title="Neón Cyberpunk"
                onClick={() => applyPresetPalette('#050510', '#00f0ff', '#ff0077')}
              >
                ⚡ Cyber
              </button>
              <button
                type="button"
                className="preset-pill"
                title="Papel Pergamino Quemado"
                onClick={() => applyPresetPalette('#dfcaa5', '#8c430a', '#2b1708')}
              >
                📜 Papiro
              </button>
              <button
                type="button"
                className="preset-pill"
                title="Oro y Obsidiana"
                onClick={() => applyPresetPalette('#09090f', '#f59e0b', '#fbbf24')}
              >
                ✨ Oro
              </button>
              <button
                type="button"
                className="preset-pill"
                title="Esmeralda Oscura"
                onClick={() => applyPresetPalette('#02140d', '#10b981', '#34d399')}
              >
                🌿 Jade
              </button>
              <button
                type="button"
                className="preset-pill"
                title="Minimalista Blanco y Grafito"
                onClick={() => applyPresetPalette('#ffffff', '#64748b', '#0f172a')}
              >
                ⚪ Minimal
              </button>
            </div>

            <div className="color-actions">
              {useCustomColors && (
                <button
                  type="button"
                  className="reset-theme-btn"
                  title="Restablecer los colores al tema activo"
                  onClick={resetToThemeColors}
                >
                  ↺ Restaurar Tema
                </button>
              )}
              <button
                type="button"
                className="close-color-btn"
                onClick={() => setColorPanelOpen(false)}
                title="Cerrar panel de colores"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Fila 2: Sliders táctiles de Círculos y Velocidad */}
        <div className="controls-grid">
          <div className="ctrl-item">
            <span>
              Círculos: <b id="valC">{maxCircles}</b>
            </span>
            <input
              type="range"
              id="slC"
              min="1"
              max={sliderMaxLimit}
              value={maxCircles}
              title={`Número de epiciclos de Fourier (hasta ${sliderMaxLimit} círculos para máxima fidelidad)`}
              onChange={(e) => updateCircles(parseInt(e.target.value, 10))}
            />
          </div>

          <div className="ctrl-item">
            <span>
              Vel: <b id="valS">{speedDisplay}</b>
            </span>
            <input
              type="range"
              id="slS"
              min="0"
              max="100"
              step="1"
              value={speedSliderRaw}
              onChange={(e) => onSpeedSlider(parseInt(e.target.value, 10))}
            />
          </div>
        </div>

        {/* Fila 3: Modo de dibujo asistido y FX */}
        <div className="actions-row">
          <div className="action-group">
            <select
              className="picker"
              id="modeSelect"
              value={drawMode}
              onChange={(e) => changeDrawMode(e.target.value)}
              title="Modo de dibujo interactivo"
            >
              <option value="none">Animación</option>
              <option value="free">✏️ Trazo libre</option>
              <option value="poly">📐 Rectas</option>
              <option value="curve">🌊 Curvas</option>
              <option value="mixed">🔀 Mixto</option>
            </select>

            {/* Visual FX Style Selector */}
            <select
              className="picker"
              value={visualFX}
              onChange={(e) => setVisualFX(e.target.value as VisualFX)}
              title="Estilo Visual FX"
            >
              <option value="classic">✨ Clásico</option>
              <option value="neon">⚡ Neón Cyber</option>
              <option value="fade">☄️ Estela Fade</option>
              <option value="ink">✒️ Tinta</option>
            </select>

            <button
              id="subLineBtn"
              className={`sub-toggle ${mixedType === 'line' ? 'on' : ''}`}
              style={{ display: drawMode === 'mixed' ? 'inline-flex' : 'none' }}
              onClick={() => setMixedType('line')}
            >
              Línea
            </button>
            <button
              id="subCurveBtn"
              className={`sub-toggle ${mixedType === 'curve' ? 'on' : ''}`}
              style={{
                display: drawMode === 'mixed' ? 'inline-flex' : 'none',
              }}
              onClick={() => setMixedType('curve')}
            >
              Curva
            </button>
            <button
              id="btnSnap"
              className={`sub-toggle ${snapAngleEnabled ? 'on' : ''}`}
              style={{
                display:
                  drawMode === 'poly' || drawMode === 'mixed'
                    ? 'inline-flex'
                    : 'none',
              }}
              onClick={toggleSnap}
            >
              🧲 45°
            </button>
            <button
              id="btnDone"
              style={{
                display:
                  drawMode !== 'free' && drawMode !== 'none'
                    ? 'inline-flex'
                    : 'none',
                background: '#059669',
              }}
              onClick={finishAssisted}
            >
              ✅ Ok
            </button>
          </div>

          <div className="action-group">
            <button
              id="btnTrack"
              className={`track-btn ${isTracking ? 'tracking-on' : ''}`}
              onClick={toggleTracking}
              title="Seguimiento dinámico de cámara en la punta del trazador"
            >
              🎥 Seguir
            </button>
          </div>
        </div>
      </header>

      <div className="canvas-container" id="canvasContainer" ref={containerRef}>
        <canvas id="canvas" ref={canvasRef}></canvas>

        {/* Botón de Acción Flotante (FAB) moderno para Exportar Video */}
        <div className="floating-fab" id="floatingFab">
          <button
            className={`fab-export-btn ${isRecording ? 'recording' : ''}`}
            onClick={() => setExportModalOpen(true)}
            title="Exportar video vertical Full HD 1080x1920 a 60 FPS en bucle cerrado"
          >
            {isRecording ? `🔴 ${recordProgress}%` : '🎬 Exportar'}
          </button>
        </div>

        <div className="floating-zoom" id="floatingZoom">
          <button
            className="zoom-btn"
            onClick={() => applyZoomStep(1.3)}
            title="Acercar"
          >
            +
          </button>
          <button
            className="zoom-btn"
            onClick={() => applyZoomStep(0.75)}
            title="Alejar"
          >
            −
          </button>
          <button
            className="zoom-btn"
            style={{ fontSize: '0.75rem' }}
            onClick={resetZoom}
            title="Centrar"
          >
            ⟲
          </button>
        </div>
      </div>

      {/* Drawer / Panel Desplegable de Configuración, Temas y Herramientas */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>⚙️ Configuración</h3>
              <button
                className="drawer-close-btn"
                onClick={() => setDrawerOpen(false)}
                title="Cerrar menú"
              >
                ✕
              </button>
            </div>

            <div className="drawer-content">
              {/* Sección 1: Selector de Temas */}
              <div className="drawer-section">
                <span className="drawer-section-title">🎨 Temas Visuales</span>
                <select
                  className="picker"
                  style={{ width: '100%', maxWidth: '100%', padding: '8px 10px' }}
                  value={currentTheme}
                  onChange={(e) => {
                    applyTheme(e.target.value as ThemeKey);
                  }}
                >
                  <option value="light">☀️ Claro</option>
                  <option value="dark">🌙 Oscuro</option>
                  <option value="burned">📜 Papel Quemado / Pirograbado</option>
                  <option value="sunset">🌅 Sunset</option>
                  <option value="matrix">💻 Matrix</option>
                  <option value="monochrome">⚪ Monochrome</option>
                </select>
              </div>

              {/* Sección 2: Personalización de Colores Rápidos */}
              <div className="drawer-section">
                <span className="drawer-section-title">🖌️ Paleta Personalizada</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>🖼️ Fondo:</span>
                    <input
                      type="color"
                      value={customBg}
                      onChange={(e) => handleColorChange('bg', e.target.value)}
                      style={{ width: '38px', height: '26px', cursor: 'pointer', border: 'none', background: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>⭕ Círculos / Radios:</span>
                    <input
                      type="color"
                      value={customCircle}
                      onChange={(e) => handleColorChange('circle', e.target.value)}
                      style={{ width: '38px', height: '26px', cursor: 'pointer', border: 'none', background: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>✒️ Trazo / Punta:</span>
                    <input
                      type="color"
                      value={customTrail}
                      onChange={(e) => handleColorChange('trail', e.target.value)}
                      style={{ width: '38px', height: '26px', cursor: 'pointer', border: 'none', background: 'none' }}
                    />
                  </div>
                </div>

                {useCustomColors && (
                  <button
                    className="alt-btn"
                    style={{ marginTop: '6px', width: '100%', padding: '6px' }}
                    onClick={resetToThemeColors}
                  >
                    ↺ Restaurar Colores del Tema
                  </button>
                )}
              </div>

              {/* Sección 3: Herramientas y Archivos */}
              <div className="drawer-section">
                <span className="drawer-section-title">📁 Archivo e Información</span>
                <div className="drawer-btn-grid">
                  <button
                    className="drawer-action-btn upload-btn"
                    onClick={() => {
                      setDrawerOpen(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    📁 Subir SVG / IMG
                  </button>
                  <button
                    className="drawer-action-btn alt-btn"
                    onClick={() => {
                      setDrawerOpen(false);
                      openExplanation();
                    }}
                  >
                    💡 Info y Guía
                  </button>
                </div>
              </div>

              {/* Sección 4: Efectos Visuales */}
              <div className="drawer-section">
                <span className="drawer-section-title">✨ Efectos y Trazado</span>
                <div className="drawer-btn-grid">
                  <button
                    className={`drawer-action-btn bloom-btn ${bloomEnabled ? 'active' : ''}`}
                    onClick={() => setBloomEnabled(!bloomEnabled)}
                  >
                    {bloomEnabled ? '✨ Bloom ON' : '⚪ Bloom OFF'}
                  </button>
                  <button
                    className={`drawer-action-btn shadow-btn ${shadowMode ? 'active' : ''}`}
                    onClick={toggleShadowMode}
                  >
                    {shadowMode ? '👻 Sombra ON' : '👻 Sombra OFF'}
                  </button>
                </div>
              </div>

              {/* Sección 5: Grabación y Pantalla Completa */}
              <div className="drawer-section" style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <button
                  className="rec-btn"
                  style={{ width: '100%', padding: '10px', fontSize: '0.86rem' }}
                  onClick={() => {
                    setDrawerOpen(false);
                    setExportModalOpen(true);
                  }}
                >
                  🎬 Exportar Video HD (1080x1920)
                </button>
                <div style={{ fontSize: '0.72rem', color: 'var(--subtext)', textAlign: 'center', marginTop: '6px' }}>
                  Doble toque en cualquier parte del lienzo para modo inmersivo a pantalla completa.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suite de Exportación de Video HD Modal */}
      {exportModalOpen && (
        <div
          className="modal-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('modal-overlay') && !isRecording) {
              setExportModalOpen(false);
            }
          }}
        >
          <div className="modal-card">
            <h2>🎬 Exportación de Video HD / 4K</h2>
            <p>
              Graba exactamente un ciclo armónico completo (de <i>t = 0</i> a <i>2π</i>) a 60 FPS con sincronización de bucle infinito perfecta para fondos de pantalla y redes.
            </p>

            <div className="export-options-grid">
              <button
                className={`aspect-option-btn ${exportAspect === '9:16' ? 'selected' : ''}`}
                onClick={() => setExportAspect('9:16')}
                disabled={isRecording}
              >
                <span className="aspect-icon">📱</span>
                <span className="aspect-label">Móvil 9:16</span>
                <span className="aspect-sub">1080 × 1920</span>
              </button>
              <button
                className={`aspect-option-btn ${exportAspect === '16:9' ? 'selected' : ''}`}
                onClick={() => setExportAspect('16:9')}
                disabled={isRecording}
              >
                <span className="aspect-icon">💻</span>
                <span className="aspect-label">Desktop 16:9</span>
                <span className="aspect-sub">1920 × 1080</span>
              </button>
              <button
                className={`aspect-option-btn ${exportAspect === '1:1' ? 'selected' : ''}`}
                onClick={() => setExportAspect('1:1')}
                disabled={isRecording}
              >
                <span className="aspect-icon">⏹️</span>
                <span className="aspect-label">Cuadrado 1:1</span>
                <span className="aspect-sub">1080 × 1080</span>
              </button>
            </div>

            {/* Indicador de Encuadre Inteligente Adaptativo */}
            <div
              style={{
                margin: '12px 0 6px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                fontSize: '0.78rem',
                lineHeight: 1.45,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🎯</span>
                  <span>Encuadre Inteligente HD</span>
                </span>
                <button
                  onClick={() => {
                    const next = !isTracking;
                    setIsTracking(next);
                    stateRef.current.isTracking = next;
                  }}
                  disabled={isRecording}
                  style={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: isTracking ? '#e11d48' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {isTracking ? 'Cambiar a Centrado' : 'Cambiar a Seguimiento'}
                </button>
              </div>
              {isTracking ? (
                <div>
                  <b style={{ color: '#e11d48' }}>Caso B: Seguimiento Activo (Macro / Zoom de Pantalla)</b>
                  <div style={{ color: 'var(--subtext)', marginTop: '2px' }}>
                    La cámara HD seguirá en tiempo real la punta trazadora en (540, 960) reflejando exactamente tu nivel de zoom actual ({Math.round(stateRef.current.scale * 100)}%).
                  </div>
                </div>
              ) : (
                <div>
                  <b style={{ color: '#0284c7' }}>Caso A: Vista General (Auto-Centrado Completo)</b>
                  <div style={{ color: 'var(--subtext)', marginTop: '2px' }}>
                    Cálculo automático de caja delimitadora (Bounding Box) con 12.5% de margen. La figura entera y todos los círculos cabrán perfectamente centrados en (540, 960) sin recortes.
                  </div>
                </div>
              )}
            </div>

            {isRecording && (
              <div style={{ margin: '14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>Grabando ciclo completo 2π...</span>
                  <b>{recordProgress}%</b>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${recordProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                style={{
                  flex: 1,
                  background: isRecording ? '#dc2626' : '#8b5cf6',
                }}
                disabled={isRecording}
                onClick={startRecordingCycle}
              >
                {isRecording ? `Grabando (${recordProgress}%)...` : '▶️ Iniciar Grabación'}
              </button>
              <button
                className="alt-btn"
                style={{ width: 'auto', padding: '0 16px' }}
                disabled={isRecording}
                onClick={() => setExportModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {infoModalOpen && (
        <div
          className="modal-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
              setInfoModalOpen(false);
            }
          }}
        >
          <div className="modal-card">
            <h2>{modalData.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: modalData.text }} />
            <button onClick={() => setInfoModalOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}
