// 정리본(현재 현황 + 날짜순 흐름) 표시. 확정본과 갱신안 미리보기(작업 6)에서 함께 쓴다.
// Design Ref: DESIGN.md §6.2, §6.4 (불일치 강조 · 날짜/(업로드일) · 출처 · "변경 전" 태그)

import type { Summary, TimelineItem } from "@/lib/types";

const MISMATCH_TEXT = "자료 간 내용 불일치 — 확인 필요";

function Tag({ tag }: { tag: TimelineItem["tag"] }) {
  if (!tag) return null;
  const style =
    tag === "불일치"
      ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${style}`}>{tag}</span>;
}

export function SummaryView({ summary }: { summary: Summary }) {
  const hasMismatch = summary.currentStatus.includes(MISMATCH_TEXT);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">현재 현황</h2>
        <p
          className={
            hasMismatch
              ? "rounded-lg border border-red-300 bg-red-50 p-4 leading-7 dark:border-red-900 dark:bg-red-950/40"
              : "leading-7"
          }
        >
          {summary.currentStatus}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">흐름</h2>
        <ol className="flex flex-col gap-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
          {summary.timeline.map((item, index) => (
            <li key={index} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <time dateTime={item.date} className="font-medium">
                  {item.date}
                  {item.dateIsUpload && " (업로드일)"}
                </time>
                <Tag tag={item.tag} />
              </div>
              <p className="leading-7">{item.text}</p>
              <p className="text-sm text-zinc-500">
                출처:{" "}
                {item.sources.map((s) => `${s.fileName} (${s.date})`).join(", ")}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
