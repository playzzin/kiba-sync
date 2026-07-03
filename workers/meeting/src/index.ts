// 회의록 생성 백엔드 Worker.
// POST /meeting/summarize : (오디오 STT | 자막 정규화) → LLM 요약(실패 시 폴백) → R2 자동 저장 → 회의록 Markdown 반환.

import {
  normalizeTranscript,
  transcriptExtFromName,
  looksBinary,
  type TranscriptExt,
} from "./transcript";
import {
  buildFallbackSections,
  buildSummaryPrompt,
  parseLlmSections,
  renderMeetingMarkdown,
  meetingFilename,
  meetingStampPrefix,
  type MeetingMeta,
  type MeetingSections,
} from "./summarize";

/** Workers AI 바인딩의 최소 계약. (모델별 타입맵 없이 사용) */
interface AiRunner {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

export interface Env {
  AI: AiRunner;
  MEETINGS: R2Bucket;
  MEETING_PASSWORD?: string;
  ALLOWED_ORIGINS?: string;
  STT_MODEL?: string;
  LLM_MODEL?: string;
  MAX_AUDIO_MB?: string;
  MAX_TEXT_MB?: string;
}

const TEXT_EXTS: TranscriptExt[] = ["txt", "vtt", "srt"];

function allowedOrigin(env: Env, origin: string | null): string | null {
  const list = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.includes("*")) return origin || "*";
  if (origin && list.includes(origin)) return origin;
  return null;
}

function corsHeaders(allowOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin;
  return headers;
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}

