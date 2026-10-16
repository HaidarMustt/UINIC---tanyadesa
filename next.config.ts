import type { NextConfig } from "next";

// Security headers sent with every response.
// They tell the browser to be strict about how our pages can be used.
const SECURITY_HEADERS = [
  // Nobody may show TanyaDesa inside a frame on their site (stops clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Blocks framing, plugins and forms sent elsewhere. Scripts are not restricted,
  // so Next.js and the CAPTCHA keep working.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  // The browser must trust our Content-Type, never guess it.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites only learn our domain, never the full address.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We never need the camera, microphone or location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Always use HTTPS for the next two years.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Hide "X-Powered-By: Next.js".
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  // Tailwind runs through Turbopack. Do not remove this block.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Lets a phone on the same WiFi open the dev server. Dev only, ignored in production.
  allowedDevOrigins: ["10.3.32.138", "192.169.110.35", "10.10.11.238", "10.255.4.8"],
};

export default nextConfig;