# -*- coding: utf-8 -*-
"""
수문조사 원가분석 대시보드 빌드 스크립트
- 원본 xlsx(과업수행 관련 자료_한국수자원조사기술원)에서 실제 셀값을 읽어
  자체 완결형 HTML 2뷰(1분 요약 / 10분 심화)를 생성한다.
- 모든 수치에 출처(citation)를 함께 기록한다.  핵심 모델: 비용 = 지점수 × 단가.
실행:  python "_build_원가분석.py"
"""
import openpyxl, os, re, json, io, statistics

BASE = os.path.dirname(os.path.abspath(__file__))
F_V1  = os.path.join(BASE, "01_사업별 예산", "수문조사 항목별 세부예산 현황_v1.xlsx")
F_V2  = os.path.join(BASE, "01_사업별 예산", "수문조사 항목별 예산 및 단가 현황_v2.xlsx")
F_UNIT= os.path.join(BASE, "02_수문조사 단가표", "항목별 단가 현황('21~'26).xlsx")
F_FARE= os.path.join(BASE, "04_조사지점 현황", "조사거점 별 주요 교통비.xlsx")
F_PT  = os.path.join(BASE, "04_조사지점 현황", "조사지점 현황('24년 기준).xlsx")
F_EQ  = os.path.join(BASE, "05_조사장비 관련", "장비 관련.xlsx")
F_CAR = os.path.join(BASE, "06_운영비 관련", "업무차량 관련.xlsx")
F_RENT= os.path.join(BASE, "06_운영비 관련", "임대 관련.xlsx")

YEARS = ["2021","2022","2023","2024","2025","2026"]

def wb(path):
    return openpyxl.load_workbook(path, data_only=True, read_only=True)

def num(v):
    if v is None: return None
    if isinstance(v,(int,float)): return float(v)
    s = str(v).replace(",","").replace("원","").replace("대","").strip()
    try: return float(s)
    except: return None

def rows(ws, maxr=None):
    out=[]
    for i,r in enumerate(ws.iter_rows(values_only=True)):
        out.append(list(r))
        if maxr and i>=maxr: break
    return out

# ────────────────────────────────────────────────────────────
# 1) 수량(개소) · 단가(백만원) · 항목별 총계/실행예산  ─ v2
# ────────────────────────────────────────────────────────────
w2 = wb(F_V2)
현황 = rows(w2["현황"], 14)
단가 = rows(w2["단가"], 10)

def series_from(sheetrows, label_row, c0=3):
    r = sheetrows[label_row]
    return [num(r[c0+i]) for i in range(6)]

# 현황(수량) — 변경전 컬럼 D~I(idx 3~8), r4~r10
qty = {
    "유량":        series_from(현황, 4),
    "유사량":      series_from(현황, 5),
    "토양수분량":  series_from(현황, 6),
    "증발산량":    series_from(현황, 7),
    "자동유량_운영": series_from(현황, 8),
    "자동유량_설치": series_from(현황, 9),
    "자동유량_유지관리": series_from(현황, 10),
}
# 단가(백만원/개소) — r4~r10, D~I
price = {
    "유량":        series_from(단가, 4),
    "유사량":      series_from(단가, 5),
    "토양수분량":  series_from(단가, 6),
    "증발산량":    series_from(단가, 7),
    "자동유량_운영": series_from(단가, 8),
    "자동유량_설치": series_from(단가, 9),
    "자동유량_유지관리": series_from(단가, 10),
}

# 항목별 상세 시트: 연도별 수량/단가/총계/기관운영/사업 (백만원)
def item_detail(sheet, rows_map):
    rs = rows(w2[sheet], 40)
    out=[]
    for y,ri in rows_map:
        r = rs[ri]
        out.append({"year":y,"qty":num(r[2]),"price":num(r[3]),"total":num(r[4]),
                    "gov":num(r[5]),"gov_pct":num(r[6]),"biz":num(r[7]),"biz_pct":num(r[8])})
    return out
