import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt', not 'autoUpdate' — a new service worker installs in the
      // background but does NOT take over automatically. The app decides
      // when to tell the customer (see useUpdateAvailable.js), so nobody
      // gets reloaded out from under a checkout form mid-fill.
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'og-image.jpg'],
      manifest: {
        name: 'States & Swaad',
        short_name: 'States & Swaad',
        description:
          'Homemade South Indian breakfast in Mumbai — podi idli, dosa, tiffins, combos and more, made fresh to order and delivered locally.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#163a2b',
        background_color: '#fff8ee',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell only — JS/CSS/fonts/images that make up the UI itself.
        globPatterns: ['**/*.{js,css,html,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Supabase (menu, prices, availability, orders, admin data,
            // auth) — NEVER cached. Every request goes to the network, so
            // the app can never show a stale price, a sold-out item as
            // available, or a stale order status. This is the one rule
            // that matters most for correctness.
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkOnly',
          },
          {
            // Google Fonts — genuinely static, safe to cache long-term.
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Menu photos etc. — fine to serve from cache instantly, but
            // always refetch in the background so an admin's photo/menu
            // update shows up on the next load rather than staying stale
            // indefinitely.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
