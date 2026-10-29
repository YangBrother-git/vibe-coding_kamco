"use client";

// 비밀번호 입력 칸 (DESIGN 2.2)
// 맞으면 원래 가려던 주소로, 틀리면 남은 기회를, 5번 틀리면 10분 차단 안내를 보여 준다.

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1 text-sm">
        <span>비밀번호</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="rounded border border-zinc-300 bg-background px-3 py-2 text-base dark:border-zinc-700"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "확인하는 중…" : "들어가기"}
      </button>
      {state ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
