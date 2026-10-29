// 로그인 실패 횟수 (PLAN 작업 23 / DESIGN 3.4 / PRD 7장 ④)
// - 같은 기기(IP)에서 5번 연속 틀리면 10분 동안 입력을 막는다.
// - 실패 횟수는 로그인에 성공하거나 10분 차단이 끝나면 0으로 되돌린다.
// - Vercel 서버는 요청마다 새로 뜰 수 있어 메모리 대신 Supabase에 둔다.
// - 시도마다 비밀번호를 검사하기 "전에" 횟수를 올린다(reserve_login_attempt, 줄 잠금).
//   읽고 나서 따로 저장하면 동시 요청으로 5번 제한을 넘길 수 있다 (보안 점검 SEC-001).

import "server-only";
import { db } from "./client";

export const MAX_FAILS = 5;
export const LOCK_MINUTES = 10;

export type LoginAttempt =
  | { locked: true; minutesLeft: number }
  | { locked: false; remaining: number }; // remaining 0 = 마지막 기회(틀리면 바로 차단)

/** 로그인 시도 1번을 예약한다. 차단 중이면 locked, 아니면 비밀번호를 검사해도 된다 */
export async function reserveLoginAttempt(ip: string): Promise<LoginAttempt> {
  const { data, error } = await db().rpc("reserve_login_attempt", {
    p_ip: ip,
    p_max: MAX_FAILS,
    p_minutes: LOCK_MINUTES,
  });
  if (error) throw new Error(`로그인 시도 기록 실패: ${error.message}`);
  const row = (data as { locked: boolean; minutes_left: number; remaining: number }[] | null)?.[0];
  if (!row) throw new Error("로그인 시도 기록 실패: 응답이 비어 있음");
  return row.locked ? { locked: true, minutesLeft: row.minutes_left } : { locked: false, remaining: row.remaining };
}

/** 로그인에 성공하면 실패 기록을 지운다 */
export async function clearLoginFailures(ip: string): Promise<void> {
  const { error } = await db().from("login_attempts").delete().eq("ip", ip);
  if (error) throw new Error(`로그인 기록 지우기 실패: ${error.message}`);
}
