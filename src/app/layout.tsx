import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "교실 초성퀴즈 스튜디오 | 단체수업용 초성·받침·모음 힌트 퀴즈",
  description:
    "선생님이 엔터만 치면서 단어나 문장을 입력해 여러 버전으로 저장하고, 교실 단체수업에서 랜덤 출제 및 1차 받침 힌트·2차 선택 글자 모음 공개 힌트를 제공하는 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
