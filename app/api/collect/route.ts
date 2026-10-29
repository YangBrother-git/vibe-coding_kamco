// 주간 수집 경로 (PLAN 작업 20·25 / DESIGN 5장)
// Supabase 예약 실행이 부른다.
//   - 기본: 월~금 09:00~10:55(한국 시간) 5분마다 — 한 번에 지역본부 1곳씩 받는다
//   - ?mode=finalize: 금요일 11:05 — 아직 성공 못 한 주를 "실패"로 바꾼다
// 예약 실행 비밀값(CRON_SECRET)이 맞을 때만 받는다 — 브라우저에서 주소를 직접 열면 거절.

import { timingSafeEqual } from "node:crypto";
import { finalizeWeekIfUnfinished, runCollectStep } from "@/lib/collect";

// 지역본부 1곳은 실제로 17~43초 걸린다 (2026-10-29 측정). 여유 있게 2분까지 허용
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
  const finalize = new URL(request.url).searchParams.get("mode") === "finalize";
  try {
    const result = finalize ? await finalizeWeekIfUnfinished(new Date()) : await runCollectStep(new Date());
    return Response.json(result, { status: result.status === "failed" ? 502 : 200 });
  } catch (error) {
    // 잠금을 얻는 단계에서 저장소에 닿지 못한 경우 등. 기록은 다음 차례·금요일 마무리가 맡는다
    return Response.json(
      { status: "error", message: error instanceof Error ? error.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}
