import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// https://vite.dev/config/
export default defineConfig({
    base: '/wows_planner/',
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        proxy: {
            '/wows_planner/api': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true,
                ws: true,
                rewrite: function (path) { return path.replace(/^\/wows_planner\/api/, ''); }
            }
        }
    },
    // @ts-ignore
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    },
});
