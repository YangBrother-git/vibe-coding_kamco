// 지역 선택 메뉴 (DESIGN 2.1 ③)
// 맨 위 "전국 합계", 그 아래 지역본부(유찰 1회 이상 건수가 많은 순, 같으면 가나다순), 맨 아래 "기타".
// 줄마다 유찰 1회 이상 건수와 비율을 보여 준다. 정렬은 lib/aggregate.ts의 summarizeRegions가 한다.
// 고른 지역은 주소(?region=)에 담겨 새로고침해도 유지된다.
// 넓은 화면에서는 표 왼쪽 목록, 좁은 화면에서는 표 위의 펼침 메뉴로 보인다.

import Link from "next/link";
import type { RegionSummary } from "@/lib/aggregate";

export type RegionLink = RegionSummary & { href: string };

function failedText(summary: RegionSummary): string {
  const ratio = summary.failedRatio === null ? "-" : `${Math.round(summary.failedRatio * 100)}%`;
  return `${summary.failedCount}건 · ${ratio}`;
}

function RegionItems({ regions, selected }: { regions: RegionLink[]; selected: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {regions.map((region) => {
        const active = region.region === selected;
        return (
          <li key={region.region}>
            <Link
              href={region.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-baseline justify-between gap-3 rounded px-3 py-2 text-sm ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="font-medium">{region.region}</span>
              <span className={`tabular-nums ${active ? "" : "text-zinc-500"}`}>{failedText(region)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function RegionList({ regions, selected }: { regions: RegionLink[]; selected: string }) {
  const current = regions.find((region) => region.region === selected);
  return (
    <nav aria-label="지역 선택">
      {/* 넓은 화면: 표 왼쪽 목록 */}
      <div className="hidden md:block">
        <p className="mb-2 px-3 text-xs text-zinc-500">유찰 1회 이상 · 비율 (건수 많은 순)</p>
        <RegionItems regions={regions} selected={selected} />
      </div>
      {/* 좁은 화면: 표 위 펼침 메뉴 */}
      <details className="rounded border border-zinc-200 md:hidden dark:border-zinc-800">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
          지역: {selected}
          {current ? <span className="ml-2 font-normal text-zinc-500">{failedText(current)}</span> : null}
        </summary>
        <div className="border-t border-zinc-200 p-1 dark:border-zinc-800">
          <RegionItems regions={regions} selected={selected} />
        </div>
      </details>
    </nav>
  );
}
