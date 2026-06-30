import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = "http://www.kiba.re.kr/";
const outputPath = path.resolve("data/kiba-content.seed.json");

const menuGroups = [
  {
    title: "연구원 소개",
    slug: "intro",
    items: [
      item("인사말", "/intro/greeting", "ctg01/pg01.htm", "mixed"),
      item("연혁", "/intro/history", "ctg01/pg02.htm", "mixed"),
      item("인증서", "/intro/certificates", "ctg01/pg03.htm", "image"),
      item("설립목적", "/intro/purpose", "ctg01/pg04.htm", "image"),
      item("조직구성", "/intro/organization", "ctg01/pg05.htm", "image"),
      item("찾아오시는길", "/intro/location", "ctg01/pg06.htm", "text"),
    ],
  },
  {
    title: "주요실적",
    slug: "performance",
    items: [
      item("원가산정", "/performance/costing", "ctg02/pg01.htm", "text"),
      item("사후정산", "/performance/settlement", "ctg02/pg02.htm", "text"),
      item("학술연구", "/performance/research", "ctg02/pg03.htm", "text"),
    ],
  },
  {
    title: "학술연구",
    slug: "research",
    items: [
      item("타당성조사", "/research/feasibility", "ctg03/pg01.htm", "text"),
      item("공공서비스 요금산정", "/research/public-fee", "ctg03/pg02.htm", "text"),
      item("분쟁검증용역", "/research/dispute-review", "ctg03/pg03.htm", "text"),
      item("건설사업관리", "/research/construction-management", "ctg03/pg04.htm", "text"),
      item("LCC", "/research/lcc", "ctg03/pg05.htm", "text"),
    ],
  },
  {
    title: "원가계산안내",
    slug: "cost-guide",
    items: [
      item("정부계약일반", "/cost-guide/government-contract", "ctg04/pg01.htm", "text"),
      item("정부계약관련법령", "/cost-guide/laws", "ctg04/pg02.htm", "text"),
      item("예정가격", "/cost-guide/estimated-price", "ctg04/pg03.htm", "text"),
      item("정부원가계산의 활용", "/cost-guide/application", "ctg04/pg04.htm", "text"),
      item("원가계산실무", "/cost-guide/practice", "ctg04/pg05.htm", "text"),
    ],
  },
  {
    title: "계약금액조정",
    slug: "contract-adjustment",
    items: [
      item("계약금액조정", "/contract-adjustment/overview", "ctg05/pg01.htm", "text"),
      item("물가변동", "/contract-adjustment/price-change", "ctg05/pg02.htm", "text"),
      item("설계변경", "/contract-adjustment/design-change", "ctg05/pg03.htm", "text"),
      item("기타 계약내용변경", "/contract-adjustment/etc", "ctg05/pg04.htm", "text"),
    ],
  },
  {
    title: "개발부담금",
    slug: "development-charge",
    items: [
      item("개발부담금이란", "/development-charge/overview", "ctg06/pg01.htm", "text"),
      item("부과대상 사업", "/development-charge/targets", "ctg06/pg02.htm", "text"),
      item("개발부담금 산출방식", "/development-charge/calculation", "ctg06/pg03.htm", "text"),
      item("개발비용 산정기준", "/development-charge/cost-standard", "ctg06/pg04.htm", "text"),
    ],
  },
  {
    title: "클레임",
    slug: "claim",
    items: [
      item("클레임", "/claim/overview", "ctg07/pg01.htm", "text"),
      item("중재", "/claim/arbitration", "ctg07/pg02.htm", "text"),
      item("분쟁", "/claim/dispute", "ctg07/pg03.htm", "text"),
      item("판례정보", "/claim/cases", "ctg07/pg04.htm", "image"),
    ],
  },
  {
    title: "고객센터",
    slug: "support",
    items: [
      item("공지사항&새소식", "/support/news", "ctg08/pg01.htm", "board"),
      item("자료실", "/support/resources", "ctg08/pg02.htm", "board"),
      item("상담 및 문의", "/support/contact", "ctg08/pg03.htm", "board"),
    ],
  },
];

function item(title, route, sourcePath, sourceType) {
  return {
    title,
    route,
    sourcePath,
    sourceType,
    sourceUrl: new URL(sourcePath, baseUrl).toString(),
  };
}

function stableId(value) {
  return value.replace(/^\/+/, "").replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "");
}

function extractBody(html) {
  const match = html.match(/<!--\s*본문 시작\s*-->([\s\S]*?)<!--\s*본문 끝\s*-->/);
  const body = match?.[1]?.trim();
  if (body) {
    return body;
  }

  if (match) {
    const footerIndex = html.indexOf("copyright_sub.gif", match.index ?? 0);
    if (footerIndex > -1) {
      return html.slice((match.index ?? 0) + match[0].length, footerIndex);
    }
  }

  return html;
}

function absolutizeUrl(value, sourceUrl) {
  try {
    return new URL(value, sourceUrl).toString();
  } catch {
    return value;
  }
}

