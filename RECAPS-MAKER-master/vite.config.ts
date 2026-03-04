import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 5177,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Permissions-Policy': 'display-capture=(self)',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https: blob: data:; style-src 'self' 'unsafe-inline' https:; worker-src 'self' blob: data:; object-src 'none'; base-uri 'self';",
    },
  },
  preview: {
    port: 5177,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Permissions-Policy': 'display-capture=(self)',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https: blob: data:; style-src 'self' 'unsafe-inline' https:; worker-src 'self' blob: data:; object-src 'none'; base-uri 'self';",
    },
  },
  // The alias is no longer needed with the stable ffmpeg version
  // and was causing resolution issues for other @ffmpeg packages.
  // resolve: {
  //   alias: {
  //     '@ffmpeg/ffmpeg': path.resolve(__dirname, 'node_modules/@ffmpeg/ffmpeg/dist/ffmpeg.min.js'),
  //   },
  // },
});
