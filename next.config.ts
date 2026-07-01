import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Raises the body size limit for the middleware/proxy layer so large
    // video uploads (up to 200MB) aren't rejected before reaching the
    // /api/analyze route handler. `middlewareClientMaxBodySize` was
    // renamed to `proxyClientMaxBodySize` in Next.js 16.
    proxyClientMaxBodySize: "200mb",

    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;