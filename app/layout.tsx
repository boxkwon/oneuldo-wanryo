import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘도, 완료 — 우리 둘의 운동 기록",
  description: "함께 움직이고, 가볍게 기록하는 우리 둘의 운동 습관 앱",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
