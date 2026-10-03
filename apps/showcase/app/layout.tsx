import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Kind UI Charts",
  description:
    "Explore Kind UI's React line, area and bar charts. Play with materials, palettes and motion in the live component showcase.",
  icons: {
    icon: [
      { url: "/kind-bloom.svg", type: "image/svg+xml" },
      { url: "/kind-bloom.ico", sizes: "16x16 32x32 48x48 64x64" },
    ],
    shortcut: "/kind-bloom.ico",
    apple: "/kind-bloom-apple.png",
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
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
