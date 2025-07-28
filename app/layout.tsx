import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "./providers";
import ThemeProviderWrapper from "@/components/ThemeProviderWrapper";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mawaridhi-Knowledge Base",
  description: "Internal Knowledge Base for Mawaridhi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ✅ Don't put comments inside JSX tags
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col items-center`}
      >
        <ThemeProviderWrapper>
          <div className="w-full max-w-7xl px-4 py-6">
            <Providers>
              <Navbar />
              {children}
              <Footer/>
            </Providers>
          </div>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
