import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional same-origin proxy: with BACKEND_URL set, the browser talks only to this site, so the session
  // cookies are first-party and the route guard in middleware.ts sees them (no custom domain needed).
  async rewrites() {
    const backend = process.env.BACKEND_URL?.replace(/\/+$/, '');
    return backend ? [{ source: '/api/:path*', destination: `${backend}/api/:path*` }] : [];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
