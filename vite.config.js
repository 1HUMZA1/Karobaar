import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Karobaar AI Dev Server Proxy Plugin (Server-side tool execution & LLM Gateway)
function karobaarAiDevPlugin() {
  return {
    name: 'karobaar-ai-dev-backend',
    configureServer(server) {
      server.middlewares.use('/api/ai/chat', async (req, res) => {
        try {
          const { handleAiChatRequest } = await import('./server/ai-middleware.js');
          await handleAiChatRequest(req, res);
        } catch (err) {
          console.error('[AI Dev Middleware Error]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'AI_DEV_SERVER_ERROR', message: err.message }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    karobaarAiDevPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024 // 15MB
      },
      manifest: {
        name: 'Karobaar',
        short_name: 'Karobaar',
        description: 'Karobaar Business Command Center',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone'
      }
    })
  ],
  server: {
    hmr: {
      overlay: false
    },
    watch: {
      ignored: [
        '**/karobaar_app/**',
        '**/karobaar_flutter/**',
        '**/Karobaar_Final_Apps/**',
        '**/desktop-build-latest/**',
        '**/*.apk',
        '**/*.exe',
        '**/*.zip'
      ]
    }
  },
  base: './'
})
