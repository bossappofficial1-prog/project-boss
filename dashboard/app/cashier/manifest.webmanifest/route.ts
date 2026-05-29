import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "BOSS Kasir",
    short_name: "BOSS Kasir",
    description: "Comprehensive Kasir solution for your business",
    start_url: "/cashier/pos",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#F91F1F",
    orientation: "portrait-primary",
    categories: ["Kasir", "POS"],
    lang: "en-US",
    dir: "ltr",
    icons: [
      {
        src: "/icons/app-icon-kasir-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/app-icon-kasir-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/app-icon-kasir-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/images/pos-kasir-light.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
      },
    ],
  });
}
