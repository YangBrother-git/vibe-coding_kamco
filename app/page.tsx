// 이슈 목록 화면 자리. 실제 목록·미분류 영역은 PLAN 작업 4에서 만든다.
// Design Ref: DESIGN.md §6.1

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">주요이슈 총정리</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        기획관리팀 보고자료를 이슈별로 모아 최신 현황과 흐름을 보여 줍니다.
      </p>
    </main>
  );
}
