"use server";

// 서버 동작 (DESIGN 5장)
// retryCollect: "지금 다시 가져오기" 버튼. 한 번에 지역본부 1곳을 받는다 (PLAN 작업 21).
// ⚠ 잠금을 푼 상태에서만 동작하게 하는 검사는 PLAN 작업 23(비밀번호 잠금)에서 붙인다.

import { refresh } from "next/cache";
import { retryFailedWeek } from "@/lib/collect";

export type RetryStepState =
  | { status: "staged"; office: string; staged: number; total: number }
  | { status: "saved"; items: number }
  | { status: "failed"; office: string; message: string }
  | { status: "refused" | "skipped" | "error"; message: string };

export async function retryCollect(): Promise<RetryStepState> {
  try {
    const result = await retryFailedWeek(new Date());
    switch (result.status) {
      case "staged":
        return { status: "staged", office: result.office, staged: result.staged, total: result.total };
      case "saved":
        refresh(); // 새 주차와 실패 안내 사라짐을 화면에 반영
        return { status: "saved", items: result.items };
      case "failed":
        return { status: "failed", office: result.office, message: result.message };
      case "skipped":
        refresh();
        return { status: "skipped", message: "이미 수집에 성공한 주입니다" };
      case "refused":
        return { status: "refused", message: result.message };
    }
  } catch {
    return { status: "error", message: "저장소에 닿지 못했습니다. 잠시 뒤 다시 눌러 주세요." };
  }
}
