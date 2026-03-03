import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/if-api': {
          target: 'https://api.infiniteflight.com/public/v2',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/if-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_IF_API_KEY}`);
            });
          },
        },
      },
    },
  };
});
