-- 지역본부별 임시 보관 표와 주간 기록 저장 함수 (PLAN 작업 18 / DESIGN 4.1, 9장 ⑪)
-- 수집은 지역본부 1곳씩 한다. 각 지역본부 결과를 임시 보관 표에 넣어 두었다가,
-- 같은 날 12곳이 모두 모이면 save_snapshot 함수 하나로 그 주 기록을 한 번에 바꾼다.
-- 함수 안의 작업은 한 덩어리(트랜잭션)로 처리되므로, 중간에 실패하면 아무것도 바뀌지 않는다.

-- 임시 보관: 어느 날 어느 지역본부를 받았는지
create table public.staged_offices (
  fiscal_year smallint not null,
  week_no smallint not null,
  collected_on date not null,
  office text not null,
  item_count integer not null check (item_count >= 0),
  staged_at timestamptz not null default now(),
  primary key (fiscal_year, week_no, collected_on, office)
);

-- 임시 보관: 지역본부별로 받은 물건 (5가지 항목만)
create table public.staged_items (
  fiscal_year smallint not null,
  week_no smallint not null,
  collected_on date not null,
  office text not null,
  item_no text not null,
  region_office text,
  category text,
  fail_count integer not null check (fail_count >= 0),
  primary key (fiscal_year, week_no, collected_on, office, item_no),
  foreign key (fiscal_year, week_no, collected_on, office)
    references public.staged_offices (fiscal_year, week_no, collected_on, office) on delete cascade
);

comment on table public.staged_offices is '지역본부별 수집 결과 임시 보관 (12곳이 모이면 save_snapshot이 비움)';
comment on table public.staged_items is '지역본부별 수집 물건 임시 보관';

alter table public.staged_offices enable row level security;
alter table public.staged_items enable row level security;

-- 지역본부 1곳의 결과를 임시 보관한다. 같은 날 같은 지역본부를 다시 받으면 새 결과로 바꾼다.
-- 그 주의 다른 날 임시 보관분(어제 실패하고 남은 것 등)은 지운다: 12곳은 같은 날 모여야 하므로.
-- 돌려주는 값: 오늘 그 주에 임시 보관된 지역본부 수
create function public.stage_office(
  p_fiscal_year smallint,
  p_week_no smallint,
  p_collected_on date,
  p_office text,
  p_items jsonb -- [{ "item_no", "region_office", "category", "fail_count" }, ...]
) returns integer
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from staged_offices
   where fiscal_year = p_fiscal_year and week_no = p_week_no and collected_on <> p_collected_on;
  delete from staged_offices
   where fiscal_year = p_fiscal_year and week_no = p_week_no and collected_on = p_collected_on and office = p_office;

  insert into staged_offices (fiscal_year, week_no, collected_on, office, item_count)
  values (p_fiscal_year, p_week_no, p_collected_on, p_office, jsonb_array_length(p_items));

  insert into staged_items (fiscal_year, week_no, collected_on, office, item_no, region_office, category, fail_count)
  select p_fiscal_year, p_week_no, p_collected_on, p_office,
         x.item_no, x.region_office, x.category, x.fail_count
    from jsonb_to_recordset(p_items) as x(item_no text, region_office text, category text, fail_count integer);

  select count(*) into v_count
    from staged_offices
   where fiscal_year = p_fiscal_year and week_no = p_week_no and collected_on = p_collected_on;
  return v_count;
end;
$$;

-- 임시 보관된 지역본부가 p_expected_offices 곳이면, 그 주 기록을 한 번에 바꾸고 임시 보관을 비운다.
-- 모자라면 오류를 내고 아무것도 바꾸지 않는다. 같은 물건번호는 하나만 남긴다.
-- 돌려주는 값: 저장한 물건 수
create function public.save_snapshot(
  p_fiscal_year smallint,
  p_week_no smallint,
  p_week_start date,
  p_collected_on date,
  p_expected_offices integer
) returns integer
language plpgsql
set search_path = public
as $$
declare
  v_offices integer;
  v_snapshot_id bigint;
  v_items integer;
begin
  select count(*) into v_offices
    from staged_offices
   where fiscal_year = p_fiscal_year and week_no = p_week_no and collected_on = p_collected_on;
  if v_offices <> p_expected_offices then
    raise exception '지역본부 %곳 중 %곳만 모였습니다', p_expected_offices, v_offices;
  end if;

  insert into weekly_snapshots (fiscal_year, week_no, week_start, status, last_attempt_at, attempts)
  values (p_fiscal_year, p_week_no, p_week_start, 'retrying', now(), 0)
  on conflict (fiscal_year, week_no) do nothing;

  select id into v_snapshot_id
    from weekly_snapshots
   where fiscal_year = p_fiscal_year and week_no = p_week_no
     for update;

  delete from snapshot_items where snapshot_id = v_snapshot_id;

  insert into snapshot_items (snapshot_id, item_no, region_office, category, fail_count, collected_on)
  select distinct on (item_no) v_snapshot_id, item_no, region_office, category, fail_count, collected_on
    from staged_items
   where fiscal_year = p_fiscal_year and week_no = p_week_no and collected_on = p_collected_on
   order by item_no, office;
  get diagnostics v_items = row_count;

  update weekly_snapshots
     set status = 'success',
         last_attempt_at = now(),
         succeeded_at = now(),
         attempts = attempts + 1,
         item_count = v_items
   where id = v_snapshot_id;

  delete from staged_offices where fiscal_year = p_fiscal_year and week_no = p_week_no;
  return v_items;
end;
$$;

-- 수집이 실패한 날을 기록한다 (월~목: retrying, 금: failed). 이미 성공한 주는 건드리지 않는다.
create function public.record_failure(
  p_fiscal_year smallint,
  p_week_no smallint,
  p_week_start date,
  p_status text
) returns void
language plpgsql
set search_path = public
as $$
begin
  if p_status not in ('retrying', 'failed') then
    raise exception '실패 상태는 retrying 또는 failed만 됩니다: %', p_status;
  end if;
  insert into weekly_snapshots (fiscal_year, week_no, week_start, status, last_attempt_at, attempts)
  values (p_fiscal_year, p_week_no, p_week_start, p_status, now(), 1)
  on conflict (fiscal_year, week_no) do update
     set status = excluded.status,
         last_attempt_at = now(),
         attempts = weekly_snapshots.attempts + 1
   where weekly_snapshots.status <> 'success';
end;
$$;

-- 세 함수는 서버 키(service_role)로만 부를 수 있게 한다
revoke execute on function public.stage_office(smallint, smallint, date, text, jsonb) from public, anon, authenticated;
revoke execute on function public.save_snapshot(smallint, smallint, date, date, integer) from public, anon, authenticated;
revoke execute on function public.record_failure(smallint, smallint, date, text) from public, anon, authenticated;
grant execute on function public.stage_office(smallint, smallint, date, text, jsonb) to service_role;
grant execute on function public.save_snapshot(smallint, smallint, date, date, integer) to service_role;
grant execute on function public.record_failure(smallint, smallint, date, text) to service_role;
