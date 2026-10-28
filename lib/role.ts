// 현재 역할(팀장/팀원)을 쿠키에서 읽는다. 로그인이 아니라 화면 표시 구분일 뿐이다(D6).
// 쿠키가 없거나 값이 이상하면 팀원으로 본다(D14).
// cookies()는 요청 때만 알 수 있는 값이므로, 이 함수를 부르는 컴포넌트는 <Suspense> 안에 둔다.

import "server-only";
import { cookies } from "next/headers";
import type { Role } from "./types";

export const ROLE_COOKIE = "role";

export function isRole(value: unknown): value is Role {
  return value === "lead" || value === "member";
}

export async function getRole(): Promise<Role> {
  const value = (await cookies()).get(ROLE_COOKIE)?.value;
  return isRole(value) ? value : "member";
}
