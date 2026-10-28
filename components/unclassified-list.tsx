// 이슈 목록 화면 아래의 미분류 자료 목록.
// [다시 분류]·[삭제]는 PLAN 작업 27·28에서 연결하므로 지금은 비활성 상태로 둔다.
// Design Ref: DESIGN.md §6.1, §6.4

import type { ReportDocument } from "@/lib/types";

export function UnclassifiedList({ documents }: { documents: ReportDocument[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-zinc-500">미분류 자료가 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{doc.fileName}</p>
            <p className="text-sm text-zinc-500">사유: {doc.failureReason ?? "분류되지 않음"}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
            >
              다시 분류
            </button>
            <button
              type="button"
              disabled
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
            >
              삭제
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
