/**
 * Excel parser for cost estimate generator.
 *
 * Supports:
 * - 내역서.xlsx  (detail/quantity sheet)
 * - 단가대비표.xlsx (price comparison sheet)
 * - Unified workbook containing both sheets
 *
 * Column layout is detected automatically from header rows so the parser
 * adapts to different template versions (ver1, ver2, etc.).
 */

import type { CostEstimateDraftRow } from "./firebase-draft";

export type ParsedCostRow = CostEstimateDraftRow;

export type ParsedPriceItem = {
  itemName: string;
  spec: string;
  unit: string;
  appliedUnitPrice: number;
  sourceRow: number;
};

// ─── Column-index maps ───────────────────────────────────────────────────────

interface NaeyeokseoColMap {
  section: number;
  itemName: number;
  spec: number;
  unit: number; // -1 when no dedicated unit column
  qty: number;
  materialUnitPrice: number;
  materialAmount: number;
  laborUnitPrice: number;
  laborAmount: number;
  expenseUnitPrice: number;
  expenseAmount: number;
  total: number;
}

interface DangaDaebiColMap {
  itemName: number;
  spec: number;
  unit: number;
  appliedUnitPrice: number; // column M in ver1, or whichever has "적용단가"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function asNum(v: unknown): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v === "string") return Number(v.replace(/,/g, "")) || 0;
  return 0;
}

function asStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function norm(v: unknown): string {
  return asStr(v).replace(/\s/g, "");
}

// ─── Header detection ────────────────────────────────────────────────────────

/**
 * Find the 0-based index of the header row in a sheet by scanning the first
 * few rows for the presence of "수량" or "재료비" keywords.
 */
function findNaeyeokseoHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    const hasQty = row.some((c) => norm(c) === "수량" || norm(c) === "물량");
    const hasPriceHeader = row.some((c) => {
      const v = norm(c);
      return v.includes("재료비") || (v.includes("단가") && v !== "단가대비표");
    });
    if (hasQty || hasPriceHeader) return i;
  }
  // Fallback: row index 7 (Excel row 8, 1-indexed)
  return 7;
}

function detectNaeyeokseoColMap(headerRow: unknown[]): NaeyeokseoColMap {
  const map: NaeyeokseoColMap = {
    section: 0,
    itemName: 1,
    spec: 2,
    unit: -1,
    qty: 3, // col D (issue #20 confirmed)
    materialUnitPrice: 4, // col E
    materialAmount: 5, // col F
    laborUnitPrice: 6, // col G
    laborAmount: 7, // col H
    expenseUnitPrice: 8, // col I
    expenseAmount: 9, // col J
    total: 10, // col K
  };

  headerRow.forEach((cell, i) => {
    const v = norm(cell);
    if (v === "수량" || v === "물량") map.qty = i;
    if (v === "단위") map.unit = i;
    if (v === "품명" || v === "공종" || v === "명칭") map.itemName = i;
    if (v === "규격") map.spec = i;
    if (v.includes("재료비") && v.includes("단가")) map.materialUnitPrice = i;
    if (v.includes("재료비") && v.includes("금액")) map.materialAmount = i;
    if (v.includes("노무비") && v.includes("단가")) map.laborUnitPrice = i;
    if (v.includes("노무비") && v.includes("금액")) map.laborAmount = i;
    if ((v.includes("경비") || v.includes("기계")) && v.includes("단가"))
      map.expenseUnitPrice = i;
    if ((v.includes("경비") || v.includes("기계")) && v.includes("금액"))
      map.expenseAmount = i;
    if (v === "합계" || v === "소계") map.total = i;
  });

  return map;
}

function detectDangaDaebiColMap(headerRow: unknown[]): DangaDaebiColMap {
  const map: DangaDaebiColMap = {
    itemName: 1,
    spec: 2,
    unit: 3,
    appliedUnitPrice: 12, // col M in ver1 = MIN(D,H,J)
  };

  headerRow.forEach((cell, i) => {
    const v = norm(cell);
    if (v === "품명" || v === "품목") map.itemName = i;
    if (v === "규격") map.spec = i;
    if (v === "단위") map.unit = i;
    if (v === "적용단가" || v === "최저단가" || v === "M") map.appliedUnitPrice = i;
  });

  return map;
}

// ─── Row-level helpers ───────────────────────────────────────────────────────

/**
 * Returns true when the row looks like a section/header row rather than a
 * data row (no numeric quantity or unit prices found).
 */
function isSectionHeader(
  row: unknown[],
  colMap: NaeyeokseoColMap,
): { isSection: boolean; text: string } {
  const qtyVal = asNum(row[colMap.qty]);
  const matPrice = asNum(row[colMap.materialUnitPrice]);
  const labPrice = asNum(row[colMap.laborUnitPrice]);
  const expPrice = asNum(row[colMap.expenseUnitPrice]);

  if (qtyVal === 0 && matPrice === 0 && labPrice === 0 && expPrice === 0) {
    const text =
      asStr(row[colMap.itemName]) || asStr(row[colMap.section]) || asStr(row[0]);
    return { isSection: text.length > 0, text };
  }
  return { isSection: false, text: "" };
}

