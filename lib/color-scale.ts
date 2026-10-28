// 건수 → 색 단계 (DESIGN 2.1 ④⑤ / PRD 5장 must ①)
// 모든 주에 같은 고정 구간을 써서, 주차를 넘겨도 색만 보고 추이를 비교할 수 있게 한다.
// 실제 색은 app/globals.css의 --heat-0 ~ --heat-4 변수에 있다.

import type { ColorLevel } from "./types";

/** 색 단계 하나의 구간과 범례 글자 */
export type ColorBand = {
  level: ColorLevel;
  /** 이 단계에 드는 가장 작은 건수 */
  min: number;
  /** 이 단계에 드는 가장 큰 건수, 마지막 단계는 끝이 없음(null) */
  max: number | null;
  /** 범례에 보여 줄 글자 */
  label: string;
  /** 칸 배경·글자색 Tailwind 클래스 (globals.css의 색 변수를 씀) */
  className: string;
};

/** 고정 구간 5단계: 0 / 1~5 / 6~20 / 21~50 / 51 이상 */
export const COLOR_BANDS: readonly ColorBand[] = [
  { level: 0, min: 0, max: 0, label: "0건", className: "bg-heat-0 text-heat-0-fg" },
  { level: 1, min: 1, max: 5, label: "1~5건", className: "bg-heat-1 text-heat-1-fg" },
  { level: 2, min: 6, max: 20, label: "6~20건", className: "bg-heat-2 text-heat-2-fg" },
  { level: 3, min: 21, max: 50, label: "21~50건", className: "bg-heat-3 text-heat-3-fg" },
  { level: 4, min: 51, max: null, label: "51건 이상", className: "bg-heat-4 text-heat-4-fg" },
];

/** 건수 → 색 단계 */
export function toColorLevel(count: number): ColorLevel {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`건수가 올바르지 않습니다: ${count}`);
  }
  if (count === 0) return 0;
  if (count <= 5) return 1;
  if (count <= 20) return 2;
  if (count <= 50) return 3;
  return 4;
}

/** 건수 → 칸에 붙일 색 클래스 */
export function heatClassName(count: number): string {
  return COLOR_BANDS[toColorLevel(count)].className;
}
