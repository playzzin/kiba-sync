"use client";

import Image from "next/image";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Code2,
  Database,
  ExternalLink,
  FileText,
  FolderKanban,
  HelpCircle,
  Home,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Moon,
  Navigation,
  Phone,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  costEstimateTemplates,
  defaultCostEstimateTemplateId,
  type CostEstimateTemplate,
  type CostEstimateTemplateId,
  type CostItemTemplate,
} from "@/lib/cost-estimate/templates";
import professionalStaffData from "@/lib/kiba/professional-staff-data.json";
import { kibaSeedPagesByRoute, kibaSeedSummary, type KibaSeedPage } from "@/lib/kiba/source-content";

type Mode = "user" | "erp" | "admin";
type BadgeType = "success" | "danger" | "warning";
type IconKey =
  | "activity"
  | "api"
  | "bell"
  | "chart"
  | "code"
  | "database"
  | "doc"
  | "folder"
  | "help"
  | "home"
  | "lock"
  | "server"
  | "settings"
  | "shield"
  | "task"
  | "users";

type MenuItem = {
  label: string;
  href?: string;
  icon: IconKey;
  badge?: string;
  badgeType?: BadgeType;
  disabled?: boolean;
  children?: MenuItem[];
};

type MenuGroup = {
  group: string;
  items: MenuItem[];
};

const visibleModeTabs: Mode[] = ["user", "erp"];

type ShellState = {
  mode: Mode;
  route: string;
  collapsed: boolean;
  dark: boolean;
  open: Set<string>;
  search: string;
};

type ProfessionalEmployee = {
  id: string;
  name: string;
  dept: string;
  rank: string;
};

type ProfessionalCert = {
  uid: string;
  empId: string;
  name: string;
  code: string;
  title: string;
  issue: string;
};

type ProfessionalEducation = {
  eduId: string;
  empId: string;
  name: string;
  degree: string;
  degreeTitle?: string;
  school: string;
  department?: string;
  major?: string;
};

type ProfessionalWork = {
  uid: string;
  code: string;
  domain: string;
  category: string;
  subCategory: string;
  taskType: string;
  scope: string;
  department: string;
  owner: string;
  keywords: string;
  description: string;
  guideline: string;
  law: string;
};

type ProfessionalStaffData = {
  employees: ProfessionalEmployee[];
  certs: ProfessionalCert[];
  educations: ProfessionalEducation[];
  works: ProfessionalWork[];
};

const professionalStaff = professionalStaffData as ProfessionalStaffData;

const icons: Record<IconKey, LucideIcon> = {
  activity: Activity,
  api: Boxes,
  bell: Bell,
  chart: BarChart3,
  code: Code2,
  database: Database,
  doc: FileText,
  folder: FolderKanban,
  help: HelpCircle,
  home: Home,
  lock: Lock,
  server: Server,
  settings: Settings,
  shield: ShieldCheck,
  task: ClipboardCheck,
  users: Users,
};

const menus: Record<Mode, MenuGroup[]> = {
  user: [
    {
      group: "KIBA SITE",
      items: [
        { label: "홈", href: "/dashboard", icon: "home", badge: "KIBA" },
        {
          label: "연구원 소개",
          icon: "home",
          children: [
            { label: "인사말", href: "/intro/greeting", icon: "doc" },
            { label: "연혁", href: "/intro/history", icon: "activity" },
            { label: "인증서", href: "/intro/certificates", icon: "shield" },
            { label: "설립목적", href: "/intro/purpose", icon: "task" },
            { label: "조직구성", href: "/intro/organization", icon: "users" },
            { label: "찾아오시는길", href: "/intro/location", icon: "help" },
          ],
        },
        {
          label: "주요실적",
          icon: "chart",
          children: [
            { label: "원가산정", href: "/performance/costing", icon: "chart" },
            { label: "사후정산", href: "/performance/settlement", icon: "task" },
            { label: "학술연구", href: "/performance/research", icon: "doc" },
          ],
        },
        {
          label: "학술연구",
          icon: "doc",
          children: [
            { label: "타당성조사", href: "/research/feasibility", icon: "chart" },
            { label: "공공서비스 요금산정", href: "/research/public-fee", icon: "database" },
            { label: "분쟁검증용역", href: "/research/dispute-review", icon: "shield" },
            { label: "건설사업관리", href: "/research/construction-management", icon: "folder" },
            { label: "LCC", href: "/research/lcc", icon: "activity" },
          ],
        },
        {
          label: "원가계산안내",
          icon: "database",
          children: [
            { label: "정부계약일반", href: "/cost-guide/government-contract", icon: "doc" },
            { label: "정부계약관련법령", href: "/cost-guide/laws", icon: "shield" },
            { label: "예정가격", href: "/cost-guide/estimated-price", icon: "chart" },
            { label: "정부원가계산의 활용", href: "/cost-guide/application", icon: "task" },
            { label: "원가계산실무", href: "/cost-guide/practice", icon: "database" },
          ],
        },
        {
          label: "계약금액조정",
          icon: "task",
          children: [
            { label: "계약금액조정", href: "/contract-adjustment/overview", icon: "task" },
            { label: "물가변동", href: "/contract-adjustment/price-change", icon: "chart" },
            { label: "설계변경", href: "/contract-adjustment/design-change", icon: "folder" },
            { label: "기타 계약내용변경", href: "/contract-adjustment/etc", icon: "doc" },
          ],
        },
        {
          label: "개발부담금",
          icon: "folder",
          children: [
            { label: "개발부담금이란", href: "/development-charge/overview", icon: "help" },
            { label: "부과대상 사업", href: "/development-charge/targets", icon: "folder" },
            { label: "개발부담금 산출방식", href: "/development-charge/calculation", icon: "chart" },
            { label: "개발비용 산정기준", href: "/development-charge/cost-standard", icon: "database" },
          ],
        },
        {
          label: "클레임",
          icon: "shield",
          children: [
            { label: "클레임", href: "/claim/overview", icon: "shield" },
            { label: "중재", href: "/claim/arbitration", icon: "task" },
            { label: "분쟁", href: "/claim/dispute", icon: "help" },
            { label: "판례정보", href: "/claim/cases", icon: "doc" },
          ],
        },
        {
          label: "고객센터",
          icon: "bell",
          children: [
            { label: "공지사항&새소식", href: "/support/news", icon: "bell", badge: "5" },
            { label: "자료실", href: "/support/resources", icon: "folder" },
            { label: "상담 및 문의", href: "/support/contact", icon: "help" },
          ],
        },
      ],
    },
  ],
  erp: [
    {
      group: "실무",
      items: [
        { label: "실무 대시보드", href: "/erp/dashboard", icon: "chart", badge: "실무" },
        {
          label: "업무관리",
          icon: "folder",
          children: [
            { label: "전문인력 통합DB", href: "/erp/workforce/professionals", icon: "users", badge: "PDF/XLS" },
            { label: "원가계산서 생성", href: "/erp/cost-estimates/new", icon: "database", badge: "NEW" },
          ],
        },
        {
          label: "CMS 구성",
          icon: "doc",
          children: [
            { label: "페이지 관리", href: "/erp/cms/pages", icon: "doc" },
            { label: "메뉴·폴더 관리", href: "/erp/cms/navigation", icon: "folder" },
            { label: "자료실 관리", href: "/erp/cms/resources", icon: "database" },
          ],
        },
        {
          label: "회계·통계",
          icon: "chart",
          children: [
            { label: "회계 항목", href: "/erp/accounting/items", icon: "database" },
            { label: "BigQuery 통계", href: "/erp/analytics/bigquery", icon: "chart" },
          ],
        },
        {
          label: "시스템 설정",
          icon: "settings",
          children: [
            { label: "Firebase 운영", href: "/erp/system/firebase", icon: "server", badge: "Live", badgeType: "success" },
            { label: "실무 설정", href: "/erp/settings", icon: "settings" },
          ],
        },
      ],
    },
  ],
  admin: [
    {
      group: "Admin",
      items: [
        { label: "Admin Dashboard", href: "/admin/dashboard", icon: "shield", badge: "Live", badgeType: "success" },
        {
          label: "User Control",
          icon: "users",
          children: [
            {
              label: "Role Management",
              icon: "shield",
              children: [
                { label: "Approve Roles", href: "/admin/users/roles/approve", icon: "shield", badge: "8" },
                { label: "Blocked Users", href: "/admin/users/roles/blocked", icon: "lock", badge: "2", badgeType: "danger" },
              ],
            },
            { label: "Access Logs", href: "/admin/users/logs", icon: "activity" },
          ],
        },
        { label: "Security Policy", href: "/admin/security", icon: "shield" },
        { label: "Company Settings", href: "/admin/settings", icon: "settings" },
      ],
    },
    {
      group: "Reports",
      items: [{ label: "Operation Stats", href: "/admin/reports", icon: "chart" }],
    },
  ],
};

const titles: Record<string, string> = {
  "/dashboard": "한국경영분석연구원",
  "/intro/greeting": "인사말",
  "/intro/history": "연혁",
  "/intro/certificates": "인증서",
  "/intro/purpose": "설립목적",
  "/intro/organization": "조직구성",
  "/intro/location": "찾아오시는길",
  "/performance/costing": "원가산정",
  "/performance/settlement": "사후정산",
  "/performance/research": "학술연구 실적",
  "/research/feasibility": "타당성조사",
  "/research/public-fee": "공공서비스 요금산정",
  "/research/dispute-review": "분쟁검증용역",
  "/research/construction-management": "건설사업관리",
  "/research/lcc": "LCC",
  "/cost-guide/government-contract": "정부계약일반",
  "/cost-guide/laws": "정부계약관련법령",
  "/cost-guide/estimated-price": "예정가격",
  "/cost-guide/application": "정부원가계산의 활용",
  "/cost-guide/practice": "원가계산실무",
  "/contract-adjustment/overview": "계약금액조정",
  "/contract-adjustment/price-change": "물가변동",
  "/contract-adjustment/design-change": "설계변경",
  "/contract-adjustment/etc": "기타 계약내용변경",
  "/development-charge/overview": "개발부담금이란",
  "/development-charge/targets": "부과대상 사업",
  "/development-charge/calculation": "개발부담금 산출방식",
  "/development-charge/cost-standard": "개발비용 산정기준",
  "/claim/overview": "클레임",
  "/claim/arbitration": "중재",
  "/claim/dispute": "분쟁",
  "/claim/cases": "판례정보",
  "/support/news": "공지사항&새소식",
  "/support/resources": "자료실",
  "/support/contact": "상담 및 문의",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/users/roles/approve": "Approve Roles",
  "/admin/users/roles/blocked": "Blocked Users",
  "/admin/users/logs": "Access Logs",
  "/admin/security": "Security Policy",
  "/admin/settings": "Company Settings",
  "/admin/reports": "Operation Stats",
  "/erp/dashboard": "실무 대시보드",
  "/erp/workforce/professionals": "전문인력 통합DB",
  "/erp/cost-estimates/new": "원가계산서 생성",
  "/erp/cms/pages": "페이지 관리",
  "/erp/cms/navigation": "메뉴·폴더 관리",
  "/erp/cms/resources": "자료실 관리",
  "/erp/accounting/items": "회계 항목",
  "/erp/analytics/bigquery": "BigQuery 통계",
  "/erp/system/firebase": "Firebase 운영",
  "/erp/settings": "실무 설정",
};

type KibaPageDetail = {
  section: string;
  title: string;
  summary: string;
  points: string[];
  deliverables: string[];
  related: string[];
};

type KibaSourceType = "text" | "board" | "image" | "mixed";

type KibaSourceFact = {
  url: string;
  sourceType: KibaSourceType;
  sourceStatus: string;
  evidence: string[];
  records?: string[];
};

