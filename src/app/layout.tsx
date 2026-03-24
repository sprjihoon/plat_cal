import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PageTracker } from "@/components/tracking/PageTracker";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "쇼핑몰 수익 관리 시스템",
  description: "스마트스토어, 쿠팡, 에이블리 등 판매 채널별 마진율과 순이익을 계산하고 상품을 관리하세요.",
  keywords: ["마진 계산기", "쇼핑몰", "스마트스토어", "쿠팡", "에이블리", "순이익", "마진율", "상품관리"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "쇼핑몰 수익 관리",
  },
};

export const viewport: Viewport = {
  themeColor: "#8C9EFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <QueryProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <PageTracker />
              <div className="flex-1">{children}</div>
              <Footer />
            </ErrorBoundary>
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
