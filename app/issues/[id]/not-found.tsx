// 없는 이슈 번호로 들어왔을 때. Design Ref: DESIGN.md §6.4

import Link from "next/link";

export default function IssueNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">이슈를 찾을 수 없습니다</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        삭제되었거나 주소가 잘못되었을 수 있습니다.
      </p>
      <Link href="/" className="text-sm font-medium underline">
        이슈 목록으로 돌아가기
      </Link>
    </main>
  );
}
