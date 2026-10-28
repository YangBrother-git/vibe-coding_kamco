// 이슈 정리본 화면. 갱신안 내용은 팀장에게만, 팀원에게는 "승인 대기 중" 안내만 보여 준다(D14).
// Design Ref: DESIGN.md §6.2 — params·역할 쿠키는 런타임 데이터이므로 Suspense 안에서 읽는다(Cache Components).

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DocumentList } from "@/components/document-list";
import { DraftReviewPanel } from "@/components/draft-review-panel";
import { RoleSwitch, RoleSwitchFallback } from "@/components/role-switch";
import { SummaryView } from "@/components/summary-view";
import { getIssueDetail } from "@/lib/data";
import { getRole } from "@/lib/role";

export default function IssuePage({ params }: PageProps<"/issues/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← 목록으로
        </Link>
        <Suspense fallback={<RoleSwitchFallback />}>
          <RoleSwitch />
        </Suspense>
      </div>
      <Suspense fallback={<p className="text-zinc-500">정리본을 불러오는 중…</p>}>
        {params.then(({ id }) => (
          <IssueContent id={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function IssueContent({ id }: { id: string }) {
  const [detail, role] = await Promise.all([getIssueDetail(id), getRole()]);
  if (!detail) notFound();

  const { issue, approved, draft, documents } = detail;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{issue.name}</h1>

      {draft && role === "lead" && <DraftReviewPanel draft={draft} expanded={!approved} />}

      {draft && role === "member" && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          승인 대기 중인 갱신안이 있습니다. 승인되기 전까지는 직전에 확정된 정리본을 보여 줍니다.
        </p>
      )}

      {issue.needsRegeneration && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          갱신안을 만들지 못했습니다.
        </p>
      )}

      {approved?.includesDeleted && (
        <p className="rounded-lg border border-zinc-300 bg-zinc-100 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          삭제된 자료 내용이 포함되어 있습니다 — 새 갱신안 승인 시 해소
        </p>
      )}

      {approved ? (
        <SummaryView summary={approved} />
      ) : (
        <p className="text-zinc-500">아직 승인된 정리본이 없습니다.</p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">연결된 자료</h2>
        <DocumentList documents={documents} />
      </section>
    </>
  );
}
