-- 수집 잠금과 예약 실행 다시 짜기 (갭 분석 H1·M1·M2 / DESIGN 9장 ⑬)
-- 1) 수집 잠금: 예약 실행과 "지금 다시 가져오기" 버튼이 겹쳐 같은 지역본부를 동시에 받거나,
--    확정이 끝난 주에 다시 보관하는 일을 막는다. 잠금은 정해진 시간이 지나면 저절로 풀린다.
-- 2) 예약 실행에 여유: 하루 12번(지역본부 수와 같음) → 24번(09:00~10:55, 5분마다).
--    한 번 실패해도 같은 날 남은 차례에서 그 지역본부를 다시 받을 수 있다.
-- 3) 금요일 마무리: 금요일 11:05에 아직 성공 못 한 주를 "실패"로 바꾼다.
--    예약 실행이 한 번도 돌지 못했거나 시간 초과로 기록이 남지 않은 주도 여기서 실패로 잡힌다.

-- 수집 잠금 (한 줄만 쓴다)
create table public.collect_lock (
  id smallint primary key default 1 check (id = 1),
  holder text,
  locked_until timestamptz not null default '-infinity'
);
insert into public.collect_lock (id) values (1);
alter table public.collect_lock enable row level security;
comment on table public.collect_lock is '수집이 한 번에 하나만 돌게 하는 잠금 (locked_until이 지나면 풀린 것)';

-- 잠금 얻기: 비어 있거나 기한이 지났으면 p_holder가 p_seconds초 동안 잡는다. 얻었으면 true
create function public.acquire_collect_lock(p_holder text, p_seconds integer) returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_updated integer;
begin
  update collect_lock
     set holder = p_holder,
         locked_until = now() + make_interval(secs => p_seconds)
   where id = 1 and locked_until < now();
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

-- 잠금 풀기: 내가 잡은 잠금만 푼다
create function public.release_collect_lock(p_holder text) returns void
language sql
set search_path = public
as $$
  update collect_lock set locked_until = '-infinity', holder = null where id = 1 and holder = p_holder;
$$;

revoke execute on function public.acquire_collect_lock(text, integer) from public, anon, authenticated;
revoke execute on function public.release_collect_lock(text) from public, anon, authenticated;
grant execute on function public.acquire_collect_lock(text, integer) to service_role;
grant execute on function public.release_collect_lock(text) to service_role;

-- 예약 실행: 월~금 00:00~01:55 UTC = 한국 시간 09:00~10:55, 5분마다 하루 24번 (같은 이름이면 새 설정으로 바뀜)
select cron.schedule(
  'onbid-weekly-collect',
  '*/5 0-1 * * 1-5',
  $$
  select net.http_get(
    url := 'https://onbid-heatmap.vercel.app/api/collect',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    timeout_milliseconds := 150000
  );
  $$
);

-- 금요일 마무리: 금요일 02:05 UTC = 한국 시간 11:05
select cron.schedule(
  'onbid-friday-finalize',
  '5 2 * * 5',
  $$
  select net.http_get(
    url := 'https://onbid-heatmap.vercel.app/api/collect?mode=finalize',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    timeout_milliseconds := 150000
  );
  $$
);
