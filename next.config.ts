import type { NextConfig } from "next";

const nextConfig = {
  env: {
    SHOPIFY_STORE_URL: "2cd994.myshopify.com", // ✅ No NEXT_PUBLIC_
    SHOPIFY_ADMIN_API_KEY: "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"
  }
};

export default nextConfig;
