// 비밀번호 잠금 (PLAN 작업 23 / DESIGN 3.4, 8장 / PRD 7장 ④)
// - 잠금 쿠키 = "발급 시각.서명". 서명은 접근 비밀번호(APP_PASSWORD)를 열쇠로 만든다.
//   그래서 비밀번호를 바꾸면 예전 쿠키의 서명이 맞지 않아, 기억된 브라우저도 다시 입력하게 된다.
// - 쿠키는 30일 동안 유효하다.
// 서버(proxy.ts, 서버 동작)에서만 쓴다. proxy에서도 쓰므로 server-only 표시는 붙이지 않는다.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const LOCK_COOKIE = "onbid_lock";
export const LOCK_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30일

/** 같은 길이로 맞춘 뒤 시간 차이 없이 비교 (글자를 하나씩 맞혀 보는 공격 방지) */
function sameText(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function signature(issuedAt: number, password: string): string {
  return createHmac("sha256", password).update(`onbid-heatmap:${issuedAt}`).digest("base64url");
}

function appPassword(): string | null {
  const password = process.env.APP_PASSWORD;
  return password ? password : null;
}

/** 입력한 비밀번호가 맞는지. 비밀번호가 설정되지 않았으면 언제나 틀림 */
export function checkPassword(input: string): boolean {
  const password = appPassword();
  if (!password) return false;
  return sameText(input, password);
}

/** 새 잠금 쿠키 값 */
export function issueLockToken(now: Date = new Date()): string {
  const password = appPassword();
  if (!password) throw new Error("APP_PASSWORD가 .env에 없습니다");
  const issuedAt = Math.floor(now.getTime() / 1000);
  return `${issuedAt}.${signature(issuedAt, password)}`;
}

/** 잠금 쿠키가 유효한지 (지금 비밀번호로 서명됐고, 30일이 지나지 않았는지) */
export function isUnlocked(token: string | undefined, now: Date = new Date()): boolean {
  const password = appPassword();
  if (!password || !token) return false;
  const [issuedText, sig] = token.split(".");
  const issuedAt = Number(issuedText);
  if (!Number.isInteger(issuedAt) || !sig) return false;
  const age = Math.floor(now.getTime() / 1000) - issuedAt;
  if (age < -300 || age > LOCK_MAX_AGE_SECONDS) return false; // 미래(시계 차 5분 허용) 또는 30일 지남
  return sameText(sig, signature(issuedAt, password));
}

/** 로그인 뒤 돌아갈 주소. 우리 사이트 안의 주소만 허용 (다른 사이트로 보내는 것 방지) */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
