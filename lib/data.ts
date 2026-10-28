// 화면이 읽는 데이터 조회 함수. 지금은 가짜 데이터를 읽고,
// PLAN 작업 9에서 같은 모양을 돌려주는 lib/db 조회로 바꾼다.

import { mockDocuments, mockIssues, mockLinks, mockSummaries } from "./mock-data";
import type { Issue, IssueDocumentLink, ReportDocument, Summary } from "./types";

export interface IssueListItem {
  issue: Issue;
  statusPreview: string | null; // 확정본 현재 현황의 첫 문장, 확정본이 없으면 null
  hasDraft: boolean;
  documentCount: number;
}

// 문장 끝: . ? ! 뒤에 공백이나 끝이 올 때 (숫자 사이 점은 제외) — DESIGN.md §5.2
export function firstSentence(text: string): string {
  const match = text.match(/^.*?[.?!](?=\s|$)/);
  return (match ? match[0] : text).trim();
}

export async function getIssueList(): Promise<IssueListItem[]> {
  return [...mockIssues]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((issue) => {
      const approved = mockSummaries.find(
        (s) => s.issueId === issue.id && s.kind === "approved",
      );
      return {
        issue,
        statusPreview: approved ? firstSentence(approved.currentStatus) : null,
        hasDraft: mockSummaries.some(
          (s) => s.issueId === issue.id && s.kind === "draft",
        ),
        documentCount: mockLinks.filter((l) => l.issueId === issue.id).length,
      };
    });
}

export interface IssueDetail {
  issue: Issue;
  approved: Summary | null;
  draft: Summary | null;
  documents: { document: ReportDocument; link: IssueDocumentLink }[]; // 보고일 순
}

export async function getIssueDetail(id: string): Promise<IssueDetail | null> {
  const issue = mockIssues.find((i) => i.id === id);
  if (!issue) return null;

  const summaryOf = (kind: Summary["kind"]) =>
    mockSummaries.find((s) => s.issueId === id && s.kind === kind) ?? null;

  const documents = mockLinks
    .filter((l) => l.issueId === id)
    .flatMap((link) => {
      const document = mockDocuments.find((d) => d.id === link.documentId);
      return document ? [{ document, link }] : [];
    })
    .sort((a, b) => a.document.reportDate.localeCompare(b.document.reportDate));

  return { issue, approved: summaryOf("approved"), draft: summaryOf("draft"), documents };
}

export async function getUnclassifiedDocuments(): Promise<ReportDocument[]> {
  return mockDocuments
    .filter((d) => d.status === "unclassified")
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
