"use client";
import { ThemeProvider as NextThemeProvider } from "next-themes";

// Fumadocs uses next-themes' default key. Keep an existing homepage choice
// only when the shared preference has not already been set by the docs.
const migrateTheme = `try {
  if (localStorage.getItem("theme") === null) {
    const previous = localStorage.getItem("kind-ui-theme");
    if (["light", "dark", "system"].includes(previous)) localStorage.setItem("theme", previous);
  }
} catch {}`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Static migration runs before next-themes' initial theme script. */}
      <script dangerouslySetInnerHTML={{ __html: migrateTheme }} />
      <NextThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="theme">
        {children}
      </NextThemeProvider>
    </>
  );
}
