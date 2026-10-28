# DESIGN — 주요이슈 총정리 서비스 (issue-summary)

> PDCA 사이클 1 · Design 단계 · 작성일 2026-10-28 · 상태: Draft
> 기준 문서: [PRD.md](PRD.md) → [PLAN.md](PLAN.md) → 이 문서. 규칙은 [CLAUDE.md](CLAUDE.md)를 따른다.

## 한눈에 보기 (비개발자용 요약)

> 아래 세 가지(화면 구성 · 데이터 흐름 · 기술 선택)만 읽어도 무엇을 어떻게 만드는지 알 수 있게 정리했다. 자세한 내용은 그 아래 각 장에 있다.

### ① 화면 구성 — 무엇이 어디에 보이는가

화면은 **두 개**뿐이다.

| 화면 | 위치 | 보이는 것 |
|---|---|---|
| **이슈 목록** (첫 화면 `/`) | 맨 위 | 서비스 이름, 팀원/팀장 전환 스위치, [보고자료 올리기] 버튼 |
| | 그 아래 | 업로드 결과 안내 (어느 이슈로 분류됐는지, 또는 실패 사유) |
| | 가운데 | 이슈 카드 목록 — 이슈 이름, 현재 현황 첫 문장, "승인 대기" 배지, 자료 수 |
| | 맨 아래 | 미분류 자료 목록 — 파일명, 사유, [다시 분류] [삭제] 버튼 |
| **이슈 정리본** (`/issues/이슈번호`) | 맨 위 | ← 목록으로, 이슈 이름, 팀원/팀장 전환 스위치 |
| | 그 아래 (팀장에게만) | 승인 대기 갱신안 미리보기 + [승인] [반려] 버튼, 반려 사유·올바른 이슈 이름 입력칸 |
| | 가운데 | **현재 현황** (3문장 이내) |
| | 그 아래 | **흐름** — 날짜순 항목, 항목마다 출처(파일명·날짜), "변경 전" 표시 |
| | 맨 아래 | 연결된 자료 목록 — 파일명, 보고일, 분류 이유, [삭제] 버튼 |

배치 그림은 6장에 있다.

### ② 데이터 흐름 — 입력 → 처리 → 출력

**1) 보고자료 올리기 (가장 중요한 흐름)**

| 단계 | 어디서 | 하는 일 |
|---|---|---|
| **입력** | 내 컴퓨터 브라우저 | 보고자료 파일 선택 (HWPX·DOCX·PPTX·PDF·TXT, 20MB 이하) |
| 처리 ① | 브라우저 | 파일에서 **글자만** 꺼내고, 주민번호·전화번호를 `***`로 가림. **원본 파일은 여기서 끝** — 인터넷으로 나가지 않는다 |
| 처리 ② | 서버 → 데이터베이스 | 같은 자료를 이미 올렸는지 확인하고, 글을 "처리 중" 상태로 먼저 저장 |
| 처리 ③ | 서버 → AI | AI가 기존 이슈마다 관련도 점수(0~100)를 매겨 70점 이상 최대 3개에 연결, 없으면 새 이슈 생성, 이유 1문장과 요점 메모 작성 |
| 처리 ④ | 서버 → AI | 연결된 이슈마다 정리본 **갱신안**(승인 대기)을 만듦 |
| 처리 ⑤ | 서버 → 데이터베이스 | 분류 결과·갱신안 저장, 상태를 "분류됨"으로 변경 (중간에 실패하면 "미분류") |
| **출력** | 이슈 목록 화면 | "○○ 이슈로 분류됨", 해당 이슈에 "승인 대기" 배지 (전체 1분 이내) |

**2) 팀장 승인·반려**

| 단계 | 내용 |
|---|---|
| **입력** | 팀장이 정리본 화면에서 [승인] 또는 [반려](사유 + 선택적으로 올바른 이슈 이름) |
| 처리 | 승인 → 갱신안을 확정본으로 교체 / 반려 → 갱신안 버리고, 이슈 이름을 적었으면 그 이슈로 다시 분류, 안 적었으면 미분류로 이동 |
| **출력** | 정리본 화면이 즉시 바뀜, 목록의 배지 갱신 |

**3) 팀원 열람**

| 단계 | 내용 |
|---|---|
| **입력** | 이슈 목록에서 이슈 카드 클릭 |
| 처리 | 데이터베이스에서 그 이슈의 **확정본**을 읽음 (승인 전 갱신안은 팀원에게 보이지 않음) |
| **출력** | 현재 현황 + 날짜순 흐름 + 출처 |

### ③ 기술 선택 — Vercel 배포를 전제로

**기본: Next.js** (이미 설치됨, 16.4.3)
- 화면과 서버 쪽 코드를 한 프로젝트에서 함께 만드는 틀이다. Vercel이 직접 만든 도구라 Part 5에서 **설정 없이 그대로 배포**된다.

**추가로 쓰는 기술**

| 기술 | 쉬운 설명 (한 줄) | 상태 |
|---|---|---|
| **TypeScript** | 코드의 오타·실수를 실행 전에 잡아 주는 맞춤법 검사기 같은 것. | 설치됨 |
| **Tailwind CSS** | 화면의 색·간격·글자 크기를 미리 정해진 이름표로 빠르게 꾸미는 도구. | 설치됨 |
| **Supabase** | 이슈·자료·정리본을 보관하는 인터넷 위의 엑셀 창고(데이터베이스). | 추가 예정 |
| **OpenAI API** | 자료를 읽고 이슈를 분류하고 정리본을 써 주는 AI 두뇌. | 추가 예정 |
| **JSZip** | HWPX·DOCX·PPTX 파일은 사실 압축 파일이라, 압축을 풀어 글자를 꺼내는 도구. | 추가 예정 |
| **pdf.js** | PDF 파일에서 글자를 꺼내는 도구(파이어폭스 브라우저가 쓰는 것과 같음). | 추가 예정 |
| **Zod** | AI의 답이 약속한 형식(점수·문장 수 등)대로 왔는지 검사하는 검수원. | 추가 예정 |
| **server-only** | 비밀 키가 든 코드가 실수로 사용자 브라우저로 새어 나가지 않게 막는 자물쇠. | 추가 예정 |
| **Vercel** | 완성된 서비스를 인터넷 주소로 올려 누구나 접속하게 해 주는 곳. | Part 5 |

