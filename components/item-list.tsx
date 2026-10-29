// 칸을 누르면 보이는 물건 목록 (PLAN 작업 32, nice / PRD 4장 확장 고려)
// 저장한 5가지 항목(물건번호·지역본부·용도·유찰 횟수·수집일)만 보여 준다.
// 한 칸에 1,000건이 넘을 수 있어 처음 200건만 보여 주고 나머지는 건수로 알린다.

import Link from "next/link";
import type { AuctionItem } from "@/lib/types";

const SHOW_LIMIT = 200;

export function ItemList({
  title,
  items,
  closeHref,
}: {
  /** 예: `서울동부지역본부 · 토지 · 유찰 5회 이상` */
  title: string;
  items: AuctionItem[];
  /** 목록을 닫는 주소 */
  closeHref: string;
}) {
  const shown = items.slice(0, SHOW_LIMIT);
  return (
    <section aria-label="물건 목록" className="flex flex-col gap-2 rounded border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">
          {title} <span className="text-zinc-500">· {items.length.toLocaleString()}건</span>
        </h3>
        <Link href={closeHref} scroll={false} className="text-sm text-zinc-500 underline">
          닫기
        </Link>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background text-zinc-500">
            <tr>
              <th scope="col" className="px-2 py-1 text-left font-medium">물건관리번호</th>
              <th scope="col" className="px-2 py-1 text-left font-medium">지역본부</th>
              <th scope="col" className="px-2 py-1 text-left font-medium">용도</th>
              <th scope="col" className="px-2 py-1 text-right font-medium">유찰</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.itemNo} className="border-t border-zinc-100 dark:border-zinc-900">
                <td className="px-2 py-1 font-mono tabular-nums">{item.itemNo}</td>
                <td className="px-2 py-1">{item.regionOffice ?? "-"}</td>
                <td className="px-2 py-1">{item.category ?? "-"}</td>
                <td className="px-2 py-1 text-right tabular-nums">{item.failCount}회</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">
        {items.length > SHOW_LIMIT ? `처음 ${SHOW_LIMIT}건만 보여 줍니다 · ` : ""}
        물건관리번호로 온비드에서 검색하면 상세 내용을 볼 수 있습니다
      </p>
    </section>
  );
}
