"use client";

// 회계연도 선택 (DESIGN 2.1 ①)
// 메뉴에는 데이터가 있는 회계연도와 올해가 나온다. 고르면 주소(?fy=)가 바뀌고,
// 주차는 그 회계연도의 가장 최근 성공 주로 다시 잡힌다 (지역 선택은 유지).

import { useRouter } from "next/navigation";

export type FiscalYearOption = {
  year: number;
  /** 이 회계연도를 보는 주소 */
  href: string;
};

export function FiscalYearSelect({
  options,
  selected,
  currentYear,
}: {
  options: FiscalYearOption[];
  selected: number;
  currentYear: number;
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">회계연도</span>
      <select
        value={selected}
        onChange={(event) => {
          const option = options.find((o) => o.year === Number(event.target.value));
          if (option) router.push(option.href, { scroll: false });
        }}
        className="rounded border border-zinc-300 bg-background px-2 py-1 dark:border-zinc-700"
      >
        {options.map((option) => (
          <option key={option.year} value={option.year}>
            {option.year}
            {option.year === currentYear ? " (올해)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