**Vercel 배포를 위해 미리 맞춘 점**

| Vercel의 제약 | 우리 대응 |
|---|---|
| 서버가 한 번에 받는 크기가 약 4.5MB로 제한됨 | 20MB 파일을 그대로 보내지 않고, 브라우저에서 **글자만** 꺼내 보낸다 |
| 서버 작업 시간이 길면 중간에 끊길 수 있음 | 전체 처리를 1분 안에 끝내도록 설계하고, 허용 시간을 70초 이상으로 설정한다 |
| 서버에 파일을 오래 보관할 수 없음 | 원래 원본을 보관하지 않으므로 문제없음. 데이터는 Supabase에 둔다 |
| 비밀 키를 코드에 넣으면 안 됨 | 키는 `.env`(내 컴퓨터)와 Vercel 환경변수 설정 화면에만 넣는다 |

---

## Context Anchor

| Key | Value |
|---|---|
| **WHY** | 흩어진 보고자료 때문에 이슈 현황 파악이 느리고, 팀원마다 아는 정보의 시점이 다르다. |
| **WHO** | 기획관리팀 팀원(업로드·열람)과 팀장(추가로 승인·반려) |
| **RISK** | 20MB 업로드와 배포 환경 크기 제한 · HWPX/PPTX 추출 품질 · AI 분류 정확도 90% 미달 |
| **SUCCESS** | 분류 정확도 18/20 이상 · 갱신안 1분 이내 · 현황 파악 5분 이내 |
| **SCOPE** | A 바탕 → B 화면 → C 저장소 → D 업로드·추출 → E 분류 → F 정리본·승인 → G 배포·검증 → H nice |

## 확정된 결정 (Decision Record)

| # | 결정 | 선택 | 이유 |
|---|---|---|---|
| D1 | 코드 구조 | **C 균형형**: `app/`은 얇게, 로직은 `lib/` 관심사별 | 규모에 비해 과하지 않으면서 분류·정리 로직을 화면과 분리할 수 있다 |
| D2 | 20MB 업로드 | **브라우저에서 글 추출**, 서버에는 글(text)만 전송 | 원본이 서버로 가지 않아 PRD의 "원본 보관 안 함"에 가장 잘 맞고, Vercel 요청 크기 제한(약 4.5MB)도 피한다 |
| D3 | 저장소 | Supabase Postgres, 서버에서 service role로만 접근 | 로그인 없음 → 브라우저 직접 접근 차단(RLS on, 공개 정책 없음) |
| D4 | AI | OpenAI, JSON 구조화 응답 + 코드 검증 | 점수·문장 수·글자 수 규칙을 코드로 강제한다 |
| D5 | 갱신안 생성 방식 | 이슈에 연결된 **모든 자료로 매번 새로 생성** | "대기 중 새 자료 합치기", "삭제 후 재생성"이 같은 함수 하나로 해결된다 |
| D6 | 역할 구분 | `role` 쿠키(`lead` / `member`) + 화면 상단 전환 스위치 | 로그인 없이 역할만 구분(PRD 비범위 준수). 보안 장치가 아니라 표시 구분이다 |
| D7 | 데이터 갱신 | 캐시(`"use cache"`) 미사용, 페이지는 매 요청 DB 조회 | 데이터가 자주 바뀌고 규모가 작다. 변경 후 Server Action은 `refresh()`, 업로드 후에는 `router.refresh()` |
| D8 | 1분 제한 | 요청 한 건 전체에 **60초 마감 하나**. 모든 AI 호출(재요청 포함)은 남은 시간 안에서만 실행 | PRD "1분 이내 갱신안", "1분 넘기면 실패"를 호출별이 아닌 전체 기준으로 지킨다 |
| D9 | 정리본 입력 | 분류 때 자료별 **요점 메모(digest, 1,000자 이내)**를 만들어 저장하고, 정리본은 메모만으로 생성 | 자료가 늘어도 AI 입력이 작게 유지되어 빠르고 저렴하다 |
| D10 | 삭제 후 확정본 | 삭제된 자료가 확정본에 포함되어 있으면 확정본에 "삭제된 자료 포함" 표시. 다음 승인 때 해제 | 갱신안이 반려되어도 확정본이 오래된 내용임을 알 수 있다 |
| D11 | 빈 이슈 | 연결된 자료가 0건이 된 이슈는 확정본이 있어도 자동 삭제 | 정리본의 근거 자료가 모두 사라졌으므로 남길 이유가 없다 |
| D12 | 이름 없이 반려 | 대상 자료 중 **다른 이슈에도 연결되지 않은 자료만** 미분류로 보낸다. 다른 이슈에 연결된 자료는 그 이슈에 그대로 둔다 | 자료가 최대 3개 이슈에 연결되므로, 한 이슈의 반려가 다른 이슈의 올바른 분류까지 지우지 않게 PRD를 해석한 것 |
| D13 | 새 이슈 이름 중복 | 기존 이슈와 이름이 같으면 AI에 다른 이름을 1회 다시 요청, 그래도 같으면 뒤에 ` (2)`, ` (3)`… | 이미 70점 미만인 기존 이슈에 억지로 끼워 넣지 않는다(PRD) |
| D14 | 갱신안 열람 | 승인 대기 갱신안은 **팀장만** 본다. 팀원에게는 "승인 대기 중" 표시만. 역할 쿠키가 없으면 기본은 팀원 | PRD "승인 전에는 직전 확정본을 계속 보여준다" |

