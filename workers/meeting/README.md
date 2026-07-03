# 회의록 생성 백엔드 (kiba-meeting-summarize)

정적 프론트(GitHub Pages)에는 서버가 없으므로, 회의록 생성의 STT·요약·R2 저장은 이 Cloudflare Worker가 담당합니다.

## 엔드포인트

`POST /meeting/summarize` (Worker 루트로 배포 시 `POST /`)

`multipart/form-data` 필드:

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `file` | ✅ | 오디오 파일 또는 자막 텍스트(TXT/VTT/SRT) |
| `password` | ✅ | 처리 비밀번호 (`MEETING_PASSWORD` 시크릿과 비교) |
| `date` | ✅ | 회의 날짜 `YYYY-MM-DD` |
| `time` |  | 회의 시간 `HH:MM` |
| `topic` |  | 회의 주제 |
| `kind` |  | `audio` \| `text` 힌트 (서버가 확장자로 재검증) |

성공 응답(JSON):

```json
{ "markdown": "...", "filename": "2026-07-03_1400_주제.md", "requestId": "uuid", "usedStt": true, "usedFallback": false }
```

## 처리 흐름

1. origin 허용 목록 + 처리 비밀번호 검증
2. 크기 제한 / 확장자 / 바이너리 위장 검증
3. 오디오 → Workers AI Whisper STT, 텍스트 → TXT/VTT/SRT 정규화
4. Workers AI LLM 요약 → 실패 시 원문 기반 자동 초안 폴백
5. R2 자동 저장 (원본/전사/회의록/metadata) — 저장 실패해도 회의록은 반환
6. 회의록 Markdown 반환 (프론트가 다운로드)

## R2 저장 구조

```text
meetings/YYYY-MM-DD[_HHMM]/<requestId>/
├─ source/<원본 파일명>
├─ YYYY-MM-DD[_HHMM]_<주제>.md
├─ YYYY-MM-DD[_HHMM]_<주제>_transcript.txt
└─ metadata.json
```

## 배포

> ⚠️ 배포는 사람이 수행합니다(계정/시크릿 접근 필요). Claude는 코드만 준비합니다.

```bash
cd workers/meeting
npm install

# 최초 1회
npx wrangler r2 bucket create kiba-meetings
npx wrangler secret put MEETING_PASSWORD   # 처리 비밀번호 입력

# 배포
npx wrangler deploy
```

배포 후 출력되는 Worker URL을 프론트 빌드 환경변수에 넣습니다:

```
NEXT_PUBLIC_MEETING_SUMMARIZE_URL=https://kiba-meeting-summarize.<계정>.workers.dev
```

## 설정 (wrangler.jsonc `vars`)

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | `https://playzzin.github.io` | 콤마 구분 허용 origin (`*` 허용 가능) |
| `STT_MODEL` | `@cf/openai/whisper` | STT 모델 |
| `LLM_MODEL` | `@cf/meta/llama-3.1-8b-instruct` | 요약 모델 |
| `MAX_AUDIO_MB` | `25` | 오디오 최대 크기 |
| `MAX_TEXT_MB` | `2` | 텍스트 최대 크기 |

## 비용/주의

- Workers AI(STT·LLM)와 R2는 Cloudflare 사용량이 발생합니다.
- 회의 원문/전사가 R2에 저장되므로 개인정보 보관 정책을 확인하세요.
- 긴 오디오는 STT 처리 시간/한도에 걸릴 수 있어 짧은 녹음 위주로 운영합니다.
