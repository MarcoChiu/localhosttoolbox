import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const getBuildTime = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${min}`;
};

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000
  },
  plugins: [react()],
  base: './',
  define: {
    __BUILD_TIME__: JSON.stringify(getBuildTime())
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pdf-lib')) {
              return 'vendor-pdflib';
            }
            if (id.includes('pdfjs-dist')) {
              return 'vendor-pdfjs';
            }
            if (id.includes('opencc-js')) {
              return 'vendor-opencc';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
