// Supabase 접속 객체. 서버에서만, service role(비밀) 키로만 접근한다(D3).
// 브라우저 코드에서 import하면 빌드가 실패하도록 server-only로 막는다.
// Design Ref: DESIGN.md §2.3, CLAUDE.md 9장

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      ".env에 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다 (PLAN 작업 7).",
    );
  }

  client = createClient(url, key, {
    // 로그인 기능이 없으므로 세션을 저장·갱신하지 않는다.
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