---

## 1. 개요

### 1.1 설계 목표
- 업로드 → 분류 → 갱신안 생성을 **1분 이내**에 끝낸다.
- PRD의 AI 규칙을 프롬프트에만 맡기지 않고 **코드에서 검증**한다.
- 원본 파일은 브라우저 밖으로 나가지 않는다.

### 1.2 설계 원칙
- 화면(`app/`)은 데이터를 보여 주고 액션을 호출하는 일만 한다. 규칙은 `lib/`에 둔다.
- 서버 전용 모듈(`lib/db`, `lib/ai`, `lib/pipeline`)은 `import "server-only"`로 보호한다.
- PRD 안내 문구는 `lib/messages.ts` 한곳에 상수로 모아 그대로 쓴다.

## 2. 아키텍처

### 2.0 설계안 비교 (Checkpoint 3 결과)

| 기준 | A 최소형 | B 정석 계층형 | **C 균형형 (선택)** |
|---|:-:|:-:|:-:|
| 방식 | 로직을 route 파일에 직접 | domain/application/infra 분리 | app 얇게 + lib 관심사별 |
| 새 파일 수 | 약 12 | 약 40 | 약 25 |
| 복잡도 | 낮음 | 높음 | 중간 |
| 유지보수 | 낮음 | 높음 | 높음 |

### 2.1 구성도

```
┌──────────────── 브라우저 ────────────────┐
│ UploadButton (client)                    │
│  ├ 형식·20MB 검사                         │
│  ├ lib/extract/*  → 글 추출 (원본은 여기서 끝) │
│  ├ lib/mask.ts    → 개인정보 *** 가리기     │
│  └ SHA-256 해시 계산                       │
└──────────┬───────────────────────────────┘
           │ POST /api/documents {fileName, contentHash, text}
┌──────────▼──────────── 서버 (Next.js) ─────┐
│ route.ts → lib/pipeline/ingest.ts          │
│   ├ lib/db       (Supabase, service role)   │
│   ├ lib/ai/classify.ts   (OpenAI, 공유 마감) │
│   └ lib/ai/summarize.ts  (OpenAI, 공유 마감) │
│ Server Actions: 승인·반려·삭제·재분류·역할   │
└──────────┬────────────────────┬───────────┘
           ▼                    ▼
     Supabase Postgres       OpenAI API
```

### 2.2 업로드 데이터 흐름

```
파일 선택
→ [브라우저] 형식·크기 검사 ─실패→ 안내
→ [브라우저] 글 추출 ─읽을 수 없음→ "글자를 읽을 수 없는 파일입니다 (사유: …)"
→ [브라우저] 개인정보 가리기 + 해시 계산 → 원본 참조 해제
→ [서버] 중복 검사 ─중복→ "이미 올린 자료입니다"
→ [서버] documents 저장 (status = pending, 보고일은 일단 업로드일 + report_date_is_upload = true) · 60초 마감 시작 (D8)
→ [서버] 분류 + 요점 메모 생성 (기존 이슈 목록 + 글) ─실패/마감 초과→ status = unclassified + "분류에 실패했습니다. 다시 시도해 주세요"
→ [서버] 연결·요점 메모 저장 (70점 이상 최대 3개, 없으면 새 이슈 1개)
→ [서버] 연결된 이슈마다 갱신안 재생성 (병렬, 남은 시간 안에서) ─실패→ 연결 되돌리고, 이번에 새로 만든 이슈는 삭제(D11), unclassified + 같은 안내
→ status = classified → 응답 → 화면 refresh
```

- 분류에 성공하면 AI가 찾은 보고일로 `report_date`를 갱신한다(없으면 업로드일 유지).
- `retryClassify`(미분류 다시 분류)도 같은 흐름과 실패 처리를 따른다.
- 서버 처리는 `try/finally`로 감싸, 어떤 예외가 나도 `pending`으로 남기지 않고 `unclassified`로 마무리한다.

시간 배분 기준: 분류 + 요점 메모 최대 25초, 갱신안 생성 최대 30초, 나머지는 DB 처리 여유. 재요청은 남은 시간이 10초 이상일 때만 한다.

### 2.3 의존성 (설치 예정 패키지)

| 패키지 | 위치 | 용도 |
|---|---|---|
| `@supabase/supabase-js` | 서버 | DB 접근 |
| `openai` | 서버 | 분류·정리 |
| `zod` | 서버 | AI 응답·요청 본문 검증 |
| `server-only` | 서버 | 서버 모듈 보호 |
| `jszip` | 브라우저 | DOCX·PPTX·HWPX(모두 zip 안의 XML) 열기 |
| `pdfjs-dist` | 브라우저 | PDF 글 추출, 암호 감지 |

CLAUDE.md 6장에 따라 각 패키지는 해당 작업 시점에 사용자에게 알리고 설치한다.

## 3. 데이터 모델

### 3.1 타입 (`lib/types.ts`)

