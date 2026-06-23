import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "172.20.10.3"],
  turbopack: {
    // pdfjs-dist references canvas in Node environments — stub it out for browser builds
    resolveAlias: {
      canvas: "./node_modules/canvas/stub.js",
    },
  },
};

export default nextConfig;
