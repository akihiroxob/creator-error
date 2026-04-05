import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin"
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp"
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin"
          }
        ]
      }
    ];
  },
  webpack: (config) => {
    config.module ??= {};
    config.module.parser ??= {};
    config.module.parser.javascript = {
      ...(typeof config.module.parser.javascript === "object"
        ? config.module.parser.javascript
        : {}),
      url: false
    };

    return config;
  }
};

export default nextConfig;
