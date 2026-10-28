// Supabase 접속 (서버 전용) — CLAUDE.md 9장 "Supabase 사용 규칙"
// 서버 키는 RLS를 건너뛰므로 브라우저로 절대 보내지 않는다. 이 파일은 server-only로 막아 둔다.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** 서버 키로 접속한 Supabase 클라이언트 (요청마다 새로 만들지 않고 하나를 같이 쓴다) */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL 또는 SUPABASE_SECRET_KEY가 .env에 없습니다");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
