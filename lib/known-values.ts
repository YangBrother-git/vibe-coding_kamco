// 알려진 지역본부·용도 대분류 목록 (DESIGN 4.1, 9장 ⑤)
// 이 목록에 없는 값이 "처음 보는 값"이며, 셀 때 "기타"로 묶는다 (PRD 5장 must ①).
//
// - 지역본부 12곳은 사용자가 지정한 목록이다 (2026-10-28).
//   온비드 검색의 담당부점 코드(srchRspbSbr)와 짝지어 둔다 (2026-10-29 사이트에서 확인).
// - 용도 대분류는 2026-10-29 온비드 사이트 실제 수집 결과로 확정했다 (PLAN 작업 14).

/** 목록에 없거나 비어 있는 값을 모으는 이름 */
export const OTHER = "기타";

/** 지역본부 12곳 (사용자 지정 이름)과 온비드 담당부점 코드 */
export const REGION_OFFICES: readonly { code: string; name: string }[] = [
  { code: "0002", name: "서울동부지역본부" },
  { code: "0012", name: "서울서부지역본부" },
  { code: "0003", name: "경기지역본부" },
  { code: "0007", name: "인천지역본부" },
  { code: "0010", name: "강원지역본부" },
  { code: "0005", name: "대전충남지역본부" },
  { code: "0011", name: "충북지역본부" },
  { code: "0008", name: "전북지역본부" },
  { code: "0004", name: "전남광주지역본부" }, // 온비드 표기는 "광주전남지역본부"
  { code: "0006", name: "대구경북지역본부" },
  { code: "0009", name: "경남지역본부" },
  { code: "0013", name: "부산지역본부" },
];

/** 지역본부 12곳 이름 */
export const KNOWN_REGION_OFFICES: readonly string[] = REGION_OFFICES.map((office) => office.name);

/** 다른 표기 → 사용자 지정 이름 (행정구역 명칭 변경) */
export const REGION_ALIASES: Readonly<Record<string, string>> = {
  광주전남지역본부: "전남광주지역본부",
};

/**
 * 용도 대분류 목록, 히트맵 세로축 위에서 아래 순서.
 * 2026-10-29 온비드 압류재산 목록(12개 지역본부, 5,619건)에서 실제로 나온 이름 그대로다 (PLAN 작업 14).
 */
export const KNOWN_CATEGORIES: readonly string[] = [
  // 부동산
  "토지",
  "주거용건물",
  "상가용및업무용건물",
  "용도복합용건물",
  "산업용및기타특수용건물",
  // 동산
  "유가증권",
  "회원권",
  "무형자산",
  "기타권리및증권",
  "석유/화학/연료",
  "기타기계기구",
  "미분류기타",
  // 차량
  "자동차",
];
