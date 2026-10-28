import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 브라우저 탭 제목과 설명을 서비스 이름으로 둔다 (PLAN 작업 1)
export const metadata: Metadata = {
  title: "온비드 압류재산 매각현황 히트맵",
  description:
    "온비드 압류재산 매각물건의 지역본부별 용도 × 유찰 횟수 현황을 주간 단위로 보여 주는 개인용 앱",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