// ─── Core row parser ─────────────────────────────────────────────────────────

/**
 * Converts raw 내역서 rows (already read from the file) into ParsedCostRow[].
 * One Excel row can produce up to 3 cost rows (material + labor + expense).
 */
function parseNaeyeokseoRows(rawRows: unknown[][]): ParsedCostRow[] {
  const headerIdx = findNaeyeokseoHeaderRow(rawRows);
  const colMap = detectNaeyeokseoColMap(rawRows[headerIdx] ?? []);

  const result: ParsedCostRow[] = [];
  let currentSection = "";
  let counter = 0;

  for (let i = headerIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.every((c) => c === null || c === "")) continue;

    const excelRow = i + 1; // 1-indexed Excel row number

    const { isSection, text } = isSectionHeader(row, colMap);
    if (isSection) {
      currentSection = text;
      continue;
    }

    const itemName = asStr(row[colMap.itemName]);
    if (!itemName) continue;

    const spec = asStr(row[colMap.spec]);
    const unit = colMap.unit >= 0 ? asStr(row[colMap.unit]) : "";
    const qty = asNum(row[colMap.qty]);

    const matPrice = asNum(row[colMap.materialUnitPrice]);
    const labPrice = asNum(row[colMap.laborUnitPrice]);
    const expPrice = asNum(row[colMap.expenseUnitPrice]);

    if (matPrice === 0 && labPrice === 0 && expPrice === 0) continue;

    const baseCode = `N${String(excelRow).padStart(3, "0")}`;
    counter++;

    if (matPrice > 0) {
      result.push({
        id: `parsed-${excelRow}-M-${counter}`,
        code: `${baseCode}-M`,
        category: "material",
        itemName,
        spec,
        unit,
        qty: String(qty),
        unitPrice: String(matPrice),
        sourceRow: excelRow,
        section: currentSection || undefined,
      });
    }
    if (labPrice > 0) {
      result.push({
        id: `parsed-${excelRow}-L-${counter}`,
        code: `${baseCode}-L`,
        category: "labor",
        itemName,
        spec,
        unit,
        qty: String(qty),
        unitPrice: String(labPrice),
        sourceRow: excelRow,
        section: currentSection || undefined,
      });
    }
    if (expPrice > 0) {
      result.push({
        id: `parsed-${excelRow}-E-${counter}`,
        code: `${baseCode}-E`,
        category: "expense",
        itemName,
        spec,
        unit,
        qty: String(qty),
        unitPrice: String(expPrice),
        sourceRow: excelRow,
        section: currentSection || undefined,
      });
    }
  }

  return result;
}

// ─── Public parse functions ───────────────────────────────────────────────────

export type ExcelParseResult<T> = {
  data: T;
  warnings: string[];
};

/**
 * Parse a 내역서 Excel file (or the 내역서 sheet inside a file).
 * sheetName is optional; omit to read the first/only sheet.
 */
export async function parseNaeyeokseo(
  file: File,
  sheetName?: string,
): Promise<ExcelParseResult<ParsedCostRow[]>> {
  const warnings: string[] = [];

  try {
    const { readSheet } = await import("read-excel-file/browser");
    const rawRows: unknown[][] = sheetName
      ? await readSheet(file as unknown as Parameters<typeof readSheet>[0], sheetName)
      : await readSheet(file as unknown as Parameters<typeof readSheet>[0]);

    if (rawRows.length === 0) {
      warnings.push("내역서 시트가 비어 있습니다.");
      return { data: [], warnings };
    }

    const rows = parseNaeyeokseoRows(rawRows);
    if (rows.length === 0) {
      warnings.push(
        "내역서에서 항목을 찾지 못했습니다. 컬럼 구조(수량, 재료비단가, 노무비단가, 경비단가)를 확인하세요.",
      );
    } else {
      warnings.push(`내역서에서 ${rows.length}개 항목을 파싱했습니다.`);
    }

    return { data: rows, warnings };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    warnings.push(`내역서 읽기 실패: ${msg}`);
    return { data: [], warnings };
  }
}

/**
 * Parse a 단가대비표 Excel file.
 */
