import { ImageResponse } from "next/og";
import { getSiteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const alt = "Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const site = getSiteConfig();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f12 0%, #1e1b4b 60%, #312e81 100%)",
          color: "white",
          padding: 80,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 72,
            height: 72,
            borderRadius: 16,
            background: "linear-gradient(135deg, #8b5cf6, #4f46e5)",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          {site.name.slice(0, 1).toUpperCase()}
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {site.name}
        </div>
        <div style={{ fontSize: 32, opacity: 0.8, marginTop: 16 }}>
          {site.tagline}
        </div>
        <div style={{ fontSize: 24, opacity: 0.55, marginTop: 28, maxWidth: 900 }}>
          {site.description}
        </div>
      </div>
    ),
    { ...size },
  );
}
