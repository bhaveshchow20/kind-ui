import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-bold text-3xl">Charts</h1>
      <p className="max-w-md text-fd-muted-foreground">
        Composable React charts built on Recharts and Motion.
      </p>
      <Link
        href="/docs"
        className="rounded-md bg-fd-primary px-4 py-2 font-medium text-fd-primary-foreground"
      >
        Get started
      </Link>
    </main>
  );
}
