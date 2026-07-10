import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { getSiteConfig } from "@/lib/site";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const site = getSiteConfig();
  const posts = getAllPosts();
  const origin = siteUrl.replace(/\/$/, "");

  const entries = posts
    .map((meta) => {
      const post = getPostBySlug(meta.slug);
      const link = `${origin}/blog/${meta.slug}`;
      return `  <entry>
    <title>${escapeXml(meta.title)}</title>
    <link href="${link}" rel="alternate"/>
    <id>${link}</id>
    <updated>${new Date(meta.date).toISOString()}</updated>
    <summary>${escapeXml(meta.description || meta.title)}</summary>
    <content type="html"><![CDATA[${post.content}]]></content>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(site.name)}</title>
  <subtitle>${escapeXml(site.tagline)}</subtitle>
  <link href="${origin}/" rel="alternate"/>
  <link href="${origin}/atom.xml" rel="self"/>
  <id>${origin}/</id>
  <updated>${new Date().toISOString()}</updated>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
