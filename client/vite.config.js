import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons.svg"],
      manifest: {
        name: "Local Disaster Alert & Resource Coordination Platform",
        short_name: "Disaster Alert",
        description: "Local Disaster Alert & Resource Coordination Platform",
        theme_color: "#0b1220",
        background_color: "#0b1220",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html"
      }
    })
  ]
});
