import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { OverlayProvider } from "@/lib/context/OverlayContext";
import GlobalOverlay from "@/components/ui/GlobalOverlay";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ManageX",
  description: "Elegant pink and white product management with Supabase auth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#fff5fb] text-zinc-950" suppressHydrationWarning>
        <LanguageProvider>
          <OverlayProvider>
            {children}
            <GlobalOverlay />
          </OverlayProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