```ts
export type Role = "lead" | "member";
export type DocumentStatus = "pending" | "classified" | "unclassified";

export interface Issue {
  id: string;
  name: string;              // 20자 이내 명사형
  needsRegeneration: boolean; // 삭제·반려 후 갱신안 재생성 실패 시 true
  createdAt: string;
  updatedAt: string;
}

export interface ReportDocument {
  id: string;
  fileName: string;
  contentHash: string;       // 원본 바이트 SHA-256 (브라우저 계산)
  text: string;              // 개인정보 가린 추출 글
  digest: string | null;     // 요점 메모 1,000자 이내 (분류 때 생성, D9)
  reportDate: string;        // YYYY-MM-DD
  reportDateIsUpload: boolean; // true면 화면에 "(업로드일)" 표시
  status: DocumentStatus;
  failureReason: string | null;
  uploadedAt: string;
}

export interface IssueDocumentLink {
  issueId: string;
  documentId: string;
  score: number;             // 0~100, 70 이상만 저장
  reason: string;            // 분류 이유 1문장
}

export interface TimelineItem {
  date: string;              // 보고 날짜
  dateIsUpload: boolean;
  text: string;              // 2문장 이내
  sources: { fileName: string; date: string }[];
  tag: "변경 전" | "불일치" | null;
}

export interface Summary {
  id: string;
  issueId: string;
  kind: "approved" | "draft";
  currentStatus: string;     // 3문장 이내, 불일치 시 "자료 간 내용 불일치 — 확인 필요" 포함
  timeline: TimelineItem[];
  documentIds: string[];     // 이 정리본을 만든 자료들
  includesDeleted: boolean;  // 확정본에 삭제된 자료 내용이 남아 있음 (D10)
  createdAt: string;
  approvedAt: string | null;
}

export interface Rejection {
  id: string;
  issueId: string;
  documentIds: string[];
  reason: string;            // 1문장
  correctedIssueName: string | null;
  createdAt: string;
}
```

### 3.2 관계

```
[Issue] 1 ── N [IssueDocumentLink] N ── 1 [ReportDocument]
   │
   ├── 0..1 [Summary kind=approved]   (확정본)
   ├── 0..1 [Summary kind=draft]      (승인 대기 갱신안)
   └── N    [Rejection]
```

### 3.3 DB 스키마 (`supabase/migrations/0001_init.sql` 초안)

```sql
create table issues (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) <= 20),
  needs_regeneration boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  content_hash text not null,
  text text not null,
  digest text check (char_length(digest) <= 1000),
  report_date date not null,                  -- 처음엔 업로드일로 저장, 분류 후 본문 보고일로 갱신
  report_date_is_upload boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending','classified','unclassified')),
  failure_reason text,
  uploaded_at timestamptz not null default now(),
  unique (file_name, content_hash)            -- 중복 업로드 차단
);

create table issue_documents (
  issue_id uuid not null references issues(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  score int not null check (score between 70 and 100),
  reason text not null,
  primary key (issue_id, document_id)
);

create table summaries (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  kind text not null check (kind in ('approved','draft')),
  current_status text not null,
  timeline jsonb not null default '[]',
  document_ids uuid[] not null default '{}',
  includes_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (issue_id, kind)                      -- 확정본 1개, 갱신안 1개
);

create table rejections (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  document_ids uuid[] not null,
  reason text not null,
  corrected_issue_name text,
  created_at timestamptz not null default now()
);

alter table issues          enable row level security;
alter table documents       enable row level security;
alter table issue_documents enable row level security;
alter table summaries       enable row level security;
alter table rejections      enable row level security;
-- 공개(anon) 정책은 만들지 않는다. 서버의 service role만 접근한다.
```

## 4. API / 서버 액션

### 4.1 목록

| 종류 | 이름 | 하는 일 | 역할 |
|---|---|---|---|
| Route Handler | `POST /api/documents` | 글 업로드 → 중복 검사 → 분류 → 갱신안 생성 | 모두 |
| Server Action | `approveDraft(issueId)` | 갱신안 → 확정본 | 팀장 |
| Server Action | `rejectDraft(issueId, reason, correctedIssueName?)` | 반려 기록 → 재분류 또는 미분류 | 팀장 |
| Server Action | `retryClassify(documentId)` | 미분류 자료 다시 분류 | 모두 |
| Server Action | `deleteDocument(documentId)` | 자료 삭제 → 연결 이슈 갱신안 재생성 | 모두 |
| Server Action | `regenerateDraft(issueId)` | "재생성 필요" 이슈의 갱신안 다시 만들기 | 모두 |
| Server Action | `setRole(role)` | `role` 쿠키 변경 | 모두 |

업로드만 Route Handler로 하는 이유: 추출 글이 Server Action 기본 본문 제한(1MB)을 넘을 수 있다. 나머지는 작은 요청이라 Server Action으로 하고 끝에 `refresh()`를 호출한다.

### 4.2 `POST /api/documents`

**Request**
```json
{ "fileName": "2026년 예산 편성 주간보고.docx", "contentHash": "sha256-hex", "text": "…추출·마스킹된 글…" }
```
- `text`는 서버에서 최대 **3MB**로 제한한다(Vercel 본문 제한 이내). AI에는 자료당 앞 **50,000자**까지 보낸다.

**Response 201**
```json
{ "data": { "documentId": "uuid", "status": "classified",
  "links": [{ "issueId": "uuid", "issueName": "2027년 예산 편성", "score": 86, "reason": "…" }] } }
```

**오류**
| 상태 | code | 안내 문구 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 요청 형식 오류 |
| 409 | `DUPLICATE` | 이미 올린 자료입니다 |
| 502 | `AI_FAILED` | 분류에 실패했습니다. 다시 시도해 주세요 |

`AI_FAILED`여도 자료는 `unclassified`로 저장되어 미분류 목록에 나타난다.
`DUPLICATE`·`AI_FAILED` 문구는 PRD 그대로이고, `VALIDATION_ERROR` 문구는 PRD에 없어 `lib/messages.ts`에서 정한다.

### 4.3 반려 처리 상세 (`rejectDraft`)

