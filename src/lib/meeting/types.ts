// 회의록 생성 도구 공용 타입.
// 프론트(정적 사이트)와 Cloudflare Worker 백엔드가 주고받는 계약을 정의한다.

/** 입력 소스 종류. */
export type MeetingSourceKind = "audio" | "text";

/** 회의록 생성 요청 메타데이터(파일 본문은 FormData로 별도 전송). */
export interface MeetingRequestMeta {
  /** 회의 날짜 (YYYY-MM-DD). */
  date: string;
  /** 회의 시간 (HH:MM). 선택값. */
  time?: string;
  /** 회의 주제. 선택값. */
  topic?: string;
  /** 소스 종류 힌트. 서버가 확장자로 재검증한다. */
  kind: MeetingSourceKind;
}

/** Worker가 반환하는 성공 응답. */
export interface MeetingSummarizeResult {
  /** 생성된 회의록 Markdown 본문. */
  markdown: string;
  /** 다운로드용 파일명 (예: 2026-07-03_1400_주제.md). */
  filename: string;
  /** R2 저장 식별자. UI에는 노출하지 않지만 로깅/추적에 사용 가능. */
  requestId: string;
  /** STT 사용 여부. */
  usedStt: boolean;
  /** 요약 실패로 원문 기반 초안 fallback을 사용했는지 여부. */
  usedFallback: boolean;
}

/** Worker 오류 응답. */
export interface MeetingSummarizeError {
  error: string;
}

/** 회의록 본문 구성 섹션. 클라이언트 fallback과 서버 프롬프트가 공유한다. */
export interface MeetingMinutesSections {
  summary: string[];
  decisions: string[];
  actionItems: string[];
  nextAgenda: string[];
  planningLoop: string[];
  excerpts: string[];
}
