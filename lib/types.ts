// 앱 전체가 함께 쓰는 데이터 모양 (DESIGN 4.1)
// 화면·집계 계산·저장소 코드가 모두 이 타입을 기준으로 맞춘다.

/** 날짜 문자열 `YYYY-MM-DD` (한국 시간 기준 날짜) */
export type DateString = string;

/** 시각 문자열 (ISO 8601, 예: `2026-10-26T09:02:00+09:00`) */
export type DateTimeString = string;

/**
 * 물건 1건. PRD에 정한 5가지 항목만 담는다 (PRD 5장 must ②, 7장 ②).
 * 지역본부·용도는 온비드 원본 값 그대로 두고, "기타" 처리는 셀 때만 한다 (DESIGN 4.2).
 */
export type AuctionItem = {
  /** 물건번호 */
  itemNo: string;
  /** 공매를 올린 지역본부 (원본 값, 비어 있을 수 있음) */
  regionOffice: string | null;
  /** 용도 대분류 (원본 값, 비어 있을 수 있음) */
  category: string | null;
  /** 유찰 횟수 (원본 숫자 그대로, "5회 이상" 묶음은 셀 때만) */
  failCount: number;
  /** 수집일 */
  collectedOn: DateString;
};

/**
 * 주간 기록의 수집 상태 (DESIGN 4.1)
 * - success: 수집 성공
 * - retrying: 월~목에 실패해 다음 날 오전 9시에 다시 시도할 예정
 * - failed: 금요일까지 모두 실패
 */
export type SnapshotStatus = "success" | "retrying" | "failed";

/** 주간 기록 1건. 한 회계연도의 한 주에 하나만 있다 (fiscalYear + weekNo). */
export type WeeklySnapshot = {
  /** 회계연도 (1월 1일~12월 31일, 1월 1일이 든 주는 새 회계연도) */
  fiscalYear: number;
  /** 주차 (1월 1일이 든 주가 1주차, 최대 53) */
  weekNo: number;
  /** 그 주 월요일 날짜 */
  weekStart: DateString;
  status: SnapshotStatus;
  /** 마지막으로 시도한 시각 */
  lastAttemptAt: DateTimeString | null;
  /** 성공한 시각 (머리글 "마지막 성공 수집") */
  succeededAt: DateTimeString | null;
  /** 이번 주 시도 횟수 (자동 최대 5번 + 다시 가져오기 버튼) */
  attempts: number;
  /** 저장한 물건 수 */
  itemCount: number;
};

/** 유찰 횟수 칸: 0~4는 그 횟수, 5는 "5회 이상" (PRD 5장 must ①) */
export type FailBucket = 0 | 1 | 2 | 3 | 4 | 5;

/** 히트맵 가로축 6칸, 화면 왼쪽부터 오른쪽 순서 */
export const FAIL_BUCKETS: readonly FailBucket[] = [0, 1, 2, 3, 4, 5];

/** 색 단계: 0 = 0건(회색), 1 = 1~5건, 2 = 6~20건, 3 = 21~50건, 4 = 51건 이상 */
export type ColorLevel = 0 | 1 | 2 | 3 | 4;

/** 히트맵 칸 1개 = 용도 대분류 한 줄 × 유찰 횟수 한 칸 */
export type HeatmapCell = {
  /** 용도 대분류 (목록에 없는 값은 "기타") */
  category: string;
  failBucket: FailBucket;
  /** 이 칸에 해당하는 물건 수 */
  count: number;
  colorLevel: ColorLevel;
};
