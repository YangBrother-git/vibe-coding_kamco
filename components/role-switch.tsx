// 팀원/팀장 전환 스위치. 누르면 role 쿠키를 바꾸고 화면을 다시 그린다.
// Design Ref: DESIGN.md D6, D14, §6.3

import { setRole } from "@/app/actions";
import { getRole } from "@/lib/role";
import type { Role } from "@/lib/types";

const OPTIONS: { value: Role; label: string }[] = [
  { value: "member", label: "팀원" },
  { value: "lead", label: "팀장" },
];

export async function RoleSwitch() {
  const current = await getRole();

  return (
    <div
      role="group"
      aria-label="역할 선택"
      className="inline-flex shrink-0 rounded-full border border-zinc-300 p-0.5 text-sm dark:border-zinc-700"
    >
      {OPTIONS.map(({ value, label }) => {
        const selected = value === current;
        return (
          <form key={value} action={setRole.bind(null, value)}>
            <button
              type="submit"
              aria-pressed={selected}
              disabled={selected}
              className={
                selected
                  ? "rounded-full bg-zinc-900 px-3 py-1 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "rounded-full px-3 py-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }
            >
              {label}
            </button>
          </form>
        );
      })}
    </div>
  );
}

// 쿠키를 읽는 동안 같은 자리를 차지하는 빈 틀 (레이아웃이 흔들리지 않게)
export function RoleSwitchFallback() {
  return (
    <div className="inline-flex h-[34px] w-[112px] shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800" />
  );
}