0. 입력 검사: 사유는 필수·**200자 이내·문장 끝 기호(`.` `?` `!`) 1개 이하**(1문장 기준), `correctedIssueName`은 앞뒤 공백 제거 후 **1~20자**. 어기면 반려하지 않고 안내
1. 대상 자료 = `draft.document_ids` 중 확정본에 없던 자료. `rejections`에 사유·대상 자료 저장
2. 갱신안 삭제
3. **대상 자료가 없으면**(삭제로 생긴 갱신안 등) 여기서 끝낸다. 확정본은 그대로 두고, 삭제된 자료가 들어 있으면 "삭제된 자료 포함" 표시가 유지된다(D10).
4. 대상 자료와 이 이슈의 연결 삭제
5. `correctedIssueName`이 있으면 → 그 이름의 이슈(없으면 생성)에 연결(점수 100, 이유 "팀장 반려 시 지정") → 그 이슈 갱신안 재생성
6. 없으면 → 다른 이슈 연결이 하나도 없는 자료는 `unclassified`로 변경(사유 "반려: {사유}", D12)
7. 이 이슈에 연결 자료가 0건이면 이슈 삭제(D11)
8. 5의 재생성이 실패하면 그 이슈에 `needs_regeneration = true`

### 4.4 삭제 처리 상세 (`deleteDocument`)

1. 자료가 연결된 이슈 목록을 구한 뒤 자료 삭제(연결은 cascade로 함께 삭제)
2. 각 이슈의 확정본 `document_ids`에 이 자료가 있으면 `includes_deleted = true`
3. 각 이슈: 남은 자료가 0건이면 확정본·갱신안과 함께 이슈 삭제(D11), 남은 자료가 있으면 갱신안 재생성
4. 재생성이 실패한 이슈는 `needs_regeneration = true` → 정리본 화면에 [갱신안 다시 만들기] 버튼
5. 승인(`approveDraft`) 시 `includes_deleted = false`, `needs_regeneration = false`로 되돌린다.

## 5. AI 설계

### 5.1 분류 (`lib/ai/classify.ts`)

- **입력**: 기존 이슈 목록(`id`, `name`, 확정본 현재 현황), 자료 파일명·글
- **출력 JSON (zod 검증)**
```json
{ "scores": [{ "issueId": "uuid", "score": 0, "reason": "1문장" }],
  "newIssue": { "name": "20자 이내 명사형", "reason": "1문장" },
  "reportDate": "YYYY-MM-DD | null",
  "digest": "자료의 날짜·핵심 사실 요점 메모, 1,000자 이내" }
```
- `digest`가 1,000자를 넘으면 잘라서 저장한다. 원문에 없는 내용을 쓰지 않도록 프롬프트에 명시한다.
- **코드 규칙**: `score ≥ 70` 필터 → 점수 내림차순 상위 3개 → 하나도 없으면 `newIssue` 사용(이름 20자 초과 시 다시 요청 1회, 그래도 넘으면 자름) → `reportDate`가 없거나 형식이 틀리면 업로드일 + `reportDateIsUpload = true`
- 새 이슈 이름이 기존 이슈와 같으면 다른 이름을 1회 다시 요청하고, 그래도 같으면 뒤에 ` (2)`, ` (3)`…을 붙인다(20자 이내 유지, D13).
- "명사형"은 프롬프트로만 요구한다. 코드는 글자 수와 `다.`·`요.`로 끝나지 않는지만 검사한다.

### 5.2 정리본 생성 (`lib/ai/summarize.ts`)

- **입력**: 이슈 이름 + 연결된 모든 자료의 **요점 메모**(보고 날짜순, 파일명·날짜·digest). 원문 전체는 보내지 않는다(D9).
- **출력 JSON**: `{ currentStatus, timeline: TimelineItem[] }`
- **프롬프트 규칙**: PRD must 2 규칙 전부(3문장/2문장/출처/자료에 없음/변경 전/불일치)
- **문장 세는 기준**: `.` `?` `!` 뒤에 공백이나 줄 끝이 오면 한 문장으로 센다. 숫자 사이의 점(`2026.10.28`, `3.5%`)은 문장 끝으로 보지 않는다.
- **코드 검증**: 문장 수 초과·출처 누락·출처 파일명이 입력에 없는 경우 → 다시 요청 1회 → 실패 시 오류
- 저장 직전 `lib/mask.ts` 한 번 더 적용

### 5.3 공통
- 요청 시작 시 `deadline = Date.now() + 60_000`을 만들고, 각 AI 호출은 `AbortSignal.timeout(deadline - Date.now())`로 남은 시간만큼만 기다린다(D8). 업로드뿐 아니라 반려·삭제·재생성·재분류 액션에도 같은 방식을 쓴다.
- 모델명은 환경변수 `OPENAI_MODEL`로 두고 기본값은 작업 18에서 정한다.
- 갱신안 생성은 연결된 이슈(최대 3개)를 `Promise.all`로 병렬 처리한다.
- 업로드 route와 액션 파일에 `maxDuration`(70초 이상)을 설정해 배포 환경이 먼저 끊지 않게 한다(작업 29에서 확인).

## 6. 화면 설계

### 6.1 이슈 목록 화면 `/`

```
┌───────────────────────────────────────────────────────┐
│ 주요이슈 총정리            [팀원|팀장]  [＋ 보고자료 올리기] │
├───────────────────────────────────────────────────────┤
│ (업로드 결과 안내 영역)                                  │
├───────────────────────────────────────────────────────┤
│ 이슈 목록                                  승인 대기 2건 │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 2027년 예산 편성             [승인 대기]   자료 4건  │ │
│ │ 현재 현황 첫 문장…                                   │ │
│ └───────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────┤
│ 미분류 자료                                              │
│  · 회의결과_1027.pdf  사유: 분류 실패  [다시 분류] [삭제] │
└───────────────────────────────────────────────────────┘
```

### 6.2 이슈 정리본 화면 `/issues/[id]`

