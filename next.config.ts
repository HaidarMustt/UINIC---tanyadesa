import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Lets a phone on the same WiFi open the dev server. Dev only, ignored in production.
  allowedDevOrigins: ["10.3.32.138", "192.169.110.35"],
};

export default nextConfig;
