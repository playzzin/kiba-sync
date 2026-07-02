export type CostEstimateTemplateId =
  | "manufacturing-purchase"
  | "construction-cost"
  | "academic-service"
  | "software-fee";

export type CostItemKind = "amount" | "rate" | "sum";

export type CostItemGroup = "material" | "labor" | "expense" | "markup" | "tax" | "total";

export type CostItemTemplate = {
  id: string;
  label: string;
  group: CostItemGroup;
  kind: CostItemKind;
  basis: string;
  description: string;
  baseItemIds?: string[];
  defaultRate?: number;
  editableRate?: boolean;
};

export type CostEstimateTemplate = {
  id: CostEstimateTemplateId;
  label: string;
  shortLabel: string;
  description: string;
  legalBasis: string[];
  useCases: string[];
  requiredDocuments: string[];
  items: CostItemTemplate[];
};

const commonManufacturingItems: CostItemTemplate[] = [
  {
    id: "directMaterial",
    label: "직접재료비",
    group: "material",
    kind: "amount",
    basis: "재료소요량 x 단가",
    description: "제품 실체를 형성하는 원재료, 매입부품, 외주품 등",
  },
  {
    id: "indirectMaterial",
    label: "간접재료비",
    group: "material",
    kind: "amount",
    basis: "직접계산 또는 결산자료 배부",
    description: "소모재료, 포장재료 등 직접재료비로 분리하기 어려운 재료비",
  },
  {
    id: "directLabor",
    label: "직접노무비",
    group: "labor",
    kind: "amount",
    basis: "공정별 노무량 x 노임단가",
    description: "제조현장 직접작업자의 노동력 대가",
  },
  {
    id: "indirectLabor",
    label: "간접노무비",
    group: "labor",
    kind: "amount",
    basis: "직접노무비 범위 내 배부",
    description: "현장 감독자와 보조 작업자의 노동력 대가",
  },
  {
    id: "expense",
    label: "경비",
    group: "expense",
    kind: "amount",
    basis: "직접계산 또는 결산자료 배부",
    description: "전력비, 운반비, 수리수선비, 특허권사용료 등",
  },
  {
    id: "primeCost",
    label: "순원가",
    group: "total",
    kind: "sum",
    basis: "재료비 + 노무비 + 경비",
    description: "일반관리비와 이윤 산정 전 원가 합계",
    baseItemIds: ["directMaterial", "indirectMaterial", "directLabor", "indirectLabor", "expense"],
  },
  {
    id: "generalAdmin",
    label: "일반관리비",
    group: "markup",
    kind: "rate",
    basis: "순원가 x 요율",
    description: "기업 유지와 관리 활동에 필요한 간접비",
    baseItemIds: ["primeCost"],
    defaultRate: 5,
    editableRate: true,
  },
  {
    id: "profit",
    label: "이윤",
    group: "markup",
    kind: "rate",
    basis: "(노무비 + 경비 + 일반관리비) x 요율",
    description: "계약 수행에 따른 적정 이윤",
    baseItemIds: ["directLabor", "indirectLabor", "expense", "generalAdmin"],
    defaultRate: 10,
    editableRate: true,
  },
  {
    id: "supplyAmount",
    label: "공급가액",
    group: "total",
    kind: "sum",
    basis: "순원가 + 일반관리비 + 이윤",
    description: "부가가치세 산정 전 계산서 금액",
    baseItemIds: ["primeCost", "generalAdmin", "profit"],
  },
  {
    id: "vat",
    label: "부가가치세",
    group: "tax",
    kind: "rate",
    basis: "공급가액 x 10%",
    description: "부가가치세 과세 대상인 경우 적용",
    baseItemIds: ["supplyAmount"],
    defaultRate: 10,
    editableRate: true,
  },
  {
    id: "totalAmount",
    label: "총원가",
    group: "total",
    kind: "sum",
    basis: "공급가액 + 부가가치세",
    description: "원가계산서 최종 금액",
    baseItemIds: ["supplyAmount", "vat"],
  },
];

