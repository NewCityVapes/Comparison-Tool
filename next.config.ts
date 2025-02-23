import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    SHOPIFY_STORE_URL: "2cd994.myshopify.com",
    SHOPIFY_ADMIN_API_KEY: "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",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
};

export default nextConfig;
