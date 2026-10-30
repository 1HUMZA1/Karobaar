import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Karobaar AI Dev Server Proxy Plugin (Server-side tool execution & LLM Gateway)
function karobaarAiDevPlugin() {
  return {
    name: 'karobaar-ai-dev-backend',
    configureServer(server) {
      const devInvitations = new Map();

      server.middlewares.use('/api/invitations', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          return res.end();
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              if (body) {
                const inv = JSON.parse(body);
                const code = (inv.code || '').trim().toUpperCase();
                const id = (inv.id || '').trim();
                if (code) devInvitations.set(code, inv);
                if (id) devInvitations.set(id, inv);
                const noHyphens = code.replace(/[^A-Z0-9]/g, '');
                if (noHyphens) devInvitations.set(noHyphens, inv);
              }
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.method === 'GET') {
          const url = new URL(req.url, 'http://localhost');
          const queryCode = (url.searchParams.get('code') || '').trim().toUpperCase();
          if (queryCode) {
            let matched = devInvitations.get(queryCode);
            if (!matched) {
              const noHyphens = queryCode.replace(/[^A-Z0-9]/g, '');
              matched = devInvitations.get(noHyphens);
            }
            if (matched) {
              res.statusCode = 200;
              return res.end(JSON.stringify({ success: true, invitation: matched }));
            }
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, message: 'Invitation not found' }));
          }
          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true, invitations: Array.from(devInvitations.values()) }));
        }
      });

      server.middlewares.use('/api/ai/models', async (req, res) => {
        try {
          const { handleAiModelsRequest } = await import('./server/ai-middleware.js');
          await handleAiModelsRequest(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

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
