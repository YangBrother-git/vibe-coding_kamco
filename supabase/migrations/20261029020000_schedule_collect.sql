-- 매주 수집 예약 실행 (PLAN 작업 27 / DESIGN 7.3, 9장 ②·⑪ / CLAUDE.md 8장)
-- Supabase Cron(pg_cron)이 월~금 00:00~00:55 UTC(= 한국 시간 09:00~09:55), 5분마다 하루 12번
-- 배포된 앱의 수집 경로를 부른다(pg_net). 한 번에 지역본부 1곳씩 받고, 그 주가 이미 성공이면 앱이 건너뛴다.
-- 예약 실행 비밀값은 이 파일에 쓰지 않는다. Supabase Vault에 'cron_secret'이라는 이름으로 따로 넣고(Vercel의 CRON_SECRET과 같은 값),
-- 부를 때마다 Vault에서 꺼내 Authorization 머리글에 붙인다.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 같은 이름의 예약이 있으면 새 설정으로 바뀐다
select cron.schedule(
  'onbid-weekly-collect',
  '*/5 0 * * 1-5',
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
