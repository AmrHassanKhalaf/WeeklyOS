import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // Let vite-plugin-pwa inject the registration script automatically.
      injectRegister: 'auto',

      workbox: {
        // Pre-cache the full app shell on install.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Runtime caching rules — evaluated in order (first match wins).
        runtimeCaching: [
          {
            // Supabase REST API (tasks, habits, weeks, etc.) → NetworkFirst
            // Serves cached data instantly while fetching fresh data in background.
            // Hard timeout: 5 s — if network is slow, cache is served immediately.
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts stylesheets → CacheFirst (they are immutable once versioned)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // SPA fallback: serve index.html for all navigation requests so
        // React Router handles routing client-side, even when offline.
        navigateFallback: 'index.html',

        // Exclude Supabase paths and edge functions from the SW navigation fallback.
        // These must always go to the network so auth/AI responses are never stale.
        navigateFallbackDenylist: [
          /^\/supabase/,
          /^\/functions/,
          /^\/auth/,
          /^\/rest/,
        ],
      },

      manifest: {
        name: 'WeeklyOS',
        short_name: 'WeeklyOS',
        description: 'Your personal weekly operating system — plan, focus, and reflect.',
        theme_color: '#0f0f11',      // matches --md-sys-color-background dark
        background_color: '#0f0f11',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],

  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com wss://*.googleapis.com https://fonts.gstatic.com; worker-src 'self' blob:;",
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
