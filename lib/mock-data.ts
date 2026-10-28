// 화면 모양을 먼저 확인하기 위한 가짜 데이터. PLAN 작업 9에서 Supabase 조회로 바꾼다.
// 민감 정보 없는 예시 내용만 넣는다 (PRD 7장).
// Design Ref: DESIGN.md §3.1 타입, §6 화면이 보여 줄 상태(승인 대기·변경 전·불일치·업로드일·미분류)를 한 번씩 담는다.

import type {
  Issue,
  IssueDocumentLink,
  Rejection,
  ReportDocument,
  Summary,
} from "./types";

export const mockIssues: Issue[] = [
  {
    id: "issue-budget",
    name: "2027년 예산 편성",
    needsRegeneration: false,
    createdAt: "2026-09-15T09:00:00+09:00",
    updatedAt: "2026-10-27T17:20:00+09:00",
  },
  {
    id: "issue-reorg",
    name: "조직개편 추진",
    needsRegeneration: false,
    createdAt: "2026-10-06T14:00:00+09:00",
    updatedAt: "2026-10-14T10:05:00+09:00",
  },
  {
    id: "issue-office",
    name: "청사 이전 검토",
    needsRegeneration: false,
    createdAt: "2026-10-21T11:30:00+09:00",
    updatedAt: "2026-10-21T11:40:00+09:00",
  },
];

export const mockDocuments: ReportDocument[] = [
  {
    id: "doc-budget-0915",
    fileName: "2027년_예산편성_주간보고_0915.docx",
    contentHash: "a1f3c9e2b7d04f6a8c1e5b9d2f7a3c6e0b4d8f1a2c5e7b9d0f3a6c8e1b4d7f2a",
    text: "2027년 예산 편성 지침이 시달되어 부서별 요구안 작성을 시작함. 요구안 제출 기한은 10월 10일.",
    digest: "9/15: 예산 편성 지침 시달, 부서별 요구안 작성 시작. 제출 기한 10/10.",
    reportDate: "2026-09-15",
    reportDateIsUpload: false,
    status: "classified",
    failureReason: null,
    uploadedAt: "2026-09-15T09:00:00+09:00",
  },
  {
    id: "doc-budget-1006",
    fileName: "예산협의_회의결과_1006.pdf",
    contentHash: "b2e4d0f3c8a15e7b9d2f6c0a4e8b1d5f3a7c9e2b6d0f4a8c1e5b3d7f9a2c6e0b",
    text: "부서 요구안 총액이 전년 대비 12% 증가함. 조직개편에 따른 인건비 증가분 반영 여부는 추후 결정.",
    digest: "10/6: 요구 총액 전년 대비 12% 증가. 조직개편 인건비 반영 여부 미정.",
    reportDate: "2026-10-06",
    reportDateIsUpload: false,
    status: "classified",
    failureReason: null,
    uploadedAt: "2026-10-06T14:00:00+09:00",
  },
  {
    id: "doc-reorg-1013-a",
    fileName: "조직개편_현안보고_1013.hwpx",
    contentHash: "c3f5e1a4d9b26f8c0e3a7d1b5f9c2e6a4b8d0f3c7e1a5d9b2f6c0e4a8d1b3f7c",
    text: "조직개편안은 2개 과 통합으로 확정함. 시행일은 2027년 1월 1일.",
    digest: "10/13: 2개 과 통합안 확정, 시행일 2027-01-01.",
    reportDate: "2026-10-13",
    reportDateIsUpload: false,
    status: "classified",
    failureReason: null,
    uploadedAt: "2026-10-13T16:00:00+09:00",
  },
  {
    id: "doc-reorg-1013-b",
    fileName: "조직개편_검토안_1013.pptx",
    contentHash: "d4a6f2b5e0c37a9d1f4b8e2c6a0d3f7b5c9e1a4d8f2b6c0e3a7d9f1b5c8e2a4d",
    text: "조직개편안은 3개 과 통합을 검토 중. 시행일은 2027년 3월 1일 예정.",
    digest: "10/13: 3개 과 통합 검토 중, 시행일 2027-03-01 예정.",
    reportDate: "2026-10-13",
    reportDateIsUpload: false,
    status: "classified",
    failureReason: null,
    uploadedAt: "2026-10-14T10:00:00+09:00",
  },
  {
    id: "doc-budget-1027",
    fileName: "예산_2차조정_주간보고_1027.docx",
    contentHash: "e5b7a3c6f1d48b0e2a5c9f3d7b1e4a8c6d0f2b5e9a3c7d1f4b8e0a6c2d9f3b5e",
    text: "2차 조정 결과 요구 총액 증가율을 8%로 낮춤. 조직개편 인건비는 반영하기로 함.",
    digest: "10/27: 2차 조정으로 증가율 8%로 하향. 조직개편 인건비 반영 결정.",
    reportDate: "2026-10-27",
    reportDateIsUpload: false,
    status: "classified",
    failureReason: null,
    uploadedAt: "2026-10-27T17:15:00+09:00",
  },
  {
    id: "doc-office-memo",
    fileName: "청사이전_메모.txt",
    contentHash: "f6c8b4d7a2e59c1f3b6d0a4e8c2f5b9d7e1a3c6f0b4d8e2a5c9f1b7d3e0a6c4f",
    text: "청사 이전 후보지 2곳 현장 확인 예정. 담당자 연락처 ***.",
    digest: "청사 이전 후보지 2곳 현장 확인 예정.",
    reportDate: "2026-10-21",
    reportDateIsUpload: true,
    status: "classified",
    failureReason: null,
    uploadedAt: "2026-10-21T11:30:00+09:00",
  },
  {
    id: "doc-unclassified-1027",
    fileName: "회의결과_1027.pdf",
    contentHash: "07d9c5e8b3f6ad2a4c7e1b5f9d3a6c0e8f2b4d7a1c5e9b3f6d0a2c8e4b7f1d5a",
    text: "10월 27일 팀 회의 결과. 안건별 논의 내용 정리.",
    digest: null,
    reportDate: "2026-10-27",
    reportDateIsUpload: true,
    status: "unclassified",
    failureReason: "분류에 실패했습니다. 다시 시도해 주세요",
    uploadedAt: "2026-10-27T18:00:00+09:00",
  },
];

