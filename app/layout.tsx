import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppFooter from "@/components/AppFooter";
import { PiroBurstProvider } from "@/components/PiroBurstProvider";
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
  title: "Reward-CRM",
  description: "特典配布管理システム",
  icons: {
    icon: [{ url: "/piro.png", type: "image/png" }],
    apple: "/piro.png",
  },
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
      <body className="flex min-h-dvh flex-col">
        <PiroBurstProvider>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <AppFooter />
        </PiroBurstProvider>
      </body>
    </html>
  );
}
