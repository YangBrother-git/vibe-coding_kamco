// 이슈 목록의 카드 한 장. 누르면 이슈 정리본 화면으로 이동한다.
// Design Ref: DESIGN.md §6.1, §6.4 (이름 · 현황 첫 문장 · 승인 대기 배지 · 자료 수)

import Link from "next/link";
import type { IssueListItem } from "@/lib/data";

export function IssueCard({ item }: { item: IssueListItem }) {
  const { issue, statusPreview, hasDraft, documentCount } = item;

  return (
    <Link
      href={`/issues/${issue.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{issue.name}</h3>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          {hasDraft && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              승인 대기
            </span>
          )}
          <span className="text-zinc-500">자료 {documentCount}건</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {statusPreview ?? "승인 대기 중"}
      </p>
    </Link>
  );
}
