import type { Metadata, Viewport } from "next";
import { Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = "https://nahw.barada.dev";
const SITE_TITLE = "نَحْو — قَوَاعِدُ الْعَرَبِيَّةِ بِطَرِيقَةٍ تَفَاعُلِيَّةٍ";
const SITE_DESCRIPTION = "أداة تعليم قواعد اللغة العربية التفاعلية";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "نَحْو",
    type: "website",
    locale: "ar",
    images: [
      {
        url: "/nahw-mark.png",
        width: 939,
        height: 751,
        alt: "نَحْو",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/nahw-mark.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" className={`${notoNaskhArabic.variable} antialiased`} style={{ colorScheme: "light" }}>
      <body>{children}</body>
    </html>
  );
}
