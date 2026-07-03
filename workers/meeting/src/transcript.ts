// 자막/전사 정규화. 프론트 src/lib/meeting/transcript.ts 와 동일한 규칙(Worker 자립 사본).

export type TranscriptExt = "txt" | "vtt" | "srt";

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
      if (out.length && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (out.length && out[out.length - 1] === cleaned) continue;
    out.push(cleaned);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function transcriptSentences(normalized: string): string[] {
  return normalized
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?。])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 텍스트로 위장한 바이너리 파일을 판별한다.
 * 앞부분에 NUL 바이트가 있거나 제어문자 비율이 높으면 바이너리로 본다.
 */
export function looksBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 4096));
  let control = 0;
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    if (byte === 0) return true;
    // 허용: 탭(9), LF(10), CR(13). 그 외 0x00~0x1F 는 제어문자.
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) control++;
  }
  return sample.length > 0 && control / sample.length > 0.1;
}
