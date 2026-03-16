import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GravityClaw — Control Center",
  description: "OpenClaw Agent Command & Control Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="scan-overlay">{children}</body>
    </html>
  );
}
