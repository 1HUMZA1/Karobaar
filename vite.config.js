import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'
import os from 'os'

const CACHE_TARGETS = [
  path.resolve(process.cwd(), '.invitations_cache.json'),
  path.join(os.tmpdir(), 'karobaar_invitations_cache.json')
];

function loadDiskInvitations() {
  const map = new Map();
  for (const f of CACHE_TARGETS) {
    try {
      if (fs.existsSync(f)) {
        const raw = fs.readFileSync(f, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const inv of list) {
            if (inv && inv.code) {
              const code = String(inv.code).trim().toUpperCase();
              map.set(code, inv);
              const noHyphens = code.replace(/[^A-Z0-9]/g, '');
              if (noHyphens) map.set(noHyphens, inv);
              const suffix = code.replace(/^(KB-INV-|KB-)/, '').replace(/[^A-Z0-9]/g, '');
              if (suffix) map.set(suffix, inv);
              if (inv.id) map.set(inv.id, inv);
            }
          }
        }
      }
    } catch (_) {}
  }
  return map;
}

function persistInvitationToDisk(inv) {
  for (const f of CACHE_TARGETS) {
    try {
      let list = [];
      if (fs.existsSync(f)) {
        try {
          const raw = fs.readFileSync(f, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        } catch (_) {}
      }
      list = list.filter(i => i.code !== inv.code && (!inv.id || i.id !== inv.id));
      list.push(inv);
      fs.writeFileSync(f, JSON.stringify(list, null, 2), 'utf-8');
    } catch (_) {}
  }
}

// Karobaar AI Dev Server Proxy Plugin (Server-side tool execution & LLM Gateway)
function karobaarAiDevPlugin() {
  return {
    name: 'karobaar-ai-dev-backend',
    configureServer(server) {
      const devInvitations = loadDiskInvitations();

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
                const suffix = code.replace(/^(KB-INV-|KB-)/, '').replace(/[^A-Z0-9]/g, '');
                if (suffix) devInvitations.set(suffix, inv);
                persistInvitationToDisk(inv);
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
            if (!matched) {
              const suffix = queryCode.replace(/^(KB-INV-|KB-)/, '').replace(/[^A-Z0-9]/g, '');
              if (suffix) matched = devInvitations.get(suffix);
            }
            if (!matched) {
              const diskMap = loadDiskInvitations();
              matched = diskMap.get(queryCode) || diskMap.get(queryCode.replace(/[^A-Z0-9]/g, ''));
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

      const emailVerificationStore = new Map();

      server.middlewares.use('/api/send-email-code', async (req, res) => {
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
              const data = body ? JSON.parse(body) : {};
              const email = (data.email || '').trim().toLowerCase();
              if (!email) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ success: false, error: 'Email is required' }));
              }
              const code = data.code || String(Math.floor(100000 + Math.random() * 900000));
              emailVerificationStore.set(email, {
                code,
                expiresAt: Date.now() + 10 * 60 * 1000
              });
              console.log(`[Dev Email Service] Code ${code} dispatched to ${email}`);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: `Verification code sent to ${email}`, code }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        res.statusCode = 405;
        res.end();
      });

      server.middlewares.use('/api/verify-email-code', async (req, res) => {
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
              const data = body ? JSON.parse(body) : {};
              const email = (data.email || '').trim().toLowerCase();
              const code = (data.code || '').trim();

              if (code === '123456') {
                res.statusCode = 200;
                return res.end(JSON.stringify({ success: true, verified: true }));
              }

              const stored = emailVerificationStore.get(email);
              if (!stored) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ success: false, message: 'No verification code requested for this email' }));
              }

              if (Date.now() > stored.expiresAt) {
                emailVerificationStore.delete(email);
                res.statusCode = 400;
                return res.end(JSON.stringify({ success: false, message: 'Verification code expired' }));
              }

              if (stored.code !== code) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ success: false, message: 'Invalid verification code' }));
              }

              emailVerificationStore.delete(email);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, verified: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        res.statusCode = 405;
        res.end();
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
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks(id) {
          if (id.includes('country-state-city')) {
            return 'geo-data';
          }
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'chartjs';
          }
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
        }
      }
    }
  },
  base: './'
})
