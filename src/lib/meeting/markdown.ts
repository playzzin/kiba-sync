// 회의록 파일명/키 규칙과, 요약 없이 원문 기반으로 만드는 클라이언트 초안(fallback) 빌더.
// 서버(Worker) 요약이 없거나 실패했을 때 사용자가 최소한의 Markdown을 받도록 한다.

import type { MeetingMinutesSections } from "./types";
import { transcriptSentences } from "./transcript";

/** 파일명/키에 쓸 수 없는 문자를 안전하게 치환한다. */
export function sanitizeSlug(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 날짜/시간 접두어(YYYY-MM-DD 또는 YYYY-MM-DD_HHMM)를 만든다. */
export function meetingStampPrefix(date: string, time?: string): string {
  const d = (date || new Date().toISOString().slice(0, 10)).trim();
  const t = (time || "").trim();
  if (!t) return d;
  return `${d}_${t.replace(":", "")}`;
}

/** 회의록 Markdown 파일명. 예: 2026-07-03_1400_정기회의.md */
export function meetingFilename(date: string, time: string | undefined, topic: string | undefined): string {
  const prefix = meetingStampPrefix(date, time);
  const slug = sanitizeSlug(topic || "회의록");
  return `${prefix}_${slug || "회의록"}.md`;
}

/** 회의록 제목. */
export function meetingTitle(date: string, time: string | undefined, topic: string | undefined): string {
  const when = time ? `${date} ${time}` : date;
  const subject = (topic || "").trim();
  return subject ? `${subject} 회의록 (${when})` : `회의록 (${when})`;
}

function renderSectionList(items: string[], emptyText: string): string {
  if (!items.length) return `- ${emptyText}\n`;
  return items.map((item) => `- ${item}`).join("\n") + "\n";
}

/** 섹션 데이터를 표준 회의록 Markdown으로 렌더링한다. 서버/클라이언트 공통 포맷. */
export function renderMeetingMarkdown(
  title: string,
  meta: { date: string; time?: string; topic?: string },
  sections: MeetingMinutesSections,
  options?: { draftNotice?: boolean; draftReason?: string },
): string {
  const lines: string[] = [];
  lines.push(`# ${title}`, "");
  lines.push(`- **날짜**: ${meta.date}${meta.time ? ` ${meta.time}` : ""}`);
  if (meta.topic?.trim()) lines.push(`- **주제**: ${meta.topic.trim()}`);
  lines.push("");
  if (options?.draftNotice) {
    lines.push("> ⚠️ 서버 요약을 사용하지 못해 원문 기반 로컬 초안으로 생성되었습니다. 검토 후 보완하세요.");
    if (options.draftReason?.trim()) {
      lines.push(`> 실패 원인: ${options.draftReason.trim()}`);
    }
    lines.push("");
  }
  lines.push("## 요약", renderSectionList(sections.summary, "요약 내용이 없습니다."));
  lines.push("## 결정 사항", renderSectionList(sections.decisions, "기록된 결정 사항이 없습니다."));
  lines.push("## 할 일", renderSectionList(sections.actionItems, "도출된 할 일이 없습니다."));
  lines.push("## 다음 안건", renderSectionList(sections.nextAgenda, "다음 안건이 없습니다."));
  lines.push("## 기획 루프 반영", renderSectionList(sections.planningLoop, "기획 루프에 반영할 항목이 없습니다."));
  if (sections.excerpts.length) {
    lines.push("## 원문 주요 발췌", renderSectionList(sections.excerpts, ""));
  }
  return lines.join("\n").trim() + "\n";
}

const DECISION_HINT = /(결정|확정|합의|승인|채택|하기로|하도록|진행하기로)/;
const ACTION_HINT = /(하기로|해야|필요|담당|맡|준비|작성|공유|정리|확인|검토|요청|전달|일정|기한|까지)/;
const AGENDA_HINT = /(다음|차기|추후|이후|논의 예정|검토 예정|다음 회의|후속)/;

/**
 * 요약 provider 없이 원문에서 규칙 기반으로 섹션을 추출하는 로컬 초안.
 * 완성도 높은 요약이 아니라, 서버 요약 부재 시의 최소 대체본이다.
 */
export function buildFallbackSections(normalizedTranscript: string): MeetingMinutesSections {
  const sentences = transcriptSentences(normalizedTranscript);
  const decisions: string[] = [];
  const actionItems: string[] = [];
  const nextAgenda: string[] = [];

  for (const s of sentences) {
    if (DECISION_HINT.test(s)) decisions.push(s);
    else if (AGENDA_HINT.test(s)) nextAgenda.push(s);
    else if (ACTION_HINT.test(s)) actionItems.push(s);
  }

  const summary = sentences.slice(0, 5);
  const excerpts = sentences.slice(0, 12);

  return {
    summary,
    decisions: dedupeLimit(decisions, 12),
    actionItems: dedupeLimit(actionItems, 15),
    nextAgenda: dedupeLimit(nextAgenda, 10),
    planningLoop: [
      "할 일 항목을 Todo/GitHub Issue로 이관할지 검토합니다.",
      "결정 사항을 관련 기획 문서/이슈에 반영합니다.",
    ],
    excerpts,
  };
}

function dedupeLimit(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}
