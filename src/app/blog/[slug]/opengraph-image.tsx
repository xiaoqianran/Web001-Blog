import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

export const runtime = "nodejs";
export const alt = "Blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  let title = slug;
  let description = "";
  let tags: string[] = [];

  try {
    const post = getPostBySlug(slug);
    if (!post.draft) {
      title = post.title;
      description = post.description;
      tags = post.tags.slice(0, 4);
    }
  } catch {
    /* fallback title = slug */
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f0f12 0%, #1e1b4b 55%, #312e81 100%)",
          color: "white",
          padding: 72,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            opacity: 0.85,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #8b5cf6, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 24,
            }}
          >
            B
          </div>
          <span>Blog · 写一点，记一点</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: title.length > 40 ? 52 : 64,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.4,
                opacity: 0.75,
                maxWidth: 960,
              }}
            >
              {description.length > 120
                ? `${description.slice(0, 120)}…`
                : description}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                fontSize: 22,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