```
┌───────────────────────────────────────────────────────┐
│ ← 목록   2027년 예산 편성                      [팀원|팀장] │
├───────────────────────────────────────────────────────┤
│ ⚠ 승인 대기 갱신안이 있습니다 (팀장에게만 버튼 표시)        │
│   [갱신안 미리보기 펼치기]  [승인]  [반려]                 │
│   반려: 사유(1문장) ____  올바른 이슈 이름(선택) ____      │
├───────────────────────────────────────────────────────┤
│ 현재 현황 (확정본)                                       │
│  …3문장 이내…                                           │
├───────────────────────────────────────────────────────┤
│ 흐름                                                    │
│  2026-10-01  …2문장…   출처: 주간보고_1001.docx (10-01)   │
│  2026-10-15  [변경 전] …  출처: …                        │
├───────────────────────────────────────────────────────┤
│ 연결된 자료                                              │
│  · 주간보고_1001.docx  2026-10-01  분류 이유: …  [삭제]   │
└───────────────────────────────────────────────────────┘
```
- 갱신안 내용과 승인·반려 버튼은 팀장에게만 보인다. 팀원에게는 "승인 대기 중인 갱신안이 있습니다"만 표시한다. 역할 쿠키가 없으면 팀원으로 본다(D14).
- 확정본이 아직 없는 새 이슈는 현재 현황 자리에 "아직 승인된 정리본이 없습니다"를 보여 주고, 팀장에게는 갱신안을 펼친 상태로 보여 준다.
- 확정본에 `includesDeleted`가 있으면 현재 현황 위에 "삭제된 자료 내용이 포함되어 있습니다 — 새 갱신안 승인 시 해소" 안내를 보여 준다.
- `needsRegeneration`이면 "갱신안을 만들지 못했습니다" 안내와 [갱신안 다시 만들기] 버튼을 보여 준다.

### 6.3 컴포넌트

| 컴포넌트 | 위치 | 종류 | 역할 |
|---|---|---|---|
| `RoleSwitch` | `components/role-switch.tsx` | client | 팀원/팀장 전환 (`setRole`) |
| `UploadButton` | `components/upload-button.tsx` | client | 검사·추출·마스킹·해시·업로드·결과 안내 |
| `IssueCard` | `components/issue-card.tsx` | server | 목록 카드 |
| `UnclassifiedList` | `components/unclassified-list.tsx` | server + client 버튼 | 미분류 목록 |
| `SummaryView` | `components/summary-view.tsx` | server | 현재 현황 + 흐름(확정본·갱신안 공용) |
| `DraftReviewPanel` | `components/draft-review-panel.tsx` | client | 승인·반려 폼 |
| `DocumentList` | `components/document-list.tsx` | server + client 버튼 | 연결 자료·삭제 |

`cacheComponents` 환경이므로 DB를 읽는 부분은 `<Suspense>`로 감싸고, 이동 후에도 상태가 남는 `UploadButton`·`DraftReviewPanel`은 완료 시 입력을 직접 초기화한다.

### 6.4 화면 체크리스트 (Gap 분석 기준)

**이슈 목록 `/`**
- [ ] 제목 "주요이슈 총정리"
- [ ] 역할 전환 스위치 (팀원/팀장)
- [ ] 보고자료 올리기 버튼 (accept: .hwpx,.docx,.pptx,.pdf,.txt)
- [ ] 업로드 결과 안내 (성공: 연결된 이슈명 / 실패: 8장 안내 문구)
- [ ] 승인 대기 건수
- [ ] 이슈 카드: 이름, 현재 현황 첫 문장(확정본이 없으면 "승인 대기 중"), 승인 대기 배지, 자료 수
- [ ] 미분류 목록: 파일명, 사유, 다시 분류 버튼, 삭제 버튼 (2분 넘게 `pending`인 자료도 "처리 중 중단됨"으로 표시)
- [ ] 이슈가 없을 때 빈 상태 안내

**이슈 정리본 `/issues/[id]`**
- [ ] 목록으로 돌아가기 링크, 이슈 이름
- [ ] 승인 대기 안내 + (팀장) 승인 버튼, 반려 사유 입력, 올바른 이슈 이름 입력(20자 이내 검사), 반려 버튼
- [ ] 현재 현황(확정본), 불일치 표시 강조
- [ ] "삭제된 자료 포함" 안내 (includesDeleted일 때)
- [ ] "갱신안을 만들지 못했습니다" 안내 + [갱신안 다시 만들기] 버튼 (needsRegeneration일 때)
- [ ] 흐름: 날짜(업로드일 표시 포함), 내용, 출처(파일명·날짜), "변경 전" 태그
- [ ] 연결 자료 목록: 파일명, 보고일, 분류 이유, 삭제 버튼
- [ ] 없는 이슈 id → `not-found`

## 7. 글 추출 설계 (브라우저, `lib/extract/`)

| 형식 | 방법 | 읽을 수 없음 판정 |
|---|---|---|
| TXT | `file.arrayBuffer()` → UTF-8(`fatal`) 시도, 실패 시 EUC-KR 디코딩 | 공백 제거 후 0자 → 빈 파일 |
| PDF | `pdfjs-dist`로 페이지별 텍스트 | 비밀번호 예외 → 암호 / 글자 0자 → 이미지 |
| DOCX | `jszip` → `word/document.xml`의 `w:t` | zip 열기 실패(암호 문서는 zip이 아님) → 암호 / 0자 → 빈 파일 |
| PPTX | `jszip` → `ppt/slides/slide*.xml`의 `a:t` (슬라이드 번호순) | 위와 같음 |
| HWPX | `jszip` → `Contents/section*.xml`의 `hp:t` | zip 열기 실패 → 암호 / `META-INF/manifest.xml`에 암호화 정보가 있으면 → 암호(**빈 파일 판정보다 먼저**) / 0자 → 빈 파일 |

