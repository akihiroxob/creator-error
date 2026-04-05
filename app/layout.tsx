import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "L3DGS Viewer Lab",
  description: "L3DGS and Three.js demo landing page scaffold built with Next.js."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
