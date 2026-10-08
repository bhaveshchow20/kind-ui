import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { showcaseAsset } from "@/lib/site-links";
import { webAnalytics } from "../../analytics.mjs";
import { indexingMetadata, showcaseURL } from "../../indexing.mjs";
import { homepageDescription, homepageTitle, socialMetadata } from "../../seo.mjs";
import "./globals.css";
import "./homepage.css";
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
  ...indexingMetadata(),
  alternates: { canonical: showcaseURL },
  title: homepageTitle,
  description: homepageDescription,
  ...socialMetadata(homepageTitle, homepageDescription, showcaseURL),
  icons: {
    icon: { url: showcaseAsset("/cherry-blossom.png"), type: "image/png", sizes: "512x512" },
    shortcut: showcaseAsset("/cherry-blossom.png"),
    apple: showcaseAsset("/cherry-blossom.png"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analytics = webAnalytics();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        {analytics && (
          <Script
            id="kind-ui-web-analytics"
            type="module"
            src={analytics.src}
            data-cf-beacon={analytics.beacon}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
