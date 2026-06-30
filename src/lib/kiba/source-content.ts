import kibaSeedJson from "../../../data/kiba-content.seed.json";

export type KibaSeedPage = {
  id: string;
  section: string;
  title: string;
  route: string;
  sourcePath: string;
  sourceUrl: string;
  sourceType: "text" | "board" | "image" | "mixed";
  contentHtml: string;
  contentLines: string[];
  contentText: string;
  imageUrls: string[];
  contentLineCount: number;
  imageCount: number;
};

export type KibaSeedSummary = {
  menuGroupCount: number;
  sourcePageCount: number;
  menuDocCount: number;
  pageDocCount: number;
  assetDocCount: number;
  boardDocCount: number;
};

type KibaSeed = {
  generatedAt: string;
  sourceBaseUrl: string;
  summary: KibaSeedSummary;
  pages: KibaSeedPage[];
};

export const kibaSeed = kibaSeedJson as KibaSeed;

export const kibaSeedPagesByRoute = Object.fromEntries(
  kibaSeed.pages.map((page) => [page.route, page]),
) as Record<string, KibaSeedPage>;

export const kibaSeedSummary = kibaSeed.summary;
