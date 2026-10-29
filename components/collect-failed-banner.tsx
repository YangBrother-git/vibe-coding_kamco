"use client";

// 수집 실패 안내 (DESIGN 2.1 ②, 3.3)
// 이번 주가 금요일까지 모두 실패했을 때만, 그 주 일요일까지 히트맵 위쪽에 보인다.
// "지금 다시 가져오기"를 누르면 지역본부 12곳을 1곳씩 차례로 받는다(한 곳에 20~35초).
// 12곳이 모이면 실패한 그 주로 저장되고, 화면이 새로 그려지며 이 안내가 사라진다.

import { useState, useTransition } from "react";
import { retryCollect } from "@/app/actions";

export function CollectFailedBanner({ weekLabel }: { weekLabel: string }) {
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);

  function retry() {
    startTransition(async () => {
      setProgress("지역본부 12곳 중 첫 곳을 받는 중…");
      // 12곳 + 확정까지 넉넉히 되풀이하되, 실패하면 바로 멈춘다
      for (let step = 0; step < 14; step++) {
        const state = await retryCollect();
        if (state.status === "staged") {
          setProgress(`${state.office}까지 받음 (${state.staged}/${state.total}) · 다음 곳을 받는 중…`);
          continue;
        }
        if (state.status === "saved") {
          setProgress(`저장했습니다 (${state.items.toLocaleString()}건)`);
        } else if (state.status === "failed") {
          setProgress(`${state.office}에서 실패했습니다. 잠시 뒤 다시 눌러 주세요. (${state.message})`);
        } else {
          setProgress(state.message);
        }
        return;
      }
    });
  }

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
        {progress ? (
          <p className="text-sm font-medium" aria-live="polite">
            {progress}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={retry}
        disabled={pending}
        className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "가져오는 중…" : "지금 다시 가져오기"}
      </button>
    </div>
  );
}
