import fs from "fs";
import path from "path";

export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  author: string;
  about: string;
  social: { label: string; href: string }[];
};

const DEFAULT_SITE: SiteConfig = {
  name: "Blog",
  tagline: "写一点，记一点",
  description: "一个用 Next.js 构建的简洁个人博客，支持 Markdown 文章与标签。",
  author: "作者",
  about:
    "这里用来记录技术笔记、产品思考与生活碎片。文章以 Markdown 撰写，存放在 content/posts/。",
  social: [],
};

export function getSiteConfig(): SiteConfig {
  const file = path.join(process.cwd(), "content/site.json");
  try {
    if (!fs.existsSync(file)) return DEFAULT_SITE;
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<SiteConfig>;
    return {
      ...DEFAULT_SITE,
      ...raw,
      social: Array.isArray(raw.social) ? raw.social : DEFAULT_SITE.social,
    };
  } catch {
    return DEFAULT_SITE;
  }
}
