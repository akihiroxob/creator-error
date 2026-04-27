import type { NextConfig } from "next";
import { createRequire } from "node:module";

const nextConfig: NextConfig = {};

const require = createRequire(import.meta.url);

try {
  if (process.env.NODE_ENV === "development") {
    require.resolve("wrangler");
    const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
    initOpenNextCloudflareForDev();
  }
} catch {
  // Wrangler is not installed yet or OpenNext dev init is unavailable.
}

export default nextConfig;
