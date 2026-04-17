import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceName | 置いてみる。確かめる。借りられる。",
  description: "置いてみる。確かめる。借りられる。空間検証型レンタルサービスのLPです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
