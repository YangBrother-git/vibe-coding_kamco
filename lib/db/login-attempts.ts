// 로그인 실패 횟수 (PLAN 작업 23 / DESIGN 3.4 / PRD 7장 ④)
// - 같은 기기(IP)에서 5번 연속 틀리면 10분 동안 입력을 막는다.
// - 실패 횟수는 로그인에 성공하거나 10분 차단이 끝나면 0으로 되돌린다.
// - Vercel 서버는 요청마다 새로 뜰 수 있어 메모리 대신 Supabase에 둔다.

import "server-only";
import { db } from "./client";

export const MAX_FAILS = 5;
export const LOCK_MINUTES = 10;

type AttemptRow = { ip: string; fail_count: number; locked_until: string | null };

export type LoginGate =
  | { locked: true; minutesLeft: number }
  | { locked: false };

async function read(ip: string): Promise<AttemptRow | null> {
  const { data, error } = await db().from("login_attempts").select("ip, fail_count, locked_until").eq("ip", ip).maybeSingle();
  if (error) throw new Error(`로그인 기록 읽기 실패: ${error.message}`);
  return data as AttemptRow | null;
}

/** 지금 이 IP가 차단 중인지 */
export async function loginGate(ip: string, now: Date = new Date()): Promise<LoginGate> {
  const row = await read(ip);
  if (row?.locked_until && new Date(row.locked_until) > now) {
    const minutesLeft = Math.ceil((new Date(row.locked_until).getTime() - now.getTime()) / 60000);
    return { locked: true, minutesLeft };
  }
  return { locked: false };
}

/**
 * 틀렸을 때 기록한다.
 * @returns 이번 실패로 차단됐으면 locked, 아니면 남은 기회 수
 */
export async function recordLoginFailure(
  ip: string,
  now: Date = new Date(),
): Promise<{ locked: true } | { locked: false; remaining: number }> {
  const row = await read(ip);
  const expired = row?.locked_until ? new Date(row.locked_until) <= now : false;
  const count = (row && !expired ? row.fail_count : 0) + 1; // 차단이 끝났으면 0부터 다시
  const lock = count >= MAX_FAILS;
  const { error } = await db()
    .from("login_attempts")
    .upsert({
      ip,
      fail_count: lock ? 0 : count,
      locked_until: lock ? new Date(now.getTime() + LOCK_MINUTES * 60000).toISOString() : null,
    });
  if (error) throw new Error(`로그인 실패 기록 실패: ${error.message}`);
  return lock ? { locked: true } : { locked: false, remaining: MAX_FAILS - count };
}

/** 로그인에 성공하면 실패 기록을 지운다 */
export async function clearLoginFailures(ip: string): Promise<void> {
  const { error } = await db().from("login_attempts").delete().eq("ip", ip);
  if (error) throw new Error(`로그인 기록 지우기 실패: ${error.message}`);
}
