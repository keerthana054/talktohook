import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Your /api/analyze route handler accepts up to 200MB video uploads
    // (see MAX_FILE_SIZE_BYTES in route.ts). Because src/middleware.ts
    // exists and runs on this route (for auth), Next.js buffers the
    // incoming request body in memory before it reaches your handler so
    // middleware can read it too. That buffering defaults to a 10MB cap,
    // which is what "Request body exceeded 10MB" was coming from -- it's
    // unrelated to serverActions.bodySizeLimit, which only governs Server
    // Actions, not Route Handlers reached through middleware.
    middlewareClientMaxBodySize: "200mb",

    // Keep this too, in case you add Server Actions elsewhere later.
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;