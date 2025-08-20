import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          'localhost:5000': 'localhost:5173'
        },
        cookiePathRewrite: {
          '/api': '/'
        },
        headers: {
          'X-Forwarded-Host': 'localhost:5173',
          'X-Forwarded-Proto': 'http'
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Copy cookies and other necessary headers
            const cookie = req.headers.cookie;
            if (cookie) {
              proxyReq.setHeader('cookie', cookie);
            }
            
            // Set origin to match target
            proxyReq.setHeader('origin', 'http://localhost:5000');
            
            // Handle POST requests
            if (req.method === 'POST') {
              proxyReq.setHeader('Content-Type', 'application/json');
            }
          });
        }
      }
    },
  },
});
