import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { showcaseAsset } from "@/lib/site-links";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geist = localFont({
  src: "../public/fonts/geist-variable.ttf",
  variable: "--font-geist",
  display: "swap",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../public/fonts/geist-mono-variable.ttf",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Kind UI Charts",
  description:
    "Explore composable React charts with real-world examples, palettes, finishes and motion.",
  icons: {
    icon: [
      { url: showcaseAsset("/kind-bloom.svg"), type: "image/svg+xml" },
      { url: showcaseAsset("/kind-bloom.ico"), sizes: "16x16 32x32 48x48 64x64" },
    ],
    shortcut: showcaseAsset("/kind-bloom.ico"),
    apple: showcaseAsset("/kind-bloom-apple.png"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#438ee8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
