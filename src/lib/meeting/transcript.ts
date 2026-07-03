// 자막/전사 텍스트를 회의록 요약에 쓸 수 있는 평문으로 정규화한다.
// TXT / VTT / SRT를 지원하며, Worker 백엔드와 동일한 규칙을 사용한다.

export type TranscriptExt = "txt" | "vtt" | "srt";

/** 파일명에서 지원하는 전사 확장자를 추출한다. 없으면 null. */
export function transcriptExtFromName(name: string): TranscriptExt | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".vtt")) return "vtt";
  if (lower.endsWith(".srt")) return "srt";
  if (lower.endsWith(".txt")) return "txt";
  return null;
}

const TIMESTAMP_LINE =
  /^\s*(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d{1,3})?\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d{1,3})?.*$/;
const CUE_INDEX_LINE = /^\s*\d+\s*$/;
const VTT_NOTE_LINE = /^\s*(WEBVTT|NOTE|STYLE|REGION)\b.*$/i;
const INLINE_TAG = /<\/?[^>]+>/g;

/**
 * VTT/SRT/TXT 원문을 발화 텍스트만 남긴 평문으로 정규화한다.
 * - 타임스탬프, 큐 인덱스, VTT 헤더/노트 제거
 * - 인라인 태그(<v Speaker> 등) 제거
 * - 연속 중복 라인 및 과도한 공백 축소
 */
export function normalizeTranscript(raw: string, ext: TranscriptExt): string {
  const text = raw.replace(/\r\n?/g, "\n").replace(/^﻿/, "");
  const lines = text.split("\n");
  const out: string[] = [];

  for (const line of lines) {
    if (ext !== "txt") {
      if (TIMESTAMP_LINE.test(line)) continue;
      if (CUE_INDEX_LINE.test(line)) continue;
      if (VTT_NOTE_LINE.test(line)) continue;
    }
    const cleaned = line.replace(INLINE_TAG, "").trim();
    if (!cleaned) {
      // 문단 구분을 위해 빈 줄은 하나까지만 유지.
      if (out.length && out[out.length - 1] !== "") out.push("");
      continue;
    }
    // 바로 앞과 동일한 발화가 반복되면(자막 겹침) 스킵.
    if (out.length && out[out.length - 1] === cleaned) continue;
    out.push(cleaned);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** 정규화된 전사에서 문장/발화 단위 리스트를 만든다. */
export function transcriptSentences(normalized: string): string[] {
  return normalized
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?。])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}
