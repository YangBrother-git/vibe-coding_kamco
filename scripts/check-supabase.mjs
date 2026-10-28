// Supabase 연결 확인용 스크립트. 키 값은 화면에 출력하지 않는다.
// 실행: npm run check:supabase

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [
  !url && "SUPABASE_URL",
  !key && "SUPABASE_SERVICE_ROLE_KEY",
].filter(Boolean);

if (missing.length > 0) {
  console.error(`✗ .env에 ${missing.join(", ")} 값이 없습니다.`);
  process.exit(1);
}

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  console.error("✗ SUPABASE_URL 형식이 이상합니다. 예: https://abcdefgh.supabase.co");
  process.exit(1);
}

try {
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
    headers: { apikey: key },
  });
  if (res.ok) {
    console.log("✓ Supabase에 연결되었습니다.");
  } else if (res.status === 401 || res.status === 403) {
    console.error(`✗ 키가 맞지 않습니다 (HTTP ${res.status}). secret(service_role) 키인지 확인하세요.`);
    process.exit(1);
  } else {
    console.error(`✗ 연결은 됐지만 응답이 이상합니다 (HTTP ${res.status}).`);
    process.exit(1);
  }
} catch (error) {
  console.error(`✗ 주소에 접속하지 못했습니다: ${error.message}`);
  process.exit(1);
}
