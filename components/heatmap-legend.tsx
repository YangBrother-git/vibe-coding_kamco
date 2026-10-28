// 색 범례 (DESIGN 2.1 ⑤)
// 5단계 색이 각각 몇 건인지 보여 준다. 모든 주에 같은 기준이다.

import { COLOR_BANDS } from "@/lib/color-scale";

export function HeatmapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <span className="text-zinc-500">범례 (물건 수)</span>
      <ul className="flex flex-wrap gap-2">
        {COLOR_BANDS.map((band) => (
          <li key={band.level} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`inline-block h-4 w-6 rounded ${band.className}`} />
            <span>{band.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
