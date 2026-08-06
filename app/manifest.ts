import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI 小秘",
    short_name: "AI 小秘",
    description: "会听、会记、会提醒的智能日程助手",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#eef2ff",
    theme_color: "#2563eb",
    lang: "zh-CN",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "./icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "./icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