function extractImages(body, sourceUrl) {
  return [...body.matchAll(/<img\b[^>]*\bsrc=["']?([^"'\s>]+)["']?[^>]*>/gi)]
    .map((match) => absolutizeUrl(match[1], sourceUrl))
    .filter((src, index, list) => src && list.indexOf(src) === index);
}

function normalizeHtml(body, sourceUrl) {
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s(src|href)=["']([^"']+)["']/gi, (_, attr, value) => ` ${attr}="${absolutizeUrl(value, sourceUrl)}"`)
    .trim();
}

function decodeEntities(value) {
  const named = {
    amp: "&",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\"",
    apos: "'",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    }
    if (lower.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    }
    return named[lower] ?? `&${entity};`;
  });
}

function htmlToLines(body) {
  const text = decodeEntities(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(br|hr)\b[^>]*>/gi, "\n")
      .replace(/<\/(p|div|li|tr|td|th|h[1-6]|table|ul|ol)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "\n"),
  );

  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line, index, list) => list.indexOf(line) === index);
}

async function fetchSourcePage(page) {
  const response = await fetch(page.sourceUrl);
  if (!response.ok) {
    throw new Error(`${page.sourceUrl} returned ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const html = new TextDecoder("euc-kr").decode(buffer);
  const body = extractBody(html);
  const contentHtml = normalizeHtml(body, page.sourceUrl);
  const contentLines = htmlToLines(body);
  const images = extractImages(body, page.sourceUrl);

  return {
    id: stableId(page.route),
    title: page.title,
    route: page.route,
    sourcePath: page.sourcePath,
    sourceUrl: page.sourceUrl,
    sourceType: page.sourceType,
    contentHtml,
    contentLines,
    contentText: contentLines.join("\n"),
    imageUrls: images,
    contentLineCount: contentLines.length,
    imageCount: images.length,
  };
}

function toSeed({ pages }) {
  const menuDocs = [];
  const pageDocs = [];
  const assetDocs = [];
  const boardDocs = [];

  menuGroups.forEach((group, groupIndex) => {
    const groupId = stableId(group.slug);
    menuDocs.push({
      id: groupId,
      title: group.title,
      slug: group.slug,
      depth: 1,
      order: groupIndex + 1,
      parentId: null,
      visible: true,
    });

    group.items.forEach((entry, itemIndex) => {
      const page = pages.find((candidate) => candidate.route === entry.route);
      const pageId = stableId(entry.route);
      menuDocs.push({
        id: pageId,
        title: entry.title,
        slug: pageId,
        route: entry.route,
        depth: 2,
        order: itemIndex + 1,
        parentId: groupId,
        sourceUrl: entry.sourceUrl,
        visible: true,
      });

      pageDocs.push({
        id: pageId,
        menuId: pageId,
        parentMenuId: groupId,
        section: group.title,
        title: entry.title,
        route: entry.route,
        sourceUrl: entry.sourceUrl,
        sourcePath: entry.sourcePath,
        sourceType: entry.sourceType,
        status: "published",
        contentHtml: page?.contentHtml ?? "",
        contentText: page?.contentText ?? "",
        contentLines: page?.contentLines ?? [],
        imageUrls: page?.imageUrls ?? [],
        contentLineCount: page?.contentLineCount ?? 0,
        imageCount: page?.imageCount ?? 0,
      });

      page?.imageUrls.forEach((url, assetIndex) => {
        assetDocs.push({
          id: `${pageId}-asset-${String(assetIndex + 1).padStart(2, "0")}`,
          pageId,
          title: `${entry.title} 이미지 ${assetIndex + 1}`,
          sourceUrl: url,
          storagePath: `public/kiba/source/${pageId}/${path.posix.basename(new URL(url).pathname)}`,
          type: "source-image",
          order: assetIndex + 1,
        });
      });

      if (entry.sourceType === "board") {
        boardDocs.push({
          id: pageId,
          boardType: entry.route.includes("resources") ? "resource" : entry.route.includes("contact") ? "inquiry" : "notice",
          title: entry.title,
          route: entry.route,
          sourceUrl: entry.sourceUrl,
          rows: page?.contentLines ?? [],
          status: "published",
        });
      }
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceBaseUrl: baseUrl,
    summary: {
      menuGroupCount: menuGroups.length,
      sourcePageCount: pages.length,
      menuDocCount: menuDocs.length,
      pageDocCount: pageDocs.length,
      assetDocCount: assetDocs.length,
      boardDocCount: boardDocs.length,
    },
    menus: menuGroups,
    firestore: {
      cmsMenus: menuDocs,
      cmsPages: pageDocs,
      cmsAssets: assetDocs,
      boardPosts: boardDocs,
    },
    pages,
  };
}

const pages = [];

for (const group of menuGroups) {
  for (const page of group.items) {
    process.stdout.write(`Scraping ${group.title} / ${page.title} ... `);
    const scraped = await fetchSourcePage(page);
    pages.push({ section: group.title, ...scraped });
    process.stdout.write(`${scraped.contentLineCount} lines, ${scraped.imageCount} images\n`);
  }
}

const seed = toSeed({ pages });
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(seed, null, 2)}\n`, "utf8");

console.log(`Wrote ${outputPath}`);
console.log(JSON.stringify(seed.summary, null, 2));