const kibaPageDetails: Record<string, KibaPageDetail> = {
  "/dashboard": {
    section: "KIBA",
    title: "한국경영분석연구원",
    summary: "원가계산, 계약금액조정, 개발부담금, 학술연구와 분쟁 검증 업무를 한 화면에서 탐색하도록 재구성한 공개 사이트형 대시보드입니다.",
    points: ["8개 대분류 메뉴", "34개 원본 하위 페이지", "공지사항·자료실·상담 접점", "실무/CRM/CMS 운영 확장"],
    deliverables: ["기관 소개와 전문업무를 분리한 정보 구조", "원가·계약·개발부담금 핵심 업무 바로가기", "고객센터 콘텐츠 운영 영역"],
    related: ["/cost-guide/government-contract", "/contract-adjustment/overview", "/development-charge/overview", "/support/contact"],
  },
  "/intro/greeting": page("연구원 소개", "인사말", "30년 경험을 축적한 공인 원가계산전문기관의 전문성과 주요 업무 범위를 소개합니다.", ["30년 축적 경험", "공인 원가계산전문기관", "전문가 협업 체계", "원가·계약·연구·클레임 통합 지원"], ["대표 인사말", "업무 영역별 서비스", "전문가 네트워크", "상담 연결"], ["/intro/purpose", "/intro/history"]),
  "/intro/history": page("연구원 소개", "연혁", "1998년 창립부터 2025년 엔지니어링사업자 신고까지 소개서 기준 주요 이력을 시간순으로 정리합니다.", ["1998년 창립·설립허가", "기획재정부 원가계산용역기관 등록", "ISO 27001 인증과 기부채납 검증기관 선정"], ["연혁 타임라인", "단가계약 등록기관", "인증·지정 흐름"], ["/intro/certificates", "/performance/costing"]),
  "/intro/certificates": page("연구원 소개", "인증서", "허가증, 등록증, 표창, 보안·시스템 인증, 특허와 저작권 자료를 신뢰 근거 중심으로 정리합니다.", ["기획재정부 제3호 허가기관", "ISO 27001 인증", "대통령·국무총리 표창"], ["허가·등록 카드", "표창·평가 카드", "시스템·지식재산 카드"], ["/intro/purpose", "/support/resources"]),
  "/intro/purpose": page("연구원 소개", "설립목적", "정부 예산 원가계산과 검증, 계약·정산·분쟁 검토를 수행하는 기관 개요와 업무 범위를 소개합니다.", ["공공예산 검증", "제조·학술·정보화 원가계산", "갈등조정중재와 건설 클레임"], ["기관 개요", "핵심 업무", "공식 연락처"], ["/intro/greeting", "/research/feasibility"]),
  "/intro/organization": page("연구원 소개", "조직구성", "2026년 6월 10일 기준 48명 조직과 본부·실·전문위원 체계를 구조화해 보여줍니다.", ["구성 인원 48명", "원가분석본부 17명", "전문·자문위원 9명 외"], ["조직 카드", "전문 인력 구성", "부서별 역할"], ["/support/contact", "/intro/location"]),
  "/intro/location": page("연구원 소개", "찾아오시는길", "서울 강남구 선릉로93길 54 일환빌딩 7층의 공식 위치와 연락처를 안내합니다.", ["서울 강남구 선릉로93길 54", "대표전화 02-558-2045", "ecost@kiba.re.kr"], ["주소·연락처", "상담 연결", "공식 채널"], ["/support/contact", "/intro/organization"]),
  "/performance/costing": page("주요실적", "원가산정", "2025년·2024년 원가계산 실적을 산업, 공공, 스마트공장, 연구개발 분야별로 선별해 보여줍니다.", ["바이오·정보통신 원가계산", "스마트공장 구축 원가계산", "LCC·소프트웨어 원가계산"], ["대표 실적", "발주기관", "분야별 큐레이션"], ["/cost-guide/practice", "/support/contact"]),
  "/performance/settlement": page("주요실적", "사후정산", "관광, 소상공인, 지식재산, 국방 외주정비 등 사후원가정산과 회계정산 실적을 정리합니다.", ["관광두레 사후원가정산", "특성화시장 회계정산", "외주정비 사후조건부 원가검증"], ["정산 대표 실적", "발주처", "검증 범위"], ["/contract-adjustment/overview", "/performance/costing"]),
  "/performance/research": page("주요실적", "학술연구", "타당성, 공공요금, 민간위탁, 실태조사와 정책 연구 성격의 원가계산·연구 실적을 구성합니다.", ["사업 타당성 분석", "민간위탁 비용 산정", "공공요금·수수료 연구"], ["연구 실적", "발주기관", "업무 연결"], ["/research/feasibility", "/research/public-fee"]),
  "/research/feasibility": page("학술연구", "타당성조사", "사업 추진 전 경제성·정책성·수요를 검토하는 연구 서비스 페이지입니다.", ["사업성 분석", "수요 추정", "리스크 검토"], ["조사 절차", "산출물 목록", "상담 전환"], ["/performance/research", "/support/contact"]),
  "/research/public-fee": page("학술연구", "공공서비스 요금산정", "공공서비스 요금과 수수료 산정을 위한 원가·수요 기반 분석 페이지입니다.", ["서비스 원가", "수요 기준", "요금 체계"], ["요금산정 프로세스", "근거 자료", "사례 목록"], ["/cost-guide/application", "/research/feasibility"]),
  "/research/dispute-review": page("학술연구", "분쟁검증용역", "계약·비용·공사 관련 분쟁에서 객관적 검증 자료를 제공하는 페이지입니다.", ["쟁점 정리", "자료 검증", "전문 의견"], ["검증 절차", "증빙 체크리스트", "결과 보고서"], ["/claim/dispute", "/claim/arbitration"]),
  "/research/construction-management": page("학술연구", "건설사업관리", "건설사업 비용, 일정, 계약 변경과 관련된 관리 분석 페이지입니다.", ["사업관리", "원가 검토", "변경 관리"], ["관리 범위", "업무 단계", "프로젝트 연결"], ["/contract-adjustment/design-change", "/performance/costing"]),
  "/research/lcc": page("학술연구", "LCC", "생애주기비용 관점에서 시설·사업의 비용 구조를 분석하는 페이지입니다.", ["초기 비용", "운영 비용", "대안 비교"], ["LCC 계산 항목", "대안 비교표", "보고서 관리"], ["/research/feasibility", "/cost-guide/practice"]),
  "/cost-guide/government-contract": page("원가계산안내", "정부계약일반", "정부계약의 기본 구조와 원가계산 적용 지점을 안내하는 페이지입니다.", ["계약 방식", "예정가격", "원가 검토"], ["기초 안내", "법령 연결", "실무 FAQ"], ["/cost-guide/laws", "/cost-guide/estimated-price"]),
  "/cost-guide/laws": page("원가계산안내", "정부계약관련법령", "정부계약과 원가계산에 필요한 주요 법령·기준을 관리하는 페이지입니다.", ["계약 법령", "회계 예규", "원가 기준"], ["법령 링크", "개정 이력", "자료실 연결"], ["/support/resources", "/cost-guide/government-contract"]),
  "/cost-guide/estimated-price": page("원가계산안내", "예정가격", "예정가격 산정의 원칙, 구성, 검토 절차를 설명하는 페이지입니다.", ["가격 기준", "원가 구성", "검토 절차"], ["산정 흐름", "필수 서류", "사례 링크"], ["/performance/costing", "/cost-guide/practice"]),
  "/cost-guide/application": page("원가계산안내", "정부원가계산의 활용", "정부원가계산 결과를 계약·예산·정산 업무에 활용하는 방식을 안내합니다.", ["계약 활용", "예산 검토", "사후 관리"], ["활용 시나리오", "업무 체크리스트", "연계 서비스"], ["/performance/settlement", "/contract-adjustment/overview"]),
  "/cost-guide/practice": page("원가계산안내", "원가계산실무", "원가계산 실무자가 확인해야 할 자료, 절차, 산출물 기준을 정리합니다.", ["비목 분류", "증빙 검토", "계산서 작성"], ["실무 단계", "자료 목록", "검토 포인트"], ["/cost-guide/estimated-price", "/support/contact"]),
  "/contract-adjustment/overview": page("계약금액조정", "계약금액조정", "계약 체결 후 조건 변화에 따른 금액 조정 업무를 안내하는 페이지입니다.", ["조정 사유", "검토 절차", "증빙 자료"], ["조정 신청 흐름", "필요 서류", "상담 CTA"], ["/contract-adjustment/price-change", "/contract-adjustment/design-change"]),
  "/contract-adjustment/price-change": page("계약금액조정", "물가변동", "물가 변동에 따른 계약금액 조정 기준과 검토 절차를 제공하는 페이지입니다.", ["지수조정", "품목조정", "기준일 검토"], ["변동률 검토", "산식 안내", "증빙 관리"], ["/contract-adjustment/overview", "/support/resources"]),
  "/contract-adjustment/design-change": page("계약금액조정", "설계변경", "설계 변경에 따른 수량·단가·금액 변경 검토를 안내합니다.", ["변경 사유", "수량 검토", "단가 검토"], ["변경 절차", "검토 표준", "프로젝트 연결"], ["/research/construction-management", "/contract-adjustment/etc"]),
  "/contract-adjustment/etc": page("계약금액조정", "기타 계약내용변경", "공기, 조건, 범위 변경 등 기타 계약내용 변경 검토를 다룹니다.", ["계약 조건", "공기 변경", "범위 변경"], ["변경 유형", "리스크 체크", "검토 보고"], ["/contract-adjustment/overview", "/claim/overview"]),
  "/development-charge/overview": page("개발부담금", "개발부담금이란", "개발이익 환수 제도와 개발부담금의 기본 개념을 설명합니다.", ["제도 개요", "부과 기준", "산정 흐름"], ["개념 설명", "대상 확인", "상담 연결"], ["/development-charge/targets", "/development-charge/calculation"]),
  "/development-charge/targets": page("개발부담금", "부과대상 사업", "개발부담금 부과 대상 사업 유형과 판단 기준을 정리합니다.", ["대상 사업", "면제·제외", "판단 기준"], ["사업 유형표", "체크리스트", "사례 관리"], ["/development-charge/overview", "/support/contact"]),
  "/development-charge/calculation": page("개발부담금", "개발부담금 산출방식", "개발부담금 산정 공식과 입력 자료, 검토 흐름을 안내합니다.", ["개발이익", "부과율", "공제 항목"], ["산출 프로세스", "입력 자료", "계산 결과"], ["/development-charge/cost-standard", "/performance/costing"]),
  "/development-charge/cost-standard": page("개발부담금", "개발비용 산정기준", "개발비용 인정 항목과 산정 기준을 설명하는 페이지입니다.", ["공사비", "부대비", "증빙 기준"], ["비용 항목표", "증빙 목록", "검토 의견"], ["/development-charge/calculation", "/support/resources"]),
  "/claim/overview": page("클레임", "클레임", "계약 수행 중 발생하는 클레임의 유형과 대응 절차를 안내합니다.", ["청구 사유", "증빙 확보", "검토 의견"], ["클레임 접수", "쟁점 정리", "전문 검토"], ["/claim/arbitration", "/claim/dispute"]),
  "/claim/arbitration": page("클레임", "중재", "중재 절차에서 필요한 비용·계약 쟁점 자료를 정리하는 페이지입니다.", ["중재 절차", "쟁점 자료", "전문 의견"], ["자료 체크리스트", "검토 보고", "사례 링크"], ["/claim/overview", "/claim/cases"]),
  "/claim/dispute": page("클레임", "분쟁", "분쟁 단계의 원가·계약·공사 쟁점을 분석하는 페이지입니다.", ["분쟁 유형", "원인 분석", "검증 자료"], ["쟁점 맵", "증빙 관리", "보고서 산출"], ["/research/dispute-review", "/claim/cases"]),
  "/claim/cases": page("클레임", "판례정보", "관련 판례와 해석 사례를 축적하고 검색하는 페이지입니다.", ["판례 요약", "쟁점 태그", "업무 적용"], ["사례 검색", "태그 관리", "자료실 연결"], ["/claim/dispute", "/support/resources"]),
  "/support/news": page("고객센터", "공지사항&새소식", "기관 공지, 사업 안내, 주요 계약·성과 소식을 게시하는 페이지입니다.", ["공지 목록", "중요 공지", "새소식"], ["게시판", "상단 고정", "첨부파일"], ["/support/resources", "/support/contact"]),
  "/support/resources": page("고객센터", "자료실", "법령, 서식, 참고자료, 보고서 파일을 관리하는 자료실입니다.", ["서식", "참고자료", "보고서"], ["파일 업로드", "카테고리", "다운로드 통계"], ["/cost-guide/laws", "/support/news"]),
  "/support/contact": page("고객센터", "상담 및 문의", "원가계산, 계약금액조정, 개발부담금 상담을 접수하는 페이지입니다.", ["문의 유형", "담당자 배정", "답변 상태"], ["상담 폼", "CRM 전환", "알림 연동"], ["/intro/location", "/performance/costing"]),
};

function page(
  section: string,
  title: string,
  summary: string,
  points: string[],
  deliverables: string[],
  related: string[],
): KibaPageDetail {
  return { section, title, summary, points, deliverables, related };
}

const kibaSourceFacts: Record<string, KibaSourceFact> = {
  "/dashboard": sourceFact("", "mixed", "메인 페이지, GNB, 34개 하위 페이지를 기준으로 재구성", [
    "원본 GNB는 연구원 소개, 주요실적, 학술연구, 원가계산안내, 계약금액조정, 개발부담금, 클레임, 고객센터의 8개 대분류로 구성됩니다.",
    "하위 메뉴는 총 34개이며, 현재 앱에서는 홈을 포함해 35개 라우트로 연결했습니다.",
    "공지사항, 자료실, 상담 및 문의는 게시판형 데이터로 분리해 CMS/CRM 운영 항목으로 설계했습니다.",
  ]),
  "/intro/greeting": sourceFact("ctg01/pg01.htm", "mixed", "텍스트 117줄, 이미지 3개 확인", [
    "연구원은 1998년 정부 허가를 받은 공인 원가계산 전문기관으로 소개됩니다.",
    "원문은 26년 축적 경험과 공공예산 검증, 원가산정 및 검증 역량을 핵심 메시지로 배치합니다.",
    "보유 전문가군은 원가분석, 건축·건설·안전, 회계·노무·세무·법률 영역까지 확장되어 있습니다.",
    "업무 범위는 제조원가, 소프트웨어 대가, 사후원가검토조건부계약, 학술연구, 건설클레임, 계약금액조정, 개발부담금 등을 포함합니다.",
  ], ["원본 이미지 자산: kimg01_1.jpg, 11_02.gif, 11_03.jpg"]),
  "/intro/history": sourceFact("ctg01/pg02.htm", "mixed", "연혁 텍스트 12줄, 연도 이미지 6개 확인", [
    "1998년 법인 설립 준비위원회 창립과 사단법인 설립허가가 연혁의 출발점입니다.",
    "1999년 원가계산용역기관 등록지정, 2000년 한국원가관리협회 등록 이력이 확인됩니다.",
    "2009년 지방계약원가협회 등록, 공기업 사업 타당성 분석 업무 승인 이력이 포함됩니다.",
    "2015년 서울시 강남구 테헤란로 주사무소 이전 내역이 표시됩니다.",
  ]),
  "/intro/certificates": sourceFact("ctg01/pg03.htm", "image", "본문은 인증서 이미지 중심, 이미지 34개 확인", [
    "원본 페이지는 텍스트 설명보다 인증서·지정서류 이미지 열람 구조에 가깝습니다.",
    "CMS에서는 인증서명, 발급기관, 발급일, 유효기간, 파일 원본을 별도 필드로 관리하는 편이 적합합니다.",
    "모바일 화면에서는 이미지 원본과 대체 텍스트를 함께 제공해야 접근성과 검색성이 보완됩니다.",
  ]),
  "/intro/purpose": sourceFact("ctg01/pg04.htm", "image", "본문 텍스트 없음, 14.jpg 이미지 기반", [
    "원본은 설립목적을 이미지 한 장으로 제공하는 구조입니다.",
    "재구성 화면에서는 이미지 원본 보존과 함께 설립 취지, 공공성, 연구 범위를 CMS 텍스트로 분리하는 것이 필요합니다.",
    "검색 노출과 관리자 수정성을 위해 이미지 대체 텍스트와 요약 필드를 반드시 두는 구성이 적합합니다.",
  ], ["원본 이미지 자산: 14.jpg"]),
  "/intro/organization": sourceFact("ctg01/pg05.htm", "image", "본문 텍스트 없음, 조직도 GIF 이미지 기반", [
    "원본은 조직구성을 이미지 조직도로 제공하고 있습니다.",
    "실무/CRM 연결을 위해 부서, 담당 업무, 문의 연결 정보를 구조화 데이터로 나누는 구성이 적합합니다.",
    "조직도 이미지는 원본 보존 영역과 반응형 텍스트 조직표를 함께 제공하는 방식으로 재구성했습니다.",
  ], ["원본 이미지 자산: 15.gif"]),
  "/intro/location": sourceFact("ctg01/pg06.htm", "text", "연락처 텍스트 8줄 확인", [
    "기관명은 한국경영분석연구원과 영문명 Korea Institute of Business Analysis & Development로 표기됩니다.",
    "주소는 서울특별시 강남구 선릉로93길54 일환빌딩 7층입니다.",
    "대표 전화는 02-558-2045, 팩스는 02-554-2045로 안내됩니다.",
    "대표 이메일은 ecost@kiba.re.kr입니다.",
  ]),
  "/performance/costing": sourceFact("ctg02/pg01.htm", "text", "주요실적 텍스트 542줄 확인", [
    "원본은 제조원가를 시작으로 용역명과 발주처를 표 형태로 나열합니다.",
    "실적 목록은 원가계산, 가격조사, 제작 원가, 물품 구매 검토 등 실무 과제를 중심으로 구성됩니다.",
    "실무 관점에서는 발주처, 용역명, 수행연도, 분야, 보고서 첨부를 필드화해야 검색성이 높아집니다.",
  ], ["과일 주스 생산라인 제작공사 원가계산용역", "교단환경 개선물품 구매를 위한 거래가격 가격조사", "교사용 교탁제작 원가계산"]),
  "/performance/settlement": sourceFact("ctg02/pg02.htm", "text", "사후정산 실적 텍스트 645줄 확인", [
    "원본은 개발부담금, 보조금, 행사비, 원가검토 등 사후 정산·검증 성격의 실적을 대량으로 제공합니다.",
    "정산 업무는 계약 이후 실제 투입비용과 증빙을 검토하는 흐름으로 분류됩니다.",
    "상태값은 접수, 검토, 보완요청, 보고완료로 나눠 CRM/실무 진행 관리와 연결하는 구성이 적합합니다.",
  ], ["개발부담금 개발비용 산출내역 검토용역", "개발부담금 개발비용 산출명세서 검증 용역", "행사 보조금 정산검토와 사후원가검토 용역"]),
  "/performance/research": sourceFact("ctg02/pg03.htm", "text", "학술연구 실적 텍스트 384줄 확인", [
    "원본은 사업타당성 연구, 산업경영 연구, 각종 통계조사, 공공요금 산정, 민간위탁용역으로 실적을 구분합니다.",
    "발주기관과 과제명을 중심으로 연구 수행 이력을 정리하는 페이지입니다.",
    "CMS에서는 연구유형, 발주처, 기간, 요약, 보고서 공개 여부를 관리 필드로 두는 구조가 필요합니다.",
  ], ["사업타당성 연구", "산업경영 연구", "각종 통계조사", "공공요금 산정", "민간위탁용역"]),
  "/research/feasibility": sourceFact("ctg03/pg01.htm", "text", "타당성조사 텍스트 10줄 확인", [
    "원문은 일정 규모 이상의 사업은 투자심사 전에 타당성 조사를 의뢰해야 한다는 취지로 설명합니다.",
    "지방자치단체 신규 투·융자사업과 공공용 건축사업 기준이 언급됩니다.",
    "관련 근거로 지방재정법 시행령 제41조가 제시됩니다.",
  ]),
  "/research/public-fee": sourceFact("ctg03/pg02.htm", "text", "공공서비스 요금산정 텍스트 83줄 확인", [
    "공공서비스는 정부, 지자체, 공사·공단이 공익을 위해 제공하는 서비스로 설명됩니다.",
    "공공요금은 정부의 인가·승인·신고 수리 등으로 가격이 결정되는 성격을 가집니다.",
    "원본은 중앙공공요금과 지방공공요금으로 분류하고 통신, 전기, 교통, 우편 등 사례를 제시합니다.",
  ], ["이동전화료와 기본전화료", "전기료와 고속도로통행료", "국내우편료와 국제우편료"]),
  "/research/dispute-review": sourceFact("ctg03/pg03.htm", "text", "분쟁검증용역 텍스트 23줄 확인", [
    "분쟁검증은 공사·토목 계약 분쟁에서 제3자 입장으로 쟁점을 분석하고 자료를 제공하는 업무입니다.",
    "검증 영역은 전산, 원가계산, 공사감정 부문으로 나뉩니다.",
    "원본은 하자, 보상, 공사 중도포기, 설계변경, 계약금액조정 관련 원가계산 사례를 포함합니다.",
  ]),
  "/research/construction-management": sourceFact("ctg03/pg04.htm", "text", "건설사업관리 텍스트 11줄 확인", [
    "원문은 기술인력 보유 시 설계 또는 감리 업무를 함께 위탁받아 수행할 수 있음을 설명합니다.",
    "건설사업관리자는 발주자를 위해 선량한 관리자의 주의로 업무를 수행해야 합니다.",
    "고의 또는 과실로 발주자에게 재산상 손해가 발생하면 배상 책임이 있다는 점을 명시합니다.",
  ]),
  "/research/lcc": sourceFact("ctg03/pg05.htm", "text", "LCC 텍스트 16줄 확인", [
    "LCC는 계획, 설계, 입찰, 시공, 인도, 운영, 폐기 단계까지 발생하는 총 비용 개념입니다.",
    "초기 건설비뿐 아니라 유지관리비와 미래 비용을 고려해야 하는 필요성을 설명합니다.",
    "기획·설계 단계에서 대안을 비교하고 비용 효과를 극대화하는 자료로 활용됩니다.",
  ]),
  "/cost-guide/government-contract": sourceFact("ctg04/pg01.htm", "text", "정부계약일반 텍스트 42줄 확인", [
    "정부계약은 국가가 사경제 주체로서 체결하는 사법상 계약으로 설명됩니다.",
    "정부 원가계산은 구매 예정가격 결정, 예산 통제, 국고 절감, 물가 안정에 활용됩니다.",
    "원가계산 종류는 물품구매, 시설공사, 용역, 사후원가정산으로 구분됩니다.",
  ]),
  "/cost-guide/laws": sourceFact("ctg04/pg02.htm", "text", "법령체계 텍스트 156줄 확인", [
    "원본은 법령체계도와 관련 법령을 함께 제공합니다.",
    "국가계약법, 시행령, 시행규칙, 예규의 제정·개정 이력이 주요 내용입니다.",
    "자료실과 연결해 개정 기준, 시행일, 파일 첨부를 관리하는 구조가 적합합니다.",
  ]),
  "/cost-guide/estimated-price": sourceFact("ctg04/pg03.htm", "text", "예정가격 텍스트 44줄 확인", [
    "예정가격은 입찰 또는 계약체결 전에 낙찰자와 계약금액 결정 기준으로 작성·비치하는 가액입니다.",
    "거래실례가격, 원가계산 가격, 표준시장단가 등 계약 유형별 기준을 구분합니다.",
    "원본은 예정가격 산정 절차를 별도 흐름으로 안내합니다.",
  ]),
  "/cost-guide/application": sourceFact("ctg04/pg04.htm", "text", "정부원가계산 활용 텍스트 재수집 완료", [
    "국가계약법 시행령 제9조를 근거로 예정가격 결정 기준을 설명합니다.",
    "거래실례가격이 없는 신규개발품, 특수규격품, 특수 용역은 원가계산 가격을 활용합니다.",
    "비목은 재료비, 노무비, 경비, 일반관리비, 이윤으로 산정하는 구조입니다.",
    "제조구매, 공사비, 용역, 토지개발비, 학술연구용역, 소프트웨어, 엔지니어링, 감리, 측량 등 기준을 분리합니다.",
  ]),
  "/cost-guide/practice": sourceFact("ctg04/pg05.htm", "text", "원가계산실무 텍스트 재수집 완료", [
    "원본은 제조구매, 수입물자, 공사비, 학술용역, 사후원가정산, 엔지니어링, 소프트웨어, 감리, 측량, 시설관리비로 산출 기준을 나눕니다.",
    "제조구매 원가계산은 직접재료비, 간접재료비, 작업설·부산물, 직접노무비, 간접노무비, 경비 항목으로 세분화됩니다.",
    "직접재료비는 재료소요량과 단가, 직접노무비는 공정별·직종별 노무량과 노임단가를 기준으로 산정합니다.",
    "실무 화면에서는 비목별 기준, 산식, 증빙 자료, 결산자료 활용 여부를 분리해 관리하는 구성이 필요합니다.",
  ]),
  "/contract-adjustment/overview": sourceFact("ctg05/pg01.htm", "text", "계약금액조정 개요 텍스트 재수집 완료", [
    "원문은 확정된 계약금액으로 이행하는 것이 원칙이지만 장기 계약에서는 경제적 여건 변화가 발생할 수 있다고 설명합니다.",
    "국가계약법 시행령은 사정변경 원칙을 반영해 제64조, 제65조, 제66조에서 계약금액 조정을 허용합니다.",
    "물가변동은 계약체결 후 90일 이상 경과와 품목조정률 또는 지수조정률 3% 이상 증감 조건이 핵심입니다.",
    "조정 방식은 동일 계약에 대해 하나의 방법을 일관되게 적용하는 관리가 필요합니다.",
  ]),
  "/contract-adjustment/price-change": sourceFact("ctg05/pg02.htm", "text", "물가변동 텍스트 30줄 확인", [
    "물가변동에 의한 계약금액 조정은 국가계약 관계 법규의 요건과 기준을 토대로 검토합니다.",
    "법적 근거는 국가계약법 제19조와 국가계약법 시행령 제64조 등이 제시됩니다.",
    "실무에서는 기준일, 조정률, 적용 방식, 증빙 자료 검토가 핵심입니다.",
  ]),
  "/contract-adjustment/design-change": sourceFact("ctg05/pg03.htm", "text", "설계변경 텍스트 76줄 확인", [
    "설계변경은 계약 체결 후 예상하지 못한 내·외부 변경으로 당초 계약 내용과 금액을 변경하는 업무입니다.",
    "법적 근거는 국가계약법 시행령 제65조, 지방계약법 시행령 제74조, 공사계약 일반조건 제20조가 제시됩니다.",
    "조정 요건은 설계서의 불분명, 누락, 오류, 상호 모순 등으로 정리됩니다.",
  ]),
  "/contract-adjustment/etc": sourceFact("ctg05/pg04.htm", "text", "기타 계약내용변경 텍스트 38줄 확인", [
    "공사시간, 운반거리, 기타 계약 조건 변경 등 물가변동·설계변경 외 사유를 다룹니다.",
    "법적 근거는 국가계약법 시행령 제66조, 지방계약법 시행령 제75조, 정부입찰계약집행기준 실비산정기준입니다.",
    "변경된 계약내용에 따라 실비 범위에서 조정하고 회계예규 기준으로 산정합니다.",
  ]),
  "/development-charge/overview": sourceFact("ctg06/pg01.htm", "text", "개발부담금 개요 텍스트 81줄 확인", [
    "원문은 개발이익 사유화와 토지 투기 문제에 대응하기 위해 토지공개념 제도가 도입된 배경을 설명합니다.",
    "개발부담금은 개발이익 일부를 환수해 토지의 효율적 이용과 국민경제 발전에 기여하는 제도로 정리됩니다.",
    "개발이익 환수에 관한 법률의 제도 연혁을 함께 제공합니다.",
  ]),
  "/development-charge/targets": sourceFact("ctg06/pg02.htm", "text", "부과대상 사업 텍스트 172줄 확인", [
    "원본은 사업종류, 근거법률, 사업명 기준의 표로 부과대상 사업을 정리합니다.",
    "택지개발사업, 주택단지 조성사업 등 개발사업 유형이 포함됩니다.",
    "일부 임대주택, 재건축, 이주단지 조성 제외 등 판단 예외가 함께 제시됩니다.",
  ]),
  "/development-charge/calculation": sourceFact("ctg06/pg03.htm", "text", "산출방식 텍스트 28줄 확인", [
    "산출은 종료시점 지가, 개시시점 지가, 정상지가상승분, 개발비용 등을 기준으로 구성됩니다.",
    "종료시점 지가는 유사 표준지와 토지가격비준율을 적용해 준공시점 토지가액을 산출합니다.",
    "개시시점 지가는 사업인가일 해당 연도 개별공시지가와 인가일까지 정상지가상승분을 반영합니다.",
  ]),
  "/development-charge/cost-standard": sourceFact("ctg06/pg04.htm", "text", "개발비용 산정기준 텍스트 35줄 확인", [
    "개발사업 시행과 관련해 지출한 비용을 합산하는 기준으로 설명됩니다.",
    "근거는 개발이익환수에 관한 법률 제11조입니다.",
    "순공사비, 조사비, 설계비, 일반관리비, 기타 경비와 공공시설 기부가액, 토지 개량비 등이 포함됩니다.",
  ]),
  "/claim/overview": sourceFact("ctg07/pg01.htm", "text", "클레임 텍스트 21줄 확인", [
    "클레임은 원래 계약과 달라진 내용에 대해 계약자와 피계약자 사이의 의견 불일치로 설명됩니다.",
    "청구 형태는 금전 지급 요구, 계약 여건 조정, 해석 요구, 구제 요청 등으로 나타납니다.",
    "절차는 예비평가와 실상조사 등 단계적 검토가 필요합니다.",
  ]),
  "/claim/arbitration": sourceFact("ctg07/pg02.htm", "text", "중재 텍스트 8줄 확인", [
    "중재는 법원 판결 대신 제3자 개입을 통해 판정을 받는 해결 방법으로 설명됩니다.",
    "원본은 중재법 제1장 제3조 제1항 정의를 근거로 제시합니다.",
    "연구원은 클레임 자료를 제공할 수 있지만 중재인이 될 수 없다는 제한을 명시합니다.",
  ]),
  "/claim/dispute": sourceFact("ctg07/pg03.htm", "text", "분쟁 텍스트 56줄 확인", [
    "건설분쟁은 공사계약 일반조건과 기술용역계약 일반조건에서 협의기간을 상정합니다.",
    "계약 수행 중 분쟁은 협의로 해결하고, 협의가 어려우면 조정위원회 또는 중재기관으로 이어집니다.",
    "불복 시 법원 판결로 진행되며, 기록 보관과 대안 검토가 중요합니다.",
  ]),
  "/claim/cases": sourceFact("ctg07/pg04.htm", "image", "본문 텍스트 없음, underconstruction 이미지 확인", [
    "원본 판례정보 페이지는 공사중 이미지로 제공됩니다.",
    "현재 앱에서는 향후 판례 DB 확장을 위한 검색, 쟁점 태그, 자료실 연결 구조로 준비했습니다.",
    "실제 운영 전에는 판례 출처, 사건번호, 쟁점, 적용 업무, 공개 범위를 필드로 설계해야 합니다.",
  ], ["원본 이미지 자산: underconstruction.jpg"]),
  "/support/news": sourceFact("ctg08/pg01.htm", "board", "공지사항 게시판 텍스트 53줄 확인", [
    "공지사항과 새소식은 게시판 목록 형태로 제공됩니다.",
    "공지, 제목, 작성자, 작성일, 조회수 성격의 데이터가 함께 표시됩니다.",
    "CMS에서는 고정 공지, 첨부파일, 공개 상태, 조회수 통계를 별도 필드로 관리하는 구성이 적합합니다.",
  ], ["한국경영분석연구원 홈페이지 오픈 안내", "국군방첩사령부 보안측정 우수 등급 획득", "주요 원재료 확인 등 연동약정 체결지원 사업 참여기업 신청 안내"]),
  "/support/resources": sourceFact("ctg08/pg02.htm", "board", "자료실 게시판 텍스트 35줄 확인", [
    "자료실은 최저임금 고시, 건설업 시중노임단가, 계약예규 개정 자료처럼 실무 기준 파일을 제공합니다.",
    "자료 유형, 시행일, 첨부파일, 조회수, 개정 여부를 관리하는 파일형 CMS가 적합합니다.",
    "원가계산안내와 계약금액조정 페이지에서 관련 자료로 연결해야 사용 흐름이 자연스럽습니다.",
  ], ["2018년 최저임금 고시", "2018년 상반기 건설업 시중노임단가", "기획재정부 계약예규 개정·시행 자료"]),
  "/support/contact": sourceFact("ctg08/pg03.htm", "board", "상담 및 문의 게시판 텍스트 44줄 확인", [
    "상담 및 문의는 원가분석, 공사비 검증, 개발비용 검토 등 실제 문의가 쌓이는 게시판 구조입니다.",
    "문의 제목, 작성자, 작성일, 답변 상태, 공개 여부를 CRM 리드로 전환하는 설계가 필요합니다.",
    "최근 문의에는 전기트럭 원가분석 성적서 발급, 공원조성 공사비 검증 가능 여부 등이 포함됩니다.",
  ], ["초소형전기트럭 신규개발 원가분석 공인인증기관 성적서 발급", "공원조성 공사 관련 공사비 검증 가능 여부 문의", "개발비용 산정과 원가검토 문의"]),
};

