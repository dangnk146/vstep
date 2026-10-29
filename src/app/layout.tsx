import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Học Bài VSTEP | VSTEP Preparation Dashboard",
  description: "Trình rèn luyện kỹ năng thi VSTEP: Reading, Listening, Writing, Speaking. Bấm giờ, lưu mẫu, so sánh đáp án và ghi âm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="h-screen overflow-hidden bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <div className="flex h-full w-full flex-col">
            <Suspense fallback={null}>
              <Sidebar />
            </Suspense>
            <main className="min-h-0 flex-1 overflow-y-auto px-1 pt-0 pb-28 sm:px-3 sm:pt-0 sm:pb-24 lg:px-4 lg:pt-0 lg:pb-20">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
