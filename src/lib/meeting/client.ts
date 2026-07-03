// 회의록 생성 Worker API 클라이언트.
// 엔드포인트는 빌드 타임 환경변수 NEXT_PUBLIC_MEETING_SUMMARIZE_URL 로 주입한다.

import type { MeetingRequestMeta, MeetingSummarizeResult } from "./types";

/** 설정된 Worker 엔드포인트 URL. 미설정 시 빈 문자열. */
export function getMeetingApiUrl(): string {
  return (process.env.NEXT_PUBLIC_MEETING_SUMMARIZE_URL || "").trim();
}

/** 서버 백엔드 사용 가능 여부. */
export function isMeetingApiConfigured(): boolean {
  return getMeetingApiUrl().length > 0;
}

export interface SummarizeMeetingParams extends MeetingRequestMeta {
  file: File | Blob;
  filename: string;
  password: string;
}

/**
 * Worker에 회의록 생성을 요청한다.
 * 파일 본문은 버튼 클릭 시에만 이 함수를 통해 전송된다(사전 업로드 없음).
 */
export async function summarizeMeeting(params: SummarizeMeetingParams): Promise<MeetingSummarizeResult> {
  const url = getMeetingApiUrl();
  if (!url) {
    throw new Error("회의록 서버 엔드포인트가 설정되지 않았습니다.");
  }

  const form = new FormData();
  form.append("file", params.file, params.filename);
  form.append("date", params.date);
  if (params.time) form.append("time", params.time);
  if (params.topic) form.append("topic", params.topic);
  form.append("kind", params.kind);
  form.append("password", params.password);

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", body: form });
  } catch {
    throw new Error("서버에 연결하지 못했습니다. 네트워크 또는 엔드포인트 설정을 확인하세요.");
  }

  if (!res.ok) {
    let message = `서버 오류 (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 유지.
    }
    if (res.status === 401 || res.status === 403) {
      message = "처리 비밀번호가 올바르지 않거나 접근이 거부되었습니다.";
    }
    throw new Error(message);
  }

  const data = (await res.json()) as MeetingSummarizeResult;
  if (!data?.markdown) {
    throw new Error("서버 응답에 회의록 본문이 없습니다.");
  }
  return data;
}
