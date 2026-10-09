/**
 * Silent Progressive Web App (PWA) initialization for Android and Web
 * Injects dynamic Web App Manifest (Blob URL) and lightweight Service Worker
 * without intrusive "Install" banners or UI obstruction.
 */

export function initPWA(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Vector SVG Fourier Epicycles Icon (Epicycles & glowing trace)
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <defs>
        <radialGradient id="bgG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0e1726"/>
          <stop offset="100%" stop-color="#030712"/>
        </radialGradient>
        <linearGradient id="traceG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#818cf8"/>
          <stop offset="100%" stop-color="#f43f5e"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="512" height="512" rx="110" fill="url(#bgG)"/>
      <!-- Base Axis Grid -->
      <circle cx="256" cy="256" r="160" fill="none" stroke="rgba(56, 189, 248, 0.18)" stroke-width="2" stroke-dasharray="6 6"/>
      <circle cx="256" cy="256" r="110" fill="none" stroke="rgba(129, 140, 248, 0.28)" stroke-width="2"/>
      <circle cx="334" cy="178" r="55" fill="none" stroke="rgba(244, 63, 94, 0.35)" stroke-width="2"/>
      <!-- Radii Arms -->
      <line x1="256" y1="256" x2="334" y2="178" stroke="rgba(56, 189, 248, 0.75)" stroke-width="4" stroke-linecap="round"/>
      <line x1="334" y1="178" x2="372" y2="140" stroke="rgba(244, 63, 94, 0.85)" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Center Pivot -->
      <circle cx="256" cy="256" r="8" fill="#38bdf8"/>
      <circle cx="334" cy="178" r="6" fill="#818cf8"/>
      <!-- Glowing Tracer Tip -->
      <circle cx="372" cy="140" r="10" fill="#f43f5e" filter="url(#glow)"/>
      <circle cx="372" cy="140" r="4.5" fill="#ffffff"/>
      <!-- Fourier Trajectory Heart Curve -->
      <path d="M 256,190 C 230,130 150,130 150,210 C 150,290 256,370 256,370 C 256,370 362,290 362,210 C 362,130 282,130 256,190 Z" 
            fill="none" stroke="url(#traceG)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
    </svg>`;

    const iconDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(iconSvg)}`;

    // Add or update favicon
    let favLink = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!favLink) {
      favLink = document.createElement('link');
      favLink.rel = 'icon';
      document.head.appendChild(favLink);
    }
    favLink.type = 'image/svg+xml';
    favLink.href = iconDataUrl;

    // Add apple touch icon
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = iconDataUrl;

    // 2. Web App Manifest
    const manifest = {
      name: 'Epiciclos de Fourier',
      short_name: 'Fourier',
      description: 'Visualizador y simulador interactivo de epiciclos y series de Fourier con exportación HD.',
      start_url: '.',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#060911',
      theme_color: '#0284c7',
      icons: [
        {
          src: iconDataUrl,
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestUrl;

    // 3. Register lightweight Blob Service Worker for silent PWA compliance
    if ('serviceWorker' in navigator) {
      const swCode = `
        const CACHE_NAME = 'fourier-cache-v1';
        self.addEventListener('install', (e) => {
          self.skipWaiting();
        });
        self.addEventListener('activate', (e) => {
          e.waitUntil(self.clients.claim());
        });
        self.addEventListener('fetch', (e) => {
          // Pass-through network with offline fallback
          e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
          );
        });
      `;
      const swBlob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(swBlob);

      navigator.serviceWorker
        .register(swUrl)
        .catch(() => {
          // Silent fallback if origin restrictions apply
        });
    }
  } catch (err) {
    // Graceful silent fallback
    console.warn('PWA setup notice:', err);
  }
}
