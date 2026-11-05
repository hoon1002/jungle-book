import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "정글 교과서",
  description: "정글을 처음 해보는 플레이어를 위한 레슨과 상황 퀴즈",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
