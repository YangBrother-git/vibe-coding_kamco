// 잠금 검사 (PLAN 작업 23·25 / DESIGN 2.2, 8장) — Next.js 16에서 middleware 대신 proxy
// 잠금 쿠키가 없거나 무효이면 비밀번호 화면(/login)으로 보낸다.
// 예외: /api/collect(예약 실행이 비밀값으로 부름), /login, robots.txt, 정적 파일
// 서버 동작은 이 검사만 믿지 않고 동작 안에서 다시 확인한다 (app/actions.ts).

import { NextResponse, type NextRequest } from "next/server";
import { LOCK_COOKIE, isUnlocked } from "@/lib/auth";

export function proxy(request: NextRequest) {
  if (isUnlocked(request.cookies.get(LOCK_COOKIE)?.value)) return NextResponse.next();

  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!api/collect|login|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
