// 회의록 섹션 구성 + Markdown 렌더 + LLM 요약/폴백. (Worker 자립 사본)

import { transcriptSentences } from "./transcript";

export interface MeetingSections {
  summary: string[];
  decisions: string[];
  actionItems: string[];
  nextAgenda: string[];
  planningLoop: string[];
  excerpts: string[];
}

export interface MeetingMeta {
  date: string;
  time?: string;
  topic?: string;
}

export function sanitizeSlug(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function meetingStampPrefix(date: string, time?: string): string {
  const d = (date || new Date().toISOString().slice(0, 10)).trim();
  const t = (time || "").trim();
  return t ? `${d}_${t.replace(":", "")}` : d;
}

export function meetingFilename(meta: MeetingMeta): string {
  const prefix = meetingStampPrefix(meta.date, meta.time);
  const slug = sanitizeSlug(meta.topic || "회의록") || "회의록";
  return `${prefix}_${slug}.md`;
}

export function meetingTitle(meta: MeetingMeta): string {
  const when = meta.time ? `${meta.date} ${meta.time}` : meta.date;
  const subject = (meta.topic || "").trim();
  return subject ? `${subject} 회의록 (${when})` : `회의록 (${when})`;
}

function renderList(items: string[], emptyText: string): string {
  if (!items.length) return `- ${emptyText}\n`;
  return items.map((item) => `- ${item}`).join("\n") + "\n";
}

export function renderMeetingMarkdown(
  meta: MeetingMeta,
  sections: MeetingSections,
  options?: { draftNotice?: boolean },
): string {
  const lines: string[] = [];
  lines.push(`# ${meetingTitle(meta)}`, "");
  lines.push(`- **날짜**: ${meta.date}${meta.time ? ` ${meta.time}` : ""}`);
  if (meta.topic?.trim()) lines.push(`- **주제**: ${meta.topic.trim()}`);
  lines.push("");
  if (options?.draftNotice) {
    lines.push("> ⚠️ 요약 provider를 사용하지 못해 원문 기반 자동 초안으로 생성되었습니다. 검토 후 보완하세요.", "");
  }
  lines.push("## 요약", renderList(sections.summary, "요약 내용이 없습니다."));
  lines.push("## 결정 사항", renderList(sections.decisions, "기록된 결정 사항이 없습니다."));
  lines.push("## 할 일", renderList(sections.actionItems, "도출된 할 일이 없습니다."));
  lines.push("## 다음 안건", renderList(sections.nextAgenda, "다음 안건이 없습니다."));
  lines.push("## 기획 루프 반영", renderList(sections.planningLoop, "기획 루프에 반영할 항목이 없습니다."));
  if (sections.excerpts.length) {
    lines.push("## 원문 주요 발췌", renderList(sections.excerpts, ""));
  }
  return lines.join("\n").trim() + "\n";
}

const DECISION_HINT = /(결정|확정|합의|승인|채택|하기로|하도록|진행하기로)/;
const ACTION_HINT = /(하기로|해야|필요|담당|맡|준비|작성|공유|정리|확인|검토|요청|전달|일정|기한|까지)/;
const AGENDA_HINT = /(다음|차기|추후|이후|논의 예정|검토 예정|다음 회의|후속)/;

function dedupeLimit(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

/** 요약 provider 없이 원문에서 규칙 기반으로 섹션을 추출하는 자동 초안. */
export function buildFallbackSections(normalizedTranscript: string): MeetingSections {
  const sentences = transcriptSentences(normalizedTranscript);
  const decisions: string[] = [];
  const actionItems: string[] = [];
  const nextAgenda: string[] = [];

  for (const s of sentences) {
    if (DECISION_HINT.test(s)) decisions.push(s);
    else if (AGENDA_HINT.test(s)) nextAgenda.push(s);
    else if (ACTION_HINT.test(s)) actionItems.push(s);
  }

  return {
    summary: sentences.slice(0, 5),
    decisions: dedupeLimit(decisions, 12),
    actionItems: dedupeLimit(actionItems, 15),
    nextAgenda: dedupeLimit(nextAgenda, 10),
    planningLoop: [
      "할 일 항목을 Todo/GitHub Issue로 이관할지 검토합니다.",
      "결정 사항을 관련 기획 문서/이슈에 반영합니다.",
    ],
    excerpts: sentences.slice(0, 12),
  };
}

function toStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return dedupeLimit(
    value.filter((v): v is string => typeof v === "string").map((v) => v.replace(/^[-*]\s*/, "")),
    limit,
  );
}

/** LLM 응답 문자열에서 JSON 오브젝트를 추출해 섹션으로 변환한다. 실패 시 null. */
export function parseLlmSections(response: string): MeetingSections | null {
  const start = response.indexOf("{");
  const end = response.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(response.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const sections: MeetingSections = {
    summary: toStringArray(parsed.summary, 8),
    decisions: toStringArray(parsed.decisions, 15),
    actionItems: toStringArray(parsed.actionItems ?? parsed.action_items, 20),
    nextAgenda: toStringArray(parsed.nextAgenda ?? parsed.next_agenda, 12),
    planningLoop: toStringArray(parsed.planningLoop ?? parsed.planning_loop, 10),
    excerpts: toStringArray(parsed.excerpts, 12),
  };
  // 최소한 요약 또는 결정/할일이 있어야 유효.
  if (!sections.summary.length && !sections.decisions.length && !sections.actionItems.length) {
    return null;
  }
  return sections;
}

export function buildSummaryPrompt(transcript: string, meta: MeetingMeta): { system: string; user: string } {
  const clipped = transcript.length > 12000 ? transcript.slice(0, 12000) : transcript;
  const system =
    "당신은 한국어 회의록 작성 도우미입니다. 전사 내용을 바탕으로 회의록을 구조화합니다. " +
    "설명 없이 유효한 JSON 객체만 출력하세요.";
  const user =
    `다음 회의 전사를 회의록으로 정리하세요.\n` +
    `회의 날짜: ${meta.date}${meta.time ? ` ${meta.time}` : ""}\n` +
    `${meta.topic ? `회의 주제: ${meta.topic}\n` : ""}` +
    `\n출력 형식(JSON):\n` +
    `{\n` +
    `  "summary": ["핵심 요약 3~5개"],\n` +
    `  "decisions": ["결정 사항"],\n` +
    `  "actionItems": ["할 일(가능하면 담당/기한 포함)"],\n` +
    `  "nextAgenda": ["다음 회의 안건"],\n` +
    `  "planningLoop": ["기획 루프 반영 사항(할 일→이슈화, 결정→문서 반영 등)"],\n` +
    `  "excerpts": ["원문 근거가 되는 주요 발췌"]\n` +
    `}\n\n` +
    `전사 내용:\n"""\n${clipped}\n"""`;
  return { system, user };
}
