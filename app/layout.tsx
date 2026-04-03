import type { Metadata, Viewport } from "next";
import { Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "أَنْوَاعُ الكَلِمَاتِ — نَحْو",
  description: "أداة تعليم قواعد اللغة العربية التفاعلية",
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
      <html lang="ar" className={`${notoNaskhArabic.variable} antialiased`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
