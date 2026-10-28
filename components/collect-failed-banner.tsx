// 수집 실패 안내 (DESIGN 2.1 ②)
// 이번 주가 금요일까지 모두 실패했을 때만, 그 주 일요일까지 히트맵 위쪽에 보인다.
// "지금 다시 가져오기" 버튼은 PLAN 작업 21에서 실제 수집에 연결한다. 지금은 자리만 둔다.

export function CollectFailedBanner({ weekLabel }: { weekLabel: string }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
    >
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold">⚠ 이번 주 수집 실패</p>
        <p className="text-sm opacity-80">
          {weekLabel} 월~금 자동 수집이 모두 실패했습니다. 일요일까지 다시 가져올 수 있습니다.
        </p>
      </div>
      <button
        type="button"
        disabled
        title="다시 가져오기 기능은 준비 중입니다"
        className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        지금 다시 가져오기
      </button>
    </div>
  );
}