const serviceItems: CostItemTemplate[] = [
  {
    id: "leadResearcher",
    label: "책임연구원 인건비",
    group: "labor",
    kind: "amount",
    basis: "소요인원 x 기준단가 x 참여기간",
    description: "연구 지휘, 감독, 결론 도출 역할",
  },
  {
    id: "researcher",
    label: "연구원 인건비",
    group: "labor",
    kind: "amount",
    basis: "소요인원 x 기준단가 x 참여기간",
    description: "책임연구원 보조와 분석 수행 인력",
  },
  {
    id: "assistant",
    label: "연구보조원/보조원",
    group: "labor",
    kind: "amount",
    basis: "소요인원 x 기준단가 x 참여기간",
    description: "통계처리, 번역, 원고 정리 등 보조 업무",
  },
  {
    id: "travel",
    label: "여비",
    group: "expense",
    kind: "amount",
    basis: "국내/국외 여비 규정",
    description: "조사와 회의 수행에 필요한 출장 비용",
  },
  {
    id: "printing",
    label: "유인물비",
    group: "expense",
    kind: "amount",
    basis: "실비 계상",
    description: "프린트, 인쇄, 문헌복사 비용",
  },
  {
    id: "dataProcessing",
    label: "전산처리비",
    group: "expense",
    kind: "amount",
    basis: "자료처리 컴퓨터 사용료",
    description: "분석 데이터 처리와 시스템 사용 비용",
  },
  {
    id: "meeting",
    label: "회의비/자문비",
    group: "expense",
    kind: "amount",
    basis: "참석자 수당 및 회의 실비",
    description: "자문회, 토론회, 공청회 등 소요 경비",
  },
  {
    id: "servicePrimeCost",
    label: "순원가",
    group: "total",
    kind: "sum",
    basis: "인건비 + 경비",
    description: "학술연구용역 원가 합계",
    baseItemIds: ["leadResearcher", "researcher", "assistant", "travel", "printing", "dataProcessing", "meeting"],
  },
  {
    id: "serviceAdmin",
    label: "일반관리비",
    group: "markup",
    kind: "rate",
    basis: "순원가 x 5%",
    description: "용역 수행 조직의 일반 관리 비용",
    baseItemIds: ["servicePrimeCost"],
    defaultRate: 5,
    editableRate: true,
  },
  {
    id: "serviceProfit",
    label: "이윤",
    group: "markup",
    kind: "rate",
    basis: "(순원가 + 일반관리비) x 10%",
    description: "용역 수행에 따른 적정 이윤",
    baseItemIds: ["servicePrimeCost", "serviceAdmin"],
    defaultRate: 10,
    editableRate: true,
  },
  {
    id: "serviceSupplyAmount",
    label: "공급가액",
    group: "total",
    kind: "sum",
    basis: "순원가 + 일반관리비 + 이윤",
    description: "부가가치세 전 용역 금액",
    baseItemIds: ["servicePrimeCost", "serviceAdmin", "serviceProfit"],
  },
  {
    id: "serviceVat",
    label: "부가가치세",
    group: "tax",
    kind: "rate",
    basis: "공급가액 x 10%",
    description: "면세 여부에 따라 조정",
    baseItemIds: ["serviceSupplyAmount"],
    defaultRate: 10,
    editableRate: true,
  },
  {
    id: "serviceTotalAmount",
    label: "총원가",
    group: "total",
    kind: "sum",
    basis: "공급가액 + 부가가치세",
    description: "학술연구용역 계산서 최종 금액",
    baseItemIds: ["serviceSupplyAmount", "serviceVat"],
  },
];

const softwareItems: CostItemTemplate[] = [
  {
    id: "functionPointCost",
    label: "기능점수 개발비",
    group: "labor",
    kind: "amount",
    basis: "기능점수 x 점수당 단가 x 보정계수",
    description: "기능점수 방식으로 산정한 소프트웨어 개발 원가",
  },
  {
    id: "inputLaborCost",
    label: "투입공수 인건비",
    group: "labor",
    kind: "amount",
    basis: "투입인력수 x 개발기간 x 기술자 단가",
    description: "투입인력 방식으로 산정한 직접인건비",
  },
  {
    id: "directSoftwareExpense",
    label: "직접경비",
    group: "expense",
    kind: "amount",
    basis: "실비 조사 계상",
    description: "SW Tool, 자료조사비, 특수자료비, 위탁비 등",
  },
  {
    id: "databaseBuildCost",
    label: "DB 구축비",
    group: "expense",
    kind: "amount",
    basis: "자료입력비 + 제경비 + 이윤",
    description: "데이터베이스 구축과 자료 입력에 필요한 비용",
  },
  {
    id: "swPrimeCost",
    label: "개발원가",
    group: "total",
    kind: "sum",
    basis: "개발비 + 직접경비 + DB 구축비",
    description: "소프트웨어 사업대가 산정의 기초 금액",
    baseItemIds: ["functionPointCost", "inputLaborCost", "directSoftwareExpense", "databaseBuildCost"],
  },
  {
    id: "swOverhead",
    label: "제경비",
    group: "markup",
    kind: "rate",
    basis: "직접인건비 x 요율",
    description: "소프트웨어 수행 간접비",
    baseItemIds: ["functionPointCost", "inputLaborCost"],
    defaultRate: 70,
    editableRate: true,
  },
  {
    id: "technologyFee",
    label: "기술료",
    group: "markup",
    kind: "rate",
    basis: "(직접인건비 + 제경비) x 요율",
    description: "기술축적, 조사연구, 기술개발, 이윤 성격의 대가",
    baseItemIds: ["functionPointCost", "inputLaborCost", "swOverhead"],
    defaultRate: 20,
    editableRate: true,
  },
  {
    id: "swSupplyAmount",
    label: "공급가액",
    group: "total",
    kind: "sum",
    basis: "개발원가 + 제경비 + 기술료",
    description: "부가가치세 산정 전 SW 사업대가",
    baseItemIds: ["swPrimeCost", "swOverhead", "technologyFee"],
  },
  {
    id: "swVat",
    label: "부가가치세",
    group: "tax",
    kind: "rate",
    basis: "공급가액 x 10%",
    description: "과세 대상인 경우 적용",
    baseItemIds: ["swSupplyAmount"],
    defaultRate: 10,
    editableRate: true,
  },
  {
    id: "swTotalAmount",
    label: "총원가",
    group: "total",
    kind: "sum",
    basis: "공급가액 + 부가가치세",
    description: "소프트웨어 대가산정 최종 금액",
    baseItemIds: ["swSupplyAmount", "swVat"],
  },
];

