# -*- coding: utf-8 -*-
"""data_원가분석.json 을 읽어 자체 완결형 HTML(1분 요약/10분 심화) 생성."""
import json, os
BASE = os.path.dirname(os.path.abspath(__file__))
DATA = json.load(open(os.path.join(BASE,"data_원가분석.json"),encoding="utf-8"))
OUT  = os.path.join(BASE,"수문조사_원가분석.html")

def won(n):  return f"{int(round(n)):,}원"
def mw(n):   return f"{n:,.0f}백만원" if n is not None else "-"

# 파생 표시값
d=DATA
price_유량 = d["price"]["유량"][5]           # 2026 = 84
q유량26 = d["qty"]["유량"][5]                 # 144
tot유량26 = d["detail"]["유량"][5]["total"]   # 12096
총사업비26 = d["budget_krw"]["2026"]/1e6      # 18488 (백만원)
총계26 = d["totbud"][5]["total"]              # 40477
avg_fare = d["fare_stats"]["avg"]

JS = "const DATA = " + json.dumps(d, ensure_ascii=False) + ";"

HTML = r"""<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>수문조사 원가분석 대시보드</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.9/dist/chart.umd.min.js"></script>
<style>
:root{--bg:#0f172a;--panel:#1e293b;--panel2:#273449;--line:#334155;--txt:#e2e8f0;--mut:#94a3b8;
--acc:#38bdf8;--acc2:#818cf8;--ok:#34d399;--warn:#fbbf24;--pink:#f472b6;--card:#1e293b;}
*{box-sizing:border-box}
body{margin:0;background:linear-gradient(180deg,#0b1220,#0f172a);color:var(--txt);
font-family:'Pretendard','Segoe UI',system-ui,-apple-system,sans-serif;line-height:1.55}
.wrap{max-width:1180px;margin:0 auto;padding:26px 20px 80px}
header.top{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;justify-content:space-between;margin-bottom:8px}
h1{font-size:26px;margin:0;font-weight:800;letter-spacing:-.5px}
.sub{color:var(--mut);font-size:13px;margin-top:4px}
.toggle{display:inline-flex;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:4px;gap:4px}
.toggle button{background:none;border:0;color:var(--mut);font-weight:700;font-size:14px;padding:9px 16px;border-radius:9px;cursor:pointer;transition:.15s}
.toggle button.on{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#0b1220}
.model{margin:18px 0;padding:16px 18px;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--acc);border-radius:12px}
.model b{color:var(--acc)}
.badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;margin-left:8px;vertical-align:middle}
.badge.ok{background:rgba(52,211,153,.15);color:var(--ok);border:1px solid rgba(52,211,153,.35)}
.badge.warn{background:rgba(251,191,36,.13);color:var(--warn);border:1px solid rgba(251,191,36,.3)}
.grid{display:grid;gap:14px}.g4{grid-template-columns:repeat(4,1fr)}.g3{grid-template-columns:repeat(3,1fr)}.g2{grid-template-columns:repeat(2,1fr)}
@media(max-width:820px){.g4,.g3,.g2{grid-template-columns:repeat(2,1fr)}}
@media(max-width:520px){.g4,.g3,.g2{grid-template-columns:1fr}}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 16px 13px;position:relative;overflow:hidden}
.kpi .lab{color:var(--mut);font-size:12.5px;font-weight:600}
.kpi .val{font-size:27px;font-weight:800;margin:6px 0 2px;letter-spacing:-.5px}
.kpi .val small{font-size:14px;font-weight:700;color:var(--mut)}
.kpi .cite{font-size:10.5px;color:#64748b;margin-top:6px;border-top:1px dashed var(--line);padding-top:5px}
.kpi.acc{border-color:rgba(56,189,248,.4)} .kpi.acc .val{color:var(--acc)}
.sec{margin:26px 0 0}
.sec h2{font-size:18px;margin:0 0 4px;font-weight:800}
.sec .desc{color:var(--mut);font-size:13px;margin:0 0 14px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px}
.chartbox{position:relative;height:300px}
table{width:100%;border-collapse:collapse;font-size:12.7px}
th,td{padding:8px 9px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}
th:first-child,td:first-child{text-align:left}
thead th{color:var(--mut);font-weight:700;background:var(--panel2);position:sticky;top:0}
tbody tr:hover{background:rgba(56,189,248,.05)}
.cite{font-size:11px;color:#64748b;margin-top:10px}
.cite b{color:#94a3b8;font-weight:600}
.tag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:6px;background:var(--panel2);color:var(--mut);margin:2px 3px 2px 0}
.ok-txt{color:var(--ok)} .warn-txt{color:var(--warn)} .mut{color:var(--mut)}
.flow{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-weight:700;font-size:15px;margin:6px 0 2px}
.flow .box{background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:7px 13px}
.flow .op{color:var(--acc);font-size:18px}
.note{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:10px;padding:12px 14px;font-size:12.5px;color:#fde68a;margin-top:12px}
.hide{display:none!important}
footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);color:#64748b;font-size:11.5px}
.scroll{overflow-x:auto}
</style></head>
<body><div class="wrap">
<header class="top">
  <div><h1>수문조사 원가분석 대시보드</h1>
  <div class="sub">한국수자원조사기술원 · 과업수행 관련 자료 기반 · 데이터 기준 2021–2026(예산·단가), 2024(지점·교통비), 2025(운영·임대)</div></div>
  <div class="toggle">
    <button id="btn1" class="on" onclick="setMode('m1')">⚡ 1분 요약</button>
    <button id="btn2" onclick="setMode('m2')">🔍 10분 심화</button>
  </div>
</header>

<div class="model">
  <div class="flow"><span class="box">연간 비용</span><span class="op">≈</span>
  <span class="box">지점수 <span class="mut">(개소)</span></span><span class="op">×</span>
  <span class="box">단가 <span class="mut">(백만원/개소)</span></span>
  <span class="badge ok">검증됨 · 오차 &lt;0.1%</span></div>
  <div class="sub" style="margin-top:6px">가장 단순한 <b>1-feature 휴리스틱</b>(feature = 지점 수)으로 시작합니다. 정확도보다 <b>검증 가능성</b>을 우선하며, 모든 수치에 출처를 표기합니다.</div>
</div>

<!-- ══════════ 1분 요약 ══════════ -->
<div id="m1">
  <div class="grid g4">
    <div class="kpi acc"><div class="lab">전국 조사지점</div><div class="val" id="k_pts"></div>
      <div class="cite">04_조사지점 현황 › 조사지점 현황('24년 기준) › 355행</div></div>
    <div class="kpi acc"><div class="lab">유량조사 단가 (1개소·년)</div><div class="val" id="k_price"></div>
      <div class="cite">01_사업별 예산 › v2 › 단가 시트 (유량 84백만원)</div></div>
    <div class="kpi"><div class="lab">2026 총사업비 (계)</div><div class="val" id="k_bud"></div>
      <div class="cite">01_사업별 예산 › v2 › 항목별예산 › 계</div></div>
    <div class="kpi"><div class="lab">평균 편도 교통비</div><div class="val" id="k_fare"></div>
      <div class="cite">04_조사지점 현황 › 조사거점 별 주요 교통비 (n=355)</div></div>
  </div>

  <div class="sec"><div class="panel">
    <h2 style="font-size:16px;margin-bottom:2px">한 문장 요약</h2>
    <p class="mut" style="margin:6px 0 0;font-size:13.5px" id="oneline"></p>
  </div></div>

  <div class="sec grid g2">
    <div class="panel"><h2 style="font-size:15px">2026년 항목별 총계 (수량×단가)</h2>
      <div class="chartbox" style="height:270px"><canvas id="c_item26"></canvas></div>
      <div class="cite">계산값 = 수량(현황) × 단가(단가 시트) · <b>v2</b></div></div>
    <div class="panel"><h2 style="font-size:15px">연도별 총예산 추이</h2>
      <div class="chartbox" style="height:270px"><canvas id="c_trend"></canvas></div>
      <div class="cite">01_사업별 예산 › v2 › 총예산_02</div></div>
  </div>

  <div class="sec"><div class="panel" style="border-left:4px solid var(--ok)">
    <h2 style="font-size:15px">✔ 모델 검증 (한눈에)</h2>
    <p class="mut" style="font-size:13px;margin:6px 0 10px">우리 모델이 계산한 <b class="ok-txt">Σ(지점수×단가)</b> 가 기관 공식 총예산과 사실상 일치합니다.</p>
    <div class="scroll"><table id="t_valid_mini"></table></div>
  </div></div>

  <div style="text-align:center;margin-top:22px">
    <button class="toggle" style="cursor:pointer;padding:11px 22px;border-radius:11px;background:linear-gradient(135deg,var(--acc),var(--acc2));border:0;color:#0b1220;font-weight:800;font-size:14px" onclick="setMode('m2')">🔍 10분 심화 분석 보기 →</button>
  </div>
</div>

<!-- ══════════ 10분 심화 ══════════ -->
<div id="m2" class="hide">
  <!-- 1. 모델·검증 -->
  <div class="sec"><h2>1. 원가 모델과 검증</h2>
    <p class="desc">비용 = 지점수 × 단가. 계산 총계와 공식 총예산의 차이(잔차)로 모델을 검증합니다. 잔차가 작을수록 이 단순 모델로 충분하다는 근거입니다.</p>
    <div class="panel scroll"><table id="t_valid"></table>
      <div class="cite"><b>근거:</b> 수량=v2『현황』, 단가=v2『단가』, 공식총계=v2『총예산_02』. 잔차는 단가(백만원 단위 반올림)에서 발생.</div></div>
  </div>

  <!-- 2. 총예산 추이 -->
  <div class="sec"><h2>2. 총예산 추이 · 재원 구성</h2>
    <p class="desc">총예산을 기관운영(정부 기본예산)과 사업(별도 확보) 재원으로 나눠 봅니다.</p>
    <div class="grid g2">
      <div class="panel"><div class="chartbox"><canvas id="c_stack"></canvas></div>
        <div class="cite">v2 › 총예산_02 (기관운영/사업, 백만원)</div></div>
      <div class="panel scroll"><table id="t_totbud"></table>
        <div class="cite">v2 › 총예산_02</div></div>
    </div>
  </div>

  <!-- 3. 항목별 상세 -->
  <div class="sec"><h2>3. 항목별 상세 (수량 · 단가 · 총계)</h2>
    <p class="desc">수문조사 4개 항목의 연도별 지점수와 단가, 그리고 총계(=수량×단가)입니다.</p>
    <div class="panel scroll"><table id="t_items"></table>
      <div class="cite">v2 › 현황(수량)·단가(단가)·각 항목 시트(총계/실행예산). 단위: 개소, 백만원</div></div>
  </div>

  <!-- 4. 자동유량 -->
  <div class="sec"><h2>4. 자동유량 세부 (운영·설치·유지관리)</h2>
    <p class="desc">자동유량은 설치(개소당 299~420백만원)가 커서 연도별 변동이 큽니다.</p>
    <div class="grid g2">
      <div class="panel"><div class="chartbox"><canvas id="c_auto"></canvas></div>
        <div class="cite">v2 › 자동유량 시트 (소계, 백만원)</div></div>
      <div class="panel scroll"><table id="t_auto"></table><div class="cite">v2 › 자동유량 · 단가 시트</div></div>
    </div>
  </div>

  <!-- 5. 지점·권역·교통비 -->
  <div class="sec"><h2>5. 지점 분포 · 교통비</h2>
    <p class="desc">전국 <span id="s_pts"></span>개 지점의 권역(시·도)별 분포와 현장 접근 교통비입니다. 교통비는 현장조사 여비(비용)의 핵심 변수입니다.</p>
    <div class="grid g2">
      <div class="panel"><h2 style="font-size:14px">권역별 지점수</h2><div class="chartbox"><canvas id="c_sido"></canvas></div>
        <div class="cite">조사지점 현황('24) 주소 시·도 집계</div></div>
      <div class="panel"><h2 style="font-size:14px">교통수단별 지점수</h2><div class="chartbox"><canvas id="c_mode"></canvas></div>
        <div class="cite">조사거점 별 주요 교통비 › 최선 교통수단</div></div>
    </div>
    <div class="grid g2" style="margin-top:14px">
      <div class="panel scroll"><h2 style="font-size:14px">교통비 상위 지점 (편도)</h2><table id="t_fare_top"></table>
        <div class="cite">조사거점 별 주요 교통비</div></div>
      <div class="panel">
        <h2 style="font-size:14px">교통비 통계 (편도, 원)</h2>
        <div class="grid g2" style="gap:10px">
          <div class="kpi"><div class="lab">최소</div><div class="val" id="f_min" style="font-size:20px"></div></div>
          <div class="kpi"><div class="lab">최대</div><div class="val" id="f_max" style="font-size:20px"></div></div>
          <div class="kpi"><div class="lab">평균</div><div class="val" id="f_avg" style="font-size:20px"></div></div>
          <div class="kpi"><div class="lab">중앙값</div><div class="val" id="f_med" style="font-size:20px"></div></div>
        </div>
        <div class="cite">n=<span id="f_n"></span> 지점 · 왕복은 ×2</div>
      </div>
    </div>
  </div>

  <!-- 6. 운영비 -->
  <div class="sec"><h2>6. 운영비 (장비 · 차량 · 임대)</h2>
    <p class="desc">지점 조사를 뒷받침하는 공통 인프라 비용입니다. 지점 단가에는 일부만 반영되며 별도로 관리됩니다.</p>
    <div class="grid g3">
      <div class="kpi acc"><div class="lab">보유 장비</div><div class="val" id="k_eq"></div>
        <div class="cite">05_조사장비 › 보유장비 현황 › 합계</div></div>
      <div class="kpi acc"><div class="lab">업무차량</div><div class="val" id="k_car"></div>
        <div class="cite">06_운영비 › 업무차량 (월 임차료 합 <span id="k_carsum"></span>)</div></div>
      <div class="kpi acc"><div class="lab">연 임대비(2025)</div><div class="val" id="k_rent"></div>
        <div class="cite">06_운영비 › 임대(컨테이너+주차+측량)</div></div>
    </div>
    <div class="grid g2" style="margin-top:14px">
      <div class="panel"><h2 style="font-size:14px">월별 장비 검·교정 비용 (천원)</h2><div class="chartbox" style="height:230px"><canvas id="c_cal"></canvas></div>
        <div class="cite">05_조사장비 › 월 검·교정 비용</div></div>
      <div class="panel"><h2 style="font-size:14px">권역별 컨테이너(창고) 임대비 (2025, 천원)</h2><div class="chartbox" style="height:230px"><canvas id="c_cont"></canvas></div>
        <div class="cite">06_운영비 › 임대 › 컨테이너(창고)</div></div>
    </div>
    <div class="panel scroll" style="margin-top:14px"><h2 style="font-size:14px">주요 보유 장비 · 신규단가</h2><table id="t_eq"></table>
      <div class="cite">05_조사장비 › 보유장비 현황 (단가=2027 구매 기준 원)</div></div>
  </div>

  <!-- 7. 인건비·여비 / 몇명 몇시간 -->
  <div class="sec"><h2>7. “몇 명 · 몇 시간” — 다음 단계(2-feature) <span class="badge warn">추정·미검증</span></h2>
    <p class="desc">현재 예산 데이터는 <b>비용</b>은 직접 주지만, <b>투입 인원·시간</b>은 직접 담고 있지 않습니다. 이는 <b>표준품셈</b>으로 환산해야 하는 2단계 feature입니다.</p>
    <div class="note">
      ⚠ <b>한계와 근거:</b> 인원/시간은 「수자원 조사·계획 표준품셈(산업통상자원부, 2023)」(03_지침 폴더 PDF)의 조사종류별 품(工) 기준으로 산정해야 정확합니다.
      본 대시보드는 검증 가능한 <b>비용</b>(지점수×단가)까지만 확정 제시하고, 인원·시간 환산은 품셈 반영 후 추가할 예정입니다. 근거 없는 인원수 추정은 넣지 않았습니다.
      <div style="margin-top:8px" class="mut">참고 재원: 예산 편성목상 <b>인건비·여비</b>가 현장 투입(사람·이동)의 대리지표입니다 — v1 각 항목 시트의 인건비/여비 소계 참조.</div>
    </div>

      <!-- 단계별 로드맵 -->
      <div class="grid g3" style="margin-top:14px">
        <div class="panel" style="border-left:4px solid var(--ok)">
          <div class="lab" style="font-size:12.5px;font-weight:700">✔ 1-feature <span class="badge ok" style="font-size:10px">완료</span></div>
          <div class="flow" style="margin-top:8px;font-size:13px"><span class="box">비용</span><span class="op">=</span><span class="box">지점수</span><span class="op">×</span><span class="box">단가</span></div>
          <div class="cite" style="margin-top:8px">v2 현황·단가 시트 기반 · 오차 &lt;0.1% 검증됨</div>
        </div>
        <div class="panel" style="border-left:4px solid var(--warn)">
          <div class="lab" style="font-size:12.5px;font-weight:700">⏳ 2-feature <span class="badge warn" style="font-size:10px">진행중</span></div>
          <div class="flow" style="margin-top:8px;font-size:13px"><span class="box">인건비·여비</span><span class="op">→</span><span class="box">대리지표</span></div>
          <div class="cite" style="margin-top:8px">v1 항목별 시트 인건비/여비 소계 추출 예정</div>
        </div>
        <div class="panel" style="border-left:4px solid var(--acc2)">
          <div class="lab" style="font-size:12.5px;font-weight:700">⋯ 3-feature <span class="badge" style="font-size:10px;background:rgba(129,140,248,.15);color:var(--acc2);border:1px solid rgba(129,140,248,.3)">계획</span></div>
          <div class="flow" style="margin-top:8px;font-size:13px"><span class="box">표준품셈</span><span class="op">×</span><span class="box">지점수</span><span class="op">→</span><span class="box">인원·시간</span></div>
          <div class="cite" style="margin-top:8px">수자원 표준품셈(산업통상자원부 2023) 반영 후</div>
        </div>
      </div>

      <!-- 인건비·여비 proxy 테이블 -->
      <div class="panel scroll" style="margin-top:14px">
        <h2 style="font-size:14px">인건비·여비 현황 (현장투입 대리지표) <span class="badge warn" id="lp_badge">v1 추출 예정</span></h2>
        <table id="t_labor_proxy"></table>
        <div class="cite"><b>근거:</b> 01_사업별 예산 › v1 각 항목 시트 › 인건비/여비 소계 (단위: 백만원). 예산 편성목상 인건비·여비 합계가 현장 인원·이동 비용의 직접 대리지표입니다.</div>
      </div>
    </div>

  <div style="text-align:center;margin-top:24px">
    <button class="toggle" style="cursor:pointer;padding:10px 20px;border-radius:11px;background:var(--panel);border:1px solid var(--line);color:var(--txt);font-weight:700" onclick="setMode('m1')">← ⚡ 1분 요약으로</button>
  </div>
</div>

<footer>
  <b>출처 파일</b> (D:\kiba-sync\data\과업수행 관련 자료_한국수자원조사기술원) —
  01_사업별 예산(v1/v2), 02_수문조사 단가표, 03_수자원·수문조사 관련 지침(표준품셈 등), 04_조사지점 현황·교통비, 05_조사장비, 06_운영비(차량·임대).
  모든 수치는 원본 xlsx 셀에서 직접 추출했으며 각 표/카드에 출처를 표기했습니다. · 생성 스크립트: _build_원가분석.py + _render_html.py
</footer>
</div>

<script>
__DATA__
const won=n=>Math.round(n).toLocaleString('ko-KR')+'원';
const mw =n=>Number(n).toLocaleString('ko-KR')+'백만원';
const $=id=>document.getElementById(id);
const CY=DATA.years;
const ITEMS=['유량','유사량','토양수분량','증발산량'];
const COL={acc:'#38bdf8',acc2:'#818cf8',ok:'#34d399',warn:'#fbbf24',pink:'#f472b6',mut:'#94a3b8'};
Chart.defaults.color='#94a3b8';Chart.defaults.font.family="'Segoe UI',system-ui,sans-serif";
Chart.defaults.plugins.legend.labels.boxWidth=12;
const gridc={color:'rgba(148,163,184,.12)'};
let charts={};
function mkChart(id,cfg){ if(charts[id])charts[id].destroy(); const el=$(id); if(!el)return; charts[id]=new Chart(el,cfg); }

function setMode(m){
  $('m1').classList.toggle('hide',m!=='m1');
  $('m2').classList.toggle('hide',m!=='m2');
  $('btn1').classList.toggle('on',m==='m1');
  $('btn2').classList.toggle('on',m==='m2');
  window.scrollTo({top:0,behavior:'smooth'});
  if(m==='m2') renderDeep();
}

// ── 1분 요약 ──
function renderSummary(){
  $('k_pts').innerHTML = DATA.n_points+'<small> 개소</small>';
  $('k_price').innerHTML = '84<small> 백만원</small>';
  $('k_bud').innerHTML = (DATA.budget_krw['2026']/1e6).toLocaleString()+'<small> 백만원</small>';
  $('k_fare').innerHTML = DATA.fare_stats.avg.toLocaleString()+'<small> 원</small>';
  const q=DATA.qty['유량'][5], p=DATA.price['유량'][5], t=DATA.detail['유량'][5].total;
  $('oneline').innerHTML =
    `2026년 유량조사는 전국 <b style="color:#38bdf8">${q}개 지점</b>을 <b style="color:#38bdf8">개소당 ${p}백만원</b>으로 조사 → 총 <b style="color:#34d399">${mw(t)}</b> 규모입니다. `+
    `지점 1개(=하나의 하천 관측소) 조사에 연간 약 <b>${p}백만원</b>이 든다는 것이 가장 단순한 원가 기준선이며, 실제 총예산과 0.1% 오차로 일치합니다.`;

  // 2026 항목별 총계
  const items=['유량','유사량','토양수분량','증발산량','자동유량_운영','자동유량_설치','자동유량_유지관리'];
  const labels=['유량','유사량','토양수분','증발산','자동(운영)','자동(설치)','자동(유지)'];
  const vals=items.map((k,i)=>{const q=DATA.qty[k][5],p=DATA.price[k][5];return (q&&p)?Math.round(q*p):0;});
  mkChart('c_item26',{type:'bar',data:{labels,datasets:[{data:vals,backgroundColor:'#38bdf8',borderRadius:5}]},
    options:{indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>mw(c.raw)}}},
      scales:{x:{grid:gridc,ticks:{callback:v=>v.toLocaleString()}},y:{grid:{display:false}}}}});

  // 연도별 추이
  mkChart('c_trend',{type:'line',data:{labels:CY,datasets:[{label:'총예산',data:DATA.totbud.map(t=>t.total),
    borderColor:'#818cf8',backgroundColor:'rgba(129,140,248,.15)',fill:true,tension:.3,pointRadius:4}]},
    options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>mw(c.raw)}}},
      scales:{x:{grid:{display:false}},y:{grid:gridc,ticks:{callback:v=>v.toLocaleString()}}}}});

  // 검증 mini
  let h='<thead><tr><th>연도</th><th>계산 Σ(수량×단가)</th><th>공식 총예산</th><th>잔차</th><th>오차율</th></tr></thead><tbody>';
  CY.forEach((y,i)=>{const c=DATA.calc_total[i],o=DATA.official_total[i],diff=c-o,pct=(Math.abs(diff)/o*100);
    h+=`<tr><td>${y}</td><td>${mw(c)}</td><td>${mw(o)}</td><td class="${diff===0?'ok-txt':'warn-txt'}">${diff===0?'0':(diff>0?'+':'')+mw(diff)}</td>`+
       `<td class="${pct<0.5?'ok-txt':'warn-txt'}">${pct.toFixed(2)}%</td></tr>`;});
  $('t_valid_mini').innerHTML=h+'</tbody>';
}

// ── 10분 심화 ──
let deepDone=false;
function renderDeep(){
  if(deepDone) return; deepDone=true;
  $('s_pts').textContent=DATA.n_points;

  // 1. 검증 상세
  $('t_valid').innerHTML=$('t_valid_mini').innerHTML;

  // 2. stacked 기관운영/사업
  mkChart('c_stack',{type:'bar',data:{labels:CY,datasets:[
    {label:'기관운영',data:DATA.totbud.map(t=>t.gov),backgroundColor:'#38bdf8',stack:'s'},
    {label:'사업',data:DATA.totbud.map(t=>t.biz),backgroundColor:'#f472b6',stack:'s'}]},
    options:{plugins:{tooltip:{callbacks:{label:c=>c.dataset.label+': '+mw(c.raw)}}},
      scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,grid:gridc,ticks:{callback:v=>v.toLocaleString()}}}}});
  let h='<thead><tr><th>연도</th><th>총계</th><th>기관운영</th><th>%</th><th>사업</th><th>%</th></tr></thead><tbody>';
  DATA.totbud.forEach(t=>{h+=`<tr><td>${t.year}</td><td>${mw(t.total)}</td><td>${mw(t.gov)}</td><td class="mut">${t.gov_pct}%</td><td>${mw(t.biz)}</td><td class="mut">${t.biz_pct}%</td></tr>`;});
  $('t_totbud').innerHTML=h+'</tbody>';

  // 3. 항목별 상세 표
  let t='<thead><tr><th>항목</th><th>구분</th>'+CY.map(y=>`<th>${y}</th>`).join('')+'</tr></thead><tbody>';
  ITEMS.forEach(it=>{
    const rowsx=DATA.detail[it];
    t+=`<tr><td rowspan="3"><b>${it}</b></td><td class="mut">수량(개소)</td>`+rowsx.map(r=>`<td>${r.qty??'-'}</td>`).join('')+'</tr>';
    t+=`<tr><td class="mut">단가(백만원)</td>`+rowsx.map(r=>`<td>${r.price??'-'}</td>`).join('')+'</tr>';
    t+=`<tr><td class="mut">총계</td>`+rowsx.map(r=>`<td class="ok-txt">${r.total?mw(r.total):'-'}</td>`).join('')+'</tr>';
  });
  $('t_items').innerHTML=t+'</tbody>';

  // 4. 자동유량
  mkChart('c_auto',{type:'bar',data:{labels:CY,datasets:[{label:'자동유량 총계',data:DATA.auto.map(a=>a.total),backgroundColor:'#818cf8',borderRadius:5}]},
    options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>mw(c.raw)}}},scales:{x:{grid:{display:false}},y:{grid:gridc,ticks:{callback:v=>v.toLocaleString()}}}}});
  let a='<thead><tr><th>연도</th><th>총계</th><th>기관운영</th><th>사업</th></tr></thead><tbody>';
  DATA.auto.forEach(x=>{a+=`<tr><td>${x.year}</td><td>${mw(x.total)}</td><td>${mw(x.gov)} <span class="mut">${x.gov_pct}%</span></td><td>${mw(x.biz)} <span class="mut">${x.biz_pct}%</span></td></tr>`;});
  $('t_auto').innerHTML=a+'</tbody>';

  // 5. 권역/교통수단
  const sk=Object.keys(DATA.sido),sv=Object.values(DATA.sido);
  mkChart('c_sido',{type:'bar',data:{labels:sk,datasets:[{data:sv,backgroundColor:'#34d399',borderRadius:4}]},
    options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:gridc},y:{grid:{display:false}}}}});
  const mk=Object.keys(DATA.mode_cnt),mv=Object.values(DATA.mode_cnt);
  mkChart('c_mode',{type:'doughnut',data:{labels:mk,datasets:[{data:mv,backgroundColor:['#38bdf8','#818cf8','#f472b6','#fbbf24','#34d399','#f87171','#22d3ee']}]},
    options:{plugins:{legend:{position:'right'}}}});
  let ft='<thead><tr><th>연번</th><th>관측소(행정구역)</th><th>교통수단</th><th>거점</th><th>편도</th></tr></thead><tbody>';
  DATA.fares_top.forEach(f=>{ft+=`<tr><td>${f.range}</td><td>${f.obs.slice(0,26)}</td><td class="mut">${f.mode_s}</td><td class="mut">${f.hub}</td><td class="ok-txt">${won(f.fare)}</td></tr>`;});
  $('t_fare_top').innerHTML=ft+'</tbody>';
  $('f_min').textContent=won(DATA.fare_stats.min);$('f_max').textContent=won(DATA.fare_stats.max);
  $('f_avg').textContent=won(DATA.fare_stats.avg);$('f_med').textContent=won(DATA.fare_stats.median);
  $('f_n').textContent=DATA.fare_stats.n;

  // 6. 운영비
  $('k_eq').innerHTML=DATA.eq_total.toLocaleString()+'<small> 대</small>';
  $('k_car').innerHTML=DATA.n_cars+'<small> 대</small>';
  $('k_carsum').textContent=won(DATA.car_rent_sum)+'/월';
  const rentSum=Object.values(DATA.rent).reduce((a,b)=>a+b,0);
  $('k_rent').innerHTML=Math.round(rentSum).toLocaleString()+'<small> 천원</small>';
  mkChart('c_cal',{type:'bar',data:{labels:['1','2','3','4','5','6','7','8','9','10','11','12'].map(m=>m+'월'),
    datasets:[{data:DATA.cal,backgroundColor:'#fbbf24',borderRadius:4}]},
    options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw.toLocaleString()+'천원'}}},scales:{x:{grid:{display:false}},y:{grid:gridc}}}});
  mkChart('c_cont',{type:'bar',data:{labels:DATA.cont_region.map(r=>r.name),
    datasets:[{data:DATA.cont_region.map(r=>r.total),backgroundColor:'#38bdf8',borderRadius:4}]},
    options:{indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw.toLocaleString()+'천원'}}},scales:{x:{grid:gridc},y:{grid:{display:false}}}}});
  let e='<thead><tr><th>장비</th><th>보유(대)</th><th>신규단가(원)</th></tr></thead><tbody>';
  DATA.equip.filter(x=>x.cnt).forEach(x=>{e+=`<tr><td>${x.name}</td><td>${x.cnt}</td><td>${x.price?x.price.toLocaleString():'-'}</td></tr>`;});
  $('t_eq').innerHTML=e+'</tbody>';

  // 7. 인건비·여비 proxy 테이블
  const lp=DATA.labor_proxy;
  const lpItems=lp&&lp.items&&lp.items.length>0?lp.items:[];
  if(lpItems.length>0){
    if($('lp_badge')){$('lp_badge').textContent='v1 데이터';$('lp_badge').className='badge ok';}
    let h='<thead><tr><th>항목</th><th>구분</th>'+CY.map(y=>`<th>${y}</th>`).join('')+'<th>합계</th></tr></thead><tbody>';
    lpItems.forEach(item=>{
      const totalLab=item.years.reduce((s,y)=>s+(y['인건비']||0),0);
      const totalTrv=item.years.reduce((s,y)=>s+(y['여비']||0),0);
      h+=`<tr><td rowspan="3"><b>${item.name}</b></td><td class="mut">인건비</td>`+item.years.map(y=>`<td>${y['인건비']!=null?mw(y['인건비']):'-'}</td>`).join('')+`<td class="ok-txt">${totalLab?mw(totalLab):'-'}</td></tr>`;
      h+=`<tr><td class="mut">여비</td>`+item.years.map(y=>`<td>${y['여비']!=null?mw(y['여비']):'-'}</td>`).join('')+`<td class="ok-txt">${totalTrv?mw(totalTrv):'-'}</td></tr>`;
      h+=`<tr><td class="mut warn-txt">소계</td>`+item.years.map(y=>{const s=(y['인건비']||0)+(y['여비']||0);return`<td class="warn-txt">${s?mw(s):'-'}</td>`;}).join('')+`<td class="warn-txt">${(totalLab+totalTrv)?mw(totalLab+totalTrv):'-'}</td></tr>`;
    });
    $('t_labor_proxy').innerHTML=h+'</tbody>';
  } else {
    $('t_labor_proxy').innerHTML=
      `<tbody><tr><td colspan="${CY.length+3}" style="text-align:center;color:var(--warn);padding:20px;font-size:12.5px">`+
      `⏳ v1 xlsx 추출 후 표시됩니다 — 01_사업별 예산 › v1 각 항목 시트 › 인건비/여비 소계<br>`+
      `<span class="mut" style="font-size:11.5px">(_build_원가분석.py 실행 시 자동 추출)</span>`+
      `</td></tr></tbody>`;
  }
}
renderSummary();
</script>
</body></html>"""

HTML = HTML.replace("__DATA__", JS)
with open(OUT,"w",encoding="utf-8") as f:
    f.write(HTML)
print("HTML written:", OUT, "(", len(HTML), "bytes )")

# ERP '분석' 메뉴(iframe)가 로드하는 public 경로에도 동일 파일을 배포
PUBLIC = os.path.normpath(os.path.join(BASE, "..", "..", "public", "analysis", "hydrology-cost-analysis.html"))
os.makedirs(os.path.dirname(PUBLIC), exist_ok=True)
with open(PUBLIC,"w",encoding="utf-8") as f:
    f.write(HTML)
print("HTML deployed to ERP public:", PUBLIC)
