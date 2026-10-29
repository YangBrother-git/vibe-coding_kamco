-- 로그인 시도를 "먼저 예약"하는 함수 (보안 점검 SEC-001)
-- 예전에는 실패 횟수를 읽고 나서 따로 저장해서, 요청을 동시에 보내면 횟수가 1만 오른 채
-- 비밀번호 검사를 여러 번 받을 수 있었다. 이제 시도마다 이 함수로 줄을 잠그고 횟수를 올린 뒤에만
-- 비밀번호를 검사하므로, 차단 전까지 검사받을 수 있는 횟수는 정확히 p_max번이다.

create function public.reserve_login_attempt(p_ip text, p_max integer, p_minutes integer)
returns table (locked boolean, minutes_left integer, remaining integer)
language plpgsql
set search_path = public
as $$
declare
  v_row login_attempts%rowtype;
  v_count integer;
begin
  -- 줄이 없으면 만들고, 같은 IP의 동시 요청은 이 줄 잠금으로 차례대로 처리한다
  insert into login_attempts (ip, fail_count) values (p_ip, 0) on conflict (ip) do nothing;
  select * into v_row from login_attempts where ip = p_ip for update;

  -- 차단 중이면 비밀번호를 검사하지 않고 거절
  if v_row.locked_until is not null and v_row.locked_until > now() then
    return query select true, ceil(extract(epoch from (v_row.locked_until - now())) / 60)::integer, 0;
    return;
  end if;

  -- 차단이 끝났으면 0부터 다시
  v_count := case when v_row.locked_until is not null then 0 else v_row.fail_count end + 1;

  if v_count >= p_max then
    -- 마지막 기회: 이 시도는 검사받지만, 이어지는 요청은 바로 차단된다
    update login_attempts
       set fail_count = 0, locked_until = now() + make_interval(mins => p_minutes)
     where ip = p_ip;
    return query select false, 0, 0;
  else
    update login_attempts set fail_count = v_count, locked_until = null where ip = p_ip;
    return query select false, 0, p_max - v_count;
  end if;
end;
$$;

revoke execute on function public.reserve_login_attempt(text, integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_login_attempt(text, integer, integer) to service_role;
