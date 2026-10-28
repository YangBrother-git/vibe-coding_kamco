-- 표 3개 만들기 (PLAN 작업 17 / DESIGN 4.1)
-- 브라우저는 Supabase에 직접 접근하지 않는다. 모든 읽기·쓰기는 서버 쪽 코드(lib/db)가 서버 전용 키로 한다.
-- 그래서 모든 표에 RLS(행 단위 접근 제한)를 켜고, 공개(anon·authenticated) 정책은 만들지 않는다.

-- 주간 기록: 한 회계연도의 한 주에 한 줄
create table public.weekly_snapshots (
  id bigint generated always as identity primary key,
  fiscal_year smallint not null check (fiscal_year between 2000 and 2100),
  week_no smallint not null check (week_no between 1 and 53),
  week_start date not null,
  -- success: 성공 / retrying: 월~목 실패, 다음 날 재시도 / failed: 금요일까지 실패
  status text not null check (status in ('success', 'retrying', 'failed')),
  last_attempt_at timestamptz,
  succeeded_at timestamptz,
  attempts smallint not null default 0 check (attempts >= 0),
  item_count integer not null default 0 check (item_count >= 0),
  unique (fiscal_year, week_no)
);

comment on table public.weekly_snapshots is '주간 수집 기록 (회계연도·주차마다 하나)';

-- 물건: 그 주에 받은 물건마다 한 줄. PRD에 정한 5가지만 담는다.
create table public.snapshot_items (
  snapshot_id bigint not null references public.weekly_snapshots (id) on delete cascade,
  item_no text not null,
  -- 지역본부·용도는 온비드 원본 값 그대로 둔다. "기타" 처리는 셀 때만 한다 (DESIGN 4.2).
  region_office text,
  category text,
  fail_count integer not null check (fail_count >= 0),
  collected_on date not null,
  -- 같은 주에 같은 물건번호는 하나만
  primary key (snapshot_id, item_no)
);

comment on table public.snapshot_items is '주간 수집 물건 (물건번호·지역본부·용도 대분류·유찰 횟수·수집일만)';

-- 로그인 시도: 기기(IP)마다 한 줄
create table public.login_attempts (
  ip text primary key,
  fail_count smallint not null default 0 check (fail_count >= 0),
  locked_until timestamptz
);

comment on table public.login_attempts is '비밀번호 연속 실패 횟수와 차단 시각 (같은 IP 5번 실패 시 10분 차단)';

-- RLS 켜기 (정책이 없으므로 anon·authenticated는 아무것도 읽거나 쓸 수 없다)
alter table public.weekly_snapshots enable row level security;
alter table public.snapshot_items enable row level security;
alter table public.login_attempts enable row level security;
