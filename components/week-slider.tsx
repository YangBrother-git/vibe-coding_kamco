"use client";

// 주차 슬라이더 (DESIGN 2.1 ⑥)
// 회계연도 안의 "성공한 주"에만 멈춘다. 수집 안 된 주·실패한 주·재시도 중인 주는 목록에 없으므로 건너뛴다.
// 고른 주차는 주소(?week=)에 담는다. 끌고 있는 동안에는 글자만 바뀌고, 손을 뗀 뒤 잠시 후 화면을 바꾼다.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type WeekOption = {
  weekNo: number;
  /** 예: `43주차 (10.19~10.25)` */
  label: string;
  /** 이 주를 보는 주소 (지역 선택은 유지) */
  href: string;
};

export function WeekSlider({ weeks, selected }: { weeks: WeekOption[]; selected: number }) {
  const router = useRouter();
  const selectedIndex = Math.max(
    0,
    weeks.findIndex((week) => week.weekNo === selected),
  );
  // 앞·뒤 버튼이나 뒤로 가기로 주차가 바뀌면, 화면 쪽에서 key를 바꿔 이 위치를 새로 잡는다
  const [index, setIndex] = useState(selectedIndex);

  // 슬라이더를 움직이고 0.3초 동안 멈추면 그 주로 이동
  useEffect(() => {
    if (index === selectedIndex) return;
    const timer = setTimeout(() => router.push(weeks[index].href, { scroll: false }), 300);
    return () => clearTimeout(timer);
  }, [index, selectedIndex, weeks, router]);

  if (weeks.length === 0) return null;
  const prev = weeks[selectedIndex - 1];
  const next = weeks[selectedIndex + 1];
  const navClass =
    "rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="week-slider" className="text-sm text-zinc-500">
          주차
        </label>
        <span className="text-sm font-medium tabular-nums">{weeks[index].label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs tabular-nums text-zinc-500">{weeks[0].weekNo}주</span>
        <input
          id="week-slider"
          type="range"
          min={0}
          max={weeks.length - 1}
          step={1}
          value={index}
          disabled={weeks.length === 1}
          onChange={(event) => setIndex(Number(event.target.value))}
          aria-valuetext={weeks[index].label}
          className="min-w-0 flex-1 accent-zinc-900 dark:accent-zinc-100"
        />
        <span className="text-xs tabular-nums text-zinc-500">{weeks[weeks.length - 1].weekNo}주</span>
        {prev ? (
          <Link href={prev.href} scroll={false} className={navClass} aria-label="이전 주">
            ◀
          </Link>
        ) : (
          <span className={`${navClass} opacity-40`} aria-hidden="true">
            ◀
          </span>
        )}
        {next ? (
          <Link href={next.href} scroll={false} className={navClass} aria-label="다음 주">
            ▶
          </Link>
        ) : (
          <span className={`${navClass} opacity-40`} aria-hidden="true">
            ▶
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500">수집에 성공한 주만 멈춥니다 · 빠진 주와 실패한 주는 건너뜁니다</p>
    </div>
  );
}
