import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tailwind v4 runs as a Vite plugin: there is no tailwind.config file.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // "@/shared/ui/Button" instead of "../../../shared/ui/Button" (the same alias is in tsconfig.json).
  resolve: { alias: { "@": "/src" } },
  server: {
    port: 5175,
    // The PrepHub API (Express) runs on 5001. Calling /api/... from the browser keeps the cookies on the same origin.
    proxy: { "/api": "http://localhost:5001" },
  },
});
