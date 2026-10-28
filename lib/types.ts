// 서비스 전체에서 쓰는 데이터 모델 타입.
// Design Ref: DESIGN.md §3.1 (DB 스키마는 §3.3과 1:1로 대응한다)

export type Role = "lead" | "member";
export type DocumentStatus = "pending" | "classified" | "unclassified";

export interface Issue {
  id: string;
  name: string; // 20자 이내 명사형
  needsRegeneration: boolean; // 삭제·반려 후 갱신안 재생성 실패 시 true
  createdAt: string;
  updatedAt: string;
}

export interface ReportDocument {
  id: string;
  fileName: string;
  contentHash: string; // 원본 바이트 SHA-256 (브라우저 계산)
  text: string; // 개인정보 가린 추출 글
  digest: string | null; // 요점 메모 1,000자 이내 (분류 때 생성, D9)
  reportDate: string; // YYYY-MM-DD
  reportDateIsUpload: boolean; // true면 화면에 "(업로드일)" 표시
  status: DocumentStatus;
  failureReason: string | null;
  uploadedAt: string;
}

export interface IssueDocumentLink {
  issueId: string;
  documentId: string;
  score: number; // 0~100, 70 이상만 저장
  reason: string; // 분류 이유 1문장
}

export interface TimelineItem {
  date: string; // 보고 날짜
  dateIsUpload: boolean;
  text: string; // 2문장 이내
  sources: { fileName: string; date: string }[];
  tag: "변경 전" | "불일치" | null;
}

export interface Summary {
  id: string;
  issueId: string;
  kind: "approved" | "draft";
  currentStatus: string; // 3문장 이내, 불일치 시 "자료 간 내용 불일치 — 확인 필요" 포함
  timeline: TimelineItem[];
  documentIds: string[]; // 이 정리본을 만든 자료들
  includesDeleted: boolean; // 확정본에 삭제된 자료 내용이 남아 있음 (D10)
  createdAt: string;
  approvedAt: string | null;
}

export interface Rejection {
  id: string;
  issueId: string;
  documentIds: string[];
  reason: string; // 1문장
  correctedIssueName: string | null;
  createdAt: string;
}
