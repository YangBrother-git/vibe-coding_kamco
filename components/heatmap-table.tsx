// 히트맵 표 (DESIGN 2.1 ④)
// 세로 = 용도 대분류(+ 맨 아래 "기타"), 가로 = 유찰 0회~5회 이상 6칸, 칸마다 물건 수.
// 칸 색은 모든 주에 같은 고정 구간 5단계 (lib/color-scale.ts).
// 물건이 있는 칸은 눌러서 그 칸의 물건 목록을 열 수 있다 (PLAN 작업 32).

import Link from "next/link";
import type { HeatmapTable as HeatmapTableData } from "@/lib/aggregate";
import { heatClassName } from "@/lib/color-scale";
import { FAIL_BUCKETS, type FailBucket } from "@/lib/types";

const BUCKET_LABELS = FAIL_BUCKETS.map((bucket) => (bucket === 5 ? "5회 이상" : `${bucket}회`));

export function HeatmapTable({
  table,
  cellHref,
  selected,
}: {
  table: HeatmapTableData;
  /** 칸을 눌렀을 때 갈 주소 (없으면 누를 수 없음) */
  cellHref?: (category: string, bucket: FailBucket) => string;
  /** 지금 목록이 열린 칸 */
  selected?: { category: string; bucket: FailBucket } | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-separate border-spacing-1 text-sm">
        <caption className="sr-only">
          {table.region} 용도별 유찰 횟수 히트맵, 전체 {table.total}건
        </caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-1 text-left font-medium text-zinc-500">
              용도
            </th>
            {BUCKET_LABELS.map((label) => (
              <th key={label} scope="col" className="px-2 py-1 text-center font-medium text-zinc-500">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.category}>
              <th scope="row" className="whitespace-nowrap px-2 py-2 text-left font-medium">
                {row.category}
              </th>
              {row.counts.map((count, i) => {
                const bucket = FAIL_BUCKETS[i];
                const active = selected?.category === row.category && selected.bucket === bucket;
                return (
                  <td
                    key={bucket}
                    className={`rounded text-center font-medium tabular-nums ${heatClassName(count)} ${active ? "ring-2 ring-foreground" : ""}`}
                  >
                    {cellHref && count > 0 ? (
                      <Link
                        href={cellHref(row.category, bucket)}
                        scroll={false}
                        aria-label={`${row.category} 유찰 ${BUCKET_LABELS[i]} ${count}건 목록 ${active ? "닫기" : "보기"}`}
                        className="block px-2 py-2 hover:underline"
                      >
                        {count}
                      </Link>
                    ) : (
                      <span className="block px-2 py-2">{count}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