- 반환형: `{ ok: true, text } | { ok: false, reason: "암호" | "이미지" | "빈 파일" }`
- HWPX 암호 판정 방식은 작업 14에서 암호 건 샘플 파일로 실제 구조를 확인한 뒤 확정한다.
- **위험(작업 13)**: `pdfjs-dist`는 브라우저에서 별도 worker 파일 설정이 필요하다. Turbopack 환경에서 worker 경로를 먼저 확인하고, 안 되면 worker 없이 동작하는 설정을 쓴다. 추출 모듈은 업로드할 때만 `import()`로 불러와 첫 화면을 무겁게 하지 않는다.
- 추출 후 `lib/mask.ts` 적용 → 해시는 **원본 바이트**로 계산(같은 파일 판정용)

### 개인정보 가리기 (`lib/mask.ts`, 브라우저·서버 공용)
- 주민등록번호: `\d{6}-?[1-4]\d{6}`
- 휴대전화: `01[016789]-?\d{3,4}-?\d{4}`
- 일반전화: `0\d{1,2}-\d{3,4}-\d{4}`
- 일치하는 부분을 `***`로 바꾼다.

## 8. 오류 처리

| 상황 | 위치 | 사용자 안내 | 처리 |
|---|---|---|---|
| 형식·크기 위반 | 브라우저 | 올릴 수 있는 파일은 HWPX·DOCX·PPTX·PDF·TXT, 20MB 이하입니다 (PRD에 문구가 없어 자체 문구) | 전송 안 함 |
| 읽을 수 없는 파일 | 브라우저 | 글자를 읽을 수 없는 파일입니다 (사유: 암호/이미지/빈 파일) | 전송 안 함 |
| 중복 | 서버 409 | 이미 올린 자료입니다 | 저장 안 함 |
| AI 실패·60초 초과 | 서버 502 | 분류에 실패했습니다. 다시 시도해 주세요 | `unclassified`로 저장 |

오류 응답 형식: `{ "error": { "code": "DUPLICATE", "message": "이미 올린 자료입니다" } }`

**처리 중 멈춤 방지**
- 서버 처리는 `try/finally`로 감싸, 예외가 나면 자료를 `unclassified`(사유: 분류 실패)로 바꾸고 이번에 만든 연결·빈 이슈를 되돌린다.
- 작업이 강제 종료되어 `pending`으로 남은 자료는, 올린 지 2분이 지나면 미분류 목록에 "처리 중 중단됨"으로 표시하고 [다시 분류]·[삭제]를 허용한다. 그래서 중복 검사에 막혀도 사용자가 처리할 수 있다.

## 9. 보안

- [ ] 키는 서버 전용, `NEXT_PUBLIC_` 금지, `server-only`로 서버 모듈 보호
- [ ] Supabase RLS on, 공개 정책 없음
- [ ] 원본 파일은 브라우저 밖으로 나가지 않음(D2)
- [ ] 개인정보는 추출 직후(브라우저) + 저장 직전(서버) 두 번 가림
- [ ] 요청 본문 zod 검증, `text` 3MB 제한
- [ ] 화면 출력은 React 기본 이스케이프만 사용(`dangerouslySetInnerHTML` 금지)
- 한계: 로그인이 없으므로 배포 주소를 아는 사람은 누구나 열람·조작 가능 → 샘플 자료로만 시험(PRD 7장)

## 10. 검증 계획

테스트 도구가 아직 없으므로 CLAUDE.md 7장 검증 루프(lint·build·화면 확인)를 기본으로 하고, 아래 시나리오를 수동/스크립트로 확인한다. 자동 테스트(Playwright 등)는 필요해지면 제안한다.

### 10.1 API (curl)
| # | 요청 | 기대 |
|---|---|---|
| 1 | 정상 글 업로드 | 201, `links` 1~3개 |
| 2 | 같은 `fileName`+`contentHash` 재업로드 | 409 `DUPLICATE` |
| 3 | `text` 누락 | 400 |
| 4 | OpenAI 키를 일부러 틀리게 | 502 `AI_FAILED`, 미분류 목록에 표시 |

### 10.2 화면 시나리오
| # | 시나리오 | 성공 기준 |
|---|---|---|
| 1 | 팀원: TXT 업로드 → 목록에 이슈·승인 대기 배지 | 1분 이내 |
| 2 | 팀장: 정리본 화면에서 승인 | 확정본 즉시 반영, 배지 사라짐 |
| 3 | 팀장: 이슈 이름 적고 반려 | 그 이슈로 재분류, 새 갱신안 |
| 4 | 팀장: 이슈 이름 없이 반려 | 자료가 미분류로 이동 |
| 5 | 암호 PDF / 스캔 PDF / 빈 TXT 업로드 | 사유별 안내 문구 |
| 6 | 자료 삭제 | 연결 이슈들의 갱신안 재생성 |
| 7 | 날짜가 같은데 내용이 다른 자료 2건 | 현황에 "자료 간 내용 불일치 — 확인 필요" |
| 8 | 확정본에 포함된 자료 삭제 → 생긴 갱신안 반려 | 확정본 유지 + "삭제된 자료 포함" 안내, 재분류 없음 |
| 9 | 새 이슈의 갱신안을 이름 없이 반려 | 자료는 미분류로, 빈 이슈는 목록에서 사라짐 |
| 10 | 반려 시 21자 이슈 이름 입력 | 반려되지 않고 20자 이내 안내 |
| 11 | 자료 10건 이상인 이슈에 업로드 | 갱신안이 1분 이내 생성 (요점 메모 사용) |
| 12 | 승인 대기 중인 이슈에 새 자료 업로드 | 갱신안이 하나로 합쳐짐(`document_ids`에 두 자료 모두) |
| 13 | 날짜가 다른 두 자료의 내용이 다름 | 현황은 최신 자료 기준, 이전 내용은 흐름에 "변경 전" |
| 14 | 본문에 보고일이 없는 자료 | 날짜 옆에 "(업로드일)" 표시 |
| 15 | 허용되지 않는 형식(.hwp) / 20MB 초과 파일 선택 | 전송되지 않고 형식·크기 안내 |
| 16 | 주민번호·전화번호가 들어 있는 자료 | 저장된 글과 정리본에 `***`로만 나타남 |
| 17 | 여러 이슈에 걸친 자료 | 70점 이상 이슈에만, 최대 3개까지 연결 |
| 18 | `OPENAI_MODEL`을 응답이 느린 설정으로 두거나 마감을 일시적으로 5초로 낮춰 시험 | 마감 후 실패 안내, 자료는 미분류 |

