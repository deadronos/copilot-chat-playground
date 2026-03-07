/* eslint-disable */
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Force host binding so Docker port mapping reaches the dev server
    host: true,
    // Proxy `/api` to the backend service.
    // Use the BACKEND_URL environment variable for local development (e.g., `BACKEND_URL=http://localhost:3000`).
    // Default remains `http://backend:3000` which resolves inside the Docker network.
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL || "http://backend:3000",
        changeOrigin: true,
        secure: false,
      },
      "/copilot": {
        target: process.env.COPILOT_URL || "http://copilot:3210",
        changeOrigin: true,
        secure: false,
        rewrite: (pathValue) => pathValue.replace(/^\/copilot/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
