// 주간 수집 경로 (PLAN 작업 20 / DESIGN 5장)
// Supabase 예약 실행이 월~금 09:00~09:55(한국 시간) 5분마다 부른다. 한 번에 지역본부 1곳씩 받는다.
// 예약 실행 비밀값(CRON_SECRET)이 맞을 때만 받는다 — 브라우저에서 주소를 직접 열면 거절 (PLAN 작업 25).

import { timingSafeEqual } from "node:crypto";
import { runCollectStep } from "@/lib/collect";

// 지역본부 1곳은 실제로 17~35초 걸린다 (2026-10-29 측정). 여유 있게 2분까지 허용
export const maxDuration = 120;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // 비밀값이 설정되지 않았으면 아무도 부를 수 없다
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "권한이 없습니다" }, { status: 401 });
  }
  try {
    const result = await runCollectStep(new Date());
    return Response.json(result, { status: result.status === "failed" ? 502 : 200 });
  } catch (error) {
    // 저장소 오류 등. 메시지만 남기고 비밀값이 섞일 수 있는 자세한 내용은 돌려주지 않는다
    return Response.json(
      { status: "error", message: error instanceof Error ? error.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}
