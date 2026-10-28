// 이슈 목록 화면. 업로드 버튼(작업 11)은 이후 작업에서 머리 영역에 추가한다.
// Design Ref: DESIGN.md §6.1

import { Suspense } from "react";
import { IssueCard } from "@/components/issue-card";
import { RoleSwitch, RoleSwitchFallback } from "@/components/role-switch";
import { UnclassifiedList } from "@/components/unclassified-list";
import { getIssueList, getUnclassifiedDocuments } from "@/lib/data";

export default async function Home() {
  const [issues, unclassified] = await Promise.all([
    getIssueList(),
    getUnclassifiedDocuments(),
  ]);
  const draftCount = issues.filter((i) => i.hasDraft).length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">주요이슈 총정리</h1>
          <Suspense fallback={<RoleSwitchFallback />}>
            <RoleSwitch />
          </Suspense>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          기획관리팀 보고자료를 이슈별로 모아 최신 현황과 흐름을 보여 줍니다.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">이슈 목록</h2>
          <span className="text-sm text-zinc-500">승인 대기 {draftCount}건</span>
        </div>
        {issues.length === 0 ? (
          <p className="text-sm text-zinc-500">
            아직 이슈가 없습니다. 보고자료를 올리면 이슈가 만들어집니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {issues.map((item) => (
              <li key={item.issue.id}>
                <IssueCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">미분류 자료</h2>
        <UnclassifiedList documents={unclassified} />
      </section>
    </main>
  );
}
