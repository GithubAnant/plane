import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat']
  },
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
  server: {
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io']
  }
});