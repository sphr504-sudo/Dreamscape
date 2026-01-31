
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Specifically define process.env.API_KEY for the Gemini SDK
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env': {} // Fallback to prevent "process is not defined" errors
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
});