export const costEstimateTemplates: CostEstimateTemplate[] = [
  {
    id: "manufacturing-purchase",
    label: "제조구매 원가계산",
    shortLabel: "제조구매",
    description: "물품 제조, 장비 제작, 부품 수리 등 제조 원가계산서 작성에 사용하는 기본 템플릿입니다.",
    legalBasis: ["국가계약법 시행령 제9조", "예정가격 작성기준 제2장 제7조~제14조"],
    useCases: ["신규 개발품", "특수 규격 물품", "제조·공사 원가 검토", "공공 조달 예정가격 산정"],
    requiredDocuments: ["규격서/과업지시서", "재료 소요량 산출서", "노무량 산출근거", "견적서 또는 거래실례 자료", "결산자료"],
    items: commonManufacturingItems,
  },
  {
    id: "construction-cost",
    label: "공사비 원가계산",
    shortLabel: "공사비",
    description: "건축, 토목, 기계, 전기 등 공사비 원가 산출과 검증에 맞춘 템플릿입니다.",
    legalBasis: ["국가계약법 시행령 제9조", "예정가격 작성기준 제2장 제15조~제22조"],
    useCases: ["공사 원가 산정", "수량 산출 내역 검토", "공사비 적정성 검증", "설계변경 금액 검토"],
    requiredDocuments: ["설계서", "수량산출서", "산출내역서", "표준품셈/일위대가", "보험료 및 법정경비 요율표"],
    items: [
      ...commonManufacturingItems.map((item) =>
        item.id === "expense"
          ? {
              ...item,
              label: "공사 경비",
              basis: "일위대가, 품셈, 법정요율",
              description: "기계경비, 보험료, 안전관리비, 품질관리비, 환경보전비 등",
            }
          : item,
      ),
    ],
  },
  {
    id: "academic-service",
    label: "학술용역 원가계산",
    shortLabel: "학술용역",
    description: "타당성 조사, 공공요금 연구, 민간위탁 비용 산정 등 학술연구용역 원가계산 템플릿입니다.",
    legalBasis: ["국가계약법 시행령 제9조", "예정가격 작성기준 제2장 제23조~제30조"],
    useCases: ["타당성 검토", "공공요금 산정", "민간위탁비 원가계산", "정책 연구용역"],
    requiredDocuments: ["과업지시서", "참여인력 계획", "연구 일정표", "여비 산출근거", "회의/자문 계획"],
    items: serviceItems,
  },
  {
    id: "software-fee",
    label: "SW 대가산정",
    shortLabel: "SW",
    description: "소프트웨어 개발비, 유지관리비, 운영비, DB 구축비 산정에 사용하는 소프트웨어 사업대가 템플릿입니다.",
    legalBasis: ["국가계약법 시행령 제9조", "예정가격 작성기준 제2장 제30조", "소프트웨어 사업대가 기준"],
    useCases: ["소프트웨어 개발비", "기능점수 방식", "투입공수 방식", "DB 구축비", "운영·유지관리비"],
    requiredDocuments: ["요구사항 정의서", "기능점수 산정표", "투입인력 계획", "SW 기술자 단가", "직접경비 증빙"],
    items: softwareItems,
  },
];

export const defaultCostEstimateTemplateId: CostEstimateTemplateId = "manufacturing-purchase";