export async function parseDangaDaebiPyo(
  file: File,
  sheetName?: string,
): Promise<ExcelParseResult<ParsedPriceItem[]>> {
  const warnings: string[] = [];

  try {
    const { readSheet } = await import("read-excel-file/browser");
    const rawRows: unknown[][] = sheetName
      ? await readSheet(file as unknown as Parameters<typeof readSheet>[0], sheetName)
      : await readSheet(file as unknown as Parameters<typeof readSheet>[0]);

    if (rawRows.length === 0) {
      warnings.push("단가대비표 시트가 비어 있습니다.");
      return { data: [], warnings };
    }

    // Find header row (look for "적용단가")
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      if (rawRows[i].some((c) => norm(c) === "적용단가" || norm(c) === "최저단가")) {
        headerIdx = i;
        break;
      }
    }

    const colMap = detectDangaDaebiColMap(rawRows[headerIdx] ?? []);
    const items: ParsedPriceItem[] = [];

    for (let i = headerIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.every((c) => c === null || c === "")) continue;

      const itemName = asStr(row[colMap.itemName]);
      if (!itemName) continue;

      const appliedPrice = asNum(row[colMap.appliedUnitPrice]);
      if (appliedPrice <= 0) continue;

      items.push({
        itemName,
        spec: asStr(row[colMap.spec]),
        unit: colMap.unit >= 0 ? asStr(row[colMap.unit]) : "",
        appliedUnitPrice: appliedPrice,
        sourceRow: i + 1,
      });
    }

    warnings.push(`단가대비표에서 ${items.length}개 단가 항목을 파싱했습니다.`);
    return { data: items, warnings };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    warnings.push(`단가대비표 읽기 실패: ${msg}`);
    return { data: [], warnings };
  }
}

/**
 * Parse a unified workbook that contains multiple sheets.
 * Tries to find sheets named "내역서" and "단가대비표" automatically.
 */
export async function parseUnifiedWorkbook(file: File): Promise<
  ExcelParseResult<{
    rows: ParsedCostRow[];
    priceItems: ParsedPriceItem[];
    foundSheets: string[];
  }>
> {
  const warnings: string[] = [];

  try {
    const { default: readXlsxFile } = await import("read-excel-file/browser");
    const sheets = await readXlsxFile(file as unknown as Parameters<typeof readXlsxFile>[0]);

    const foundSheets = sheets.map((s) => s.sheet);
    warnings.push(`시트 목록: ${foundSheets.join(", ")}`);

    // Try to find 내역서 sheet
    const naeyeokseoSheet =
      sheets.find((s) => s.sheet === "내역서") ??
      sheets.find((s) => s.sheet.includes("내역서"));

    // Try to find 단가대비표 sheet
    const dangaDaebiSheet =
      sheets.find((s) => s.sheet === "단가대비표") ??
      sheets.find((s) => s.sheet.includes("단가"));

    let rows: ParsedCostRow[] = [];
    const priceItems: ParsedPriceItem[] = [];

    if (naeyeokseoSheet) {
      rows = parseNaeyeokseoRows(naeyeokseoSheet.data as unknown[][]);
      warnings.push(
        rows.length > 0
          ? `내역서(${naeyeokseoSheet.sheet})에서 ${rows.length}개 항목 파싱 완료`
          : `내역서(${naeyeokseoSheet.sheet}) 파싱 결과 항목 없음 – 컬럼 구조 확인 필요`,
      );
    } else {
      warnings.push(
        '"내역서" 시트를 찾지 못했습니다. 통합 파일의 시트명을 확인하세요.',
      );
    }

    if (dangaDaebiSheet) {
      let headerIdx = 0;
      for (let i = 0; i < Math.min(dangaDaebiSheet.data.length, 10); i++) {
        if (
          (dangaDaebiSheet.data[i] as unknown[]).some(
            (c) => norm(c) === "적용단가" || norm(c) === "최저단가",
          )
        ) {
          headerIdx = i;
          break;
        }
      }
      const colMap = detectDangaDaebiColMap(
        (dangaDaebiSheet.data[headerIdx] as unknown[]) ?? [],
      );
      for (let i = headerIdx + 1; i < dangaDaebiSheet.data.length; i++) {
        const row = dangaDaebiSheet.data[i] as unknown[];
        if (!row || row.every((c) => c === null || c === "")) continue;
        const itemName = asStr(row[colMap.itemName]);
        if (!itemName) continue;
        const appliedPrice = asNum(row[colMap.appliedUnitPrice]);
        if (appliedPrice <= 0) continue;
        priceItems.push({
          itemName,
          spec: asStr(row[colMap.spec]),
          unit: colMap.unit >= 0 ? asStr(row[colMap.unit]) : "",
          appliedUnitPrice: appliedPrice,
          sourceRow: i + 1,
        });
      }
      warnings.push(
        `단가대비표(${dangaDaebiSheet.sheet})에서 ${priceItems.length}개 단가 파싱 완료`,
      );
    }

    return { data: { rows, priceItems, foundSheets }, warnings };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    warnings.push(`통합 파일 읽기 실패: ${msg}`);
    return { data: { rows: [], priceItems: [], foundSheets: [] }, warnings };
  }
}
