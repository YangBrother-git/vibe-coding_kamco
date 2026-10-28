// robots.txt: 모든 검색엔진에 사이트 전체를 수집하지 말라고 알린다 (PLAN 작업 24 / PRD 7장 ④)
// 개인 업무용 화면이므로 검색 결과에 나오지 않아야 한다.

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
