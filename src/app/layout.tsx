import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EndlleesTube - Minecraft Video Platform",
  description: "A modern video platform for Minecraft content creators. Upload, share, and discover amazing Minecraft videos.",
  keywords: ["Minecraft", "video", "platform", "content", "creators", "gaming"],
  authors: [{ name: "EndlleesTube Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "EndlleesTube - Minecraft Video Platform",
    description: "A modern video platform for Minecraft content creators",
    url: "https://endlleestube.com",
    siteName: "EndlleesTube",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EndlleesTube - Minecraft Video Platform",
    description: "A modern video platform for Minecraft content creators",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