function sourceFact(
  path: string,
  sourceType: KibaSourceType,
  sourceStatus: string,
  evidence: string[],
  records?: string[],
): KibaSourceFact {
  return {
    url: path ? `http://www.kiba.re.kr/${path}` : "http://www.kiba.re.kr/",
    sourceType,
    sourceStatus,
    evidence,
    records,
  };
}

function sourceTypeName(type: KibaSourceType) {
  if (type === "board") {
    return "게시판";
  }
  if (type === "image") {
    return "이미지 자료";
  }
  if (type === "mixed") {
    return "소개 자료";
  }
  return "본문 자료";
}

const kibaNews = [
  "국군방첩사령부 보안측정 우수 등급 획득",
  "주요 원재료 확인 등 연동약정 체결지원 사업 안내",
  "서울시 개발비용산정기관",
  "용인시 죽전동 공동주택 신축공사 분양가산정 관련 계약",
  "항공임무 외주정비 원가계산 검증용역 계약",
];

const greetingExperts = [
  "공인원가분석사",
  "건축시공기술사",
  "건설안전기술사",
  "화공안전기술사",
  "건축기사",
  "변호사",
  "공인회계사",
  "공인노무사",
  "세무사",
];

const greetingServices = [
  {
    title: "제조원가",
    summary: "제조·공사, 군수·방산, 장비 제작과 수리, 운송 및 폐기물 처리비용까지 원가산정 범위를 폭넓게 지원합니다.",
    items: [
      "제조·공사 원가계산",
      "군수물자 및 방산물자 원가계산",
      "교재개발 및 인쇄·졸업앨범 원가계산",
      "사무비품 및 집기비품 제작 원가계산",
      "전기·전자 장비 제작 원가계산",
      "부품 제작 및 수리비 원가계산",
      "선박건조 및 수리공사 원가계산",
      "제품공정별 제조원가계산",
      "장비 및 수리 원가계산",
      "자동차 번호판 제작원가계산",
      "운송비용 원가계산",
      "건설 폐기물 처리비용 산정",
    ],
  },
  {
    title: "소프트웨어 대가산정",
    summary: "개발, 유지관리, 운영, 데이터베이스 구축 비용을 사업 성격에 맞춰 산정합니다.",
    items: ["소프트웨어 개발비", "소프트웨어 유지관리비", "소프트웨어 운영비", "데이터베이스 구축비"],
  },
  {
    title: "사후원가검토조건부계약",
    summary: "계약 이후 정산과 검토가 필요한 용역·시설·외주정비 비용을 객관적으로 검증합니다.",
    items: [
      "사후원가검토조건부계약 정산",
      "생활폐기물 수집 및 운반 대행용역 정산",
      "시설운영비 및 유지관리비 정산",
      "외주정비 정산",
    ],
  },
  {
    title: "학술연구",
    summary: "타당성, 민간위탁비, 공공요금, 수수료, 대중교통, 손해보상과 공기업 자산평가까지 연구 과제를 수행합니다.",
    items: [
      "타당성 검토 및 기본계획수립 연구",
      "공공 건축물 건립 타당성 검토",
      "공공기관·시설·행정분야 민간위탁운영 타당성 검토",
      "생활폐기물 수집 및 운반 민간위탁 검토와 원가계산",
      "민간위탁비용 원가계산",
      "상·하수도 요금, 원인자부담금, 온천수 요금산정",
      "공공시설 사용료 및 임대료 산정",
      "전기요금 요율, 도시가스 공급비용 및 사용료 산정",
      "대중교통 관련 연구",
      "손해배상금 산정 및 공기업 설립 자산평가",
    ],
  },
  {
    title: "건설클레임, 공사비 산정 및 검증",
    summary: "공기분석, 공사비분석, 분양가, 공사원가, 계약조정, 하자·리모델링 비용을 분석합니다.",
    items: [
      "건설공사 클레임 분석 및 자문",
      "재개발·재건축·플랜트·토목 공사비 산정 및 검증",
      "일반 분양가 산정과 심의·자문",
      "매입 임대주택 원가 산정 및 검증",
      "수량 산출 내역서 작성 및 분석",
      "건축·토목·기계·전기·통신 내역서 작성 및 검증",
      "물가변동과 기타 계약내용 변경에 의한 계약금액조정",
      "하자관련 공사비, 리모델링 공사비, 손해배상금 산정 및 검증",
    ],
  },
  {
    title: "공기연장(EOT) 클레임",
    summary: "건설사업의 공기연장 클레임과 적정공기 분석을 통해 지연 책임과 면제 일정을 검토합니다.",
    items: [
      "공기연장(EOT) 클레임 분석 및 자문",
      "공기적정성 분석 및 자문",
      "지체상금 관련 적정공기 분석 및 자문",
      "발주자·계약자 귀책 지연일정 분석",
      "지체상금 면제일정 분석",
      "최초·변경 적정공기 산정 및 검증",
    ],
  },
  {
    title: "개발부담금 산정 및 검증",
    summary: "개발부담금 산정, 검증, 관련 컨설팅으로 개발사업의 비용 검토를 지원합니다.",
    items: ["개발부담금 산정 및 검증", "개발부담금 관련 컨설팅"],
  },
  {
    title: "기부채납 산정 및 검증",
    summary: "공공시설 설치비와 기부채납 관련 비용을 검증하고 컨설팅합니다.",
    items: ["기부채납 공공시설 설치비 산정 및 검증", "기부채납 관련 컨설팅"],
  },
];

const profileStats = [
  { label: "설립 허가", value: "1998.04.10", caption: "기획재정부 제3호 허가기관" },
  { label: "구성 인원", value: "48명", caption: "2026.06.10 기준 조직 현황" },
  { label: "전문·자문", value: "100명+", caption: "박사급 각 분야 자문 인력" },
  { label: "보안 인증", value: "ISO 27001", caption: "원가계산전문기관 최초 인증" },
];

const profileOverviewCards = [
  {
    title: "기관 개요",
    body: "사단법인 한국경영분석연구원은 정부 예산 원가계산과 검증, 제조·학술·정보화 사업 원가계산, 공동주택 분양가 산정, 개발부담금 산정 등을 수행합니다.",
    items: ["회사명: 사단법인 한국경영분석연구원", "허가: 기획재정부 제3호 허가기관", "이사장: 김민선"],
  },
  {
    title: "공공 검증 업무",
    body: "공사원가, 물가변동, 추가비용, 설계변경, 리모델링, 신기술·신제품 원가계산까지 공공 의사결정에 필요한 비용 근거를 만듭니다.",
    items: ["정부 예산 원가계산 및 검증", "공사원가계산 및 검증", "건설 공정별 물량산출 및 검증"],
  },
  {
    title: "분쟁·중재 지원",
    body: "법원 감정, 건설 클레임, 이전보상비 산정, 학술연구용역, 갈등조정중재까지 비용 쟁점과 이해관계 조정을 지원합니다.",
    items: ["법원 감정 및 건설 클레임", "이전보상비 산정", "갈등조정중재"],
  },
];

const kibaLocationInfo = {
  name: "사단법인 한국경영분석연구원",
  address: "서울특별시 강남구 선릉로93길 54 일환빌딩 7층",
  shortAddress: "서울 강남구 선릉로93길 54",
  floor: "일환빌딩 7층",
  phone: "02-558-2045",
  fax: "02-554-2045",
  email: "ecost@kiba.re.kr",
  website: "www.kiba.re.kr",
  googleMapEmbedUrl:
    "https://maps.google.com/maps?q=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%EC%84%A0%EB%A6%89%EB%A1%9C93%EA%B8%B8%2054%20%EC%9D%BC%ED%99%98%EB%B9%8C%EB%94%A9%207%EC%B8%B5&t=&z=17&ie=UTF8&iwloc=&output=embed",
  googleMapUrl:
    "https://www.google.com/maps/search/?api=1&query=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%EC%84%A0%EB%A6%89%EB%A1%9C93%EA%B8%B8%2054%20%EC%9D%BC%ED%99%98%EB%B9%8C%EB%94%A9%207%EC%B8%B5",
};

const locationVisitGuides = [
  {
    title: "방문 전 상담 예약",
    body: "원가계산, 계약금액조정, 개발부담금 등 상담 목적을 먼저 알려주시면 담당 분야 검토자가 빠르게 연결됩니다.",
  },
  {
    title: "기초 자료 준비",
    body: "계약서, 산출내역서, 설계변경 자료, 정산 증빙 등 검토 범위에 맞는 자료를 준비하면 상담 품질이 높아집니다.",
  },
  {
    title: "현장·온라인 병행",
    body: "방문 상담이 어려운 경우 전화와 이메일을 통해 사전 검토와 후속 자료 접수를 병행할 수 있습니다.",
  },
];

