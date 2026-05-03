import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRO DATA AI OS - Content That Converts",
  description: "Transform one piece of content into perfectly optimized social media assets. Powered by AI, guided by your brand.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}