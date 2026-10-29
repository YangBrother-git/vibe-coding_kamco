import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false, // X-Powered-By 노출 제거
  async headers() {
    // 보안 머리글: 다른 사이트의 iframe 삽입(클릭재킹)·형식 추측·검색엔진 색인 차단
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
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