simple_map = list(zip(YEARS,[5,6,7,8,9,10]))
detail = {
    "유량":   item_detail("유량", simple_map),
    "유사량": item_detail("유사량", simple_map),
    "토양수분량": item_detail("토양수분량", simple_map),
    "증발산량": item_detail("증발산량", simple_map),
}
# 자동유량: 소계 행만 (r5,9,13,17,21,25)
auto_rows = rows(w2["자동유량"], 40)
auto = []
for y,ri in zip(YEARS,[5,9,13,17,21,25]):
    r = auto_rows[ri]
    auto.append({"year":y,"total":num(r[5]),"gov":num(r[6]),"gov_pct":num(r[7]),
                 "biz":num(r[8]),"biz_pct":num(r[9])})

# 총예산_02 : 연도별 총계/기관운영/사업
tot_rows = rows(w2["총예산_02"], 12)
totbud=[]
for y,ri in zip(YEARS,[5,6,7,8,9,10]):
    r = tot_rows[ri]
    totbud.append({"year":y,"total":num(r[2]),"gov":num(r[3]),"gov_pct":num(r[4]),
                   "biz":num(r[5]),"biz_pct":num(r[6])})

# 항목별예산(계, 원) — v2 항목별예산 r4 계, 변경전 D~I
hb = rows(w2["항목별예산"], 10)
budget_krw_2026 = num(hb[4][6])   # 2024?  주의: idx3=2021..idx8=2026 -> 2026=idx8? 재확인
# 항목별예산 r3 헤더: idx1=구분,2..7 = 2021..2026 ; 계 r4
budget_krw = {y: num(hb[4][2+i]) for i,y in enumerate(YEARS)}
w2.close()

# ────────────────────────────────────────────────────────────
# 2) 조사지점 현황 → 권역(시도)별 지점수
# ────────────────────────────────────────────────────────────
wpt = wb(F_PT)
ptrows = rows(wpt["2024년 기준"])
points=[]
for r in ptrows[3:]:
    no, name, addr = r[1], r[2], r[3]
    if no is None or name is None: continue
    sido = None
    if addr:
        sido = str(addr).split()[0]
    points.append({"no":no,"name":str(name),"sido":sido})
wpt.close()
def norm_sido(s):
    if not s: return "기타"
    s=str(s)
    m={"강원특별자치도":"강원","충청북도":"충북","충청남도":"충남","경기도":"경기",
       "서울특별시":"서울","서울시":"서울","인천광역시":"인천","경상북도":"경북",
       "경상남도":"경남","전라북도":"전북","전북특별자치도":"전북","전라남도":"전남",
       "대전광역시":"대전","대구광역시":"대구","광주광역시":"광주","부산광역시":"부산",
       "울산광역시":"울산","세종특별자치시":"세종","제주특별자치도":"제주"}
    return m.get(s, s[:2])
from collections import Counter, OrderedDict
sido_cnt = Counter(norm_sido(p["sido"]) for p in points)
n_points = len(points)

# ────────────────────────────────────────────────────────────
# 3) 교통비(편도)  → 지점 확장, 통계, 교통수단별
# ────────────────────────────────────────────────────────────
wf = wb(F_FARE)
frows = rows(wf["Sheet1"])
fares=[]   # per-그룹
fare_by_point=[]  # 확장(지점 단위)
for r in frows[1:]:
    rng, obs, mode, hub, fare = r[0], r[1], r[2], r[3], r[4]
    if rng is None or fare is None: continue
    f = num(fare)
    if f is None: continue
    # 연번 범위 확장 수
    s = str(rng)
    if "~" in s:
        a,b = s.split("~")
        try: cnt = int(b.strip())-int(a.strip())+1
        except: cnt = 1
    else:
        cnt = 1
    mode_s = re.sub(r'^\d+순위\s*','',str(mode)) if mode else "기타"
    fares.append({"range":s,"obs":str(obs) if obs else "","mode":str(mode) if mode else "",
                  "mode_s":mode_s,"hub":str(hub) if hub else "","fare":f,"cnt":cnt})
    for _ in range(cnt):
        fare_by_point.append(f)
wf.close()
fare_stats = {
    "min":min(fare_by_point),"max":max(fare_by_point),
    "avg":round(statistics.mean(fare_by_point)),
    "median":round(statistics.median(fare_by_point)),
    "n":len(fare_by_point)
}
mode_cnt = Counter(x["mode_s"] for x in fares for _ in range(x["cnt"]))
# 교통비 상위/하위
fares_sorted = sorted(fares, key=lambda x:-x["fare"])