const profileTimeline = [
  { date: "2025.09.15", title: "엔지니어링사업자 신고", detail: "E-14-000086" },
  { date: "2024.12.16", title: "국군방첩사령부 보안측정 우수", detail: "보안측정 우수 등급 획득" },
  { date: "2024.12.09", title: "기부채납 공공시설 설치비용 검증 전문기관 선정", detail: "서울시 검증기관 지정 기반" },
  { date: "2024.09.27", title: "정보보안경영시스템 인증", detail: "ISO 27001, 원가계산전문기관 최초" },
  { date: "2024.04.01", title: "견적원가시스템 라이선스 취득", detail: "원가 산정 시스템 기반 확보" },
  { date: "2024.01.01", title: "한국학술연구용역협회 등록", detail: "제2025-03호" },
  { date: "2020.09.29", title: "기부채납 검증 전문기관 선정", detail: "공공시설 설치비용 검증" },
  { date: "2020.06.30", title: "소프트웨어사업자 신고", detail: "B20-201500" },
  { date: "2017.05.01", title: "건설원가협회 등록", detail: "제17-49호" },
  { date: "2009.01.02", title: "지방계약원가협회 등록", detail: "제6호" },
  { date: "2000.07.01", title: "한국원가관리협회 등록", detail: "제10호" },
  { date: "1999.04.02", title: "원가계산용역기관 등록", detail: "기획재정부 제84호" },
  { date: "1998.04.10", title: "사단법인 설립허가", detail: "기획재정부 제3호" },
  { date: "1998.01.05", title: "연구원 창립", detail: "기관 출발" },
];

const annualContractAgencies = [
  "정부조달마스협회",
  "한국생명공학연구원",
  "한국발명진흥회",
  "한국철도기술연구원",
  "중소벤처기업진흥공단",
  "한국교통안전공단",
  "한국생산기술연구원",
  "한국산업기술진흥원",
  "한국에너지기술평가원",
  "창업진흥원",
  "한국장애인고용공단",
  "스마트제조혁신추진단",
  "소상공인시장진흥공단 등 다수",
];

const historyHighlights = [
  {
    value: "1998",
    label: "기관 출발",
    text: "연구원 창립과 기획재정부 제3호 사단법인 설립허가",
  },
  {
    value: "1999",
    label: "원가계산 등록",
    text: "원가계산용역기관 등록으로 공공 원가검증 기반 확립",
  },
  {
    value: "2024",
    label: "신뢰 인증",
    text: "ISO 27001 인증과 국군방첩사령부 보안측정 우수 등급",
  },
  {
    value: "2025",
    label: "전문성 확장",
    text: "엔지니어링사업자 신고로 기술 검증 영역 확장",
  },
];

const historyEras = [
  {
    range: "1998-2000",
    title: "설립과 공인 기반",
    body: "연구원 창립, 사단법인 설립허가, 원가계산용역기관 등록, 한국원가관리협회 등록으로 기관의 법적·전문 기반을 구축했습니다.",
  },
  {
    range: "2009-2017",
    title: "계약·건설 원가 영역 확장",
    body: "지방계약원가협회와 건설원가협회 등록을 통해 공공계약, 공사비, 건설 원가 검증 역량을 넓혔습니다.",
  },
  {
    range: "2020-2024",
    title: "디지털·보안·기부채납 검증",
    body: "소프트웨어사업자 신고, 기부채납 공공시설 설치비용 검증기관 선정, ISO 27001 인증으로 검증 체계를 고도화했습니다.",
  },
  {
    range: "2025",
    title: "엔지니어링 검증 역량 강화",
    body: "엔지니어링사업자 신고를 기반으로 원가, 기술, 공사비, 시스템 검증 업무를 통합적으로 수행할 기반을 확장했습니다.",
  },
];

const certificateGroups = [
  {
    title: "허가·등록",
    body: "기관 운영과 원가계산 수행 자격의 기반이 되는 허가·등록 자료입니다.",
    items: ["기획재정부 비영리법인 설립 허가증", "사업자 등록증", "한국원가관리협회 등록증", "지방계약원가협회 등록증", "건설원가협회 등록증", "한국학술연구협회 등록증", "엔지니어링사업자 신고증"],
  },
  {
    title: "표창·평가",
    body: "공공성과 수행 품질을 보여주는 표창 및 평가 이력입니다.",
    items: ["대통령 표창", "국무총리 표창", "중소벤처기업부장관 표창", "보건복지부장관 상장", "의정부시장 표창", "국군 방첩사령부 보안측정 우수"],
  },
  {
    title: "시스템·지식재산",
    body: "원가 검증과 데이터 기반 업무를 뒷받침하는 시스템, 인증, 특허, 저작권 자료입니다.",
    items: ["견적원가시스템 라이선스 증서", "정보보안경영시스템 ISO 27001 인증", "소프트웨어 개발 원가검증시스템 특허증", "가격정보 검색 솔루션 저작권 등록증", "노임단가 및 경비 제비율정보 검색솔루션 저작권 등록증", "웹기반사업관리 플랫폼 시스템", "원가솔루션"],
  },
];

const organizationUnits = [
  { name: "원장", count: "1명", role: "기관 운영 총괄과 대외 책임" },
  { name: "경영관리부", count: "3명", role: "운영, 회계, 행정, AI 지원 체계" },
  { name: "원가분석본부", count: "17명", role: "제조·공사·정보화 원가계산과 검증" },
  { name: "품질관리실", count: "4명", role: "보고서 품질관리와 검토 기준 운영" },
  { name: "건설사업본부", count: "9명", role: "공사비, 클레임, 법원 감정, 건설 원가 검증" },
  { name: "학술사업본부", count: "2명", role: "타당성, 민간위탁, 정책·요금 연구" },
  { name: "갈등조정중재센터", count: "전문가 연계", role: "분쟁·중재·갈등조정 자문" },
  { name: "전문·자문위원", count: "9명 외", role: "건축, 전기, 회계, 농화학 등 분야별 자문" },
];

const expertCapabilityGroups = [
  "공인원가분석사·경영지도사",
  "건축시공기술사·건설안전기술사",
  "공사원가 법원감정인",
  "공인회계사·세무사·공인노무사",
  "소프트웨어 특급기술자·기능점수측정전문가",
  "ISO 27001 인증심사원",
  "PMP 프로젝트관리전문가",
  "갈등조정전문가·대한상사중재원 중재인",
  "박사급 각 분야 100명 이상",
];

const performanceProfiles = {
  "/performance/costing": {
    eyebrow: "Costing Records",
    title: "원가산정 대표 실적",
    summary: "소개서에 수록된 2025년·2024년 실적 중 제조, 정보통신, R&D, 스마트공장, 공공기관 분야를 선별했습니다.",
    metrics: [
      { label: "대표 연도", value: "2025" },
      { label: "분야", value: "제조·SW" },
      { label: "스마트공장", value: "다수" },
      { label: "공공기관", value: "다기관" },
    ],
    records: [
      { year: "2025", title: "바이오 소재자원은행 활용 가이드북 제작 원가계산", client: "한국생명공학연구원" },
      { year: "2025", title: "정보통신보조기기 보급사업 원가계산", client: "파라다이스복지재단" },
      { year: "2025", title: "LCC 제조원가계산", client: "윈데크코리아" },
      { year: "2025", title: "액체주석용 전자기 펌프 원가계산", client: "한국가스공사 가스연구원" },
      { year: "2024", title: "대중소상생형 스마트공장 구축 지원사업", client: "한국생산성본부" },
      { year: "2024", title: "소프트웨어 의료기기 원가계산", client: "웰트 주식회사" },
    ],
    focus: ["제조원가", "정보화 사업", "스마트공장", "R&D 장비", "공공 보조기기", "LCC"],
  },
  "/performance/settlement": {
    eyebrow: "Settlement Records",
    title: "사후정산 대표 실적",
    summary: "계약 종료 후 실제 투입 비용과 증빙을 검증하는 사후원가정산·회계정산 실적을 발주처와 함께 구성했습니다.",
    metrics: [
      { label: "관광", value: "관광두레" },
      { label: "시장", value: "특성화" },
      { label: "국방", value: "외주정비" },
      { label: "IP", value: "센터검증" },
    ],
    records: [
      { year: "2024", title: "관광두레 주민사업체 육성지원 수행 사후원가정산", client: "한국관광공사 서울센터" },
      { year: "2024", title: "소상공인 역량강화사업 회계정산 용역 원가산정", client: "소상공인시장진흥공단" },
      { year: "2024", title: "특성화시장 육성사업 회계정산 용역 원가계산", client: "중소상공인 희망재단" },
      { year: "2024", title: "지역지식재산센터 정산보고서 검증 용역 원가계산", client: "한국발명진흥회" },
      { year: "2023", title: "항공관제용 무전기 외주정비 사후조건부 원가검증", client: "육군항공학교" },
      { year: "2023", title: "관광기업 혁신바우처 지원사업 사무국 운영 사후원가정산", client: "한국관광공사" },
    ],
    focus: ["사후원가정산", "회계정산", "보조금 집행 검증", "외주정비", "관광·창업 지원", "정산보고서 검증"],
  },
  "/performance/research": {
    eyebrow: "Research Records",
    title: "학술연구 대표 실적",
    summary: "타당성, 공공요금, 민간위탁, 실태조사, 정책 연구 성격의 과제를 소개서 자료 기준으로 묶었습니다.",
    metrics: [
      { label: "연구", value: "타당성" },
      { label: "민간위탁", value: "원가" },
      { label: "공공요금", value: "산정" },
      { label: "정책", value: "분석" },
    ],
    records: [
      { year: "2025", title: "문예회관 특성화지원 사업 성과평가연구 용역원가계산", client: "한국문화예술회관연합회" },
      { year: "2025", title: "글로벌 산업기술정책 동향조사분석 원가계산", client: "산업기술 분야 발주기관" },
      { year: "2025", title: "소상공인 정책 이슈 발굴 및 대응 사업 원가계산", client: "소상공인 지원 분야" },
      { year: "2025", title: "신재생에너지 보급사업 지원단가 산정", client: "한국에너지공단" },
      { year: "2021", title: "생활폐기물 청소서비스 및 공무관 근무환경 개선방안 연구", client: "지방자치단체" },
      { year: "2020", title: "수거체계 개선을 위한 생활폐기물 수집·운반 대행업무 원가계산", client: "서울특별시 마포구" },
    ],
    focus: ["타당성 연구", "민간위탁", "공공요금", "성과평가", "실태조사", "정책 연구"],
  },
};

const defaultState: ShellState = {
  mode: "user",
  route: "/dashboard",
  collapsed: false,
  dark: false,
  open: new Set<string>(),
  search: "",
};

function defaultRoute(mode: Mode) {
  if (mode === "admin") {
    return "/admin/dashboard";
  }
  if (mode === "erp") {
    return "/erp/dashboard";
  }
  return "/dashboard";
}

function routeMode(route: string): Mode {
  if (route.startsWith("/admin")) {
    return "admin";
  }
  if (route.startsWith("/erp") || route.startsWith("/dev")) {
    return "erp";
  }
  return "user";
}

function normalizeRoute(route: string) {
  if (route.startsWith("/dev")) {
    return "/erp/dashboard";
  }
  return route;
}

function modeName(mode: Mode) {
  if (mode === "admin") {
    return "관리자 페이지";
  }
  if (mode === "erp") {
    return "직원 페이지";
  }
  return "USER MODE";
}

function modeTabLabel(mode: Mode) {
  if (mode === "erp") {
    return "실무";
  }
  if (mode === "admin") {
    return "ADMIN";
  }
  return "USER";
}

function toMode(value: string | null): Mode {
  if (value === "developer" || value === "erp") {
    return "erp";
  }
  if (value === "user") {
    return "user";
  }
  return "user";
}

function readInitialState(): ShellState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  const storedMode = toMode(window.localStorage.getItem("mp_mode"));
  const hashRoute = window.location.hash.replace("#", "");
  const route = normalizeRoute(hashRoute || defaultRoute(storedMode));
  const mode = hashRoute ? routeMode(route) : storedMode;
  const storedOpen = JSON.parse(window.localStorage.getItem("mp_open") || "[]") as string[];
  const routeOpen = routeParentsFor(mode, route);

  return {
    mode,
    route,
    collapsed: window.localStorage.getItem("mp_collapsed") === "1",
    dark: window.localStorage.getItem("mp_dark") === "1",
    open: new Set(hashRoute && routeOpen.length ? routeOpen : storedOpen),
    search: "",
  };
}

function itemKey(mode: Mode, item: MenuItem, depth: number) {
  return `${mode}:${depth}:${item.href || item.label}`;
}

function itemActive(item: MenuItem, route: string): boolean {
  if (item.href === route) {
    return true;
  }
  return item.children?.some((child) => itemActive(child, route)) ?? false;
}

