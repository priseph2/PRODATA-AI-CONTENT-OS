import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRO DATA AI CONTENT OS",
  description: "Turn one content input into many approved, branded, scheduled social media assets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {children}
      </body>
    </html>
  );
}