export const mockLinks: IssueDocumentLink[] = [
  { issueId: "issue-budget", documentId: "doc-budget-0915", score: 95, reason: "2027년 예산 편성 지침과 요구안 작성 일정을 다룬다." },
  { issueId: "issue-budget", documentId: "doc-budget-1006", score: 92, reason: "부서 요구안 총액 협의 결과를 보고한다." },
  { issueId: "issue-reorg", documentId: "doc-budget-1006", score: 74, reason: "조직개편에 따른 인건비 반영 여부를 언급한다." },
  { issueId: "issue-reorg", documentId: "doc-reorg-1013-a", score: 97, reason: "조직개편 확정안과 시행일을 보고한다." },
  { issueId: "issue-reorg", documentId: "doc-reorg-1013-b", score: 93, reason: "조직개편 검토안의 통합 범위와 시행일을 다룬다." },
  { issueId: "issue-budget", documentId: "doc-budget-1027", score: 94, reason: "예산 2차 조정 결과를 보고한다." },
  { issueId: "issue-office", documentId: "doc-office-memo", score: 88, reason: "청사 이전 후보지 현장 확인 계획을 담고 있다." },
];

export const mockSummaries: Summary[] = [
  // 예산: 확정본 + 새 자료(10/27)로 만든 승인 대기 갱신안
  {
    id: "sum-budget-approved",
    issueId: "issue-budget",
    kind: "approved",
    currentStatus:
      "부서별 요구안이 모두 제출되어 협의가 진행 중이다. 요구 총액은 전년 대비 12% 증가했다. 조직개편 인건비 반영 여부는 아직 정해지지 않았다.",
    timeline: [
      {
        date: "2026-09-15",
        dateIsUpload: false,
        text: "2027년 예산 편성 지침이 시달되었다. 부서별 요구안 제출 기한은 10월 10일이다.",
        sources: [{ fileName: "2027년_예산편성_주간보고_0915.docx", date: "2026-09-15" }],
        tag: null,
      },
      {
        date: "2026-10-06",
        dateIsUpload: false,
        text: "요구 총액이 전년 대비 12% 증가했다. 조직개편 인건비 반영 여부는 추후 결정하기로 했다.",
        sources: [{ fileName: "예산협의_회의결과_1006.pdf", date: "2026-10-06" }],
        tag: null,
      },
    ],
    documentIds: ["doc-budget-0915", "doc-budget-1006"],
    includesDeleted: false,
    createdAt: "2026-10-06T14:01:00+09:00",
    approvedAt: "2026-10-07T09:30:00+09:00",
  },
  {
    id: "sum-budget-draft",
    issueId: "issue-budget",
    kind: "draft",
    currentStatus:
      "2차 조정으로 요구 총액 증가율을 8%로 낮췄다. 조직개편 인건비는 반영하기로 결정했다.",
    timeline: [
      {
        date: "2026-09-15",
        dateIsUpload: false,
        text: "2027년 예산 편성 지침이 시달되었다. 부서별 요구안 제출 기한은 10월 10일이다.",
        sources: [{ fileName: "2027년_예산편성_주간보고_0915.docx", date: "2026-09-15" }],
        tag: null,
      },
      {
        date: "2026-10-06",
        dateIsUpload: false,
        text: "요구 총액이 전년 대비 12% 증가했다. 조직개편 인건비 반영 여부는 추후 결정하기로 했다.",
        sources: [{ fileName: "예산협의_회의결과_1006.pdf", date: "2026-10-06" }],
        tag: "변경 전",
      },
      {
        date: "2026-10-27",
        dateIsUpload: false,
        text: "2차 조정으로 증가율을 8%로 낮췄다. 조직개편 인건비는 반영하기로 했다.",
        sources: [{ fileName: "예산_2차조정_주간보고_1027.docx", date: "2026-10-27" }],
        tag: null,
      },
    ],
    documentIds: ["doc-budget-0915", "doc-budget-1006", "doc-budget-1027"],
    includesDeleted: false,
    createdAt: "2026-10-27T17:20:00+09:00",
    approvedAt: null,
  },
  // 조직개편: 같은 날짜 자료끼리 내용이 달라 불일치 표시
  {
    id: "sum-reorg-approved",
    issueId: "issue-reorg",
    kind: "approved",
    currentStatus:
      "조직개편안의 통합 범위와 시행일이 자료마다 다르다. 자료 간 내용 불일치 — 확인 필요.",
    timeline: [
      {
        date: "2026-10-06",
        dateIsUpload: false,
        text: "조직개편에 따른 인건비 증가분의 예산 반영 여부를 추후 결정하기로 했다.",
        sources: [{ fileName: "예산협의_회의결과_1006.pdf", date: "2026-10-06" }],
        tag: null,
      },
      {
        date: "2026-10-13",
        dateIsUpload: false,
        text: "2개 과 통합안이 확정되었고 시행일은 2027년 1월 1일이다.",
        sources: [{ fileName: "조직개편_현안보고_1013.hwpx", date: "2026-10-13" }],
        tag: "불일치",
      },
      {
        date: "2026-10-13",
        dateIsUpload: false,
        text: "3개 과 통합을 검토 중이며 시행일은 2027년 3월 1일 예정이다.",
        sources: [{ fileName: "조직개편_검토안_1013.pptx", date: "2026-10-13" }],
        tag: "불일치",
      },
    ],
    documentIds: ["doc-budget-1006", "doc-reorg-1013-a", "doc-reorg-1013-b"],
    includesDeleted: false,
    createdAt: "2026-10-14T10:05:00+09:00",
    approvedAt: "2026-10-14T15:00:00+09:00",
  },
  // 청사 이전: 본문에 보고일이 없어 업로드일 사용
  {
    id: "sum-office-approved",
    issueId: "issue-office",
    kind: "approved",
    currentStatus: "청사 이전 후보지 2곳의 현장 확인이 예정되어 있다. 일정은 자료에 없음.",
    timeline: [
      {
        date: "2026-10-21",
        dateIsUpload: true,
        text: "청사 이전 후보지 2곳을 현장 확인하기로 했다.",
        sources: [{ fileName: "청사이전_메모.txt", date: "2026-10-21" }],
        tag: null,
      },
    ],
    documentIds: ["doc-office-memo"],
    includesDeleted: false,
    createdAt: "2026-10-21T11:40:00+09:00",
    approvedAt: "2026-10-21T13:00:00+09:00",
  },
];

export const mockRejections: Rejection[] = [];