function findParents(items: MenuItem[], href: string, mode: Mode, parents: string[] = [], depth = 1): string[] | null {
  for (const item of items) {
    const id = itemKey(mode, item, depth);
    if (item.href === href) {
      return parents;
    }
    if (item.children) {
      const result = findParents(item.children, href, mode, [...parents, id], depth + 1);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

function routeParentsFor(mode: Mode, route: string) {
  const parents: string[] = [];
  for (const group of menus[mode]) {
    const groupParents = findParents(group.items, route, mode);
    if (groupParents) {
      parents.push(...groupParents);
    }
  }
  return parents;
}

function visibleItems(items: MenuItem[], query: string): MenuItem[] {
  if (!query) {
    return items;
  }

  const normalized = query.toLowerCase();
  const result: MenuItem[] = [];

  for (const item of items) {
    const children = item.children ? visibleItems(item.children, normalized) : undefined;
    const matched = item.label.toLowerCase().includes(normalized);
    if (matched || children?.length) {
      result.push({ ...item, children: children?.length ? children : item.children });
    }
  }

  return result;
}

function safeHash(route: string) {
  return `#${route}`;
}

export function SiteModeShell() {
  const [shell, setShell] = useState<ShellState>(defaultState);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "Ready" });
  const [tooltip, setTooltip] = useState({ show: false, label: "", left: 0, top: 0 });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = titles[shell.route] || "Dashboard";
  const userPage = kibaPageDetails[shell.route] ?? kibaPageDetails["/dashboard"];
  const heroDescription =
    shell.mode === "user"
      ? userPage.summary
      : shell.mode === "erp"
        ? shell.route === "/erp/workforce/professionals"
          ? "전문인력 데이터를 검색하고 필요한 인력만 선택해 PDF와 엑셀 보고서로 정리하는 직원 페이지입니다."
          : "전문인력 DB, CMS, 회계·통계를 한 곳에서 구성하고 운영하는 KIBA 실무 화면입니다."
        : "사용자 권한, 보안 정책, 운영 리포트를 관리하는 KIBA 관리자 화면입니다.";
  const effectiveOpen = useMemo(() => {
    const next = new Set(shell.open);
    const activeParents = new Set<string>();
    for (const group of menus[shell.mode]) {
      const parents = findParents(group.items, shell.route, shell.mode);
      parents?.forEach((parent) => activeParents.add(parent));
    }
    for (const parent of activeParents) {
      const [, parentDepth] = parent.split(":");
      const hasOpenAtDepth = [...next].some((openId) => {
        const [openMode, openDepth] = openId.split(":");
        return openMode === shell.mode && openDepth === parentDepth;
      });
      if (!hasOpenAtDepth) {
        next.add(parent);
      }
    }
    return next;
  }, [shell.mode, shell.open, shell.route]);

  const filteredGroups = useMemo(() => {
    const query = shell.search.trim();
    return menus[shell.mode]
      .map((group) => ({ ...group, items: visibleItems(group.items, query) }))
      .filter((group) => group.items.length > 0);
  }, [shell.mode, shell.search]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const initial = readInitialState();
      setShell(initial);
      window.history.replaceState({ route: initial.route }, "", safeHash(initial.route));
    });

    function syncRouteFromHash() {
      const rawRoute = window.location.hash.replace("#", "") || defaultRoute("user");
      const route = normalizeRoute(rawRoute);
      const mode = routeMode(route);
      const open = new Set(routeParentsFor(mode, route));
      if (route !== rawRoute) {
        window.history.replaceState({ route }, "", safeHash(route));
      }
      setShell((previous) => ({ ...previous, route, mode, open }));
    }

    window.addEventListener("popstate", syncRouteFromHash);
    window.addEventListener("hashchange", syncRouteFromHash);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("popstate", syncRouteFromHash);
      window.removeEventListener("hashchange", syncRouteFromHash);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mobile-lock", mobileOpen);
    return () => document.body.classList.remove("mobile-lock");
  }, [mobileOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showToast(message: string) {
    setToast({ show: true, message });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast((current) => ({ ...current, show: false })), 2000);
  }

  function saveOpen(open: Set<string>) {
    window.localStorage.setItem("mp_open", JSON.stringify([...open]));
  }

  function go(route: string) {
    const nextMode = routeMode(route);
    const open = new Set(routeParentsFor(nextMode, route));
    window.history.pushState({ route }, "", safeHash(route));
    window.localStorage.setItem("mp_mode", nextMode);
    saveOpen(open);
    setMobileOpen(false);
    setShell((previous) => ({ ...previous, route, mode: nextMode, open }));
    showToast(`${titles[route] || route} opened`);
  }

  function setMode(mode: Mode) {
    if (mode === shell.mode) {
      showToast(`${modeName(mode)} is already active`);
      return;
    }
    const route = defaultRoute(mode);
    const open = new Set(routeParentsFor(mode, route));
    window.history.pushState({ route }, "", safeHash(route));
    window.localStorage.setItem("mp_mode", mode);
    saveOpen(open);
    setMobileOpen(false);
    setShell((previous) => ({ ...previous, mode, route, open }));
    showToast(`${modeName(mode)} enabled`);
  }

  function toggleAccordion(id: string, depth: number) {
    setShell((previous) => {
      const next = new Set(previous.open);
      const shouldOpen = previous.collapsed || !next.has(id);

      if (!shouldOpen) {
        next.delete(id);
      } else {
        for (const openId of [...next]) {
          const openDepth = Number(openId.split(":")[1]);
          if (openDepth === depth) {
            next.delete(openId);
          }
        }
        next.add(id);
      }
      saveOpen(next);
      if (previous.collapsed && window.innerWidth > 768) {
        window.localStorage.setItem("mp_collapsed", "0");
        return { ...previous, collapsed: false, open: next };
      }
      return { ...previous, open: next };
    });
  }

  function toggleCollapse() {
    if (window.innerWidth <= 768) {
      setMobileOpen(true);
      return;
    }

    setShell((previous) => {
      const collapsed = !previous.collapsed;
      window.localStorage.setItem("mp_collapsed", collapsed ? "1" : "0");
      showToast(collapsed ? "Sidebar collapsed" : "Sidebar expanded");
      return { ...previous, collapsed };
    });
  }

  function toggleDark() {
    setShell((previous) => {
      const dark = !previous.dark;
      window.localStorage.setItem("mp_dark", dark ? "1" : "0");
      showToast(dark ? "Dark mode enabled" : "Light mode enabled");
      return { ...previous, dark };
    });
  }

  function handleTooltip(event: MouseEvent<HTMLButtonElement>, label: string) {
    if (!shell.collapsed || window.innerWidth <= 768) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      label,
      left: rect.right + 12,
      top: rect.top + 8,
    });
  }

  function renderItem(item: MenuItem, depth: number) {
    const id = itemKey(shell.mode, item, depth);
    const hasChildren = Boolean(item.children?.length);
    const active = itemActive(item, shell.route);
    const open = effectiveOpen.has(id);
    const Icon = icons[item.icon];

    return (
      <div key={id} className={`nav-item depth-${depth}${hasChildren && open ? " open" : ""}${active ? " active-parent" : ""}`}>
        <button
          type="button"
          className={`nav-btn${active ? " active" : ""}${item.disabled ? " disabled" : ""}`}
          aria-label={item.label}
          aria-current={item.href === shell.route ? "page" : undefined}
          aria-expanded={hasChildren ? open : undefined}
          onClick={() => {
            if (item.disabled) {
              showToast("This menu is locked");
              return;
            }
            if (hasChildren) {
              toggleAccordion(id, depth);
              return;
            }
            if (item.href) {
              go(item.href);
            }
          }}
          onMouseEnter={(event) => handleTooltip(event, item.label)}
          onMouseLeave={() => setTooltip((current) => ({ ...current, show: false }))}
        >
          <span className="nav-icon">
            <Icon size={17} strokeWidth={2.2} />
          </span>
          <span className="nav-label">{item.label}</span>
          {depth > 1 ? <span className="depth-chip">{depth}Depth</span> : null}
          {item.badge ? <span className={`badge ${item.badgeType || ""}`}>{item.badge}</span> : null}
          {hasChildren ? (
            <span className="arrow">
              <ChevronRight size={14} strokeWidth={2.5} />
            </span>
          ) : null}
        </button>

        {hasChildren ? (
          <div className="children">
            <div className="children-in">{item.children?.map((child) => renderItem(child, depth + 1))}</div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`app ${shell.dark ? "dark" : ""}`}>
      <div className={`overlay ${mobileOpen ? "show" : ""}`} aria-hidden="true" onClick={() => setMobileOpen(false)} />

      <aside className={`sidebar ${shell.collapsed ? "collapsed" : ""} ${mobileOpen ? "open" : ""}`} aria-label="Left navigation menu">
        <div className="brand">
          <button className="brand-btn" type="button" aria-label="Toggle sidebar" onClick={toggleCollapse}>
            <span className="logo">K</span>
            <span className="brand-text">
              <strong>{shell.mode === "erp" ? "직원페이지" : shell.mode === "admin" ? "KIBA Admin" : "한국경영분석연구원"}</strong>
              <span>{modeName(shell.mode)}</span>
            </span>
            <span className="collapse-mark">
              <ChevronLeft size={16} strokeWidth={2.5} />
            </span>
          </button>
          <button className="mobile-close" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="tools">
          <div className="search-wrap">
            <span className="search-icon-inside">
              <Search size={14} strokeWidth={2.5} />
            </span>
            <input
              className="search"
              value={shell.search}
              placeholder="Search menu"
              aria-label="Search menu"
              onChange={(event) => setShell((previous) => ({ ...previous, search: event.target.value }))}
            />
          </div>
        </div>

        <nav className="nav" aria-label={`${modeName(shell.mode)} navigation`}>
          {filteredGroups.map((group) => (
            <div key={group.group}>
              <div className="group-title">{shell.collapsed ? group.group[0] : group.group}</div>
              {group.items.map((item) => renderItem(item, 1))}
            </div>
          ))}
        </nav>

        <div className="footer">
          <div className="footer-banner">
            <strong>KIBA Site Map</strong>
            <span>8 categories / 33 public pages</span>
          </div>
          <div className="user-row">
            <div className="avatar">KA</div>
            <div className="user-meta">
              <strong>한국경영분석연구원</strong>
              <span>ecost@kiba.re.kr</span>
            </div>
            <button className="logout" type="button" aria-label="Sign out" onClick={() => showToast("Logout flow is ready")}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <section className={`shell ${shell.collapsed ? "collapsed" : ""}`}>
        <header className="header">
          <div className="header-left">
            <button className="icon-btn hamburger" type="button" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="breadcrumb">
              <span>KIBA</span>
              <span className="breadcrumb-slash">/</span>
              <strong>{title}</strong>
            </div>
          </div>

          <div className="header-right">
            <div className="mode-tabs" role="tablist" aria-label="Site mode selection">
              {visibleModeTabs.map((mode) => (
                <button
                  key={mode}
                  className={`mode-tab ${shell.mode === mode ? "active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={shell.mode === mode}
                  onClick={() => setMode(mode)}
                >
                  {modeTabLabel(mode)}
                </button>
              ))}
            </div>
            <button className="icon-btn" type="button" aria-label="Toggle theme" onClick={toggleDark}>
              {shell.dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="icon-btn" type="button" aria-label="Notifications" onClick={() => showToast("3 notifications pending")}>
              <Bell size={16} />
            </button>
          </div>
        </header>

        <main className="main" tabIndex={-1}>
          <div className="container">
            <section className="hero">
              <small>{modeName(shell.mode)}</small>
              <h1>{title}</h1>
              <p>{heroDescription}</p>
            </section>

            {shell.mode === "admin" ? (
              <AdminDashboard />
            ) : shell.mode === "erp" ? (
              <ErpDashboard route={shell.route} />
            ) : (
              <UserSitePage route={shell.route} go={go} />
            )}
          </div>
        </main>
      </section>

      <div className={`toast ${toast.show ? "show" : ""}`}>
        <HelpCircle size={15} strokeWidth={2.5} />
        <span>{toast.message}</span>
      </div>
      <div className={`tooltip ${tooltip.show ? "show" : ""}`} style={{ left: tooltip.left, top: tooltip.top }}>
        {tooltip.label}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  icon,
  down = false,
}: {
  title: string;
  value: string;
  trend: string;
  icon: IconKey;
  down?: boolean;
}) {
  const Icon = icons[icon];
  return (
    <div className="card stat">
      <div>
        <h3>{title}</h3>
        <strong>{value}</strong>
        <span className={`trend ${down ? "down" : ""}`}>{trend}</span>
      </div>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
    </div>
  );
}

function ChartCard({ title = "Operation Analytics" }: { title?: string }) {
  return (
    <div className="card">
      <div className="section-title">
        <h2>{title}</h2>
        <span>Realtime</span>
      </div>
      <div className="chart">
        {[45, 68, 52, 85, 71, 94, 61, 89, 75].map((value, index) => (
          <div key={`${value}-${index}`} className="bar" style={{ height: `${value}%` }}>
            <span>{value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserSitePage({ route, go }: { route: string; go: (route: string) => void }) {
  if (route === "/dashboard") {
    return <KibaHome go={go} />;
  }
  if (route === "/intro/greeting") {
    return <KibaGreetingPage go={go} />;
  }
  if (route === "/intro/purpose") {
    return <KibaProfileOverviewPage go={go} />;
  }
  if (route === "/intro/history") {
    return <KibaHistoryPage go={go} />;
  }
  if (route === "/intro/certificates") {
    return <KibaCertificatesPage go={go} />;
  }
  if (route === "/intro/organization") {
    return <KibaOrganizationPage go={go} />;
  }
  if (route === "/intro/location") {
    return <KibaLocationPage go={go} />;
  }
  if (route === "/performance/costing" || route === "/performance/settlement" || route === "/performance/research") {
    return <KibaPerformancePage route={route} go={go} />;
  }

  const detail = kibaPageDetails[route] ?? kibaPageDetails["/dashboard"];
  const pageData = kibaSeedPagesByRoute[route];
  return <KibaDetailPage detail={detail} page={pageData} route={route} go={go} />;
}

function KibaHome({ go }: { go: (route: string) => void }) {
  const featuredRoutes = [
    "/intro/greeting",
    "/performance/costing",
    "/research/feasibility",
    "/cost-guide/practice",
    "/contract-adjustment/price-change",
    "/development-charge/calculation",
  ];

  return (
    <div className="public-site">
      <section className="public-hero">
        <div className="hero-copy">
          <span className="eyebrow">Korea Institute of Business Analysis & Development</span>
          <div className="public-logo-card" aria-label="한국경영분석연구원 로고">
            <Image src="/한국경영분석연구원로고.jpg" alt="한국경영분석연구원" width={576} height={120} priority />
          </div>
          <h1>한국경영분석연구원</h1>
          <p>
            1998년 기획재정부 허가를 받은 원가계산전문기관의 소개서 자료를 바탕으로 공공예산 검증,
            원가산정, 계약금액조정, 개발부담금, 학술연구와 분쟁 검증 업무를 다시 구성했습니다.
          </p>
          <div className="hero-proof-strip" aria-label="핵심 신뢰 지표">
            <span>
              <ShieldCheck size={14} />
              기재부 허가
            </span>
            <span>
              <BarChart3 size={14} />
              공공예산 검증
            </span>
            <span>
              <Database size={14} />
              34개 업무 페이지
            </span>
          </div>
          <div className="hero-actions">
            <button className="primary-btn" type="button" onClick={() => go("/support/contact")}>
              <Phone size={16} />
              상담 및 문의
            </button>
            <button className="secondary-btn" type="button" onClick={() => go("/cost-guide/government-contract")}>
              <Database size={16} />
              원가계산안내
            </button>
          </div>
        </div>

        <div className="hero-metrics">
          {profileStats.map((stat) => (
            <Metric key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </section>

      <section className="profile-summary-strip" aria-label="원본 사이트 수집 현황">
        <span>
          <strong>{kibaSeedSummary.menuGroupCount}</strong>
          원본 메뉴
        </span>
        <span>
          <strong>{kibaSeedSummary.sourcePageCount}</strong>
          하위 페이지
        </span>
        <span>
          <strong>{kibaSeedSummary.boardDocCount}</strong>
          게시판
        </span>
        <span>
          <strong>{kibaSeedSummary.assetDocCount}</strong>
          이미지 자료
        </span>
      </section>

      <section className="public-section">
        <div className="public-section-head">
          <span className="eyebrow">Core Services</span>
          <h2>주요 업무 바로가기</h2>
          <p>원본 홈페이지에서 반복적으로 강조되는 원가, 연구, 계약, 개발부담금 업무를 먼저 탐색할 수 있게 배치했습니다.</p>
        </div>

        <div className="feature-grid">
          {featuredRoutes.map((route, index) => {
            const detail = kibaPageDetails[route];
            return (
              <button key={route} className="feature-card" type="button" onClick={() => go(route)}>
                <div className="feature-card-top">
                  <span>{detail.section}</span>
                  <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
                </div>
                <strong>{detail.title}</strong>
                <p>{detail.summary}</p>
                <div className="feature-card-action">
                  자세히 보기
                  <ChevronRight size={16} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="public-section">
        <div className="public-section-head">
          <span className="eyebrow">Original Menu</span>
          <h2>원본 메뉴 구조</h2>
          <p>상위메뉴 8개와 하위메뉴 34개를 원본 순서대로 연결했습니다.</p>
        </div>

        <div className="menu-overview-grid">
          {topLevelUserMenus().map((group) => (
            <article key={group.label} className="menu-overview-card">
              <div>
                <strong>{group.label}</strong>
                <span>{flattenItems(group.children ?? []).length}개 페이지</span>
              </div>
              <div className="menu-link-list">
                {flattenItems(group.children ?? []).map((item) => (
                  <button key={item.href} type="button" onClick={() => item.href && go(item.href)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section">
        <div className="split-showcase">
          <div>
            <span className="eyebrow">Notice</span>
            <h2>공지사항&새소식</h2>
            <div className="board-preview-list">
              {kibaNews.map((news, index) => (
                <button key={news} type="button" onClick={() => go("/support/news")}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{news}</strong>
                </button>
              ))}
            </div>
          </div>
          <div className="contact-panel">
            <span className="eyebrow">Contact</span>
            <h2>상담 및 문의</h2>
            <p>원가계산, 계약금액조정, 개발부담금, 분쟁 검증 관련 상담을 고객센터 메뉴와 연결했습니다.</p>
            <button className="primary-btn" type="button" onClick={() => go("/support/contact")}>
              <Phone size={16} />
              문의 페이지로 이동
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function KibaGreetingPage({ go }: { go: (route: string) => void }) {
  const siblingItems = sectionItems("연구원 소개");

  return (
    <div className="greeting-page">
      <section className="greeting-hero">
        <div className="greeting-hero-copy">
          <span className="eyebrow">Greeting</span>
          <h1>30년 경험을 축적한 원가계산전문기관</h1>
          <p>
            (사)한국경영분석연구원은 공공예산의 검증과 원가산정 및 검증을 위해 1998년 기획재정부의
            허가를 받은 공인 원가계산전문기관입니다.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" type="button" onClick={() => go("/support/contact")}>
              상담 및 문의
            </button>
            <button className="secondary-btn" type="button" onClick={() => go("/intro/history")}>
              연혁 보기
            </button>
          </div>
        </div>

        <div className="greeting-proof">
          <Metric label="축적 경험" value="30년" />
          <Metric label="설립 허가" value="1998" />
          <Metric label="전문 업무" value="8+" />
          <Metric label="전문가군" value="9" />
        </div>
      </section>

      <nav className="sibling-nav" aria-label="연구원 소개 하위 메뉴">
        {siblingItems.map((item) => (
          <button key={item.href} className={item.href === "/intro/greeting" ? "active" : ""} type="button" onClick={() => item.href && go(item.href)}>
            {item.label}
          </button>
        ))}
      </nav>

      <section className="greeting-message content-card">
        <div>
          <span className="eyebrow">Message</span>
          <h2>신뢰할 수 있는 원가·계약 검증 파트너</h2>
        </div>
        <div className="greeting-message-body">
          <p>
            저희는 공인원가분석사, 건축시공기술사, 건설안전기술사, 화공안전기술사, 건축기사, 변호사,
            공인회계사, 공인노무사, 세무사 등 분야별 전문가와 함께 제조원가계산, 소프트웨어 대가산정,
            사후원가검토조건부계약, 학술연구, 건설클레임, 건설 공사비, 계약금액조정, 개발부담금,
            하자보수비 산정 및 검증, 사후원가계산에 효율적인 솔루션을 제공합니다.
          </p>
          <p>
            의뢰인과의 파트너십을 바탕으로 최고의 시너지 효과를 만들고, 고객이 감동할 수 있는 결과를
            제공하기 위해 최선의 노력을 다하겠습니다.
          </p>
        </div>
      </section>

      <section className="content-card">
        <div className="public-section-head">
          <span className="eyebrow">Experts</span>
          <h2>전문가 네트워크</h2>
          <p>원가, 건설, 안전, 법률, 회계, 노무, 세무 영역의 전문가가 프로젝트 성격에 맞춰 협업합니다.</p>
        </div>
        <div className="expert-chip-grid">
          {greetingExperts.map((expert) => (
            <span key={expert}>{expert}</span>
          ))}
        </div>
      </section>

      <section className="public-section">
        <div className="public-section-head">
          <span className="eyebrow">Services</span>
          <h2>주요 업무 영역</h2>
          <p>원문 인사말의 업무 범위를 상용 페이지에 맞춰 읽기 쉬운 서비스 카드로 재구성했습니다.</p>
        </div>
        <div className="greeting-service-grid">
          {greetingServices.map((service) => (
            <article key={service.title} className="greeting-service-card">
              <div>
                <h3>{service.title}</h3>
                <p>{service.summary}</p>
              </div>
              <ul>
                {service.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="greeting-cta">
        <div>
          <span className="eyebrow">Partnership</span>
          <h2>정확한 검증과 실무형 해결책이 필요한 순간</h2>
          <p>한국경영분석연구원이 원가, 계약, 정산, 개발부담금, 건설클레임의 의사결정을 지원합니다.</p>
        </div>
        <button className="primary-btn" type="button" onClick={() => go("/support/contact")}>
          상담 요청하기
        </button>
      </section>
    </div>
  );
}

function SectionSiblingNav({
  section,
  activeRoute,
  go,
}: {
  section: string;
  activeRoute: string;
  go: (route: string) => void;
}) {
  const siblingItems = sectionItems(section);

  return (
    <nav className="sibling-nav" aria-label={`${section} 하위 메뉴`}>
      {siblingItems.map((item) => (
        <button key={item.href} className={item.href === activeRoute ? "active" : ""} type="button" onClick={() => item.href && go(item.href)}>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function ProfileHero({
  eyebrow,
  title,
  summary,
  metrics = profileStats,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  metrics?: { label: string; value: string }[];
}) {
  return (
    <section className="profile-hero">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{summary}</p>
      </div>
      <div className="profile-hero-metrics">
        {metrics.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
    </section>
  );
}

function KibaProfileOverviewPage({ go }: { go: (route: string) => void }) {
  return (
    <div className="profile-page">
      <ProfileHero
        eyebrow="Institution Profile"
        title="기획재정부 허가 원가계산전문기관"
        summary="소개서 기준 기관 개요를 공공 검증, 원가계산, 계약·분쟁 지원 흐름으로 재구성했습니다."
      />
      <SectionSiblingNav section="연구원 소개" activeRoute="/intro/purpose" go={go} />

      <section className="profile-card-grid">
        {profileOverviewCards.map((card) => (
          <article key={card.title} className="profile-card">
            <span className="eyebrow">Overview</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            <ul>
              {card.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="content-card">
        <div className="public-section-head">
          <span className="eyebrow">Business Scope</span>
          <h2>소개서 기준 주요 업무</h2>
          <p>정부 예산 검증부터 갈등조정중재까지 원문 개요에 있는 업무를 실제 탐색 가능한 서비스 단위로 정리했습니다.</p>
        </div>
        <div className="profile-scope-grid">
          {[
            "정부 예산 원가계산 및 검증",
            "제조·학술·정보화 사업 원가계산",
            "공동주택 분양가 산정",
            "개발비용 및 개발부담금 산정",
            "물가변동, 추가비용 산정 및 설계변경",
            "리모델링·신기술 원가계산",
            "공사원가계산 및 건설 클레임",
            "학술연구용역 및 갈등조정중재",
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function KibaHistoryPage({ go }: { go: (route: string) => void }) {
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = historyRef.current;
    if (!root) {
      return;
    }

    const timeline = root.querySelector<HTMLElement>(".history-premium-timeline");
    const revealItems = Array.from(root.querySelectorAll<HTMLElement>(".history-premium-item"));
    revealItems.forEach((item, index) => item.style.setProperty("--reveal-index", String(index % 8)));
    const scrollRoot = root.closest<HTMLElement>(".main");

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("show"));
      return;
    }

    const updateLine = () => {
      if (!timeline) {
        return;
      }
      const viewportRect = scrollRoot?.getBoundingClientRect();
      const viewportTop = viewportRect?.top ?? 0;
      const viewportHeight = viewportRect?.height ?? window.innerHeight;
      const rect = timeline.getBoundingClientRect();
      const start = viewportTop + viewportHeight * 0.2;
      const end = rect.height + viewportHeight * 0.2;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / end));
      root.style.setProperty("--history-progress", progress.toFixed(4));
    };

    const revealVisibleItems = () => {
      const viewportRect = scrollRoot?.getBoundingClientRect();
      const viewportTop = viewportRect?.top ?? 0;
      const viewportBottom = viewportRect?.bottom ?? window.innerHeight;
      revealItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.top < viewportBottom * 0.92 && rect.bottom > viewportTop) {
          item.classList.add("show");
        }
      });
      updateLine();
    };
    window.requestAnimationFrame(revealVisibleItems);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          } else {
            entry.target.classList.remove("show");
          }
        });
      },
      { root: scrollRoot, rootMargin: "0px 0px -12% 0px", threshold: 0.18 },
    );

    revealItems.forEach((item) => observer.observe(item));
    const scrollTarget: HTMLElement | Window = scrollRoot ?? window;
    scrollTarget.addEventListener("scroll", updateLine, { passive: true });
    window.addEventListener("resize", updateLine);

    return () => {
      observer.disconnect();
      scrollTarget.removeEventListener("scroll", updateLine);
      window.removeEventListener("resize", updateLine);
    };
  }, []);

  return (
    <div ref={historyRef} className="profile-page history-page history-premium-page">
      <section className="history-premium-hero">
        <div>
          <span className="eyebrow">KIBA History</span>
          <h1>한국경영분석연구원 연혁</h1>
          <p>1998년 창립부터 2025년 엔지니어링사업자 신고까지, 공공 원가검증 전문기관으로 쌓아온 주요 이력을 시간의 흐름에 맞춰 보여줍니다.</p>
        </div>
        <div className="history-premium-hero-metrics">
          {historyHighlights.map((highlight) => (
            <article key={highlight.value}>
              <strong>{highlight.value}</strong>
              <span>{highlight.label}</span>
            </article>
          ))}
        </div>
      </section>

      <SectionSiblingNav section="연구원 소개" activeRoute="/intro/history" go={go} />

      <section className="history-era-grid" aria-label="연혁 시대 구분">
        {historyEras.map((era) => (
          <article key={era.range} className="history-era-card">
            <time>{era.range}</time>
            <h2>{era.title}</h2>
            <p>{era.body}</p>
          </article>
        ))}
      </section>

      <section className="history-premium-timeline" aria-label="주요 연혁 타임라인">
        <div className="history-premium-line" aria-hidden="true">
          <div className="history-premium-line-fill" />
        </div>

        {profileTimeline.map((event) => (
          <article key={`${event.date}-${event.title}`} className="history-premium-item">
            <div className="history-premium-dot" aria-hidden="true" />
            <div className="history-premium-card">
              <div className="history-premium-year">{historyYear(event.date)}</div>
              <div className="history-premium-date">{event.date}</div>
              <h2>{event.title}</h2>
              <p>{event.detail}</p>
              <span>{historyStageLabel(event.date)}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="history-premium-info-grid">
        <article className="content-card">
          <span className="eyebrow">Annual Contracts</span>
          <h2>연간 단가계약 등록기관</h2>
          <p>소개서에 수록된 연간 단가계약 등록기관을 한눈에 확인할 수 있게 정리했습니다.</p>
          <div className="agency-chip-list">
            {annualContractAgencies.map((agency) => (
              <span key={agency}>{agency}</span>
            ))}
          </div>
        </article>

        <article className="content-card history-source-card">
          <span className="eyebrow">Profile Source</span>
          <h2>2026.06 소개서 기준</h2>
          <div className="history-source-facts">
            <p>
              <span>허가</span>
              <strong>기획재정부 제3호</strong>
            </p>
            <p>
              <span>설립일</span>
              <strong>1998년 4월 10일</strong>
            </p>
            <p>
              <span>보안</span>
              <strong>ISO 27001 / 보안측정 우수</strong>
            </p>
            <p>
              <span>최근</span>
              <strong>2025년 엔지니어링사업자 신고</strong>
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

function historyYear(date: string) {
  return date.split(".")[0] ?? date;
}

function historyStageLabel(date: string) {
  const year = Number(historyYear(date));
  if (year >= 2024) {
    return "전문성 확장";
  }
  if (year >= 2020) {
    return "디지털·검증";
  }
  if (year >= 2009) {
    return "협회 등록";
  }
  return "설립 기반";
}

function KibaCertificatesPage({ go }: { go: (route: string) => void }) {
  return (
    <div className="profile-page">
      <ProfileHero
        eyebrow="Certification"
        title="허가·등록·표창·인증 현황"
        summary="원본의 이미지 중심 인증 페이지를 소개서 기준의 구조화된 신뢰 자료 페이지로 재구성했습니다."
        metrics={[
          { label: "허가기관", value: "제3호" },
          { label: "협회 등록", value: "다수" },
          { label: "보안", value: "우수" },
          { label: "인증", value: "ISO" },
        ]}
      />
      <SectionSiblingNav section="연구원 소개" activeRoute="/intro/certificates" go={go} />

      <section className="certificate-grid">
        {certificateGroups.map((group) => (
          <article key={group.title} className="certificate-card">
            <div>
              <span className="eyebrow">Document</span>
              <h2>{group.title}</h2>
              <p>{group.body}</p>
            </div>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

function KibaOrganizationPage({ go }: { go: (route: string) => void }) {
  return (
    <div className="profile-page">
      <ProfileHero
        eyebrow="Organization"
        title="48명 조직과 100명 이상 전문 자문 체계"
        summary="2026년 6월 10일 기준 소개서의 조직도와 인력 보유현황을 반응형 조직 카드로 재구성했습니다."
        metrics={[
          { label: "구성 인원", value: "48명" },
          { label: "원가분석", value: "17명" },
          { label: "건설사업", value: "9명" },
          { label: "전문·자문", value: "100명+" },
        ]}
      />
      <SectionSiblingNav section="연구원 소개" activeRoute="/intro/organization" go={go} />

      <section className="org-layout">
        <div className="org-root-card">
          <span className="eyebrow">Leadership</span>
          <h2>한국경영분석연구원</h2>
          <p>원장, 경영관리부, 원가분석본부, 품질관리실, 건설사업본부, 학술사업본부, 갈등조정중재센터가 업무별로 협업합니다.</p>
        </div>
        <div className="org-unit-grid">
          {organizationUnits.map((unit) => (
            <article key={unit.name} className="org-unit-card">
              <span>{unit.count}</span>
              <h3>{unit.name}</h3>
              <p>{unit.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-card">
        <div className="public-section-head">
          <span className="eyebrow">Capabilities</span>
          <h2>보유 전문성</h2>
          <p>인력 보유현황에 나타난 자격과 전문 분야를 외부 고객이 이해하기 쉬운 역량 단위로 묶었습니다.</p>
        </div>
        <div className="expert-chip-grid">
          {expertCapabilityGroups.map((capability) => (
            <span key={capability}>{capability}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function KibaLocationPage({ go }: { go: (route: string) => void }) {
  return (
    <div className="profile-page location-page">
      <section className="location-hero">
        <div className="location-hero-copy">
          <span className="eyebrow">Location</span>
          <h1>찾아오시는길</h1>
          <p>
            한국경영분석연구원은 서울 강남구 선릉로93길 54 일환빌딩 7층에 위치해 있습니다. 방문 상담 전 연락을 주시면
            업무 분야에 맞는 검토자가 상담을 준비합니다.
          </p>
          <div className="location-hero-meta" aria-label="방문 핵심 정보">
            <span>
              <MapPin size={15} />
              {kibaLocationInfo.shortAddress}
            </span>
            <span>
              <Building2 size={15} />
              {kibaLocationInfo.floor}
            </span>
            <span>
              <Phone size={15} />
              {kibaLocationInfo.phone}
            </span>
          </div>
          <div className="location-hero-actions">
            <a className="primary-btn" href={kibaLocationInfo.googleMapUrl} target="_blank" rel="noreferrer">
              <Navigation size={16} />
              Google Maps 열기
            </a>
            <button className="secondary-btn" type="button" onClick={() => go("/support/contact")}>
              <Mail size={16} />
              상담 문의하기
            </button>
          </div>
        </div>
        <div className="location-hero-card">
          <span>
            <Building2 size={18} />
            Office
          </span>
          <strong>{kibaLocationInfo.name}</strong>
          <div className="location-card-list">
            <p>
              <span>주소</span>
              <strong>{kibaLocationInfo.address}</strong>
            </p>
            <p>
              <span>대표전화</span>
              <strong>{kibaLocationInfo.phone}</strong>
            </p>
            <p>
              <span>이메일</span>
              <strong>{kibaLocationInfo.email}</strong>
            </p>
          </div>
        </div>
      </section>

      <SectionSiblingNav section="연구원 소개" activeRoute="/intro/location" go={go} />

      <section className="location-map-section">
        <div className="location-map-frame">
          <iframe
            title="한국경영분석연구원 Google Maps"
            src={kibaLocationInfo.googleMapEmbedUrl}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <aside className="location-map-panel">
          <span className="eyebrow">Map & Address</span>
          <h2>서울 강남구 선릉로93길 54</h2>
          <p>{kibaLocationInfo.floor}</p>
          <div className="location-map-facts" aria-label="주소 상세 정보">
            <span>강남구 선릉역 생활권</span>
            <span>방문 상담 전 예약 권장</span>
            <span>전화·이메일 사전 검토 가능</span>
          </div>
          <div className="location-map-actions">
            <a href={kibaLocationInfo.googleMapUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={15} />
              새 창에서 지도 보기
            </a>
            <a href={`tel:${kibaLocationInfo.phone.replaceAll("-", "")}`}>
              <Phone size={15} />
              전화 연결
            </a>
          </div>
        </aside>
      </section>

      <section className="location-contact-grid">
        <article className="location-contact-card">
          <span>
            <MapPin size={20} />
          </span>
          <div>
            <strong>주소</strong>
            <p>{kibaLocationInfo.address}</p>
          </div>
        </article>
        <a className="location-contact-card" href={`tel:${kibaLocationInfo.phone.replaceAll("-", "")}`}>
          <span>
            <Phone size={20} />
          </span>
          <div>
            <strong>대표전화</strong>
            <p>{kibaLocationInfo.phone}</p>
          </div>
        </a>
        <a className="location-contact-card" href={`mailto:${kibaLocationInfo.email}`}>
          <span>
            <Mail size={20} />
          </span>
          <div>
            <strong>이메일</strong>
            <p>{kibaLocationInfo.email}</p>
          </div>
        </a>
        <article className="location-contact-card">
          <span>
            <Clock size={20} />
          </span>
          <div>
            <strong>상담 안내</strong>
            <p>방문 전 대표전화 또는 문의 페이지로 상담 일정을 확인해 주세요.</p>
          </div>
        </article>
      </section>

      <section className="location-visit-section">
        <div className="public-section-head">
          <span className="eyebrow">Visit Guide</span>
          <h2>방문 상담 준비 안내</h2>
          <p>기관 방문 전 필요한 흐름을 간단히 정리했습니다. 검토 범위와 자료가 명확할수록 상담과 후속 견적 산정이 빨라집니다.</p>
        </div>
        <div className="location-guide-grid">
          {locationVisitGuides.map((guide, index) => (
            <article key={guide.title} className="location-guide-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{guide.title}</h3>
              <p>{guide.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="location-consult-banner">
        <div>
          <span className="eyebrow">Consulting</span>
          <h2>원가·계약·개발부담금 상담이 필요하신가요?</h2>
          <p>방문 상담 전 문의를 남겨주시면 분야별 담당자가 확인 후 연락드립니다.</p>
        </div>
        <button className="primary-btn" type="button" onClick={() => go("/support/contact")}>
          상담 및 문의로 이동
        </button>
      </section>
    </div>
  );
}

function KibaPerformancePage({ route, go }: { route: string; go: (route: string) => void }) {
  const profile = performanceProfiles[route as keyof typeof performanceProfiles] ?? performanceProfiles["/performance/costing"];

  return (
    <div className="profile-page">
      <ProfileHero eyebrow={profile.eyebrow} title={profile.title} summary={profile.summary} metrics={profile.metrics} />
      <SectionSiblingNav section="주요실적" activeRoute={route} go={go} />

      <section className="performance-layout">
        <main className="performance-record-list">
          {profile.records.map((record) => (
            <article key={`${record.year}-${record.title}`} className="performance-record-card">
              <span>{record.year}</span>
              <div>
                <h2>{record.title}</h2>
                <p>{record.client}</p>
              </div>
            </article>
          ))}
        </main>

        <aside className="content-card performance-side">
          <span className="eyebrow">Focus</span>
          <h2>분야별 키워드</h2>
          <p>소개서 실적을 고객이 탐색하기 쉬운 업무 키워드로 재분류했습니다.</p>
          <div className="agency-chip-list">
            {profile.focus.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <button className="primary-btn" type="button" onClick={() => go("/support/contact")}>
            관련 실적 문의
          </button>
        </aside>
      </section>
    </div>
  );
}

function KibaDetailPage({
  detail,
  page,
  route,
  go,
}: {
  detail: KibaPageDetail;
  page?: KibaSeedPage;
  route: string;
  go: (route: string) => void;
}) {
  const source = kibaSourceFacts[route];
  const cleanLines = page ? cleanContentLines(page.contentLines) : [];
  const sections = buildReadableSections(cleanLines);
  const siblingItems = sectionItems(detail.section);
  const importantLines = source?.evidence ?? detail.points;

  return (
    <div className="public-page">
      <section className="page-hero">
        <span className="eyebrow">{detail.section}</span>
        <h1>{detail.title}</h1>
        <p>{detail.summary}</p>
        <div className="page-meta-row">
          <span>{source ? sourceTypeName(source.sourceType) : "콘텐츠"}</span>
          <span>{page ? `${page.contentLineCount}개 항목` : "페이지 구성"}</span>
          <span>{page ? `${page.imageCount}개 이미지` : "KIBA"}</span>
        </div>
      </section>

      <nav className="sibling-nav" aria-label={`${detail.section} 하위 메뉴`}>
        {siblingItems.map((item) => (
          <button key={item.href} className={item.href === route ? "active" : ""} type="button" onClick={() => item.href && go(item.href)}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="page-grid">
        <main className="page-main">
          <section className="content-card intro-card">
            <span className="eyebrow">Overview</span>
            <h2>{detail.title} 안내</h2>
            <p>{firstParagraph(cleanLines) || detail.summary}</p>
            <div className="insight-grid">
              {importantLines.slice(0, 4).map((line) => (
                <article key={line} className="insight-card">
                  <strong>{line}</strong>
                </article>
              ))}
            </div>
          </section>

          {page?.sourceType === "board" ? <BoardPageContent page={page} /> : null}
          {page?.sourceType !== "board" ? <ArticleSections sections={sections} fallbackLines={cleanLines} /> : null}
          {page?.imageUrls.length ? <ImageGallery page={page} /> : null}
          {page ? <FullContentList page={page} lines={cleanLines} /> : null}
        </main>

        <aside className="page-side">
          <div className="side-card">
            <span className="eyebrow">Menu</span>
            <h3>{detail.section}</h3>
            <div className="side-link-list">
              {siblingItems.map((item) => (
                <button key={item.href} className={item.href === route ? "active" : ""} type="button" onClick={() => item.href && go(item.href)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="side-card">
            <span className="eyebrow">Related</span>
            <h3>연계 페이지</h3>
            <div className="side-link-list">
              {detail.related.map((relatedRoute) => (
                <button key={relatedRoute} type="button" onClick={() => go(relatedRoute)}>
                  {kibaPageDetails[relatedRoute]?.title ?? titles[relatedRoute]}
                </button>
              ))}
            </div>
          </div>

          <div className="side-card contact-mini">
            <span className="eyebrow">Consulting</span>
            <h3>상담 연결</h3>
            <p>관련 업무 상담은 고객센터 문의로 연결됩니다.</p>
            <button className="primary-btn" type="button" onClick={() => go("/support/contact")}>
              상담 및 문의
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ArticleSections({ sections, fallbackLines }: { sections: ContentSection[]; fallbackLines: string[] }) {
  const visibleSections = sections.length ? sections : [{ title: "상세 내용", lines: fallbackLines }];

  return (
    <section className="content-card">
      <span className="eyebrow">Content</span>
      <h2>상세 내용</h2>
      <div className="article-section-list">
        {visibleSections.slice(0, 12).map((section, sectionIndex) => (
          <article key={`${section.title}-${sectionIndex}`} className="article-section">
            <h3>{section.title}</h3>
            {section.lines.slice(0, 8).map((line, lineIndex) => (
              <p key={`${section.title}-${sectionIndex}-${lineIndex}`}>{line}</p>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function BoardPageContent({ page }: { page: KibaSeedPage }) {
  const rows = boardRows(page.contentLines);

  return (
    <section className="content-card">
      <span className="eyebrow">Board</span>
      <h2>{page.title} 목록</h2>
      <div className="board-row-list">
        {rows.slice(0, 12).map((row, index) => (
          <article key={`${page.id}-board-${index}`} className="board-row">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{row.title}</strong>
            <p>{row.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ImageGallery({ page }: { page: KibaSeedPage }) {
  return (
    <section className="content-card">
      <span className="eyebrow">Materials</span>
      <h2>이미지 자료</h2>
      <div className="image-gallery-grid">
        {page.imageUrls.map((imageUrl, index) => (
          <a key={imageUrl} className="image-material-card" href={imageUrl} target="_blank" rel="noreferrer">
            <span style={{ backgroundImage: `url(${imageUrl})` }} aria-hidden="true" />
            <strong>{page.contentLines[index] ?? `${page.title} 자료 ${index + 1}`}</strong>
          </a>
        ))}
      </div>
    </section>
  );
}

function FullContentList({ page, lines }: { page: KibaSeedPage; lines: string[] }) {
  const contentLines = lines.length ? lines : ["이미지 자료 중심 페이지입니다."];

  return (
    <section className="content-card">
      <span className="eyebrow">Details</span>
      <h2>전체 세부 자료</h2>
      <div className="detail-line-list">
        {contentLines.map((line, index) => (
          <p key={`${page.id}-detail-${index}`}>
            <span>{String(index + 1).padStart(3, "0")}</span>
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}

type ContentSection = {
  title: string;
  lines: string[];
};

function cleanContentLines(lines: string[]) {
  return lines.map((line) => line.trim()).filter((line) => line && line !== "▣" && line !== "-");
}

function firstParagraph(lines: string[]) {
  return lines.find((line) => line.length > 28) ?? lines[0] ?? "";
}

function buildReadableSections(lines: string[]): ContentSection[] {
  const sections: ContentSection[] = [];
  let current: ContentSection | null = null;

  for (const line of lines) {
    if (isHeadingLine(line)) {
      current = { title: line, lines: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { title: "개요", lines: [] };
      sections.push(current);
    }
    current.lines.push(line);
  }

  return sections.filter((section) => section.lines.length > 0 || section.title !== "개요");
}

function isHeadingLine(line: string) {
  return /^\d+\.\s*/.test(line) || /^[가-힣A-Z\s·/]{2,18}$/.test(line);
}

function boardRows(lines: string[]) {
  const clean = cleanContentLines(lines);
  const rows: { title: string; meta: string }[] = [];

  for (let index = 0; index < clean.length; index += 4) {
    const chunk = clean.slice(index, index + 4);
    const title = chunk.find((line) => line.length > 8) ?? chunk[0] ?? "게시글";
    rows.push({
      title,
      meta: chunk.filter((line) => line !== title).join(" · "),
    });
  }

  return rows;
}

function sectionItems(section: string) {
  const parent = topLevelUserMenus().find((item) => item.label === section);
  if (!parent?.children) {
    return [];
  }
  return flattenItems(parent.children).filter((item) => item.href);
}

function topLevelUserMenus() {
  return menus.user.flatMap((group) => group.items).filter((item) => item.children?.length);
}

function flattenItems(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) => (item.children ? flattenItems(item.children) : [item]));
}

function AdminDashboard() {
  return (
    <>
      <div className="grid grid4">
        <StatCard title="Total Users" value="128" trend="+14.2%" icon="users" />
        <StatCard title="Role Requests" value="8" trend="+3 pending" icon="shield" />
        <StatCard title="Blocked Accounts" value="2" trend="-1 account" icon="lock" down />
        <StatCard title="Security Score" value="99.8%" trend="Stable" icon="chart" />
      </div>

      <div className="grid grid2 gap-top">
        <div className="card">
          <div className="section-title">
            <h2>Role Approval Status</h2>
            <span>Latest</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Admin One</td>
                <td>Manager</td>
                <td>
                  <span className="status approved">Approved</span>
                </td>
                <td>
                  <button className="ghost-btn" type="button">
                    Edit
                  </button>
                </td>
              </tr>
              <tr>
                <td>Staff Two</td>
                <td>Operator</td>
                <td>
                  <span className="status pending">Pending</span>
                </td>
                <td>
                  <button className="ghost-btn" type="button">
                    Review
                  </button>
                </td>
              </tr>
              <tr>
                <td>External User</td>
                <td>Viewer</td>
                <td>
                  <span className="status blocked">Blocked</span>
                </td>
                <td>
                  <button className="ghost-btn" type="button">
                    Unlock
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ChartCard title="Admin Analytics" />
      </div>
    </>
  );
}

function ProfessionalWorkforceDashboard() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const certsByEmployee = useMemo(() => groupByValue(professionalStaff.certs, (cert) => cert.empId), []);
  const educationsByEmployee = useMemo(() => groupByValue(professionalStaff.educations, (education) => education.empId), []);
  const departments = useMemo(() => uniqueSorted(professionalStaff.employees.map((employee) => employee.dept)), []);
  const phdCount = useMemo(
    () =>
      new Set(
        professionalStaff.educations
          .filter((education) => `${education.degree} ${education.degreeTitle ?? ""}`.includes("박사"))
          .map((education) => education.empId),
      ).size,
    [],
  );
  const masterCount = useMemo(
    () =>
      new Set(
        professionalStaff.educations
          .filter((education) => `${education.degree} ${education.degreeTitle ?? ""}`.includes("석사"))
          .map((education) => education.empId),
      ).size,
    [],
  );

  const filteredEmployees = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    return professionalStaff.employees.filter((employee) => {
      const certs = certsByEmployee[employee.id] ?? [];
      const educations = educationsByEmployee[employee.id] ?? [];
      const works = professionalWorksFor(employee);
      const searchable = [
        employee.id,
        employee.name,
        employee.dept,
        employee.rank,
        ...certs.flatMap((cert) => [cert.code, cert.title, cert.issue]),
        ...educations.flatMap((education) => [education.degree, education.degreeTitle, education.school, education.department, education.major]),
        ...works.flatMap((work) => [work.code, work.domain, work.category, work.subCategory, work.taskType, work.scope, work.department, work.owner, work.keywords]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ko-KR");

      return (!department || employee.dept === department) && (!keyword || searchable.includes(keyword));
    });
  }, [certsByEmployee, department, educationsByEmployee, query]);

  const selectedEmployees = useMemo(() => professionalStaff.employees.filter((employee) => selectedIds.has(employee.id)), [selectedIds]);
  const exportEmployees = selectedEmployees.length ? selectedEmployees : filteredEmployees;
  const allFilteredSelected = filteredEmployees.length > 0 && filteredEmployees.every((employee) => selectedIds.has(employee.id));
  const exportRows = professionalExportRows(exportEmployees, certsByEmployee, educationsByEmployee);
  const downloadLabel = selectedEmployees.length ? "선택 인력" : "검색 결과";
  const selectedDeptCounts = topCountEntries(exportEmployees.map((employee) => employee.dept), 6);

  function toggleEmployee(employeeId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  }

  function toggleFilteredEmployees(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const employee of filteredEmployees) {
        if (checked) {
          next.add(employee.id);
        } else {
          next.delete(employee.id);
        }
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function downloadExcel() {
    const html = buildProfessionalExcelHtml(exportRows, `${downloadLabel} ${exportRows.length}명`);
    downloadBlob("KIBA_전문인력_통합DB.xls", "application/vnd.ms-excel;charset=utf-8", html);
  }

  function downloadPdf() {
    const report = window.open("", "kiba-professional-report", "width=1120,height=820");
    if (!report) {
      return;
    }

    report.document.write(buildProfessionalPrintHtml(exportRows, `${downloadLabel} ${exportRows.length}명`));
    report.document.close();
    report.focus();
    window.setTimeout(() => report.print(), 200);
  }

  return (
    <div className="workforce-dashboard">
      <div className="grid grid4">
        <StatCard title="전문인력" value={String(professionalStaff.employees.length)} trend={`${departments.length}개 분야`} icon="users" />
        <StatCard title="자격 등록" value={String(professionalStaff.certs.length)} trend={`${uniqueSorted(professionalStaff.certs.map((cert) => cert.title)).length}종`} icon="shield" />
        <StatCard title="학력 등록" value={String(professionalStaff.educations.length)} trend={`박사 ${phdCount} / 석사 ${masterCount}`} icon="doc" />
        <StatCard title="선택 인력" value={String(selectedIds.size)} trend={`${filteredEmployees.length}명 검색`} icon="task" />
      </div>

      <section className="card workforce-panel gap-top">
        <div className="workforce-panel-head">
          <div>
            <span className="eyebrow">Professional Workforce</span>
            <h2>전문인력 검색 및 선택</h2>
            <p>이름, 부서, 직급, 학력, 자격증, 업무분류 키워드로 통합 검색합니다.</p>
          </div>
          <div className="workforce-download-actions">
            <button className="secondary-btn" type="button" onClick={downloadPdf} disabled={exportRows.length === 0}>
              <FileText size={15} />
              PDF 다운로드
            </button>
            <button className="primary-btn" type="button" onClick={downloadExcel} disabled={exportRows.length === 0}>
              <Database size={15} />
              엑셀 다운로드
            </button>
          </div>
        </div>

        <div className="workforce-toolbar">
          <label className="workforce-search-field">
            <Search size={15} />
            <input value={query} placeholder="이름·부서·직급·학력·자격증·업무분류 검색" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select className="input workforce-select" value={department} aria-label="부서 필터" onChange={(event) => setDepartment(event.target.value)}>
            <option value="">전체 부서</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <button className="secondary-btn" type="button" onClick={() => toggleFilteredEmployees(true)} disabled={filteredEmployees.length === 0}>
            <Users size={15} />
            검색결과 선택
          </button>
          <button className="secondary-btn" type="button" onClick={clearSelection} disabled={selectedIds.size === 0}>
            <X size={15} />
            선택 해제
          </button>
        </div>

        <div className="workforce-table-wrap">
          <table className="table workforce-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="검색 결과 전체 선택"
                    checked={allFilteredSelected}
                    onChange={(event) => toggleFilteredEmployees(event.target.checked)}
                  />
                </th>
                <th>성명</th>
                <th>부서 / 직급</th>
                <th>대표 자격</th>
                <th>학력</th>
                <th>연결 업무</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const certs = certsByEmployee[employee.id] ?? [];
                const educations = educationsByEmployee[employee.id] ?? [];
                const works = professionalWorksFor(employee);
                return (
                  <tr key={employee.id} className={selectedIds.has(employee.id) ? "selected" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`${employee.name} 선택`}
                        checked={selectedIds.has(employee.id)}
                        onChange={() => toggleEmployee(employee.id)}
                      />
                    </td>
                    <td>
                      <strong>{employee.name}</strong>
                      <span>{employee.id}</span>
                    </td>
                    <td>
                      {employee.dept}
                      <span>{employee.rank}</span>
                    </td>
                    <td>{compactList(certs.map((cert) => cert.title), 3)}</td>
                    <td>{compactList(educations.map((education) => `${education.degreeTitle || education.degree} ${education.school}`), 2)}</td>
                    <td>{compactList(works.map((work) => `${work.category}/${work.subCategory || work.taskType}`), 2)}</td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6}>검색 결과가 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid2 gap-top">
        <section className="card workforce-selected-card">
          <div className="section-title">
            <h2>다운로드 데이터 정리</h2>
            <span>{downloadLabel}</span>
          </div>
          <div className="workforce-summary-grid">
            <div>
              <strong>{exportRows.length}</strong>
              <span>대상 인력</span>
            </div>
            <div>
              <strong>{exportRows.reduce((sum, row) => sum + Number(row.자격수), 0)}</strong>
              <span>자격 합계</span>
            </div>
            <div>
              <strong>{exportRows.reduce((sum, row) => sum + Number(row.학력수), 0)}</strong>
              <span>학력 합계</span>
            </div>
          </div>
          <div className="workforce-selection-list">
            {exportRows.slice(0, 8).map((row) => (
              <article key={row.직원코드}>
                <strong>{row.성명}</strong>
                <span>
                  {row.부서} · {row.직급}
                </span>
              </article>
            ))}
            {exportRows.length > 8 ? <p>외 {exportRows.length - 8}명</p> : null}
          </div>
        </section>

        <section className="card workforce-selected-card">
          <div className="section-title">
            <h2>분야별 구성</h2>
            <span>Summary</span>
          </div>
          <div className="workforce-bars">
            {selectedDeptCounts.map(([dept, count]) => (
              <div key={dept} className="workforce-bar-row">
                <span>{dept}</span>
                <div>
                  <i style={{ width: `${Math.max(8, Math.round((count / Math.max(1, exportRows.length)) * 100))}%` }} />
                </div>
                <b>{count}</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

type CostEstimateRowState = {
  amount: string;
  rate: string;
};

type CostEstimateMeta = {
  title: string;
  client: string;
  manager: string;
  note: string;
};

function CostEstimateBuilderPage() {
  const [templateId, setTemplateId] = useState<CostEstimateTemplateId>(defaultCostEstimateTemplateId);
  const template = useMemo(
    () => costEstimateTemplates.find((item) => item.id === templateId) ?? costEstimateTemplates[0],
    [templateId],
  );
  const [rows, setRows] = useState<Record<string, CostEstimateRowState>>(() => initialCostEstimateRows(template));
  const [meta, setMeta] = useState<CostEstimateMeta>({
    title: `${template.shortLabel} 원가계산서`,
    client: "",
    manager: "원가분석본부",
    note: "",
  });

  const calculatedRows = useMemo(() => calculateCostEstimateRows(template, rows), [template, rows]);
  const totalItem = lastCostItem(template, "total");
  const supplyItem = template.items.find((item) => item.label === "공급가액");
  const vatItem = template.items.find((item) => item.group === "tax");
  const totalAmount = totalItem ? calculatedRows[totalItem.id] ?? 0 : 0;
  const supplyAmount = supplyItem ? calculatedRows[supplyItem.id] ?? 0 : totalAmount;
  const vatAmount = vatItem ? calculatedRows[vatItem.id] ?? 0 : 0;
  const inputAmount = template.items
    .filter((item) => item.kind === "amount")
    .reduce((sum, item) => sum + (calculatedRows[item.id] ?? 0), 0);
  const estimateNumber = `KIBA-${template.shortLabel}-${todayStamp().replace(/-/g, "")}`;

  function updateRow(itemId: string, field: keyof CostEstimateRowState, value: string) {
    const cleanValue = field === "rate" ? cleanRateInput(value) : cleanMoneyInput(value);
    setRows((current) => ({
      ...current,
      [itemId]: {
        amount: current[itemId]?.amount ?? "",
        rate: current[itemId]?.rate ?? "",
        [field]: cleanValue,
      },
    }));
  }

  function updateMeta(field: keyof CostEstimateMeta, value: string) {
    setMeta((current) => ({ ...current, [field]: value }));
  }

  function selectTemplate(nextTemplate: CostEstimateTemplate) {
    setTemplateId(nextTemplate.id);
    setRows(initialCostEstimateRows(nextTemplate));
    setMeta((current) => ({ ...current, title: `${nextTemplate.shortLabel} 원가계산서` }));
  }

  function printEstimate() {
    const report = window.open("", "kiba-cost-estimate-report", "width=1120,height=820");
    if (!report) {
      return;
    }

    report.document.write(buildCostEstimatePrintHtml(template, meta, estimateNumber, rows, calculatedRows));
    report.document.close();
    report.focus();
    window.setTimeout(() => report.print(), 200);
  }

  return (
    <div className="cost-estimate-page">
      <section className="card cost-estimate-hero">
        <div>
          <span className="eyebrow">Cost Estimate Builder</span>
          <h2>원가계산서 생성</h2>
          <p>계산 유형을 선택하면 적용 법령, 비목, 산식 템플릿이 함께 로딩되고 입력 금액에 따라 계산서 미리보기가 즉시 갱신됩니다.</p>
        </div>
        <div className="cost-estimate-actions">
          <button className="secondary-btn" type="button" onClick={() => setRows(initialCostEstimateRows(template))}>
            <X size={15} />
            입력 초기화
          </button>
          <button className="primary-btn" type="button" onClick={printEstimate}>
            <FileText size={15} />
            PDF/인쇄 출력
          </button>
        </div>
      </section>

      <div className="grid grid4">
        <StatCard title="계산 유형" value={String(costEstimateTemplates.length)} trend="템플릿" icon="database" />
        <StatCard title="입력 비목" value={String(template.items.filter((item) => item.kind === "amount").length)} trend={template.shortLabel} icon="task" />
        <StatCard title="입력 합계" value={`${formatWon(inputAmount)}원`} trend="직접 입력" icon="chart" />
        <StatCard title="총원가" value={`${formatWon(totalAmount)}원`} trend="자동 계산" icon="shield" />
      </div>

      <div className="cost-estimate-layout gap-top">
        <aside className="card cost-template-panel">
          <div className="section-title">
            <h2>계산 유형</h2>
            <span>Template</span>
          </div>
          <div className="cost-template-list">
            {costEstimateTemplates.map((item) => (
              <button
                key={item.id}
                className={item.id === template.id ? "active" : ""}
                type="button"
                onClick={() => selectTemplate(item)}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="cost-estimate-workspace">
          <section className="card cost-estimate-meta">
            <div className="section-title">
              <h2>계산서 정보</h2>
              <span>{estimateNumber}</span>
            </div>
            <div className="cost-meta-grid">
              <label>
                <span>계산서명</span>
                <input value={meta.title} onChange={(event) => updateMeta("title", event.target.value)} />
              </label>
              <label>
                <span>의뢰기관</span>
                <input value={meta.client} placeholder="발주기관 또는 고객사" onChange={(event) => updateMeta("client", event.target.value)} />
              </label>
              <label>
                <span>담당부서</span>
                <input value={meta.manager} onChange={(event) => updateMeta("manager", event.target.value)} />
              </label>
              <label>
                <span>검토 메모</span>
                <input value={meta.note} placeholder="증빙, 면세 여부, 특이사항" onChange={(event) => updateMeta("note", event.target.value)} />
              </label>
            </div>
          </section>

          <section className="card cost-standard-card">
            <div className="section-title">
              <h2>적용 기준</h2>
              <span>{template.shortLabel}</span>
            </div>
            <div className="cost-standard-grid">
              <div>
                <strong>법령/기준</strong>
                {template.legalBasis.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div>
                <strong>활용 업무</strong>
                {template.useCases.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div>
                <strong>필요 자료</strong>
                {template.requiredDocuments.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="card cost-items-card">
            <div className="section-title">
              <h2>비목 입력 및 산식</h2>
              <span>{template.items.length} rows</span>
            </div>
            <div className="cost-items-table-wrap">
              <table className="table cost-items-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>비목</th>
                    <th>산출 기준</th>
                    <th>요율</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {template.items.map((item) => (
                    <tr key={item.id} className={item.kind !== "amount" ? "computed" : ""}>
                      <td>
                        <span className={`cost-group-pill ${item.group}`}>{costGroupName(item.group)}</span>
                      </td>
                      <td>
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </td>
                      <td>{item.basis}</td>
                      <td>
                        {item.kind === "rate" ? (
                          <label className="cost-rate-input">
                            <input
                              value={rows[item.id]?.rate ?? ""}
                              aria-label={`${item.label} 요율`}
                              onChange={(event) => updateRow(item.id, "rate", event.target.value)}
                              disabled={!item.editableRate}
                            />
                            <span>%</span>
                          </label>
                        ) : (
                          <span className="muted-text">{item.kind === "sum" ? "합계" : "-"}</span>
                        )}
                      </td>
                      <td>
                        {item.kind === "amount" ? (
                          <label className="cost-money-input">
                            <input
                              value={rows[item.id]?.amount ?? ""}
                              aria-label={`${item.label} 금액`}
                              placeholder="0"
                              onChange={(event) => updateRow(item.id, "amount", event.target.value)}
                            />
                            <span>원</span>
                          </label>
                        ) : (
                          <strong className="cost-computed-amount">{formatWon(calculatedRows[item.id] ?? 0)}원</strong>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card cost-preview-card">
            <div className="section-title">
              <h2>계산서 미리보기</h2>
              <span>Preview</span>
            </div>
            <div className="cost-preview-sheet">
              <div className="cost-preview-head">
                <div>
                  <span>{estimateNumber}</span>
                  <h3>{meta.title || "원가계산서"}</h3>
                  <p>{template.label}</p>
                </div>
                <dl>
                  <div>
                    <dt>작성일</dt>
                    <dd>{todayStamp()}</dd>
                  </div>
                  <div>
                    <dt>의뢰기관</dt>
                    <dd>{meta.client || "-"}</dd>
                  </div>
                  <div>
                    <dt>담당</dt>
                    <dd>{meta.manager || "-"}</dd>
                  </div>
                </dl>
              </div>
              <div className="cost-preview-summary">
                <div>
                  <span>공급가액</span>
                  <strong>{formatWon(supplyAmount)}원</strong>
                </div>
                <div>
                  <span>부가가치세</span>
                  <strong>{formatWon(vatAmount)}원</strong>
                </div>
                <div>
                  <span>총원가</span>
                  <strong>{formatWon(totalAmount)}원</strong>
                </div>
              </div>
              <table className="table cost-preview-table">
                <thead>
                  <tr>
                    <th>비목</th>
                    <th>산출 기준</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {template.items.map((item) => (
                    <tr key={`preview-${item.id}`}>
                      <td>{item.label}</td>
                      <td>{item.basis}</td>
                      <td>{formatWon(calculatedRows[item.id] ?? 0)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {meta.note ? <p className="cost-preview-note">{meta.note}</p> : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function ErpDashboard({ route }: { route: string }) {
  if (route === "/erp/workforce/professionals") {
    return <ProfessionalWorkforceDashboard />;
  }
  if (route === "/erp/cost-estimates/new") {
    return <CostEstimateBuilderPage />;
  }

  const pageTitle = titles[route] ?? "실무 대시보드";
  const erpPagePlan =
    {
      "/erp/cms/pages": ["공개 페이지", "초안", "검수", "배포 상태"],
      "/erp/cms/navigation": ["상위 폴더", "하위 페이지", "노출 순서", "권한"],
      "/erp/cms/resources": ["자료 분류", "첨부파일", "다운로드", "개정일"],
      "/erp/cost-estimates/new": ["계산 유형", "비목 템플릿", "산식 계산", "PDF 출력"],
      "/erp/accounting/items": ["매출 항목", "비용 항목", "세금계산서", "입금 상태"],
      "/erp/analytics/bigquery": ["업무 통계", "상담 전환", "정산 기간", "월별 리포트"],
      "/erp/system/firebase": ["Auth", "Firestore", "Storage", "Functions"],
      "/erp/settings": ["기관 정보", "업무 코드", "알림", "권한 기본값"],
    }[route] ?? ["전문인력", "CMS", "회계", "통계"];

  const erpFolders = [
    { folder: "업무관리", pages: "전문인력 통합DB, 원가계산서 생성" },
    { folder: "CMS 구성", pages: "페이지 관리, 메뉴·폴더 관리, 자료실 관리" },
    { folder: "회계·통계", pages: "회계 항목, BigQuery 통계" },
    { folder: "시스템 설정", pages: "Firebase 운영, 실무 설정" },
  ];

  return (
    <>
      <div className="grid grid4">
        <StatCard title="전문인력" value={String(professionalStaff.employees.length)} trend="통합DB" icon="users" />
        <StatCard title="자격 등록" value={String(professionalStaff.certs.length)} trend="검증자료" icon="shield" />
        <StatCard title="업무분류" value={String(professionalStaff.works.length)} trend="코드화" icon="database" />
        <StatCard title="CMS 페이지" value="34" trend="Ready" icon="folder" />
      </div>

      <div className="grid grid2 gap-top">
        <div className="card">
          <div className="section-title">
            <h2>{pageTitle} 구성</h2>
            <span>실무</span>
          </div>
          <div className="related-list">
            {erpPagePlan.map((item) => (
              <div key={item} className="related-item">
                <strong>{item}</strong>
                <span>실무 필드 및 화면 구성 항목</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <h2>실무 폴더 / 페이지</h2>
            <span>Navigation</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>폴더</th>
                <th>페이지 구성</th>
              </tr>
            </thead>
            <tbody>
              {erpFolders.map((folder) => (
                <tr key={folder.folder}>
                  <td>{folder.folder}</td>
                  <td>{folder.pages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid2 gap-top">
        <ChartCard title="실무 업무 흐름" />
        <div className="card terminal">
          <div className="section-title">
            <h2>Firebase 실무 Runtime</h2>
            <span>READY</span>
          </div>
          <p>
            <span className="prefix">$</span>Auth roles mapped to staff folders.
          </p>
          <p>
            <span className="prefix">$</span>Firestore collections ready: professionalStaff, cmsPages, resources.
          </p>
          <p>
            <span className="prefix">$</span>Storage paths ready for workforce reports and CMS files.
          </p>
          <p>
            <span className="prefix">$</span>BigQuery export configured for staff statistics.
          </p>
        </div>
      </div>
    </>
  );
}

function initialCostEstimateRows(template: CostEstimateTemplate) {
  return template.items.reduce<Record<string, CostEstimateRowState>>((state, item) => {
    state[item.id] = {
      amount: "",
      rate: item.defaultRate != null ? String(item.defaultRate) : "",
    };
    return state;
  }, {});
}

function calculateCostEstimateRows(template: CostEstimateTemplate, rows: Record<string, CostEstimateRowState>) {
  const calculated: Record<string, number> = {};

  for (const item of template.items) {
    if (item.kind === "amount") {
      calculated[item.id] = parseCostInput(rows[item.id]?.amount);
      continue;
    }

    const baseAmount = (item.baseItemIds ?? []).reduce((sum, itemId) => sum + (calculated[itemId] ?? 0), 0);
    if (item.kind === "rate") {
      const rate = parseCostInput(rows[item.id]?.rate || String(item.defaultRate ?? 0));
      calculated[item.id] = (baseAmount * rate) / 100;
      continue;
    }

    calculated[item.id] = baseAmount;
  }

  return calculated;
}

function lastCostItem(template: CostEstimateTemplate, group: CostItemTemplate["group"]) {
  return [...template.items].reverse().find((item) => item.group === group);
}

function costGroupName(group: CostItemTemplate["group"]) {
  const labels: Record<CostItemTemplate["group"], string> = {
    material: "재료",
    labor: "노무",
    expense: "경비",
    markup: "가산",
    tax: "세액",
    total: "합계",
  };
  return labels[group];
}

function cleanMoneyInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function cleanRateInput(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  const [whole, ...fractions] = normalized.split(".");
  return fractions.length ? `${whole}.${fractions.join("").slice(0, 3)}` : whole;
}

function parseCostInput(value?: string) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatWon(value: number) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function buildCostEstimatePrintHtml(
  template: CostEstimateTemplate,
  meta: CostEstimateMeta,
  estimateNumber: string,
  rows: Record<string, CostEstimateRowState>,
  calculatedRows: Record<string, number>,
) {
  const totalItem = lastCostItem(template, "total");
  const totalAmount = totalItem ? calculatedRows[totalItem.id] ?? 0 : 0;
  const legalBasis = template.legalBasis.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const requiredDocuments = template.requiredDocuments.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(meta.title || "원가계산서")}</title>
  <style>
    @page{size:A4;margin:12mm}
    *{box-sizing:border-box}
    body{font-family:"Malgun Gothic",Arial,sans-serif;color:#111827;margin:0}
    header{border-bottom:2px solid #2563eb;margin-bottom:18px;padding-bottom:14px}
    h1{font-size:25px;margin:0 0 8px}
    h2{font-size:16px;margin:22px 0 10px}
    p{margin:0;color:#475569;font-size:12px;line-height:1.65}
    dl{display:grid;grid-template-columns:110px 1fr 110px 1fr;gap:8px 12px;margin:14px 0 0;font-size:12px}
    dt{color:#64748b;font-weight:700}
    dd{margin:0;color:#0f172a;font-weight:700}
    ul{margin:0;padding-left:18px;color:#334155;font-size:11px;line-height:1.6}
    table{border-collapse:collapse;width:100%;font-size:11px}
    th{background:#eff6ff;color:#1d4ed8}
    th,td{border:1px solid #cbd5e1;padding:7px;text-align:left;vertical-align:top}
    td.amount{text-align:right;font-weight:700}
    .summary{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #cbd5e1;margin:18px 0}
    .summary div{padding:12px;border-right:1px solid #cbd5e1}
    .summary div:last-child{border-right:0}
    .summary span{display:block;color:#64748b;font-size:11px;font-weight:700}
    .summary strong{display:block;margin-top:5px;font-size:18px;color:#0f172a}
    .note{margin-top:14px;border:1px solid #cbd5e1;background:#f8fafc;padding:10px}
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(meta.title || "원가계산서")}</h1>
    <p>${escapeHtml(template.label)} · ${escapeHtml(estimateNumber)}</p>
    <dl>
      <dt>작성일</dt><dd>${escapeHtml(todayStamp())}</dd>
      <dt>의뢰기관</dt><dd>${escapeHtml(meta.client || "-")}</dd>
      <dt>담당부서</dt><dd>${escapeHtml(meta.manager || "-")}</dd>
      <dt>계산유형</dt><dd>${escapeHtml(template.label)}</dd>
    </dl>
  </header>

  <section class="summary">
    <div><span>입력 비목</span><strong>${template.items.filter((item) => item.kind === "amount").length}</strong></div>
    <div><span>적용 기준</span><strong>${escapeHtml(template.shortLabel)}</strong></div>
    <div><span>총원가</span><strong>${formatWon(totalAmount)}원</strong></div>
  </section>

  <h2>적용 법령 및 기준</h2>
  <ul>${legalBasis}</ul>

  <h2>비목별 원가계산</h2>
  ${costEstimateRowsTableHtml(template, rows, calculatedRows)}

  <h2>필요 증빙 자료</h2>
  <ul>${requiredDocuments}</ul>
  ${meta.note ? `<p class="note">${escapeHtml(meta.note)}</p>` : ""}
</body>
</html>`;
}

function costEstimateRowsTableHtml(
  template: CostEstimateTemplate,
  rows: Record<string, CostEstimateRowState>,
  calculatedRows: Record<string, number>,
) {
  return `<table>
    <thead>
      <tr><th>구분</th><th>비목</th><th>산출 기준</th><th>요율</th><th>금액</th></tr>
    </thead>
    <tbody>
      ${template.items
        .map((item) => {
          const rate = item.kind === "rate" ? `${escapeHtml(rows[item.id]?.rate || String(item.defaultRate ?? 0))}%` : "-";
          return `<tr>
            <td>${escapeHtml(costGroupName(item.group))}</td>
            <td>${escapeHtml(item.label)}</td>
            <td>${escapeHtml(item.basis)}</td>
            <td>${rate}</td>
            <td class="amount">${formatWon(calculatedRows[item.id] ?? 0)}원</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>`;
}

const professionalExportHeaders = ["직원코드", "성명", "부서", "직급", "자격수", "대표자격", "학력수", "학력", "업무수", "업무분류"] as const;

type ProfessionalExportHeader = (typeof professionalExportHeaders)[number];
type ProfessionalExportRow = Record<ProfessionalExportHeader, string>;

function groupByValue<T>(items: T[], keyer: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = keyer(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

function uniqueSorted(items: string[]) {
  return [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko-KR"));
}

function professionalWorksFor(employee: ProfessionalEmployee) {
  return professionalStaff.works.filter((work) => work.owner && work.owner.includes(employee.name));
}

function compactList(items: string[], limit: number) {
  const values = uniqueSorted(items.map((item) => item.trim()).filter(Boolean));
  if (!values.length) {
    return "-";
  }
  const visible = values.slice(0, limit).join(", ");
  return values.length > limit ? `${visible} 외 ${values.length - limit}건` : visible;
}

function topCountEntries(items: string[], limit: number): [string, number][] {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const key = item || "미분류";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function professionalExportRows(
  employees: ProfessionalEmployee[],
  certsByEmployee: Record<string, ProfessionalCert[]>,
  educationsByEmployee: Record<string, ProfessionalEducation[]>,
): ProfessionalExportRow[] {
  return employees.map((employee) => {
    const certs = certsByEmployee[employee.id] ?? [];
    const educations = educationsByEmployee[employee.id] ?? [];
    const works = professionalWorksFor(employee);

    return {
      직원코드: employee.id,
      성명: employee.name,
      부서: employee.dept,
      직급: employee.rank,
      자격수: String(certs.length),
      대표자격: certs.map((cert) => `${cert.title} (${cert.code}${cert.issue ? `, ${cert.issue}` : ""})`).join(" | "),
      학력수: String(educations.length),
      학력: educations
        .map((education) => [education.degreeTitle || education.degree, education.school, education.department, education.major].filter(Boolean).join(" "))
        .join(" | "),
      업무수: String(works.length),
      업무분류: works.map((work) => `${work.code} ${work.category}/${work.subCategory || work.taskType} ${work.scope}`).join(" | "),
    };
  });
}

function buildProfessionalExcelHtml(rows: ProfessionalExportRow[], scopeLabel: string) {
  return `\uFEFF<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body{font-family:"Malgun Gothic",Arial,sans-serif;color:#111827}
    h1{font-size:22px;margin:0 0 8px}
    p{margin:0 0 16px;color:#475569}
    table{border-collapse:collapse;width:100%;font-size:12px}
    th{background:#eaf2ff;color:#0f172a}
    th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;vertical-align:top}
  </style>
</head>
<body>
  <h1>KIBA 전문인력 통합DB</h1>
  <p>${escapeHtml(scopeLabel)} · ${escapeHtml(todayStamp())}</p>
  ${professionalRowsTableHtml(rows)}
</body>
</html>`;
}

function buildProfessionalPrintHtml(rows: ProfessionalExportRow[], scopeLabel: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>KIBA 전문인력 통합DB</title>
  <style>
    @page{size:A4 landscape;margin:12mm}
    *{box-sizing:border-box}
    body{font-family:"Malgun Gothic",Arial,sans-serif;color:#0f172a;margin:0}
    header{border-bottom:2px solid #2563eb;margin-bottom:16px;padding-bottom:12px}
    h1{font-size:24px;margin:0 0 6px}
    p{margin:0;color:#475569;font-size:12px}
    table{border-collapse:collapse;width:100%;font-size:10px}
    th{background:#eff6ff;color:#1d4ed8}
    th,td{border:1px solid #cbd5e1;padding:6px;text-align:left;vertical-align:top;word-break:keep-all}
    td{line-height:1.45}
  </style>
</head>
<body>
  <header>
    <h1>KIBA 전문인력 통합DB</h1>
    <p>${escapeHtml(scopeLabel)} · ${escapeHtml(todayStamp())}</p>
  </header>
  ${professionalRowsTableHtml(rows)}
</body>
</html>`;
}

function professionalRowsTableHtml(rows: ProfessionalExportRow[]) {
  return `<table>
    <thead>
      <tr>${professionalExportHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${
        rows.length
          ? rows
              .map((row) => `<tr>${professionalExportHeaders.map((header) => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`)
              .join("")
          : `<tr><td colspan="${professionalExportHeaders.length}">대상 데이터가 없습니다.</td></tr>`
      }
    </tbody>
  </table>`;
}

function downloadBlob(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value: string) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}
