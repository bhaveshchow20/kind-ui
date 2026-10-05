"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page-state" role="alert">
      <h1>The showcase couldn’t load</h1>
      <p>Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
