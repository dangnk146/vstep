import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    >
      <body className="min-h-full flex flex-col md:flex-row bg-background text-foreground">
        <ThemeProvider>
          <div className="flex flex-col md:flex-row min-h-screen w-full">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