/** 길이 정보 노출을 줄인 상수 시간 비교. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const allow = allowedOrigin(env, origin);
    const cors = corsHeaders(allow);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "POST만 지원합니다." }, 405, cors);
    }
    // origin이 지정됐는데 허용 목록에 없으면 차단.
    if (origin && !allow) {
      return json({ error: "허용되지 않은 origin입니다." }, 403, cors);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return json({ error: "multipart/form-data 요청이 필요합니다." }, 400, cors);
    }

    // 1) 비밀번호 검증
    const password = String(form.get("password") ?? "");
    if (!env.MEETING_PASSWORD) {
      return json({ error: "서버에 처리 비밀번호가 설정되지 않았습니다." }, 500, cors);
    }
    if (!password || !safeEqual(password, env.MEETING_PASSWORD)) {
      return json({ error: "처리 비밀번호가 올바르지 않습니다." }, 401, cors);
    }

    // 2) 입력 필드
    const file = form.get("file");
    if (!(file instanceof File)) {
      return json({ error: "회의 자료 파일이 없습니다." }, 400, cors);
    }
    const date = String(form.get("date") ?? "").trim() || new Date().toISOString().slice(0, 10);
    const time = String(form.get("time") ?? "").trim() || undefined;
    const topic = String(form.get("topic") ?? "").trim() || undefined;
    const kindHint = String(form.get("kind") ?? "").trim();
    const meta: MeetingMeta = { date, time, topic };

    // 3) 종류/확장자 판정 및 크기 제한
    const textExt = transcriptExtFromName(file.name);
    const isText = textExt !== null || kindHint === "text";
    const maxAudioMb = Number(env.MAX_AUDIO_MB || "25");
    const maxTextMb = Number(env.MAX_TEXT_MB || "2");
    const maxBytes = (isText ? maxTextMb : maxAudioMb) * 1024 * 1024;
    if (file.size === 0) {
      return json({ error: "빈 파일입니다." }, 400, cors);
    }
    if (file.size > maxBytes) {
      return json(
        { error: `파일이 너무 큽니다. 최대 ${isText ? maxTextMb : maxAudioMb}MB까지 지원합니다.` },
        413,
        cors,
      );
    }

    // 소스 바이트는 한 번만 읽어 처리와 R2 저장에 재사용한다.
    const sourceBuffer = await file.arrayBuffer();
    const sourceBytes = new Uint8Array(sourceBuffer);

    let normalized: string;
    let usedStt = false;

    try {
      if (isText) {
        if (textExt && !TEXT_EXTS.includes(textExt)) {
          return json({ error: "지원하지 않는 텍스트 확장자입니다. (TXT/VTT/SRT)" }, 415, cors);
        }
        if (looksBinary(sourceBytes)) {
          return json({ error: "텍스트 파일이 아닙니다. (바이너리 위장 파일)" }, 415, cors);
        }
        const raw = new TextDecoder("utf-8").decode(sourceBytes);
        normalized = normalizeTranscript(raw, textExt ?? "txt");
        if (!normalized) {
          return json({ error: "전사 내용이 비어 있습니다." }, 422, cors);
        }
      } else {
        // 오디오 STT
        const sttModel = env.STT_MODEL || "@cf/openai/whisper";
        const sttResult = (await env.AI.run(sttModel, {
          audio: Array.from(sourceBytes),
        })) as { text?: string };
        normalized = normalizeTranscript(String(sttResult?.text ?? ""), "txt");
        usedStt = true;
        if (!normalized) {
          return json({ error: "음성에서 전사 텍스트를 추출하지 못했습니다." }, 422, cors);
        }
      }
    } catch (error) {
      return json(
        { error: `입력 처리 중 오류: ${error instanceof Error ? error.message : "알 수 없음"}` },
        500,
        cors,
      );
    }

    // 4) LLM 요약 (실패 시 원문 기반 폴백)
    let sections: MeetingSections;
    let usedFallback = false;
    try {
      const { system, user } = buildSummaryPrompt(normalized, meta);
      const llmModel = env.LLM_MODEL || "@cf/meta/llama-3.1-8b-instruct";
      const llmResult = (await env.AI.run(llmModel, {
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 2048,
      })) as { response?: string };
      const parsed = parseLlmSections(String(llmResult?.response ?? ""));
      if (parsed) {
        sections = parsed;
        if (!parsed.excerpts.length) {
          sections.excerpts = buildFallbackSections(normalized).excerpts;
        }
      } else {
        sections = buildFallbackSections(normalized);
        usedFallback = true;
      }
    } catch {
      sections = buildFallbackSections(normalized);
      usedFallback = true;
    }

    const markdown = renderMeetingMarkdown(meta, sections, { draftNotice: usedFallback });
    const filename = meetingFilename(meta);
    const requestId = crypto.randomUUID();

    // 5) R2 자동 저장 (실패해도 사용자에겐 회의록을 반환)
    try {
      const prefix = meetingStampPrefix(date, time);
      const base = `meetings/${prefix}/${requestId}`;
      const transcriptName = filename.replace(/\.md$/, "_transcript.txt");
      await Promise.all([
        env.MEETINGS.put(`${base}/source/${file.name}`, sourceBuffer, {
          httpMetadata: { contentType: file.type || "application/octet-stream" },
        }),
        env.MEETINGS.put(`${base}/${transcriptName}`, normalized, {
          httpMetadata: { contentType: "text/plain; charset=utf-8" },
        }),
        env.MEETINGS.put(`${base}/${filename}`, markdown, {
          httpMetadata: { contentType: "text/markdown; charset=utf-8" },
        }),
        env.MEETINGS.put(
          `${base}/metadata.json`,
          JSON.stringify(
            {
              requestId,
              date,
              time: time ?? null,
              topic: topic ?? null,
              filename,
              sourceName: file.name,
              sourceType: file.type || null,
              savedAt: new Date().toISOString(),
              usedStt,
              usedFallback,
            },
            null,
            2,
          ),
          { httpMetadata: { contentType: "application/json; charset=utf-8" } },
        ),
      ]);
    } catch (error) {
      // 저장 실패는 회의록 반환을 막지 않는다. (UI에는 별도 노출하지 않음)
      console.error("R2 save failed", error);
    }

    return json({ markdown, filename, requestId, usedStt, usedFallback }, 200, cors);
  },
};
