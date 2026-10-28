// 팀장에게만 보이는 승인 대기 갱신안 패널.
// 승인·반려 버튼과 입력칸은 자리만 잡아 두고, PLAN 작업 25·26에서 동작을 연결한다.
// Design Ref: DESIGN.md §6.2, §6.4, D14

import { SummaryView } from "@/components/summary-view";
import type { Summary } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900";
const buttonClass =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-700";

export function DraftReviewPanel({
  draft,
  expanded,
}: {
  draft: Summary;
  expanded: boolean; // 확정본이 없는 새 이슈면 펼친 상태로 보여 준다
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
        승인 대기 중인 갱신안이 있습니다
      </p>

      <details open={expanded} className="rounded-md bg-white p-4 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium">갱신안 미리보기</summary>
        <div className="mt-4">
          <SummaryView summary={draft} />
        </div>
      </details>

      <div className="flex flex-col gap-3">
        <button type="button" disabled className={`${buttonClass} self-start`}>
          승인
        </button>
        <div className="flex flex-col gap-2">
          <input
            disabled
            placeholder="반려 사유 (1문장)"
            aria-label="반려 사유"
            className={inputClass}
          />
          <input
            disabled
            placeholder="올바른 이슈 이름 (선택, 20자 이내)"
            aria-label="올바른 이슈 이름"
            maxLength={20}
            className={inputClass}
          />
          <button type="button" disabled className={`${buttonClass} self-start`}>
            반려
          </button>
        </div>
      </div>
    </section>
  );
}
