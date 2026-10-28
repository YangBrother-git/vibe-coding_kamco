// 이슈에 연결된 자료 목록. [삭제]는 PLAN 작업 28에서 연결하므로 지금은 비활성 상태로 둔다.
// Design Ref: DESIGN.md §6.2, §6.4 (파일명 · 보고일 · 분류 이유 · 삭제)

import type { IssueDetail } from "@/lib/data";

export function DocumentList({ documents }: { documents: IssueDetail["documents"] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-zinc-500">연결된 자료가 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {documents.map(({ document, link }) => (
        <li
          key={document.id}
          className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{document.fileName}</p>
            <p className="text-sm text-zinc-500">
              보고일 {document.reportDate}
              {document.reportDateIsUpload && " (업로드일)"} · 관련도 {link.score}점
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              분류 이유: {link.reason}
            </p>
          </div>
          <button
            type="button"
            disabled
            className="shrink-0 self-start rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  );
}
