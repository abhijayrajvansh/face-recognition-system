import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Face Attendance",
  description: "Face recognition attendance admin and capture app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="app-shell flex min-h-full flex-col gap-4">
          <header className="panel p-3 md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h1 className="text-lg font-bold tracking-tight md:text-xl">Face Attendance</h1>
              <nav className="grid grid-cols-2 gap-2 text-sm md:flex md:flex-wrap">
                <Link className="btn-ghost inline-flex items-center justify-center" href="/">
                  Home
                </Link>
                <Link className="btn-ghost inline-flex items-center justify-center" href="/attendance">
                  Attendance
                </Link>
                <Link className="btn-ghost inline-flex items-center justify-center" href="/admin/users">
                  Users
                </Link>
                <Link className="btn-ghost inline-flex items-center justify-center" href="/admin/sessions">
                  Sessions
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
