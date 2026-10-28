"use server";

// Server Actions. 승인·반려·삭제·재분류·갱신안 재생성은 이후 작업에서 이 파일에 추가한다.
// Design Ref: DESIGN.md §4.1

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { ROLE_COOKIE, isRole } from "@/lib/role";

export async function setRole(role: string) {
  if (!isRole(role)) return;
  (await cookies()).set(ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });
  refresh();
}
