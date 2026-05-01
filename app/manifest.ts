import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نَحْو — قَوَاعِدُ الْعَرَبِيَّةِ بِطَرِيقَةٍ تَفَاعُلِيَّةٍ",
    short_name: "نَحْو",
    description: "أداة تعليم قواعد اللغة العربية التفاعلية",
    start_url: "/",
    display: "standalone",
    theme_color: "#d97706",
    background_color: "#fdfbf7",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
