// 비밀번호 화면 (PLAN 작업 23 / DESIGN 2.2)
// 잠금을 풀지 않은 상태로 어떤 주소에 들어가도 proxy.ts가 이 화면으로 보낸다.

import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { safeNext } from "@/lib/auth";

// 돌아갈 주소(?next=)를 읽는 부분. Cache Components 규칙상 <Suspense> 안에서 읽는다.
async function Form({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  return <LoginForm next={safeNext(typeof params.next === "string" ? params.next : null)} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h1 className="text-lg font-semibold">온비드 압류재산 매각현황</h1>
        <Suspense fallback={null}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
