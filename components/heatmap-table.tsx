// 히트맵 표 (DESIGN 2.1 ④)
// 세로 = 용도 대분류(+ 맨 아래 "기타"), 가로 = 유찰 0회~5회 이상 6칸, 칸마다 물건 수.
// 칸 색은 모든 주에 같은 고정 구간 5단계 (lib/color-scale.ts).

import type { HeatmapTable as HeatmapTableData } from "@/lib/aggregate";
import { heatClassName } from "@/lib/color-scale";
import { FAIL_BUCKETS } from "@/lib/types";

const BUCKET_LABELS = FAIL_BUCKETS.map((bucket) => (bucket === 5 ? "5회 이상" : `${bucket}회`));

export function HeatmapTable({ table }: { table: HeatmapTableData }) {
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
              {row.counts.map((count, bucket) => (
                <td
                  key={bucket}
                  className={`rounded px-2 py-2 text-center font-medium tabular-nums ${heatClassName(count)}`}
                >
                  {count}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