### 10.3 샘플 자료
`samples/` 폴더(민감 정보 없음)에 형식별 1개 이상 + 예외 파일(암호 PDF, 이미지 PDF, 빈 TXT) + 성공 기준 측정용 20건을 둔다. 실제 업무 자료는 넣지 않는다.

## 11. 구현 가이드

### 11.1 파일 구조

```
app/
  layout.tsx                    # lang="ko", 서비스 제목
  page.tsx                      # 이슈 목록
  issues/[id]/page.tsx          # 정리본
  issues/[id]/not-found.tsx
  api/documents/route.ts        # 업로드·분류
  actions.ts                    # Server Actions
components/                     # 6.3 표
lib/
  types.ts
  messages.ts                   # PRD 안내 문구 상수
  mask.ts
  extract/{index,txt,pdf,docx,pptx,hwpx}.ts   # 브라우저 전용
  db/{client,issues,documents,summaries}.ts   # server-only
  ai/{client,classify,summarize}.ts           # server-only
  pipeline/{ingest,regenerate,reject}.ts      # server-only, 흐름 조립
supabase/migrations/0001_init.sql
samples/
```

### 11.2 구현 순서
PLAN.md 작업 순서(1~32)를 그대로 따른다. 이 문서의 각 절과의 대응:

| PLAN 묶음 | 이 문서 |
|---|---|
| A 바탕 | 3.1 타입, `lib/messages.ts` |
| B 화면 | 6장 (가짜 데이터) |
| C 저장소 | 3.3 스키마, `lib/db` |
| D 업로드·추출 | 2.2, 7장, 4.2 중복 |
| E 분류 | 5.1, 5.3, 8장 |
| F 정리본·승인 | 5.2, 4.3, 6.2 |
| G 배포·검증 | 9장, 10장 |

### 11.3 세션 가이드

| 모듈 | Scope Key | 내용 | PLAN 작업 |
|---|---|---|---|
| 바탕·화면 | `module-1` | 타입, 가짜 데이터, 두 화면, 역할 스위치 | 1~6 |
| 저장소 | `module-2` | Supabase 연결, 마이그레이션, `lib/db` | 7~9 |
| 업로드·추출 | `module-3` | 업로드 버튼, 5형식 추출, 예외, 중복, 마스킹 | 10~17 |
| AI 분류 | `module-4` | OpenAI 연결, 보고일, 분류, 실패 처리 | 18~21 |
| 정리본·승인 | `module-5` | 갱신안, 충돌, 승인·반려, 미분류, 삭제 | 22~28 |
| 배포·검증 | `module-6` | Vercel 배포, 샘플 20건 측정 | 29~30 |
| nice | `module-7` | 마지막 갱신일, 검색 (성공 기준 달성 후) | 31~32 |

권장: 모듈 하나를 한 세션에서 끝내고 커밋한 뒤 다음 모듈로 넘어간다.

## 알려진 한계

- **동시 업로드 경쟁**: 같은 이슈에 자료 두 건이 거의 동시에 처리되면, 먼저 시작한 갱신안 생성이 나중에 끝나 다른 쪽 결과를 덮어쓸 수 있다. 팀 규모에서는 드물어 이번 사이클에서는 막지 않는다. 생기면 [갱신안 다시 만들기]로 해소한다(저장 시 `document_ids`가 현재 연결과 다르면 `needs_regeneration = true`로 표시해 알아챌 수 있게 한다).
- **로그인 없음**: 역할 쿠키는 표시 구분일 뿐 보안 장치가 아니다(PRD 비범위).
- **암호 판정 오차**: 손상된 파일이나 확장자만 바꾼 구형 파일도 "암호"로 안내될 수 있다.

## 남은 확인 사항
- 작업 18: OpenAI 기본 모델, API 데이터 학습 미사용 정책 확인
- 작업 29: Vercel 함수 최대 실행 시간이 1분 처리에 충분한지(`maxDuration` 설정 필요 여부)
- 작업 8: 위 스키마 초안을 적용 전에 사용자와 최종 확인

## Version History

| Version | Date | Changes |
|---|---|---|
| 0.1 | 2026-10-28 | 초안 (설계안 C, 브라우저 글 추출 확정) |
| 0.2 | 2026-10-28 | 검토 반영: 60초 단일 마감(D8), 요점 메모(D9), 삭제 후 확정본 표시(D10), 빈 이슈 삭제(D11), 재생성 실패 처리, 반려 이름 검사, 카드 표시, 알려진 한계, pdfjs·HWPX 위험 |
| 0.3 | 2026-10-28 | 비개발자용 "한눈에 보기"(화면 구성·데이터 흐름·기술 선택 쉬운 설명·Vercel 대응) 추가 |
| 0.4 | 2026-10-28 | 3문서 교차 검토 반영: 보고일 첫 저장값, pending 멈춤 방지, 빈 이슈 기준 확대(D11), D12~D14, 문장 세는 기준, 반려 사유 검사, 안내 문구 출처 정리, 검증 시나리오 12~18, module-7 |
