import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Permissions-Policy': 'camera=*, microphone=()',
    },
    
  },
}
);