# ────────────────────────────────────────────────────────────
# 4) 장비 / 차량 / 임대
# ────────────────────────────────────────────────────────────
we = wb(F_EQ)
eqrows = rows(we["보유장비 관련"], 20)
eq_total = num(eqrows[4][4])   # 합계 보유수량
equip=[]
for r in eqrows[5:]:
    grp = r[1]; sub=r[2]; sub2=r[3]; cntv=num(r[4]); price_e=num(r[9])
    if cntv is None: continue
    nm = " ".join([str(x) for x in [grp,sub,sub2] if x])
    equip.append({"name":nm.replace("\\n","").replace("\n",""),"cnt":cntv,"price":price_e})
cal_rows = rows(we["월 검·교정 비용"], 4)
cal = [num(cal_rows[3][2+i]) for i in range(12)]   # 천원
cal_total = sum(x for x in cal if x)
we.close()

wc = wb(F_CAR)
carrows = rows(wc["업무차량"])
cars=[]
for r in carrows[3:]:
    typ=r[1]; eco=r[2]; rent=num(r[3])
    if typ is None or rent is None: continue
    cars.append({"type":str(typ),"eco":str(eco) if eco else "","rent":rent})
n_cars=len(cars)
car_rent_sum=sum(c["rent"] for c in cars)
eco_cnt=Counter("전기/수소/하이브리드" if ("전기" in c["eco"] or "수소" in c["eco"] or "하이브리드" in c["eco"]) else "일반(내연)" for c in cars)
fuel_rows = rows(wc["전기&주유비"],5)
fuel = {"elec":[num(fuel_rows[3][2+i]) for i in range(6)],
        "oil":[num(fuel_rows[4][2+i]) for i in range(6)],
        "months":[str(fuel_rows[2][2+i]) for i in range(6)]}
wc.close()

wr = wb(F_RENT)
def rent_total(sheet):
    rs = rows(wr[sheet],10)
    # 합계 행 = r3, 합계 컬럼 idx14
    return num(rs[3][14])
rent = {
    "컨테이너(창고)": rent_total("컨테이너(창고)_2025년 기준"),
    "주차시설": rent_total("주차시설_2025년 기준"),
    "측량장비": rent_total("측량장비 대여_2025년 기준"),
}
# 컨테이너 권역별
cont_rows = rows(wr["컨테이너(창고)_2025년 기준"],10)
cont_region=[]
for r in cont_rows[4:9]:
    if r[1]: cont_region.append({"name":str(r[1]),"total":num(r[14])})
wr.close()

# ────────────────────────────────────────────────────────────
# 5) 검증: 계산 총계(Σ 수량×단가) vs 공식 총예산_01 소계
# ────────────────────────────────────────────────────────────
calc_total=[]
for i,y in enumerate(YEARS):
    s=0
    for k in ["유량","유사량","토양수분량","증발산량","자동유량_운영","자동유량_설치","자동유량_유지관리"]:
        q=qty[k][i]; p=price[k][i]
        if q is not None and p is not None: s+= q*p
    calc_total.append(round(s))
official_total=[t["total"] for t in totbud]

DATA = {
    "years":YEARS,"qty":qty,"price":price,"detail":detail,"auto":auto,
    "totbud":totbud,"budget_krw":budget_krw,
    "n_points":n_points,"sido":OrderedDict(sido_cnt.most_common()),
    "fare_stats":fare_stats,"mode_cnt":OrderedDict(mode_cnt.most_common()),
    "fares_top":fares_sorted[:12],"fares_bottom":fares_sorted[-8:],
    "eq_total":eq_total,"equip":equip,"cal":cal,"cal_total":cal_total,
    "n_cars":n_cars,"car_rent_sum":car_rent_sum,"eco_cnt":OrderedDict(eco_cnt.most_common()),
    "fuel":fuel,"rent":rent,"cont_region":cont_region,
    "calc_total":calc_total,"official_total":official_total,
}

out = os.path.join(BASE, "data_원가분석.json")
with open(out,"w",encoding="utf-8") as f:
    json.dump(DATA,f,ensure_ascii=False,indent=1)
print("JSON written:", out)
print("n_points=",n_points," fare_stats=",fare_stats," eq_total=",eq_total," n_cars=",n_cars)
print("calc_total=",calc_total)
print("official_total=",official_total)
print("budget_krw_2026=",budget_krw["2026"])
print("sido=",dict(sido_cnt.most_common()))
print("rent=",rent)
