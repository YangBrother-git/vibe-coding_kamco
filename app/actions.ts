"use server";

// 서버 동작 (DESIGN 5장)
// - login: 비밀번호 화면. 맞으면 30일짜리 잠금 쿠키를 주고, 같은 IP 5번 연속 실패 시 10분 차단 (PLAN 작업 23).
// - retryCollect: "지금 다시 가져오기" 버튼. 한 번에 지역본부 1곳을 받는다 (PLAN 작업 21).
//   잠금을 푼 상태에서만 동작한다. proxy.ts만 믿지 않고 여기서 다시 확인한다 (PLAN 작업 25).

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOCK_COOKIE, LOCK_MAX_AGE_SECONDS, checkPassword, isUnlocked, issueLockToken, safeNext } from "@/lib/auth";
import { retryFailedWeek } from "@/lib/collect";
import { clearLoginFailures, loginGate, recordLoginFailure } from "@/lib/db/login-attempts";

export type LoginState = { message: string } | null;

/** 접속한 기기의 주소 (Vercel·프록시 뒤에서는 x-forwarded-for의 첫 번째 값) */
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/"));
  const ip = await clientIp();
  try {
    const gate = await loginGate(ip);
    if (gate.locked) return { message: `${minutesText(gate.minutesLeft)} 뒤에 다시 시도해 주세요.` };
    if (!checkPassword(password)) {
      const result = await recordLoginFailure(ip);
      return result.locked
        ? { message: "10분 뒤에 다시 시도해 주세요." }
        : { message: `비밀번호가 맞지 않습니다. (남은 기회 ${result.remaining}번)` };
    }
    await clearLoginFailures(ip);
  } catch {
    return { message: "지금은 확인할 수 없습니다. 잠시 뒤 다시 시도해 주세요." };
  }
  (await cookies()).set(LOCK_COOKIE, issueLockToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LOCK_MAX_AGE_SECONDS,
  });
  redirect(next);
}

function minutesText(minutes: number): string {
  return `${Math.max(1, minutes)}분`;
}

export type RetryStepState =
  | { status: "staged"; office: string; staged: number; total: number }
  | { status: "saved"; items: number }
  | { status: "failed"; office: string; message: string }
  | { status: "busy" | "refused" | "skipped" | "error"; message: string };

export async function retryCollect(): Promise<RetryStepState> {
  if (!isUnlocked((await cookies()).get(LOCK_COOKIE)?.value)) {
    return { status: "refused", message: "잠금을 풀어야 쓸 수 있습니다. 비밀번호를 다시 입력해 주세요." };
  }
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
      case "busy":
        return { status: "busy", message: "예약 실행이 수집 중입니다. 잠시 뒤 이어서 받습니다." };
      case "refused":
      case "marked-failed":
        return { status: "refused", message: "message" in result ? result.message : "다시 가져올 실패한 주가 없습니다" };
    }
  } catch {
    return { status: "error", message: "저장소에 닿지 못했습니다. 잠시 뒤 다시 눌러 주세요." };
  }
}
